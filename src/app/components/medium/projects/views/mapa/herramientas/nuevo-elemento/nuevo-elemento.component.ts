import { Component, ChangeDetectorRef, Input, Output, EventEmitter, NgZone, ViewChild } from '@angular/core';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { Map, Polygon, Marker, Polyline } from 'leaflet';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { delayExecution } from 'src/app/shared/helpers';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { Capa } from 'src/app/interfaces/medium/mapa/Modulo';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { isset, toggleFullscreen } from '../../../../../../../shared/helpers';
import { ShepherdService } from 'angular-shepherd';
import { esLocale}  from 'ngx-bootstrap/locale';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { LayerForm, LayerSelectorsSectionComponent } from '../shared/layer-selectors-section/layer-selectors-section.component';
import { ApiService } from '../../../../../../../services/api.service';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
defineLocale('es', esLocale);

@Component({
  selector: 'herramienta-nuevo-elemento',
  templateUrl: './nuevo-elemento.component.html',
  styleUrls: ['./nuevo-elemento.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class NuevoElementoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  @Output()
  public showCommandCenterManagementTool:EventEmitter<any> = new EventEmitter;

  public selectedLayer:Capa = null;

  public formData:LayerForm = {
    module:null,
    group:null,
    layer:null
  };

  @ViewChild(LayerSelectorsSectionComponent)
  public LayerSelectorsSection:LayerSelectorsSectionComponent;

  private featurePropertiesData:{[propertyName:string]:any} = null; 
  public featurePropertiesWithValues:any[] = [];

  public newFeatureLayer:Marker|Polyline|Polygon;
  public featureData:{[propertyName:string]:string|number|boolean} = {};

  public buildingFeatureState:"waiting"|"inProgress"|"finished" = "waiting";

  public showButtonForFinishMultipleGeometryFeature:boolean = false;

  public helpText:string = null;

  public showSpinner:boolean = false;

  public today:Date = new Date;

  private updateHelpText:(event:any) => void = (e) => {
    
    if( this.selectedLayer.tipo_geometria !== "POINT" )
    {
      const isAPolygon = this.geometryTypeOfSelectedLayer.includes("polygon");

      e.layer.editor._drawnLatLngs.length + 1 < e.layer.editor.MIN_VERTEX ?
      this.helpText = `Click para continuar ${ isAPolygon ? "polígono" : "línea" }.` :
      this.helpText = `Click en último punto para terminar ${ isAPolygon ? "polígono" : "línea" }.`;
    }

    this._changeDetector.detectChanges();
  }

  private onDrawingALayer: (event:any) => Promise<void> = async event => 
  {
    this._ngZone.run(async () => {

      if( this.selectedLayer.filtro_capa === "gissmart_energy#gestlighting#centro_mando" )
      {
        await this._showCommandCenterManagementTool();
        return;
      }

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

            this._changeDetector.detectChanges();

          }, 200);
      }
      else
      {
        this.buildingFeatureState = "finished";

        this.newFeatureLayer.disableEdit();

        this.getFeaturePropertiesWithValues();

        this.helpText = this.geometryTypeOfSelectedLayer.includes('polygon') ? 
        `<kdb>Ctrl + click</kdb> sobre polígono para iniciar agujero.`: "";
      }

      this.showButtonForFinishMultipleGeometryFeature = false;
      
      this._spinnerService.hide();
    });
  };

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _projectService:ProjectService,
    private _apiService:ApiService,
    private _projectLayersService:ProjectLayersService,
    private _ngZone:NgZone,
    private _bsLocaleService:BsLocaleService,
    private _shepherdService:ShepherdService
  )
  {
    super();

    this._bsLocaleService.use('es');
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
 
  get thereIsMoreThanOneModule():boolean
  {
    return this._projectLayersService.modulesNumber > 1;
  }

  public async show():Promise<void>
  {
    this.map.on('editable:drawing:click', this.updateHelpText);
    this.map.on('editable:drawing:cancel', () => this.showButtonForFinishMultipleGeometryFeature = false);
    this.map.on("editable:drawing:commit", this.onDrawingALayer);
    
    this.map.doubleClickZoom.disable(); 
    await super.show();
  }

  public onChangeModuleOrGroupSelector():void
  {
    this.selectedLayer = null;
  }

  public async onChangeLayerSelector(layer:Capa):Promise<void>
  {
    this.selectedLayer = layer;
  }

  public drawLayer():void
  {    
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

  private async getFeaturePropertiesWithValues():Promise<void>
  {
    this._ngZone.run(async () => {

      try
      {
        this.showSpinner = true;
  
        this.newFeatureLayer instanceof Marker ?
        this.map.flyTo(this.newFeatureLayer.getLatLng(), 20, {duration: .50}) :
        this.map.flyToBounds( this.newFeatureLayer.getBounds(), { maxZoom: 20, duration: .50});
  
        const newFeatureGeometryToString = GeoJSONHelper.geometryToString(this.newFeatureLayer.toGeoJSON().geometry);
  
        this.featurePropertiesData = ( await this._apiService.postWithAuthentication({
          funcion:"informacion_nuevo_elemento_web",
          bd_proyecto: this._projectService.project.bd_proyecto,
          capa_seleccionada: this.selectedLayer.filtro_capa,
          geometria: `ST_GEOMFROMTEXT('${newFeatureGeometryToString}',${this._projectService.project.proyeccion})`
        }) ).datos;

        if( ! Object.keys(this.featurePropertiesData.atributos).length )
          throw new Error("No hay atributos para asignar al elemento.");

        const featureProperties = this.featurePropertiesData.atributos;

        this.featurePropertiesWithValues = Object.keys(featureProperties).map(propertyName => {
          
          this.featureData[featureProperties[propertyName].campo] = featureProperties[propertyName].tipo === "Booleano" ?
          isset(featureProperties[propertyName].valor_defecto) :
          featureProperties[propertyName].valor_defecto;
          
          featureProperties[propertyName]["nombre"] = propertyName;
          
          return featureProperties[propertyName];
        });

        this.formatFeaturePropertiesWithValues();  
      }
      catch (error)
      {
        this._toastrService.error(error.message, "Error");
        this.clear();
      }
      finally
      {
        this.showSpinner = false;
      }
    });
  }

  private formatFeaturePropertiesWithValues():void
  {
    /* VIALES */

    if( this.featurePropertiesData["viales"] )
    {
      const vials = {
        campo: "vial",
        dominio: true,
        dominios: [],
        nombre: "Vial",
        tipo: "Texto",
        valor_defecto: ""
      };

      for( const [label, value] of Object.entries(this.featurePropertiesData['viales']) )
      {
        vials.dominios.push({label, value});
      }

      this.featurePropertiesWithValues.push(vials);
    }

    /* CRITERIOS PARA CAPA LUMINARIA O PUNTO LUZ */
    if( this.selectedLayer.filtro_capa.includes("gestlighting#luminaria") ||
        this.selectedLayer.filtro_capa.includes("gestlighting#punto_luz") 
      )
    {
      const propertiesToUpdate = {
        marca_soporte: {
          field: "modelo_soporte",
          data: this.featurePropertiesData["soportes"]
        },
        marca_lampara: {
          field: "modelo_lampara",
          data: this.featurePropertiesData["lamparas"]
        },
        marca_luminaria: {
          field: "modelo_luminaria",
          data: this.featurePropertiesData["luminarias"]
        },
        centro_mando: {
          field: "circuito",
          data: this.featurePropertiesData["circuitos"]
        },
      };

      this.featurePropertiesWithValues.forEach(propertyData => {

        if(  propertiesToUpdate[propertyData.campo] )
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
     if( (this.selectedLayer.filtro_capa.includes("gestlighting#luminaria") ||
         this.selectedLayer.filtro_capa.includes("gestlighting#punto_luz") ) &&
         propertyData.datos
       )
     {
      const propertyDataToUpdate = this.featurePropertiesWithValues.find(
        _propertyData => _propertyData.campo === propertyData.datos.field
      );
      
      propertyDataToUpdate.dominio = true;
      propertyDataToUpdate.dominios = propertyData.datos.data[value];
     }
  }

  public finishMultipleGeometryFeature():void
  {
    this.map.editTools.stopDrawing();
    this.buildingFeatureState = "finished";  
    this.newFeatureLayer.disableEdit();

    this.getFeaturePropertiesWithValues();

    this.helpText = null;
                
    this._changeDetector.detectChanges();
  }

  public async saveChanges():Promise<void>
  {
    this._ngZone.run( async () => {
      try {

        this._spinnerService.updateText("Añadiendo elemento...");
  
        this._spinnerService.show();
  
        await delayExecution(250);

        const feature = this.newFeatureLayer.toGeoJSON();

        GeoJSONHelper.reproyectGeometry(undefined, this._projectService.configuration.datos_municipio.nombre_proj4, feature.geometry);

        const featureGeometryToString = GeoJSONHelper.geometryToString(feature.geometry);

        const filtroCapa = this.selectedLayer.filtro_capa.split("#");

        this.featureData["geom"] = `ST_GEOMFROMTEXT('${featureGeometryToString}',${this._projectService.project.proyeccion})`;

        await this._apiService.postWithAuthentication({
          funcion:"nuevo_elemento_web",
          nombre_proyecto: this._projectService.project.nombre,
          bd_proyecto: this._projectService.project.bd_proyecto,
          modulo_formateado: filtroCapa[0],
          grupo_formateado: filtroCapa[1],
          capa_formateada: filtroCapa[2],
          elemento: this.featureData
        });
    
        this._toastrService.success("Elemento añadido.","Exito!");

        this.selectedLayer.capaWms.setParams(({fake: Date.now()} as any));

      } catch (error)
      {
        console.error(error);
        this._toastrService.error(error.message,"Error.");  
      }
      finally
      {
        this.clear();
        this.drawLayer();
        this._spinnerService.hide();
        this._spinnerService.cleanText();
      }
    });
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  private async _showCommandCenterManagementTool():Promise<void>
  {
    this.map.editTools.stopDrawing();
    this.newFeatureLayer.disableEdit();
    this.buildingFeatureState = "waiting";
    this.helpText = null;
    this.map.off("editable:drawing:commit");   
    this.map.off('editable:drawing:cancel');
    this.map.off('editable:drawing:click', this.updateHelpText);

    this.map.flyTo((this.newFeatureLayer as Marker).getLatLng(), 20, {duration: .50});
    
    await super.hide();
    
    this.showCommandCenterManagementTool.emit({
      layer: this.selectedLayer,
      element: this.newFeatureLayer,
      action: "new"
    });

    this.selectedLayer = null;
  }

  public async whenClosingCommandCenterManagementTool(layer:Capa):Promise<void>
  {
    await this.show();
    this.LayerSelectorsSection.fillFormFromALayer(layer);
  }

  public async hide():Promise<void>
  {
    this.showSpinner = false;
    this.selectedLayer = null;

    this.clear();
    this.map.off("editable:drawing:commit");   
    this.map.off('editable:drawing:click', this.updateHelpText);

    this.featurePropertiesWithValues = [];
    this.map.doubleClickZoom.enable(); 

    this._spinnerService.cleanText();

    /* REMOVER TOUR DE SERVICIO */
    this._shepherdService.tourObject = null;

    await super.hide();
  }

  public async clear():Promise<void>
  {
    this.map.editTools.stopDrawing();

    if( this.newFeatureLayer )
    {
      this.newFeatureLayer.remove();
      this.newFeatureLayer = null;
      this.featureData = {};
      this.featurePropertiesWithValues = [];
    }

    this.buildingFeatureState = "waiting";
    
    this.helpText = null;
    
    this.featurePropertiesData = null;
    
    if( this.selectedLayer )
    {
      await delayExecution( this.ANIMATION_DURATION );
      this.LayerSelectorsSection.fillFormFromALayer( this.selectedLayer );
    }
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
          const mediaElements = document.querySelectorAll(".step-media");
          toggleFullscreen(mediaElements[mediaElements.length - 1]);
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
        _buttons = _buttons.slice(2);
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
          element: `${ step.selectorPrefix ?? '#' }${step.element}`, 
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

    const steps = [];

    const firstSteps = [
      {
        element: `layer-selector`,
        labelPosition: "left",
        content: 'Seleccionar <b>capa</b>.',
        selectorPrefix: "."
      },
      {
        element: `new-element-draw-layer-btn`,
        labelPosition: "top",
        content: 'Para seguir con la creación del elemento, hacer click en <span class="badge bg-warning text-white">Continuar</span>.',
        event: {
          "before-show": () => mapRefDiv.remove()
        }
      }
    ];

    if( this.thereIsMoreThanOneModule )
    {
      firstSteps.unshift(
        {
          element: `module-selector`,
          labelPosition: "left",
          content: 'Seleccionar <b>modulo</b>.',
          selectorPrefix: "."
        },
        {
          element: `group-selector`,
          labelPosition: "left",
          content: 'Seleccionar <b>grupo</b>.',
          selectorPrefix: "."
        }
      );
    }

    const secondSteps = [
      {
        element: `mapRefDiv`,
        labelPosition: "right",
        hasMedia: true,
        content: `
        Para capa con <b>geometría de punto</b> hacer click sobre el mapa para crear el elemento.
        <br><br> 
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/nuevo-elemento/1-punto.mp4" type="video/mp4">
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
        hasMedia: true,
        content: `
        Para capa con <b>geometría de línea</b> hacer click sobre el mapa para crear los vértices del elemento y 
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
        element: `new-element-help-text-container`,
        labelPosition: "right-start",
        hasMedia: true,
        content: `
        Mientras se crea el elemento se mostrarán, en la <b>parte inferior de la barra</b>, 
        textos que indican los pasos para crear la geometría. 
        <br><br> 
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/nuevo-elemento/7-texto-ayuda.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video>
        `,
        event: {
          "before-show": () => mapRefDiv.remove()
        }
      }
    ];
    
    const thirdSteps = 
      {
        element: "new-element-tool",
        labelPosition: "right-start",
        hasMedia: true,
        content: `
        Al crear el elemento, se mostrarán los campos para asignar los atributos.
         Hacer click en <span class="badge bg-info text-white">Guardar</span> para guardar el elemento y actualizar la capa. 
        <br><br>
        <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div> 
        <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none'" 
        class="hide step-media w-100 h-auto" src="assets/images/medium/tours/herramientas/nuevo-elemento/8-datos-elemento.png">`
      };

    
    if( this.buildingFeatureState === "finished" )
    {
      steps.push(thirdSteps); // Si el elemento ya esta creado, solo mostrar paso final.
    }
    else
    {
      this.buildingFeatureState === "waiting" ? 
      steps.push(...firstSteps, ...secondSteps, thirdSteps) : // Si no hay ninguna accion realizada mostrar todos los pasos. 
      steps.push(...secondSteps, thirdSteps); // Si el elemento se esta creando, obviar los primeros pasos. 

    } 

    return steps;
  }
}
