import { Component, Input, Output, EventEmitter, NgZone, ChangeDetectorRef } from '@angular/core';
import { Map, Polyline, Polygon, Marker, DomUtil, TileLayer, tileLayer, LatLng } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { MapService } from '../../../../../../../services/unic/map.service';
import { delayExecution } from 'src/app/shared/helpers';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../shared/helpers';

@Component({
  selector: 'herramienta-copiar-elemento',
  templateUrl: './copiar-elemento.component.html',
  styleUrls: ['./copiar-elemento.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class CopiarElementoComponent extends HideableSectionComponent
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

  public copyingElement = false;

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
            funcion: "informacion_copia_web",
            proyecto: this.project.bd_proyecto,
            proyeccion: this.project.proyeccion,
            pulsacion: point.coordinates,
            capas_filtro: this.layerFilters,
        })).datos;

        this.copyingElement = false;

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
        {
          this.onSelectLayer(this.elementsInClickRange[0]);
          this.drawLayer();
        }
      }
      catch (error)
      {
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        this._mapService.enableEvents();

        if( ! this.copyingElement )
          this.map.on("click", this.onMapClick);

          this.showSpinner = false;
      }
    });
  };

  public newFeatureLayer:Marker|Polyline|Polygon;
  public buildingFeatureState:"waiting"|"inProgress"|"finished" = "waiting";

  public helpText:string = null;

  private updateHelpText:(event:any) => void = (e) => {

    if( this.selectedLayer.tipo_geometria !== "POINT" )
    {
      const isAPolygon = this.geometryTypeOfSelectedLayer.includes("polygon");

      e.layer.editor._drawnLatLngs.length + 1 < e.layer.editor.MIN_VERTEX ?
      this.helpText = `Click para continuar ${ isAPolygon ? "polígono" : "línea" }.` :
      this.helpText = `Click en último punto para terminar ${ isAPolygon ? "polígono" : "línea" }.`;

      this._changeDetectorRef.detectChanges();
    }
  }

  public showButtonForFinishMultipleGeometryFeature:boolean = false;

  private onDrawingALayer: (event:any) => Promise<void> = async event =>
  {
    this._ngZone.run(async () => {

      this._spinnerService.updateText("Dibujando elemento...");
      this._spinnerService.show();

      await delayExecution(250);

      if( this.geometryTypeOfSelectedLayer.includes("multi") && this.buildingFeatureState === "inProgress" )
      {
        setTimeout(() => {

            (this.newFeatureLayer as any).editor.newShape();

            this.showButtonForFinishMultipleGeometryFeature = true;

            this.helpText = this.geometryTypeOfSelectedLayer.includes('polygon') ? `
            Click en mapa para iniciar nuevo polígono. <br> 
            Click sobre polígono para iniciar agujero. <br>
            ` :
            `Click en mapa para iniciar nueva línea.`;

            this._changeDetectorRef.detectChanges();

          }, 200);
      }
      else
      {
        this.buildingFeatureState = "finished";

        this.helpText = this.geometryTypeOfSelectedLayer.includes('polygon') ?
        `<kdb>Ctrl + click</kdb> sobre polígono para iniciar agujero.`: "";
      }

      this._spinnerService.hide();
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
    private _changeDetectorRef:ChangeDetectorRef,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get drawing():boolean
  {
    return this.map.editTools.drawing();
  }
  
  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  get geometryTypeOfSelectedLayer():string
  {
    return this.selectedLayer.tipo_geometria.toLowerCase();
  }

  public async show():Promise<void>
  {
    this.layerFilters = this._projectLayersService.obtenerFiltrosDeCapas();

    this.map.on("click", this.onMapClick);
    this.map.on('editable:drawing:click', this.updateHelpText);
    this.map.on('editable:drawing:cancel', () => this.showButtonForFinishMultipleGeometryFeature = false);
    this.map.on("editable:drawing:commit", this.onDrawingALayer);

    this.map.doubleClickZoom.disable();

    DomUtil.addClass(this.map.getContainer(), 'cursor-help');

    await super.show();
  }

  public async onSelectLayer(layerData:any):Promise<void>
  {
    try
    {
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

      this.map.flyToBounds(([
        (layerData.bbox as number[]).slice(0,2).reverse(),
        (layerData.bbox as number[]).slice(2,4).reverse()
      ] as any),{ maxZoom: 20, duration: .50});

      this.selectedLayer = layerData;

      if( ! layerData.tipo_geometria || ! layerData.tipo )
      {
        const layer = this._projectLayersService.obtenerCapas().find(layer => layer.filtro_capa === layerData.capa);
        this.selectedLayer["tipo"] = layer.nombre;
        this.selectedLayer["tipo_geometria"] = layer.tipo_geometria;
      }

    }
    catch (error)
    {
      this._toastrService.error(error.message);
    }
  }

  public async drawLayer():Promise<void>
  {
    this.copyingElement = true;

    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    this.map.off("click", this.onMapClick);

    switch( this.selectedLayer.tipo_geometria )
    {
      case "POINT":
        this.newFeatureLayer = this.map.editTools.startMarker();
        this.helpText = "Click en mapa para agregar marcador.";
        break;

      case "LINESTRING":
      case "MULTILINESTRING":
        this.newFeatureLayer = this.map.editTools.startPolyline();
        this.helpText = "Click en mapa para iniciar línea.";
        break;

      case "POLYGON":
      case "MULTIPOLYGON":

        this.newFeatureLayer = this.map.editTools.startPolygon();

        // evento pora iniciar agujero sobre poligono una vez que este es dibujado.
        this.newFeatureLayer.on('click', (event:any) => {

          if ((event.originalEvent.ctrlKey || event.originalEvent.metaKey) &&
             (this.newFeatureLayer as any).editEnabled() &&
             this.selectedLayer.tipo_geometria !== "MULTIPOLYGON"
            )
            {
              (this.newFeatureLayer as any).editor.newHole(event.latlng);
            }

        });

        this.helpText = "Click en mapa para iniciar polígono.";

        break;
    }

    this.buildingFeatureState = "inProgress";
  }

  
  public finishMultipleGeometryFeature():void
  {
    this.map.editTools.stopDrawing();
    this.buildingFeatureState = "finished";

    this.helpText = null;

    this._changeDetectorRef.detectChanges();
  }

  public async saveChanges():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Copiando elemento...");
      this._spinnerService.show();

      await delayExecution(250);

      const feature = this.newFeatureLayer.toGeoJSON();

      GeoJSONHelper.reproyectGeometry(undefined, this._projectService.configuration.datos_municipio.nombre_proj4, feature.geometry);

      const featureGeometryToString = GeoJSONHelper.geometryToString(feature.geometry);

      const layerFilter = this.selectedLayer.capa.split("#");

      const module = this._projectLayersService.obtenerModulos().find(module => module.nombre_formateado === layerFilter[0]);
      const group = module.grupos.find(group => group.nombre_formateado === layerFilter[1]);
      const layer = group.capas.find(layer => layer.nombre_formateado === layerFilter[2]);

      await this._projectsService.consultarApi({
        funcion: "copia_elemento_web",
        modulo: module.nombre,
        modulo_formateado: module.nombre_formateado,
        grupo: group.nombre,
        grupo_formateado: group.nombre_formateado,
        capa: layer.nombre,
        capa_formateada: layer.nombre_formateado,
        nombre_proyecto: this.project.nombre,
        bd_proyecto: this.project.bd_proyecto,
        geometria: featureGeometryToString,
        proyeccion: this.project.proyeccion,
        id_elemento_original: this.selectedLayer.id
      });

      layer.refrescar();

      this._toastrService.success("Elemento copiado.","Exito!");

      this.map.editTools.stopDrawing();

      this.newFeatureLayer.remove();

      this.drawLayer();
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
    this.map.editTools.stopDrawing();

    if( this.newFeatureLayer )
    {
      this.newFeatureLayer.remove();
      this.newFeatureLayer = null;
    }

    if( this.selectedLayer )
    {
      this.highlightedElementLayer.remove();
      this.highlightedElementLayer = null;
      this.selectedLayer = null;
    }

    this.elementsInClickRange = [];
    this.showSpinner = false;
    this.copyingElement = false;
    this.buildingFeatureState = "waiting";

    this.layerFilters = null;

    this.map.doubleClickZoom.enable();
    this.map.off("editable:drawing:commit", this.onDrawingALayer);
    this.map.off('editable:drawing:cancel');
    this.map.off('editable:drawing:click', this.updateHelpText);
    this.map.off("click", this.onMapClick);
    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    // Remover tour de servicio global.
    this._shepherdService.tourObject = null;

    await super.hide();
  }

  public clear():void
  {
    this.map.editTools.stopDrawing();

    this.newFeatureLayer.remove();

    this.highlightedElementLayer.remove();
    this.highlightedElementLayer = null;
    this.selectedLayer = null;

    if( this.elementsInClickRange.length === 1 )
      this.elementsInClickRange = [];

    this.copyingElement = false;

    this.buildingFeatureState = "waiting";

    this.map.on("click", this.onMapClick);

    DomUtil.addClass(this.map.getContainer(), 'cursor-help');
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
       {
        _buttons.splice(1,1);
       }
       else
       {
          if( ! step.hasMedia  )
          _buttons = _buttons.slice(1);  
        }
        
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
         hasMedia: true,
         content: `
         <ol>
          <li class="mb-1"> Hacer click encima o cerca del elemento <b>del que se quieren copiar los atributos</b> y esperar a que sea ubicado.</li>
          <li class="mb-1"> Una vez seleccionado, dibujar el elemento que contendrá los atributos copiados. </li>
          <li class="mb-1"> Confirmar la posición del nuevo elemento sobre el mapa si es necesario. </li>
          <li class="mb-1"> Hacer click en <span class="badge bg-info text-white">Guardar</span> para finalizar.</li>
         </ol>.
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/copiar-elemento/1-copiar-elemento.mp4" type="video/mp4">
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
         Los pasos para dibujar el elemento seran iguales a los usados en la herramienta de <b>nuevo elemento</b> 
         (ver botón <img class="ml-1 icon d-inline-block" src="assets/icons/SVG/NUEVOPUNTO.svg">).
         `
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         hasMedia: true,
         content: `
         Para <b>geometría de punto</b> hacer click sobre el mapa para crear el elemento.
         <br><br> 
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/nuevo-elemento/1-punto.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         hasMedia: true,
         content: `
         Para <b>geometría de línea</b> hacer click sobre el mapa para crear los vértices del elemento y 
         click sobre el vértice final para terminar. 
         <br><br>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/nuevo-elemento/2-linea.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         hasMedia: true,
         content: `
         Puede <b>crear</b> vértices en la línea haciendo <b>click sobre los existentes</b> y también <b>moverlos, arrastrandolos con el cursor</b>.
         <br><br>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/nuevo-elemento/3-linea-manipulacion.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         hasMedia: true,
         content: `
         Al igual que en <b>línea</b>, para <b>geometría de polígono</b>, hacer click sobre el mapa para 
         crear los vértices del elemento y click sobre el vértice final para terminar.
         <br><br> 
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/nuevo-elemento/4-poligono.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         hasMedia: true,
         content: `
         Puede <b>crear</b> vértices en el polígono haciendo <b>click sobre los existentes</b> y también <b>moverlos, arrastrandolos con el cursor</b>.
         También puede dibujarle agujeros.
         <br><br>
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/nuevo-elemento/5-poligono-manipulacion.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video>  
         `
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         hasMedia: true,
         content: `
         Para <b>geometrías multi-parte</b> (<b>multi-línea</b> y <b>multi-polígono</b>) se sigue la misma logíca de polígono y línea con la 
         diferencia que puede crear multiples geometrías para el elemento. Para terminar la construcción hacer click en <span class="badge bg-warning text-white">Terminar</span>.
         <br><br> 
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/nuevo-elemento/6-multi-poligono.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video>
         `,
         event: {
           "before-show": () => document.querySelector("body").appendChild(mapRefDiv)
         }
       },
       {
         element: `copy-element-tool-body`,
         labelPosition: "right-start",
         hasMedia: true,
         content: `
         Mientras se crea el elemento se mostrarán, en la <b>parte superior de la barra</b>, textos que indican los pasos para crear la geometría. 
         <br><br> 
         <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/copiar-elemento/9-texo-ayuda.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
         `,
         event: {
           "before-show": () => mapRefDiv.remove()
         }
       },
       {
        element: `mapRefDiv`,
        labelPosition: "right",
        hasMedia: true,
        content: `
        Si se hace click entre elementos contiguos o cercanos entre si (cualquier geometría) 
        serán listados en la barra, donde podrá buscar y seleccionar el deseado.
        <br> Para que un elemento sea listado debe estar dentro del <b>rango de pulsación del click</b> (<b>3 metros</b>).
        <br> Puede medir con la herramienta de medición de perímetro (ver botón <img class="ml-1 icon d-inline-block" src="assets/icons/SVG/MEDIRLONGITUD.svg">).
        <br><br>
        <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/copiar-elemento/10-elementos-adyacentes.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
        `,
        event: {
          "before-show": () => document.querySelector("body").appendChild(mapRefDiv)
        }
      }
     ];
    
     return steps;
   }
}

