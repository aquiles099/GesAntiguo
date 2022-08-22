import { Component, Input, Output, EventEmitter, NgZone, ViewChild } from '@angular/core';
import { Map, DomUtil, TileLayer, tileLayer, LatLng } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { MapService } from '../../../../../../../services/unic/map.service';
import { delayExecution } from 'src/app/shared/helpers';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../shared/helpers';

@Component({
  selector: 'herramienta-eliminar-elemento',
  templateUrl: './eliminar-elemento.component.html',
  styleUrls: ['./eliminar-elemento.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class EliminarElementoComponent extends HideableSectionComponent
{
  @ViewChild(ModalDirective)
  public confirmationModal:ModalDirective;

  @Input()
  public map:Map;

  private elementsInClickRange:any[] = [];

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private highlightedElementLayer:TileLayer.WMS;

  public showSpinner:boolean = false;

  public selectedLayer:any;

  private layerFilters:{[layerFilter:string]:string};

  private onMapClick: (event:any) => void = event => 
  {
    this._ngZone.run( async () => {

      try
      {
        this.map.off("click", this.onMapClick);

        this._mapService.disableEvents();

        this.showSpinner = true;

        const latlng:LatLng = event.latlng;

        const point = {
          type: "Point",
          coordinates: [latlng.lng, latlng.lat]
        };

        GeoJSONHelper.reproyectGeometry(
          null,
          this._projectService.configuration.datos_municipio.nombre_proj4, 
          point
        );
        
        const data = (await this._projectsService.consultarApi({
            funcion: "informacion_borrar_web",
            proyecto: this.project.bd_proyecto,
            proyeccion: this.project.proyeccion,
            pulsacion: point.coordinates,
            capas_filtro: this.layerFilters,
        })).datos;

        this.selectedLayer = null;

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
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        this._mapService.enableEvents();
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

  public async show():Promise<void>
  {
    this.layerFilters = this._projectLayersService.obtenerFiltrosDeCapas();
    this.map.on("click", this.onMapClick);
    this.map.doubleClickZoom.disable(); 

    DomUtil.addClass(this.map.getContainer(), 'cursor-help');

    await super.show();
  }

  public async onSelectLayer(layerData:any):Promise<void>
  {
    try
    {
      setTimeout(() => {
        this.map.flyToBounds(([
          (layerData.bbox as number[]).slice(0,2).reverse(),
          (layerData.bbox as number[]).slice(2,4).reverse()
        ] as any),{ maxZoom: 20, duration: .50});
      });

      if( this.highlightedElementLayer )
        this.highlightedElementLayer.remove();

      const filtroCapa = layerData.capa.split("#");

      const wmsOptions = {
        layers: filtroCapa.join("_"),
        styles: "buffer_linea",
        className: "informacion_seleccionado",
        format: 'image/png',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        cql_filter: `id_${filtroCapa[2]}='${layerData.id}'`,
        env: "buffer:30"
      };

      this.highlightedElementLayer = tileLayer.wms(this._projectService.baseUrl, wmsOptions);

      this.map.addLayer(this.highlightedElementLayer);

      this.selectedLayer = layerData;

      if( ! layerData.tipo )
      {
        const layer = this._projectLayersService.obtenerCapas().find(layer => layer.filtro_capa === layerData.capa);
        this.selectedLayer["tipo"] = layer.nombre;
      }

    }
    catch (error)
    {
      this._toastrService.error(error.message);  
    }
  }

  public async deleteLayer():Promise<void>
  {
    try
    {
      this.confirmationModal.hide();

      this._spinnerService.updateText("Eliminando elemento...");
      this._spinnerService.show();

      await delayExecution(250);

      const layerFilter = this.selectedLayer.capa.split("#");
    
      const module = this._projectLayersService.obtenerModulos().find(module => module.nombre_formateado === layerFilter[0]);
      const group = module.grupos.find(group => group.nombre_formateado === layerFilter[1]);
      const layer = group.capas.find(layer => layer.nombre_formateado === layerFilter[2]);

      await this._projectsService.consultarApi({
        funcion: "borrar_elemento_web",
        modulo: module.nombre,
        modulo_formateado: module.nombre_formateado,
        grupo: group.nombre,
        grupo_formateado: group.nombre_formateado,
        capa: layer.nombre,
        capa_formateada: layer.nombre_formateado,
        nombre_proyecto: this.project.nombre,
        bd_proyecto: this.project.bd_proyecto,
        elementos: [ this.selectedLayer.id ]
      });

      this.highlightedElementLayer.remove();
      this.highlightedElementLayer = null;

      this.elementsInClickRange = this.elementsInClickRange.filter(
        layerData => layerData.id !== this.selectedLayer.id
      );
      
      this.selectedLayer = null;

      layer.refrescar();

      if( this.elementsInClickRange.length === 1 )
        this.onSelectLayer(this.elementsInClickRange[0]);
      
      this._toastrService.success("Elemento eliminado.","Exito!");  
      
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

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    if( this.selectedLayer )
    {
      this.highlightedElementLayer.remove();
      this.highlightedElementLayer = null;
      this.selectedLayer = null;
    }

    this.elementsInClickRange = [];
    this.showSpinner = false;  
    this.layerFilters = null;
    this.map.doubleClickZoom.enable(); 
    this.map.off("click", this.onMapClick);
    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    this._shepherdService.tourObject = null;

    await super.hide();
  }
  
   /* TOUR */

   public showTour():void
   {
     if( this.tourIsActive )
       return;
 
     this.buildTour();
 
     const removeMapRefDiv = () => {
       const mapRefDiv = document.getElementById("mapRefDiv");
       
       if( mapRefDiv )
         mapRefDiv.remove();
     }
 
     this._shepherdService.tourObject.on("cancel", removeMapRefDiv);
     this._shepherdService.tourObject.on("complete", removeMapRefDiv);
 
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
         _buttons.splice(1, 1);
       
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
         when: step.event ?? null,
         beforeShowPromise: step.beforeShowPromise ?? null
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
         labelPosition: "right-start",
         content: `
         Para eliminar un elemento:
         <ol>
          <li class="mb-1">Hacer click encima o cerca del mismo y esperar a que sea ubicado.</li>
          <li class="mb-1">Hacer click en <span class="badge bg-info text-white">Continuar</span> y confirmar la acción.</li>
         </ol>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/eliminar-elemento/1-eliminar-elemento.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video>  
         `,
         event: {
           "before-show": () => document.querySelector("body").appendChild(mapRefDiv)
         }
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right-start",
         content: `
         Si se hace click entre elementos contiguos o cercanos entre si (cualquier geometría) 
         serán listados en la barra, donde podrá buscar y seleccionar el deseado.
         <br> Para que un elemento sea listado debe estar dentro del <b>rango de pulsación del click</b> (<b>3 metros</b>).
         <br> Puede medir con la herramienta de medición de perímetro (ver botón <img class="ml-1 icon d-inline-block" src="assets/icons/SVG/MEDIRLONGITUD.svg">).
         <br><br>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/eliminar-elemento/2-elementos-adyacentes.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video>   
         `
       }
     ];
  
     return steps;
   }
}

