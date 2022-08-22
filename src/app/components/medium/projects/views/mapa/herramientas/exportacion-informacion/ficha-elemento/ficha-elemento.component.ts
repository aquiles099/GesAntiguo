import { Component, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Map, DomUtil, TileLayer } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { FeatureSheetTemplate } from '../../../../../../../../interfaces/geojson/export/feature-sheet-template';
import { FeatureSheetPdfExporter } from '../../../../../../../../models/unic/geojson/pdf-export/feature-sheet-pdf-exporter';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { MapService } from '../../../../../../../../services/unic/map.service';
import { delayExecution } from 'src/app/shared/helpers';
import { Capa } from '../../../../../../../../interfaces/medium/mapa/Modulo';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ProjectLayersService } from '../../../../../../../../services/medium/project-layers.service';
import { Project } from '../../../../../../../../interfaces/project';
import { LatLng } from '@agm/core';
import { GeoJSONHelper } from '../../../../../../../../models/geojson-helper';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../../shared/helpers';
import LeafletWms from 'leaflet.wms';

@Component({
  selector: 'herramienta-ficha-elemento',
  templateUrl: './ficha-elemento.component.html',
  styleUrls: ['./ficha-elemento.component.css','../../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class FichaElementoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private layer:Capa;

  public pdfTemplate:FeatureSheetTemplate;

  private elementsInClickRange:any[] = [];

  private highlightedElementLayer:TileLayer.WMS;

  public showSpinner:boolean = false;

  public selectedElement:any;

  private onMapClick: (event:any) => void = event => 
  {
    this._ngZone.run( async () => {

      try
      {
        this.map.off("click", this.onMapClick);

        this._mapService.disableEvents();

        this.showSpinner = true;

        const latlng:LatLng = event.latlng;

        const point:any = {
          type: "Point",
          coordinates: [latlng.lng, latlng.lat]
        };

        GeoJSONHelper.reproyectGeometry(
          null,
          this._projectService.configuration.datos_municipio.nombre_proj4, 
          point
        );
        
        const layerFilters = {};

        layerFilters[this.layer.filtro_capa] =  this.layer.capaWms.wmsParams.cql_filter ?? "";

        const data = (await this._projectsService.consultarApi({
            funcion: "informacion_elementos_web",
            proyecto: this.project.bd_proyecto,
            proyeccion: this.project.proyeccion,
            pulsacion: point.coordinates,
            capas_filtro: layerFilters
        })).datos;

        this.selectedElement = null;

        if( this.highlightedElementLayer )
        {
          this.highlightedElementLayer.remove();
          this.highlightedElementLayer = null;
        }
          
        this.elementsInClickRange = [];

        for( const [id, elementData] of Object.entries(data))
        {
          elementData["id"] = id;
          this.elementsInClickRange.push(elementData);
        }

        if( this.elementsInClickRange.length === 1 )
          this.onSelectLayer(this.elementsInClickRange[0]);
      }
      catch (error)
      {
        console.error(error);
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        this._mapService.enableEvents();

        if( this.isVisible )
          this.map.on("click", this.onMapClick);

        this.showSpinner = false;
      }
    });
  };

  constructor(
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _projectLayersService:ProjectLayersService,
    private _mapService:MapService,
    private _spinnerService:SpinnerService,
    private _ngZone:NgZone,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public setLayer(filter:string):void
  {
    this.layer = this._projectLayersService.obtenerCapas().find(capa => capa.filtro_capa === filter);
  }

  public async show():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Removiendo capas...");
      this._spinnerService.show();

      this._projectLayersService
          .obtenerCapas()
          .forEach(capa => {

            if( capa.filtro_capa !== this.layer.filtro_capa )
              this.map.removeLayer(capa.capaWms);

          });

      this.map.on("click", this.onMapClick);
  
      this.map.doubleClickZoom.disable(); 
  
      DomUtil.addClass(this.map.getContainer(), 'cursor-help');
  
      await super.show();      
    }
    catch (error)
    {
      this._toastrService.error(error.message);
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText()
    }
  }

  public onSelectLayer(layerData:any):void
  {
    try
    {
      this.map.flyToBounds(([
        (layerData.bbox as number[]).slice(0,2).reverse(),
        (layerData.bbox as number[]).slice(2,4).reverse()
      ] as any),{ maxZoom: 20, duration: .50});

      if( this.highlightedElementLayer )
        this.highlightedElementLayer.remove();

      const filtroCapa = layerData.capa.split("#");

      const wmsOptions = {
        layers: filtroCapa.join("_"),
        styles: "buffer_linea",
        className: "informacion_seleccionado",
        format: 'image/gif',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        cql_filter: `id_${filtroCapa[2]}='${layerData.id}'`,
        env: "buffer:30",
        tiled: false
      };

      let url = this._projectService.baseUrl;

      url = url.replace("http", "https");

      this.highlightedElementLayer = LeafletWms.overlay(url, wmsOptions);

      this.map.addLayer(this.highlightedElementLayer);

      this.highlightedElementLayer.bringToBack();
      
      if( ! layerData.tipo )
      {
        const layer = this._projectLayersService.obtenerCapas().find(layer => layer.filtro_capa === layerData.capa);
        layerData["tipo"] = layer.nombre;
      }

      this.selectedElement = layerData;
    }
    catch (error)
    {
      this._toastrService.error(error.message);  
    }
  }

  public async export():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Generando ficha...");
      this._spinnerService.show();

      const mapImageRequired = this.pdfTemplate.propertiesGroups.some(propertyGroup => typeof propertyGroup === "string" && propertyGroup === "map");
      
      if( mapImageRequired )
        await this.addMapScreenshotInPdfTemplate();

      const featureImagesCollectionRequired = this.pdfTemplate.propertiesGroups.some(propertyGroup => typeof propertyGroup === "string" && propertyGroup === "images");

      if( featureImagesCollectionRequired )
        await this.addFeatureImageCollectionInPdfTemplate();

      const pdfExporter = new FeatureSheetPdfExporter(
        this.pdfTemplate,
        {properties: this.selectedElement.datos_elemento},
        this._projectService.project
      );

      await pdfExporter.build();

      pdfExporter.download();

      this._toastrService.success("Ficha generada.","Exito!");

      setTimeout(() => {
        for(let [layerType, unloadedLayersNumber] of  Object.entries( this._mapService.lastScreenshot.unloadedLayers ))
        {
          if( unloadedLayersNumber > 0 )
            this._toastrService.warning(`${unloadedLayersNumber} capas ${layerType.toUpperCase()} no pudieron ser cargadas en el plano.`);
        }
      }, 1000);
    } 
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }
  }

  private async addMapScreenshotInPdfTemplate():Promise<void>
  {
    let currentMapZoom = this.map.getZoom();
        
    const currentCqlFilter = this.layer.capaWms.wmsParams.cql_filter;
    const filtroCapa = this.layer.filtro_capa.split("#");
    
    this.layer.capaWms.wmsParams.cql_filter = `id_${filtroCapa[2]}='${this.selectedElement.id}'`;
    this.layer.refrescar();

    await delayExecution(5000);

    if( this.layer.tipo_geometria === "POINT")
      this.map.setZoom(20);

    this.pdfTemplate.mapImageSrc = await this._mapService.getMapScreenshot();

    currentCqlFilter ?
    this.layer.capaWms.wmsParams.cql_filter = currentCqlFilter :
    delete this.layer.capaWms.wmsParams.cql_filter;

    this.layer.refrescar();

    this.map.setZoom(currentMapZoom);
  }

  private async addFeatureImageCollectionInPdfTemplate():Promise<void>
  {
    this.pdfTemplate.featureImages = (await this._projectsService.consultarApi({
        "funcion": "web_informacion_imagenes_elemento",
        "proyecto": this.project.nombre,
        "modulo": this.layer.modulo,
        "grupo": this.layer.grupo,
        "capa": this.layer.nombre,
        "elemento": this.selectedElement.id
    })).datos;

    if( this.pdfTemplate.featureImages.length )
    {
      this.pdfTemplate.featureImages = this.pdfTemplate.featureImages.map((imgData:any) => {
      
        return {
          file_name: imgData.nombre,
          upload_date:imgData.fecha,
          src: `data:image/${imgData.extension};base64,${imgData.base64}`
        };
        
      });
    }
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this._spinnerService.updateText("Proyectando capas...");
    this._spinnerService.show();

    this._projectLayersService
        .obtenerCapas()
        .forEach(capa => {

          if( capa.filtro_capa !== this.layer.filtro_capa )
            this.map.addLayer(capa.capaWms);

        });

    this.pdfTemplate = null;

    if( this.selectedElement )
    {
      this.highlightedElementLayer.remove();
      this.highlightedElementLayer = null;
      this.selectedElement = null;
    }
    
    this.layer = null;

    this.elementsInClickRange = [];

    this.showSpinner = false;
    
    this.map.off("click", this.onMapClick);
  
    this.map.doubleClickZoom.enable(); 

    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    this._shepherdService.tourObject = null;

    await super.hide();

    this._spinnerService.hide();
    this._spinnerService.cleanText();
  }

    /* TOUR */

    public showTour():void
    {
      if( this.tourIsActive )
        return;
        
      if( this._shepherdService.tourObject )
      {
        const currentTour = this._shepherdService.tourObject;
        this._shepherdService.tourObject = null;
        this._shepherdService.addSteps(currentTour.steps);
      }
      else
      {
        this.buildTour();
      }      
      
      const removeMapRefDiv = () => {
        const mapRefDiv = document.getElementById("mapRefDiv");
        
        if( mapRefDiv )
          mapRefDiv.remove();
      }
  
      this._shepherdService.tourObject.on("cancel", removeMapRefDiv);
  
      this._shepherdService.start();
    }
  
    private buildTour():void
    {
      const that = this;    
    
      const steps = this.buildTourSteps();
  
      const buttons = [
        {
          classes: 'btn-info',
          text: 'Expandir recurso',
          action(){
            const mediaResources = document.querySelectorAll(".step-media");
            toggleFullscreen(mediaResources[mediaResources.length - 1]);
          }
        },
        {
          classes: 'btn-secondary',
          text: 'Atras',
          action(){
              that._shepherdService.back();
          }
        },
        {
          classes: 'btn-info',
          text: 'Siguiente',
          action(){
              that._shepherdService.next();
          }
        }
      ];
      
      const _steps = [];
  
      for( let i = 0, stepsLength = steps.length; i < stepsLength; i++ )
      {
        let _buttons = [...buttons]; 
        
        const step = steps[i];
  
        if( i === 0 )
        _buttons = _buttons.slice(2);
       
       if( i === (stepsLength - 1)  )
       {
         const lastBtnIndex = _buttons.length - 1;
         _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (mas a la derecha) siempre sera el de avanzar / finalizar.
         _buttons[lastBtnIndex].text = 'Finalizar';
         _buttons[lastBtnIndex].action = () => that._shepherdService.complete();
       }
       
       const _step = {
         id: step.element,
         attachTo: { 
           element: `#${step.element}`, 
           on: step.labelPosition
         },
         buttons: _buttons,
         title: `PASO ${i + 1}`,
         text: step.content,
         when: step.event ?? null
       };
  
       _steps.push(_step);
      }
  
      this._shepherdService.addSteps(_steps);
    }
  
    private buildTourSteps():any[]
    {   
      const mapRefDiv = document.createElement("DIV");
   
      mapRefDiv.style.left = "2.5%";
      mapRefDiv.style.right = "32.5%";
      mapRefDiv.style.top = "0%";
      mapRefDiv.style.bottom = "0%";
      mapRefDiv.style.width = "40%";
      mapRefDiv.style.height = "50%";
      mapRefDiv.style.margin = "auto"; 
      mapRefDiv.style.border = "1px solid red";
      mapRefDiv.style.zIndex = "1200";
      mapRefDiv.style.position = "fixed";
      mapRefDiv.id = "mapRefDiv";
  
      const steps = [
          {
          element: `mapRefDiv`,
          labelPosition: "right",
          content: `
          <ol>
            <li class="mb-1">Hacer click encima o cerca de un elemento.</li>
            <li class="mb-1">Esperar a que sea ubicado.</li>
            <li class="mb-1">
            Hacer click en <span class="badge bg-info text-white">Imprimir</span>
            y esperar a que la ficha sea generada.
            </li>
          </ol>
          `,
          event: {
            "before-show": () => document.querySelector("body").appendChild(mapRefDiv)
          }
        },
        {
          element: 'export-element-sheet-tool',
          labelPosition: "left-start",
          content: `
          Al igual que en otras herramientas, si se hace click entre elementos contiguos o cercanos entre si (cualquier geometría)
          serán listados en la barra, donde podrá buscar y seleccionar el deseado.
          <br> Para que un elemento sea listado debe estar dentro del <b>rango de pulsación del click</b> (<b>3 metros</b>).
          <br> Puede medir con la herramienta de medición de perímetro (ver botón <img class="ml-1 icon d-inline-block" src="assets/icons/SVG/MEDIRLONGITUD.svg">).
         <br><br>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/mover-elemento/5-elementos-adyacentes.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video>
          `,
          event: {
            "before-show": () => mapRefDiv.remove()
          }
        }
      ];
   
      return steps;
    }
}
