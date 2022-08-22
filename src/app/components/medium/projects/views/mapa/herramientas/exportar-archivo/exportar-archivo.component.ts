import { Component, Output, EventEmitter, ViewChild, Input, NgZone } from '@angular/core';
import { HideableSectionComponent } from 'src/app/components/shared/hideable-section/hideable-section.component';
import { ProjectLayersService } from 'src/app/services/medium/project-layers.service';
import { ProjectService } from 'src/app/services/unic/project.service';
import { ShepherdService } from 'angular-shepherd';
import { Modulo, Grupo, Capa } from '../../../../../../../interfaces/medium/mapa/Modulo';
import { ToastrService } from 'ngx-toastr';
import { NgForm } from '@angular/forms';
import { Draw, DrawMap, FeatureGroup, TileLayer } from 'leaflet';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { toggleFullscreen } from '../../../../../../../shared/helpers';
import LeafletWms from 'leaflet.wms';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'herramienta-exportar-archivo',
  templateUrl: './exportar-archivo.component.html',
  styleUrls: ['./exportar-archivo.component.css', '../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class ExportarArchivoComponent extends HideableSectionComponent {

  @Input()
  public map:DrawMap;

  @Input()
  public drawnElementsLayer:FeatureGroup;

  public nombreProyeccion: string;

  public formatos = ["SHAPE", "JSON", "CSV", "GML", "KML"];

  public modosDeSeleccion:{name:string, value:string, disabled: boolean}[] = [
    {
      name: "Todo",
      value: "all",
      disabled: false
    },
    {
      name: "Selección personalizada",
      value: "custom_selection",
      disabled: false
    },
    {
      name: "Centros de mando especificos",
      value: "specific_command_centers",
      disabled: false
    }
  ];

  public formObject:{[key:string]:string} = 
  {
    module: null,
    group: null,
    layer: null,
    formato: null,
    modo_seleccion: null  
  };

  private capaSeleccionada:Capa;

  @ViewChild(NgForm)
  public form:NgForm;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  // custom selection

  public polygon: Draw.Polygon;

  public drawing:boolean = false;

  private onDrawnPolygon:(event: any) => Promise<void> = async event =>
  {
    try
    {
      this._spinnerService.updateText("Ubicando elementos...");
      this._spinnerService.show();

      const data = (await this._projectsService.consultarApi({
        funcion: "web_informacion_edicion_alfanumerica_edicio_multiple",
        proyecto: this.project.bd_proyecto,
        proyeccion: this.project.proyeccion,
        modulo: this.capaSeleccionada.modulo,
        grupo: this.capaSeleccionada.grupo,
        capa: this.capaSeleccionada.nombre,
        filtro: this.capaSeleccionada.capaWms.wmsParams.cql_filter ?? "",
        geometria: event.layer._latlngs
      })).datos;

      if( ! data.elementos.length )
        throw new Error("No se ubico ningún elemento dentro del polígono dibujado.");

      let cqlFilter = this.buildCqlFilterForExportRequest( data.elementos, "id_" + this.capaSeleccionada.nombre_formateado );

      this.exportLayerData( cqlFilter );

      this.drawing = false;
    }
    catch(error)
    {
      this._ngZone.run(() => {
        this._toastrService.error(error.message, "Error");
        // leve retraso para esperar que el evento de rectangulo se remueva.
        setTimeout(() => this.drawPolygon(), 250);
      });
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  private buildCqlFilterForExportRequest: (elements:any[], attribute:string) => string = (elements, attribute) =>
  {
    let cqlFilter = attribute + " IN (";
      
    for( let i = 0, elementsNumber = elements.length; i < elementsNumber; i++ )
    {
      cqlFilter += `'${ typeof elements[i] === "string" ? elements[i] : elements[i].id}'`;
      
      if( i !== (elementsNumber - 1))
        cqlFilter += `, `;
    }

    cqlFilter += ")";  

    return cqlFilter;
  }

  // specific command centers 
  
  public commandCenters:string[] = [];
  public selectedCms:string[] = [];
  
  private highlightedElementsLayer:TileLayer.WMS;

  public selectingCommandCenters:boolean = false;

  constructor(
    private _projectLayersService: ProjectLayersService,
    private _projectService: ProjectService,
    private _projectsService:ProjectsService,
    private _shepherdService:ShepherdService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _ngZone:NgZone
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

  get showingForm():boolean
  {
    return ! this.drawing && ! this.selectingCommandCenters;
  }

  get thereAreSelectedCms():boolean
  {
    return this.selectedCms.length > 0;
  }
 
  get allCmsAreSelected():boolean
  {
    return this.selectedCms.length === this.commandCenters.length;
  }

  get thereIsMoreThanOneModule():boolean
  {
    return this._projectLayersService.modulesNumber > 1;
  }

  public async show(): Promise<void>
  {
    this.nombreProyeccion = this._projectService.configuration?.datos_municipio.nombre_proyeccion;
    this.map.on('draw:created',this.onDrawnPolygon);

    await super.show();
  }
  
  public onChangeModuleOrGroupSelector():void
  {
    this.capaSeleccionada = null;
  }

  public eventoCapaSeleccionada(capa:Capa):void
  {
    this.capaSeleccionada = capa;
    
    if( this.formObject.modo_seleccion === 'specific_command_centers' && capa.nombre_formateado !== 'centro_mando' )
      this.formObject.modo_seleccion = null;
  }

  public onSubmitForm():void
  {
    switch( this.formObject.modo_seleccion )
    {
      case "all":
        this.exportLayerData();
        break;
      case "custom_selection":
        this.drawPolygon();
        break;
      case "specific_command_centers":
        this.getCommandCenters();
        break;
    }
  }

  public applyFilterInSelectedLayerAndMakeRequest():void
  {
    let cqlFilter = this.buildCqlFilterForExportRequest( this.selectedCms, 'descripcion');
    this.exportLayerData(cqlFilter);
    this.selectedCms = [];
  }
  
  private exportLayerData(cqlFilter?:string):void
  {  
    try
    {
      this._ngZone.run(() => this._toastrService.info("La descarga del archivo empezará en un momento, por favor espere."));
 
      //Obtenemos el nombre del proyecto
      let bdProyecto = this.project.bd_proyecto,
          estructuraCapa = this.capaSeleccionada.filtro_capa.replace(/#/g, '_');
      let peticionGeo = "";

      const a = document.createElement('a');

      //SHAPE
      if (this.formObject.formato === "SHAPE")
      {
        peticionGeo = 
        `${environment.baseUrl}geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${bdProyecto}%3A${estructuraCapa}${cqlFilter ? "&cql_filter=" + cqlFilter : ''}&outputFormat=shape-zip`;

        a.href = peticionGeo;
        a.click();

      //JSON
      } else if (this.formObject.formato === "JSON") {

        peticionGeo = 
        `${environment.baseUrl}geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${bdProyecto}%3A${estructuraCapa}${cqlFilter ? "&cql_filter=" + cqlFilter : ''}&outputFormat=application/json`;

        fetch(peticionGeo)
        .then((response) => response.json())
        .then((response: JSON) => {
         
          let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response));
          a.href = dataStr;
          a.download = estructuraCapa + ".json";
          a.click();

        });

      //CSV
      } else if (this.formObject.formato === "CSV")
      {
        peticionGeo = 
        `${environment.baseUrl}geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${bdProyecto}%3A${estructuraCapa}${cqlFilter ? "&cql_filter=" + cqlFilter : ''}&outputFormat=csv`;

        a.href = peticionGeo;
        a.click();

        //GML
      } else if (this.formObject.formato === "GML") {
        peticionGeo = 
        `${environment.baseUrl}geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${bdProyecto}%3A${estructuraCapa}${cqlFilter ? "&cql_filter=" + cqlFilter : ''}&outputFormat=GML2`;

        fetch(peticionGeo)
        .then(response => response.text())
        .then((response) => {
         
          let dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(response);
          a.href = dataStr;
          a.download = estructuraCapa + ".gml";
          a.click();

        });
        
        //KML
      } else if (this.formObject.formato === "KML") {

        peticionGeo = 
        `${environment.baseUrl}geoserver/wms/kml?layers=${bdProyecto}:${estructuraCapa}&styles=${this.capaSeleccionada.capaWms.wmsParams.styles}`;

        a.href = peticionGeo;
        a.click();

      }
    
    }
    catch(error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
  }

  // custom selection

  private drawPolygon():void
  {
    this.polygon = new Draw.Polygon(this.map);
    this.polygon.enable();
    this.drawing = true;
  }

  // specific command centers

  public async getCommandCenters():Promise<void>
  {
    try
    {
      if( ! this.commandCenters.length )
      {
        this._spinnerService.show();
  
        this.commandCenters = (await this._projectsService.consultarApi({
            funcion: "web_fichas_cm_lista_cm",
            proyecto: this.project.bd_proyecto,
            modulo: "gissmart_energy",
            grupo: "gestlighting",
            capa: "centro_mando"
        })).datos.lista;
  
        this.createAndProjectHighlightLayer();
      }

      this.selectingCommandCenters = true;
    }
    catch(error)
    {
      console.error(error);
      this._toastrService.error(error.mesagge,"Error");
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  private createAndProjectHighlightLayer():void
  {
    const baseUrl = this.project.url_base.split('wms?')[0] + "wms?";

    this.highlightedElementsLayer = new LeafletWms.overlay(baseUrl, ({
      layers: "gissmart_energy_gestlighting_centro_mando",
      styles: "buffer_linea",
      className: "informacion_seleccionado",
      format: 'image/png',
      crossOrigin: true,
      transparent: true,
      opacity: 1,
      maxNativeZoom: 22,
      maxZoom: 22,
      tiled: false,
      cql_filter: null,
      env: "buffer:30",
    } as any));

    this.map.addLayer(this.highlightedElementsLayer);

    this.highlightedElementsLayer.bringToBack();
  }

  public async selectAllCms():Promise<void>
  {
    this.selectedCms = [...this.commandCenters];
    this.updateHiglightedElementsLayer();
  }

  public async unselectAllCms():Promise<void>
  {
    this.selectedCms = [];
    this.updateHiglightedElementsLayer();
  }

  public cmIsSelected(cm:string):boolean
  {
    return this.selectedCms.includes(cm);
  }

  public updateSelectedCms(cm):void
  {
    this.cmIsSelected(cm) ?
    this.selectedCms = this.selectedCms.filter(_cm => _cm !== cm) :
    this.selectedCms.push(cm);

    this.updateHiglightedElementsLayer();
  }

  private updateHiglightedElementsLayer():void
  {
    if( this.selectedCms.length )
    {
      let cms = this.selectedCms.map(cm => `'${cm}'`);
      (this.highlightedElementsLayer.wmsParams as any).cql_filter = `descripcion IN (${cms.join(", ")})`;
    }
    else
    {
      (this.highlightedElementsLayer.wmsParams as any).cql_filter = "id_centro_mando='????'";
    }  
    
    this.highlightedElementsLayer.setParams(({fake: Date.now()} as any));
  }

  //

  public returnToForm():void
  {
    this.drawing ?
    this.clearPolygonAndStopDrawing() :
    this.clearSelectedCmsAndUpdateHighlightedElementsLayer();
  }

  private clearSelectedCmsAndUpdateHighlightedElementsLayer():void
  {
    this.selectedCms = [];
    this.updateHiglightedElementsLayer();
    this.selectingCommandCenters = false;
  }

  private clearPolygonAndStopDrawing():void
  {
    this.polygon.disable();
    this.drawnElementsLayer.clearLayers();
    this.drawing = false;
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide(): Promise<void> 
  {
    this.capaSeleccionada = null;

    this.form.reset();

    this._shepherdService.tourObject = null;
    
    if( this.polygon )
      this.clearPolygonAndStopDrawing();

    this.map.off('draw:created', this.onDrawnPolygon);

    if( this.commandCenters.length )
      this.clearCommandCentersData();

    await super.hide();
  }

  private clearCommandCentersData():void
  {
    this.selectedCms = [];
    this.commandCenters = [];

    this.map.removeLayer( this.highlightedElementsLayer );
    this.highlightedElementsLayer = null;
    this.selectingCommandCenters = false;
  }

  /* TOUR */

  public showTour():void
  {
    if( this.tourIsActive )
      return;

    this.buildTour();

    const onCancelOrCompleteTourClosure = () => {

      const mapRefDiv = document.getElementById("mapRefDiv");
        
      if( mapRefDiv )
        mapRefDiv.remove();
    }

    this._shepherdService.tourObject.on("cancel", onCancelOrCompleteTourClosure);
    this._shepherdService.tourObject.on("complete", onCancelOrCompleteTourClosure);

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
        _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (más a la derecha) siempre sera el de avanzar / finalizar.
        _buttons[lastBtnIndex].text = 'Finalizar';
        _buttons[lastBtnIndex].action = () => that._shepherdService.complete();
      }
      
      const _step = {
        id: step.element,
        attachTo: { 
          element: `${step.selectorPrefix ?? "#"}${step.element}`, 
          on: step.labelPosition
        },
        buttons: _buttons,
        title: `PASO ${i + 1}`,
        text: step.content,
        beforeShowPromise: step.beforeShowPromise ?? null,
        when: step.event
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

    const drawPolygonStep = {
      element: `mapRefDiv`,
      hasMedia: true,
      labelPosition: "left-start",
      content: `
      Para <b>Selección personalizada</b> encerrar los elementos que se desean exportar en un polígono
      (dibujando sobre el mapa).  
      <br><br>
      Para dibujar polígono, <b>hacer click en el mapa para crear los vértices</b> y click en el vértice inicial para terminar.
      <br><br>
      Al terminar el polígono, empezará la exportación.
      <br><br>
      <div style="display: none">Error al cargar video.</div>
      <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
            class="step-media" loop autoplay muted>
        <source src="assets/images/medium/tours/herramientas/exportar-informacion-de-capa/6-seleccion-personalizada.mp4" type="video/mp4">
        Tu navegador no soporta videos.
      </video> 
      `,
      event: {
        "before-show": () => document.querySelector("body").appendChild(mapRefDiv),
        "hide": () => mapRefDiv.remove()
      }
    };

    const selectingCommandCentersStep = 
    {
      element: `map-section`,
      selectorPrefix: `.`,
      hasMedia: true,
      labelPosition: "left",
      content: `
      Para <b>centros de mando especificos</b>, seleccionar uno o varios haciendo click sobre el nombre o la casilla correspondiente.
      <br><br>
      Hacer click <span class="badge bg-info text-white">Exportar</span> para generar el archivo.
      <div style="display: none">Error al cargar video.</div>
      <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
            class="step-media" loop autoplay muted>
        <source src="assets/images/medium/tours/herramientas/exportar-informacion-de-capa/7-seleccionar-centros-de-mando.mp4" type="video/mp4">
        Tu navegador no soporta videos.
      </video> 
      `
    };

    let steps = [];

    if( this.drawing )
    {
      steps.push(drawPolygonStep);
    }
    else if( this.selectingCommandCenters )
    {
      steps.push(selectingCommandCentersStep);
    }
    else
    {

      steps.push(
        {
          element: `layer-selector`,
          selectorPrefix:".",
          labelPosition: "left",
          content: 'Seleccionar <b>capa</b>.'
        },
        {
          element: `format-selector`,
          labelPosition: "left",
          content: `
            Seleccionar <b>formato</b>
            <br>
            <b>(SHAPE, JSON, CSV, GML, KML)</b>.
          `
        },
        {
          element: `selection-mode-selector`,
          labelPosition: "left",
          content: `
            Seleccionar <b>modo de selección</b>
            <br><br>
            <ul>
              <li class="mb-1">
                <b>Todo</b>: todos los elementos de la capa seleccionada serán exportados.
              </li>
              <li class="mb-1">
                <b>Selección personalizada</b>: solo elementos dentro de una zona dibujada sobre el mapa.
              </li>
              <li class="mb-1">
                <b>Centros de mando especificos (solo para centro de mando)</b>.
              </li>
            </ul>
          `
        },
        drawPolygonStep,
        selectingCommandCentersStep,
        {
          element: `export-btn`,
          labelPosition: "top",
          content: `
            Al hacer click en <span class="badge bg-info text-white">Exportar</span> 
            la descarga del archivo puede <b>demorar unos segundos</b> para comenzar.
          `
        },
        {
          element: `project-projection`,
          labelPosition: "bottom",
          content: `
            Los archivos serán exportados en la proyección del proyecto. 
          `
        }
      );

      if( this.thereIsMoreThanOneModule )
      {
        steps.unshift( 
          {
            element: `module-selector`,
            selectorPrefix: ".",
            labelPosition: "left",
            content: 'Seleccionar <b>modulo</b>'
          },
          {
            element: `group-selector`,
            selectorPrefix: ".",
            labelPosition: "left",
            content: 'Seleccionar <b>grupo</b>.'
          }
        );
      }
    }

    return steps;
  }
}
