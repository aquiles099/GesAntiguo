import { Component, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Map, DomUtil, TileLayer, tileLayer, LatLng, LatLngBounds, Marker } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { MapService } from '../../../../../../../services/unic/map.service';
import { delayExecution } from 'src/app/shared/helpers';
import { isset, toggleFullscreen } from '../../../../../../../shared/helpers';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import Swal from 'sweetalert2';
import { ShepherdService } from 'angular-shepherd';

@Component({
  selector: 'herramienta-editar-elemento',
  templateUrl: './editar-elemento.component.html',
  styleUrls: ['./editar-elemento.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class EditarElementoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  private elementsInClickRange:any[] = [];

  private layerFilters:{[layerFilter:string]:string};

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  @Output()
  public showCommandCenterManagementTool:EventEmitter<any> = new EventEmitter;

  private highlightedElementLayer:TileLayer.WMS;

  public showSpinner:boolean = false;

  public selectedElement:any;

  public inEdition = false;

  public featurePropertiesWithValues:any[] = [];

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
            "funcion": "informacion_edicion_alfanumerica_web",
            "proyecto": this.project.bd_proyecto,
            "proyeccion": this.project.proyeccion,
            "pulsacion": point.coordinates,
            "capas_filtro": this.layerFilters,
        })).datos;

        this.inEdition = false;

        this.selectedElement = null;

        if( this.highlightedElementLayer )
          this.highlightedElementLayer.remove();
          
        this.elementsInClickRange = [];

        for( const [id, elementData] of Object.entries(data))
        {
          elementData["id"] = id;
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
            this.inEdition = true :
            this.elementsInClickRange = [];
          }      
        }
        
        this.sortElementsInClickRange();
      }
      catch (error)
      {
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        // Al abrir herramienta de gestion de centro de mando ya el contenedor esta escondido. 
        if( this.isVisible ) 
          this.map.on("click", this.onMapClick);
        
        this._mapService.enableEvents();
        this.map.doubleClickZoom.disable(); 
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
      /*if( ! Object.keys(layerData.atributos).length )
        throw new Error("El elemento no tiene atributos para editar.");*/
        if(! Object.keys(layerData.atributos).length){
          Swal.fire({
            icon: "info",
            title: "Error",
            text: "Debe configurar algún atributo para esta herramienta.",
            confirmButtonText: "OK",
          });
        }

      this.map.flyToBounds(([
        (layerData.bbox as number[]).slice(0,2).reverse(),
        (layerData.bbox as number[]).slice(2,4).reverse()
      ] as any),{ duration: .50});

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

      Object.keys(layerData.atributos).forEach(propertyName => {
          
        layerData.datos_elemento[propertyName] = layerData.atributos[propertyName].tipo === "Booleano" ?
        isset(layerData.datos_elemento[propertyName]) :
        layerData.datos_elemento[propertyName];
        
        layerData.atributos[propertyName]["nombre"] = propertyName;
        
      });

      layerData.atributos_array = Object.values(layerData.atributos);

      this.selectedElement = layerData;

      this.formatFeaturePropertiesWithValues();  
    }
    catch (error)
    {
      this._toastrService.error(error.message);  
    }
  }

  private formatFeaturePropertiesWithValues():void
  {
    /* VIALES */
    if( this.selectedElement["viales"] )
    {
      const vials = {
        campo: "vial",
        dominio: true,
        dominios: [],
        nombre: "Vial",
        tipo: "Texto",
        valor_defecto: ""
      };

      for( const [label, value] of Object.entries(this.selectedElement['viales']) )
      {
        vials.dominios.push({label, value});
      }

      this.selectedElement.atributos_array.push(vials);
    }

    /* CRITERIOS PARA CAPA LUMINARIA O PUNTO LUZ */
    if( this.selectedElement.capa.includes("gestlighting#luminaria") ||
        this.selectedElement.capa.includes("gestlighting#punto_luz") 
      )
    {
      const propertiesToUpdate = {
        marca_soporte: {
          field: "modelo_soporte",
          data: this.selectedElement["soportes"] ?? ["-"]
        },
        marca_lampara: {
          field: "modelo_lampara",
          data: this.selectedElement["lamparas"] ?? ["-"]
        },
        marca_luminaria: {
          field: "modelo_luminaria",
          data: this.selectedElement["luminarias"] ?? ["-"]
        },
        centro_mando: {
          field: "circuito",
          data: this.selectedElement["circuitos"] ?? ["-"]
        },
      };

      this.selectedElement.atributos_array.forEach(propertyData => {

        if( propertiesToUpdate[propertyData.campo] )
        {
          propertyData["datos"] = propertiesToUpdate[propertyData.campo];
          propertyData.dominio = true;
          propertyData.dominios = Object.keys(propertiesToUpdate[propertyData.campo].data) ;    
        }

      });
    }
  }

  public onChangePropertyValueSelector(propertyData: any, value:string|number):void
  {
     /* CRITERIOS PARA CAPA LUMINARIA O PUNTO LUZ */
     if( (this.selectedElement.capa.includes("gestlighting#luminaria") ||
         this.selectedElement.capa.includes("gestlighting#punto_luz") ) &&
         propertyData.datos
       )
     {
      const propertyDataToUpdate = this.selectedElement.atributos_array.find(
        _propertyData => _propertyData.campo === propertyData.datos.field
      );
      
      propertyDataToUpdate.dominio = true;
      propertyDataToUpdate.dominios = propertyData.datos.data[value] ?? ["-"];
     }
  }

  public showfieldsToEdit():void
  {
    if( this.selectedElement.capa === "gissmart_energy#gestlighting#centro_mando" )
    {
      this._showCommandCenterManagementTool();
      return;
    }

    this.inEdition = true;
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
      action: "update"
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

  public async saveChanges():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando elemento...");
      this._spinnerService.show();

      await delayExecution(250);

      const layerFilter = this.selectedElement.capa.split("#");

      const elementData = {};
      
      elementData[`id_${layerFilter[2]}`] = this.selectedElement.id;

      this.selectedElement.atributos_array.forEach(propertyData => {
       elementData[propertyData.campo] = this.selectedElement.datos_elemento[propertyData.nombre];
      });

      await this._projectsService.consultarApi({
        funcion: "edicion_alfanumerica",
        bd_proyecto: this.project.bd_proyecto,
        modulo_formateado: layerFilter[0],
        grupo_formateado: layerFilter[1],
        capa_formateada: layerFilter[2],
        elemento: elementData
      });

      const layer = this._projectLayersService.obtenerCapas().find(layer => layer.filtro_capa === this.selectedElement.capa);
      
      layer.refrescar();

      // verificar si la capa del elemento tiene filtro.
      // Si lo tiene, revisar si el elemento editado queda filtrado o no
      // para ser removido del listado de elementos capturados por el rango de click 
      //(en caso de que halla mas de un elemento).
      if( this.elementsInClickRange.length > 1 )
      {
        for( let [property, values] of Object.entries( layer.obtenerFiltro() ) )
        {
          if( ! values.includes( elementData[property] ) )
          {
            this.elementsInClickRange = this.elementsInClickRange.filter(element => element.id !== this.selectedElement.id);
            break;
          }
        }
      }
      
      this._toastrService.success("Elemento editado.","Exito!");
      
      this.clear();
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

    this.elementsInClickRange = [];
    this.showSpinner = false;  
    this.inEdition = false;
    this.layerFilters = null;

    this.map.doubleClickZoom.enable(); 
    this.map.off("click", this.onMapClick);
    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    this._shepherdService.tourObject = null;
  }

  public clear():void
  {     
    this.highlightedElementLayer.remove();
    this.highlightedElementLayer = null;
    this.selectedElement = null;

    if( this.elementsInClickRange.length === 1 )
      this.elementsInClickRange = [];
      
    this.inEdition = false;

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
         Para editar un elemento:
         <ol>
          <li class="mb-1">Hacer click encima o cerca del mismo y esperar a que sea ubicado.</li>
          <li class="mb-1">Editar los campos de atributos.</li>
          <li class="mb-1">Hacer click en <span class="badge bg-info text-white">Guardar</span> y la información del elemento sera actualizada.</li>
         </ol>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/editar-elemento/1-editar-elemento.mp4" type="video/mp4">
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
         Si se hace click entre elementos contiguos o cercanos entre si (cualquier geometría) 
         serán listados en la barra, donde se podrá buscar y seleccionar el deseado.
         <br> Para que un elemento sea listado debe estar dentro del <b>rango de pulsación del click</b> (<b>3 metros</b>).
         <br> Puede medir con la herramienta de medición de perímetro (ver botón <img class="ml-1 icon d-inline-block" src="assets/icons/SVG/MEDIRLONGITUD.svg">).
         <br><br>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/editar-elemento/2-elementos-adyacentes.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video>  
         `
       }
     ];
  
     return steps;
   }
}
