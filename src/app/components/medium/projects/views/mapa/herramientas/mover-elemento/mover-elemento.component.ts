import { Component, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Map, Polyline, Polygon, Marker, DomUtil, TileLayer, tileLayer, LatLng } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { MapService } from '../../../../../../../services/unic/map.service';
import { environment } from '../../../../../../../../environments/environment';
import { delayExecution } from 'src/app/shared/helpers';
import { ProjectLayersService } from 'src/app/services/medium/project-layers.service';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../shared/helpers';

@Component({
  selector: 'herramienta-mover-elemento',
  templateUrl: './mover-elemento.component.html',
  styleUrls: ['./mover-elemento.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class MoverElementoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  private elementsInClickRange:any[] = [];

  private layerFilters:{[layerFilter:string]:string};

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private highlightedElementLayer:TileLayer.WMS;

  public showSpinner:boolean = false;

  public selectedLayer:any;
  public editableLayer:Marker|Polyline|Polygon;

  public helpText:string = "Seleccione un elemento para editar";

  private onMapClick: (event:any) => void = event => 
  {
    this._ngZone.run( async () => {

      try
      {
        this.map.off("click", this.onMapClick);

        this._mapService.disableEvents();

        this.showSpinner = true;

        const clickLatLng = event.latlng;

        const point = {
          type: "Point",
          coordinates: [clickLatLng.lng, clickLatLng.lat]
        };

        GeoJSONHelper.reproyectGeometry(
          null,
          this._projectService.configuration.datos_municipio.nombre_proj4, 
          point
        );
                
        const data = (await this._projectsService.consultarApi({
            "funcion": "informacion_mover_web",
            "proyecto": this.project.bd_proyecto,
            "capas_filtro": this.layerFilters,
            "pulsacion": point.coordinates,
            "proyeccion": this.project.proyeccion
        })).datos;

        this.selectedLayer = null;

        if( this.highlightedElementLayer )
          this.highlightedElementLayer.remove();
          
        this.elementsInClickRange = [];

        for( const [id, elementData] of Object.entries(data))
        {
          elementData["id"] = id;

          this.elementsInClickRange.push(elementData);
        }

        if( this.elementsInClickRange.length === 1)
          this.onSelectLayer(this.elementsInClickRange[0]);
        
      }
      catch (error)
      {
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        this._mapService.enableEvents();
        this.map.doubleClickZoom.disable(); 
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

  public async onSelectLayer(datosDeCapa:any):Promise<void>
  {
    try
    {
      this.map.flyToBounds(([
        (datosDeCapa.bbox as number[]).slice(0,2).reverse(),
        (datosDeCapa.bbox as number[]).slice(2,4).reverse()
      ] as any),{ duration: .50});

      if( this.highlightedElementLayer )
        this.map.removeLayer(this.highlightedElementLayer);

      const filtroCapa = datosDeCapa.capa.split("#");

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
        cql_filter: `id_${filtroCapa[2]}='${datosDeCapa.id}'`,
        env: "buffer:30"
      };

      this.highlightedElementLayer = tileLayer.wms(this._projectService.baseUrl, wmsOptions);

      this.map.addLayer(this.highlightedElementLayer);

      this.selectedLayer = datosDeCapa;
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message);  
    }
  }

  public buildEditableLayer():void
  {    
    const geometry = GeoJSONHelper.stringToGeometry(this.selectedLayer.geom);

    GeoJSONHelper.reproyectGeometry(
      this._projectService.configuration.datos_municipio.nombre_proj4, 
      environment.defaultProj4Crs,
      geometry
    );
    
    GeoJSONHelper.invertGeometryCoordinates(geometry);

    switch( geometry.type )
    {
      case "Point":
        this.editableLayer = new Marker((geometry.coordinates as any)).addTo( this.map );
        this.helpText = "Mueva el elemento a la posición deseada.";
        break;

      case "LineString":
      case "MultiLineString":
        this.editableLayer = new Polyline( (geometry.coordinates as any) ).addTo( this.map );
        this.helpText = "Mueva el elemento o sus vertices a la posición deseada.";
        break;

      case "Polygon":
      case "MultiPolygon":
        this.editableLayer = new Polygon( (geometry.coordinates as any) ).addTo( this.map );

        this.editableLayer.on('click', (event:any) => {

          if ((event.originalEvent.ctrlKey || event.originalEvent.metaKey) && this.editableLayer.editEnabled())
            (this.editableLayer as any).editor.newHole(event.latlng);

        });

        this.helpText = "Mueva el elemento o sus vertices a la posición deseada. <br><br> Presione <kdb>Ctrl</kdb> + click sobre polígono para iniciar agujero.";
        
        break;
    }

    this.editableLayer.enableEdit();

    this.map.off("click", this.onMapClick);
  }

  public async saveChanges():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Moviendo elemento...");
      this._spinnerService.show();

      await delayExecution(250);

      const feature = this.editableLayer.toGeoJSON();

      GeoJSONHelper.reproyectGeometry( null, this._projectService.configuration.datos_municipio.nombre_proj4,  feature.geometry);
      
      const geometryToString = GeoJSONHelper.geometryToString(feature.geometry);

      const layerFilter = this.selectedLayer.capa.split("#");

      await this._projectsService.consultarApi({
        "funcion": "mover_elemento_web",
        "proyecto_formateado": this.project.bd_proyecto,
        "modulo_formateado": layerFilter[0],
        "grupo_formateado": layerFilter[1],
        "capa_formateada": layerFilter[2],
        "id_elemento": this.selectedLayer.id,
        "geom": geometryToString,
        "proyeccion": this.project.proyeccion
      });

      const capa = this._projectLayersService.obtenerCapas().find(layer => layer.filtro_capa === this.selectedLayer.capa);
      
      capa.refrescar();
      
      this._toastrService.success("Elemento movido.","Exito!");
      
      this.clear();

      this.elementsInClickRange = [];
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
    if( this.editableLayer )
    {
     this.editableLayer.remove();
     this.editableLayer = null;
    }

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

  public clear():void
  {
    this.editableLayer.remove();
    this.editableLayer = null;

    this.helpText = "";
     
    if( this.selectedLayer )
    {
      this.highlightedElementLayer.remove();
      this.highlightedElementLayer = null;
      this.selectedLayer = null;
    }

    this.map.on("click", this.onMapClick);
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
         labelPosition: "auto-start",
         content: `
         Para mover un elemento:
         <ol>
          <li class="mb-1">Hacer click encima o cerca del mismo, esperar a que sea ubicado y hacer click en <span class="badge bg-warning text-white">Continuar</span>.</li>
          <li class="mb-1">Arrastrar el elemento hasta la nueva posición con el cursor.</li>
          <li class="mb-1">Hacer click en <span class="badge bg-info text-white">Guardar</span> y la capa sera actualizada.</li>
         </ol>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/mover-elemento/1-punto.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `,
         event: {
           "before-show": () => document.querySelector("body").appendChild(mapRefDiv)
         }
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         content: `
         Puede <b>crear</b> vértices en las líneas haciendo <b>click sobre los existentes</b> y también <b>moverlos, arrastrandolos con el cursor</b>.
         <br><br>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/mover-elemento/2-linea.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         content: `
         En <b>polígonos</b> tambien puede <b>crear y mover vértices</b> como en el <b>paso anterior</b>. 
        <br>
        Para iniciar un agujero sobre un polígono pulsar <kbd>Ctrl</kbd> + <kbd>click derecho</kbd>
        dentro del mismo y para terminarlo hacer click sobre el vértice final.  
         <br><br>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/mover-elemento/3-poligono.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         content: `
         Para deshacer la acción hacer click en <span class="badge-outline-info">Cancelar</span>.
         <br><br> 
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/mover-elemento/4-deshacer.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `
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
           <source src="assets/images/medium/tours/herramientas/mover-elemento/5-elementos-adyacentes.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `
       }
     ];
  
     return steps;
   }
}
