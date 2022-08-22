import { Component, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Map, DomUtil, TileLayer, tileLayer, LatLng, LatLngBounds, Marker } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { MapService } from '../../../../../../../services/unic/map.service';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../shared/helpers';

@Component({
  selector: 'herramienta-informacion-elemento',
  templateUrl: './informacion-elemento.component.html',
  styleUrls: ['./informacion-elemento.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class InformacionElementoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  private elementsInClickRange:any[] = [];

  private layerFilters:{[filter:string]:string} = {};

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  @Output()
  public showCommandCenterManagementTool:EventEmitter<any> = new EventEmitter;

  private highlightedElementLayer:TileLayer.WMS;

  public showSpinner:boolean = false;

  public selectedElement:any;

  public showingInfo:boolean = false;

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
            funcion: "informacion_elementos_web",
            proyecto: this.project.bd_proyecto,
            proyeccion: this.project.proyeccion,
            pulsacion: point.coordinates,
            capas_filtro: this.layerFilters
        })).datos;
        
        this.selectedElement = null;

        this.showingInfo = false;

        if( this.highlightedElementLayer )
        {
          this.highlightedElementLayer.remove();
          this.highlightedElementLayer = null;
        }
          
        this.elementsInClickRange = [];

        for( const [id, elementData] of Object.entries(data))
        {
          elementData["id"] = id;
          
          elementData["data"] = Object.keys(elementData["datos_elemento"]).map(key => {
            return {
              label: key,
              value: elementData["datos_elemento"][key]
            }
          });

          this.elementsInClickRange.push(elementData);
        }

        if( this.elementsInClickRange.length === 1 )
        {
          this.onSelectElement(this.elementsInClickRange[0]);
          
          if( this.selectedElement && this.selectedElement.capa === "gissmart_energy#gestlighting#centro_mando" )
          {
            await this._showCommandCenterManagementTool();
          }
          else
          {
            this.selectedElement ?
            this.showingInfo = true :
            this.elementsInClickRange = [];
          }      
        }

        this.sortElementsInClickRange();
      }
      catch (error)
      {
        console.error(error);
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        // Al abrir herramienta de gestion de centro de mando ya el contenedor esta escondido. 
        if( this.isVisible ) 
          this.map.on("click", this.onMapClick);

        this._mapService.enableEvents();
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

  private sortElementsInClickRange():void
  {
    const elementTypes = new Set( this.elementsInClickRange.map(element => element.capa.split("#")[2] ) );

    const sortedElements = [];

    for( let type of elementTypes )
    {
      const elementsByType = this.elementsInClickRange.filter(element => element.capa.includes(type));
      const formattedType = type.split("_").join(" ");

      elementsByType.forEach((element, index) => element["label"] =  `${formattedType} ${index + 1}`);

      sortedElements.push(...elementsByType);
    }
  }

  public async onSelectElement(layerData:any):Promise<void>
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

      this.selectedElement = layerData;

    }
    catch (error)
    {
      this._toastrService.error(error.message);  
    }
  }

  public async showInfo():Promise<void>
  {
    if( this.selectedElement.capa === "gissmart_energy#gestlighting#centro_mando" )
    {
      this._showCommandCenterManagementTool();
      return;
    }

    this.showingInfo = true;
  }

  private async _showCommandCenterManagementTool():Promise<void>
  {
    //
    this.layerFilters = {};
    this.map.off("click", this.onMapClick);
    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    await super.hide();
    
    const layer = this._projectLayersService.obtenerCapa(this.selectedElement.capa);

    const bbox = [
      (this.selectedElement.bbox as number[]).slice(0,2).reverse(),
      (this.selectedElement.bbox as number[]).slice(2,4).reverse()
    ];

    const bboxInstance = new LatLngBounds((bbox as any));

    const referenceMarker = new Marker( bboxInstance.getCenter() );

    referenceMarker.feature = referenceMarker.toGeoJSON();

    referenceMarker.feature.properties.id = this.selectedElement.id;

    this.showCommandCenterManagementTool.emit({
      layer: layer,
      element: referenceMarker,
      action: "details"
    });
  }

  public async whenClosingCommandCenterManagementTool():Promise<void>
  {
    await this.show();

    if( this.elementsInClickRange.length > 1 )
    {
      // centrar mapa sobre elemento seleccionado al abrir herramienta.
      // (aplica solo cuando se cierra la ventana de edicion de centro de mando).
      if( this.selectedElement )
      {
        this.map.flyToBounds(([
          (this.selectedElement.bbox as number[]).slice(0,2).reverse(),
          (this.selectedElement.bbox as number[]).slice(2,4).reverse()
        ] as any),{ duration: .50});
      }
    }
    else
    {
      this.highlightedElementLayer.remove();
      this.highlightedElementLayer = null;
      this.selectedElement = null;
      this.elementsInClickRange = [];
    }
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.beforeClosingTool();
    await super.hide();
  }

  public beforeClosingTool():void
  {
    if( this.selectedElement )
    {
      this.highlightedElementLayer.remove();
      this.highlightedElementLayer = null;
      this.selectedElement = null;
    }

    this.layerFilters = {};
    this.elementsInClickRange = [];
    this.showSpinner = false;  
    this.showingInfo = false;

    this.map.doubleClickZoom.enable(); 
    this.map.off("click", this.onMapClick);
    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');
  }

  public clear():void
  {     
    this.highlightedElementLayer.remove();
    this.highlightedElementLayer = null;
    this.selectedElement = null;

    if( this.elementsInClickRange.length === 1 )
      this.elementsInClickRange = [];

    this.showingInfo = false;
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
        _buttons.splice(1,1);
     
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
          <li class="mb-1">A continuación se mostrará la información en la barra.</li>
        </ol>
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/informacion-elemento/1-informacion-elemento.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video>
        `,
        event: {
          "before-show": () => document.querySelector("body").appendChild(mapRefDiv)
        }
      },
      {
        element: `element-information-tool`,
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

