import { Component, ChangeDetectorRef, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, NgZone, Input } from '@angular/core';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { PlanimetryTemplate, PlanimetryBox } from '../../../../../../../interfaces/geojson/planimetry/planimetry-template';
import { getTimeDiff, htmlToImageSrc, showPreconfirmMessage, toggleFullscreen } from '../../../../../../../shared/helpers';
import { control, Map, Rectangle, Control } from 'leaflet';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { MapService } from '../../../../../../../services/unic/map.service';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { delayExecution, getFileContent } from 'src/app/shared/helpers';
import { PdfPlaneExporter } from '../../../../../../../models/unic/geojson/pdf-export/pdf-plane-exporter';
import { Capa } from '../../../../../../../interfaces/medium/mapa/Modulo';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { ModalConfiguracionDePlanoComponent } from './modal-configuracion-de-plano/modal-configuracion-de-plano.component';
import { ModalConfiguracionDeCajetinComponent } from './modal-configuracion-de-cajetin/modal-configuracion-de-cajetin.component';
import { CajetinDePlanoComponent } from './cajetin-de-plano/cajetin-de-plano.component';
import { ShepherdService } from 'angular-shepherd';
import { environment } from '../../../../../../../../environments/environment';

require('leaflet-graphicscale');

const graphicScale = (control as any).graphicScale({
  fill: "fill"
});

interface _Step
{
  element: string;
  selectorPrefix?: string;
  labelPosition: string;
  content:string;
  hasMedia?:boolean;
  event?: {[key:string]: () => void}
}

@Component({
  selector: 'herramienta-planimetria',
  templateUrl: './planimetria.component.html',
  styleUrls: ['./planimetria.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class PlanimetriaComponent extends HideableSectionComponent implements AfterViewChecked
{
  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  @ViewChild(ModalConfiguracionDePlanoComponent)
  public ModalConfiguracionDePlano:ModalConfiguracionDePlanoComponent;
 
  @ViewChild(ModalConfiguracionDeCajetinComponent)
  public ModalConfiguracionDeCajetin:ModalConfiguracionDeCajetinComponent;

  @ViewChild(ModalDirective)
  public templateDataModal:ModalDirective;

  @Output()
  public showFeatureExportTool:EventEmitter<any> = new EventEmitter;
  
  public formData:any = {
    module:null,
    group:null,
    layer:null
  }

  public templates:PlanimetryTemplate[] = [];
  private selectedTemplate:PlanimetryTemplate;
  
  public templateBoxes:PlanimetryBox[] = [];

  public selectedLayer:Capa;

  public templateInExport:PlanimetryTemplate = null;
  public graphicScaleImgSrc:string = "";
  public templateBoxInExport:PlanimetryBox;
  public numberOfPlansExported:number;

  @ViewChild(CajetinDePlanoComponent)
  public CajetinDePlano:CajetinDePlanoComponent;
  
  @ViewChild("graphicScaleImageContainer")
  public graphicScaleImageContainer:ElementRef<HTMLElement>;
  
  @ViewChild("legendImageContainer")
  public legendImageContainer:ElementRef<HTMLElement>;

  public rectangle:Rectangle;
  
  private onDrawingRectangle: (event:any) => void = async event => 
  {
      this._mapService.map.fitBounds(this.rectangle.getBounds(), { duration: .50 });
      this._ngZone.run(() => this.export());
  };

  public showSpinner:boolean = false;

  constructor(
    private _changeDetector:ChangeDetectorRef,
    private _mapService:MapService,
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _projectLayersService:ProjectLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _ngZone:NgZone,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get map():Map
  {
    return this._mapService.map;
  }

  get drawing():boolean
  {
    return this.map.editTools.drawing();
  }

  get recentTemplates():Array<PlanimetryTemplate>
  {
    return this.templates.length ? this.templates.filter(template => {

      const creationDate = new Date(template.created_at);

      return getTimeDiff(creationDate) < 7;

    }) :
    [];
  }

  get graphicScaleRequired():boolean
  {
    return this.templateInExport && this.templateInExport.graphic_scale.enabled;
  }

  get projectConfiguration():any
  {
    return this._projectService.configuration;
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  get thereIsOnlyOneModule():boolean
  {
    return this._projectLayersService.modulesNumber === 1;
  }

  public ngAfterViewChecked():void
  {
    this._changeDetector.detectChanges();
  }

  public async show():Promise<void>
  {
    this.map.addControl(graphicScale);

    const changePolygonColor = event => event.layer.setStyle({color: 'mediumseagreen'}) ;

    this.map.on('editable:drawing:commit', this.onDrawingRectangle);
    this.map.on('editable:editing', changePolygonColor);

    await super.show();
  }
  
  public onChangeModuleOrGroupSelector():void
  {
    this.selectedLayer = null;
  }

  public async onChangeLayerSelector(layer:Capa):Promise<void>
  {
    try
    {
      this.showSpinner = true;

      this.selectedLayer = layer;

      this.templates = [];

      this.templateBoxes = (await this._projectsService.consultarApi({
        "funcion": "web_lista_configuracion_cajetines",
        "proyecto": this._projectService.project.nombre,
        "modulo": this.selectedLayer.modulo,
        "grupo": this.selectedLayer.grupo,
        "capa": this.selectedLayer.nombre
      })).datos;  

      const layerPlanimetryData = (await this._projectsService.consultarApi({
        "funcion": "web_lista_configuracion_planos",
        "proyecto": this._projectService.project.nombre,
        "modulo": this.selectedLayer.modulo,
        "grupo": this.selectedLayer.grupo,
        "capa": this.selectedLayer.nombre
      })).datos;

      this.templates = layerPlanimetryData.configuracion;
      this.numberOfPlansExported = layerPlanimetryData.nro_planos_exportados ?? 0;
    
    }
    catch (error)
    {
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public getTemplateAge(template:PlanimetryTemplate):string
  {
    const diffInHours = getTimeDiff( new Date(template.created_at), new Date, "hour");

    let tag = "";

    switch( true )
    {
      case diffInHours < 1:
        const diffInMinutes = getTimeDiff( new Date(template.created_at), new Date, "minute");
        tag = diffInMinutes < 3 ? "Hace un momento." : `Hace ${diffInMinutes} minutos.`
        break;
      case diffInHours >= 1 && diffInHours < 24:
        tag = diffInHours === 1 ? `Hace una hora.` : `Hace ${diffInHours} horas.`;
        break;
      case diffInHours >= 24:
        const resultInDays = getTimeDiff( new Date(template.created_at), new Date, "day");
        tag = resultInDays === 1 ? `Hace un dia.` : `Hace ${resultInDays} dias.`;
        break;
    }
    
    return tag;
  }

  public async updateTemplateBoxes(updatedBox:PlanimetryBox):Promise<void>
  {
    try {

      this._spinnerService.updateText("Configurando cajetin...");
      this._spinnerService.show();

      await delayExecution(250);

      const boxExists = this.templateBoxes.some(_box => _box.model === updatedBox.model);

      if( boxExists )
      {
        const boxIndex = this.templateBoxes.findIndex(box => box.model === updatedBox.model); 
        this.templateBoxes.splice(boxIndex, 1, updatedBox);
        // para detectar cambio en arreglo. 
        this.templateBoxes = [...this.templateBoxes];        
      }
      else
      {
        this.templateBoxes = [...this.templateBoxes, updatedBox];
      }

      await this._projectsService.consultarApi({
        "funcion": "web_actualizar_configuracion_cajetines",
        "proyecto": this._projectService.project.nombre,
        "modulo": this.selectedLayer.modulo,
        "grupo": this.selectedLayer.grupo,
        "capa": this.selectedLayer.nombre,
        "configuracion": this.templateBoxes
      });

      this.ModalConfiguracionDePlano.selectedBox = updatedBox;
      this.ModalConfiguracionDePlano.template.boxModel = updatedBox.model;
      
      await this.ModalConfiguracionDePlano.show(); 
    } 
    catch (error) 
    {
      this._toastrService.error(error.message);
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async editTemplate(template:PlanimetryTemplate):Promise<void>
  {
    this.ModalConfiguracionDePlano.templateIndexToEdit = this.templates.findIndex(_template => _template === template);
    await this.ModalConfiguracionDePlano.show();
  }

  public updateTemplates(templates:Array<PlanimetryTemplate>):void
  {
    this.templates = [...templates];
  }

  public async deleteTemplate(template:PlanimetryTemplate):Promise<void>
  { 
    let deletedTemplate;

    const templateIndex = this.templates.findIndex(_template => _template === template);

    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Eliminar plano?",
        "Esta accion no es reversible."
      );
    
      if( userResponse.isConfirmed )
      {
        this._spinnerService.show();

        deletedTemplate = this.templates.splice(templateIndex, 1);

        this.templates = [...this.templates]; 

        await this._projectsService.consultarApi({
          "funcion": "web_actualizar_configuracion_planos",
          "proyecto": this._projectService.project.nombre,
          "modulo": this.selectedLayer.modulo,
          "grupo": this.selectedLayer.grupo,
          "capa": this.selectedLayer.nombre,
          "configuracion": this.templates
        });

        this._toastrService.success("Plantilla eliminada.","Exito!");
      }  
    } 
    catch (error) 
    {
      this.templates =  this.templates.concat(this.templates.slice(0, templateIndex), deletedTemplate, this.templates.slice(templateIndex));
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  public selectTemplateAndDrawPolygon(template?:PlanimetryTemplate):void
  {
    if(template)
      this.selectedTemplate = template;

    this.startDrawing();
  }
    
  private startDrawing():void
  {
    this.rectangle = this.map.editTools.startRectangle();
  }

  public clearRectangle():void
  {
    this.rectangle.remove();
    this.rectangle = null;
    this.map.editTools.stopDrawing();
  }

  public async export():Promise<void>
  {    
    try
    {       
      this._spinnerService.updateText("Generando plano... <br> Por favor, no salga del sitio.");
      this._spinnerService.show();

      await delayExecution(250);

      this.clearRectangle();

      this._projectLayersService
          .obtenerCapas()
          .filter(layer => layer.filtro_capa !== this.selectedLayer.filtro_capa)
          .forEach(layer => this.map.removeLayer( layer.capaWms ));
      
      this.templateInExport = ObjectUtility.simpleCloning(this.selectedTemplate);

      this.templateBoxInExport = this.templateBoxes.find(box => box.model === this.templateInExport.boxModel); 
      
      this.templateBoxInExport = ObjectUtility.simpleCloning(this.templateBoxInExport);

      const date = new Date();

      this.templateBoxInExport.date = `${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}/${(date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)}/${date.getFullYear()}`,
      
      await delayExecution(3000); // aguardar a que escala se actualize.

      this.templateBoxInExport.scale = '1:' + this._mapService.getScale();
      
      this.templateBoxInExport.number = (this.numberOfPlansExported + 1).toString().padStart(5,"0");

      if( this.templateInExport.graphic_scale.enabled )
        this.graphicScaleImgSrc = await htmlToImageSrc((graphicScale as Control).getContainer());            

      this.map.removeControl(graphicScale);

      // generar captura de mapa con medidas de contenedor de mapa de plano.
      this.templateInExport.map_image_src = await this._mapService.getMapScreenshot({
        width: 1539.77,
        height: 881.1782,  
        windowHeight: 881.1782
      });

      this.templateDataModal.show();

      await delayExecution(500); // tiempo que tarda abriendo el modal.
      
      if( this.templateInExport.graphic_scale.enabled )
        this.templateInExport.graphic_scale.image_src = await htmlToImageSrc(this.graphicScaleImageContainer.nativeElement);
     
      if( this.templateInExport.miniature_map.enabled )
        this.templateInExport.miniature_map.image_src = await this._mapService.getMapZoneScreenshot();
     
      if( this.templateInExport.legend.enabled )
      {
        const legendImage = await this.getLegendImage();

        (this.legendImageContainer.nativeElement.querySelector(".legend-image") as HTMLImageElement).src = legendImage.src;

        const canvasOptions = {
          width: this.legendImageContainer.nativeElement.offsetWidth, 
          height: 199.04890000000003
        };

        if( legendImage.height > 199.04890000000003 )
          delete canvasOptions.height;

        this.templateInExport.legend.image_src = await htmlToImageSrc(
          this.legendImageContainer.nativeElement, canvasOptions
        );
      }
      
      const boxHeight = this.CajetinDePlano.templateRef.nativeElement.offsetHeight;

      this.templateInExport.boxImageSrc = await htmlToImageSrc(this.CajetinDePlano.templateRef.nativeElement, {
        width: this.CajetinDePlano.templateRef.nativeElement.offsetWidth,
        height: boxHeight > 204.66150000000002 ? boxHeight : 204.66150000000002
      });

      const pdf = new PdfPlaneExporter(this.templateInExport);

      pdf.build();

      pdf.download();

      await this._projectsService.consultarApi({
        "funcion": "web_actualizar_numeracion_exportacion_planos",
        "proyecto": this._projectService.project.nombre,
        "modulo": this.selectedLayer.modulo,
        "grupo": this.selectedLayer.grupo,
        "capa": this.selectedLayer.nombre
      });

      this.numberOfPlansExported++;

      setTimeout(() => {
        this.showMapScreenshotErrors();
      }, 1000);
      
    } 
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
      this.startDrawing();
    }
    finally
    {
      this._projectLayersService
          .obtenerCapas()
          .filter(layer => layer.filtro_capa !== this.selectedLayer.filtro_capa)
          .forEach(layer => this.map.addLayer( layer.capaWms ));

      if(this.templateDataModal)
        this.templateDataModal.hide();

      await delayExecution(500);

      this.map.addControl(graphicScale);
        
      this.templateInExport = null;
      this.templateBoxInExport = null;
      this.graphicScaleImgSrc = null;

      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }
  }

  private async getLegendImage():Promise<HTMLImageElement>
  {
    const projectName = this._projectService.project.bd_proyecto,
          style = this.selectedLayer.capaWms.wmsParams.styles,
          layer = this.selectedLayer.filtro_capa.split("#").join("_");

    const requestParams:{[key:string]:string|number} = {
      REQUEST:"GetLegendGraphic",
      // WIDTH:611,
      // HEIGHT:199,
      transparent:"true",
      style:style,
      SCALE:2000,
      VERSION:"1.0.0",
      FORMAT:"image/png",
      LAYER:layer,
      LEGEND_OPTIONS:"fontName:Raleway;fontSize:14;columns:4;forceLabels:on;fontAntiAliasing:true;"
    }; 

    let imgUrl = `${ environment.baseUrl }geoserver/${projectName}/wms?`;

    for( let [key, value] of Object.entries( requestParams ) )
      imgUrl += `${key}=${value}&`;

    const iconBlob = await (await fetch(imgUrl)).blob();

    const image = new Image;

    image.src = await getFileContent(iconBlob, "dataURL");

    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image)
      image.onerror = reject
    });
  }

  private showMapScreenshotErrors():void
  {
    for(let [layerType, unloadedLayersNumber] of  Object.entries( this._mapService.lastScreenshot.unloadedLayers ))
    {
      if( unloadedLayersNumber > 0 )
        this._toastrService.warning(`${unloadedLayersNumber} capas ${layerType.toUpperCase()} no pudieron ser cargadas en el plano.`);
    }
  }
 
  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.selectedTemplate = null;

    if( this.rectangle )
      this.clearRectangle();

    this.map.off('editable:drawing:commit', this.onDrawingRectangle);
    this.map.off('editable:editing');
    
    this.templates = [];
    this.templateBoxes = [];

    this.selectedTemplate = null;

    this.showSpinner = false;
    this.selectedLayer = null;
    
    this.map.removeControl(graphicScale);

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

    this.buildTour();

    const onCancelOrCompleteTourClosure = () => {

      const mapRefDiv = document.getElementById("mapRefDiv");
        
      if( mapRefDiv )
        mapRefDiv.remove();

      this.templates = this.templates.filter((template:PlanimetryTemplate) => template.boxModel );
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
        steps.length === 1 ?
        _buttons.splice(1, 1) :
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
    const steps:_Step[] = [];

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

    if( this.drawing )
    {
      steps.push(
        {
          element: `mapRefDiv`,
          hasMedia: true,
          labelPosition: "left-start",
          content: `
          Dibujar rectángulo
          en el mapa que <b>delimitará la zona del plano</b>.  
          <br>
          Para dibujar rectángulo, <b>hacer click y mantener mientras desplaza el cursor</b>.
          <br><br>
          Al terminar el rectángulo de zona, empezará la generación del plano.
          <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/planimetria/8-establecer-zona-de-plano.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video> 
          `,
          event: {
            "before-show": () => document.querySelector("body").appendChild(mapRefDiv),
            "hide": () => mapRefDiv.remove()
          }
        }
      );
    }
    else
    {
      steps.push(
        {
          element: `layer-selector`,
          selectorPrefix: `.`,
          labelPosition: "left",
          content: 'Seleccionar <b>capa</b>.'
        },
        {
          element: `recent-templates-list`,
          labelPosition: "left",
          content:`
          Aquí se mostrará el listado de plantillas creadas recientemente (<b>antiguedad menor o igual a una semana</b>).
          <br>
          Puede desplazarse verticalmente en caso de que halla más de una plantilla.
          `,
          event: {
            "before-show": () => {
  
              const now = new Date;
  
              this.templates.unshift({
                title: "plantilla test",
                map_image_src: null,
                graphic_scale:null,
                miniature_map:null,
                legend:null,
                boxModel:null,
                created_at: now.toString(),
                updated_at: now.toString()
              });             
  
              }
            }
        },
        {
          element: `templates-list`,
          labelPosition: "left",
          content:`
          Aquí se mostrará el listado con todas plantillas creadas.
          <br>
          Puede desplazarse verticalmente en caso de que halla más de una plantilla.
          `,
        },
        {
          element: `fake-template`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: `
          Puede ver el título de la plantilla en la parte izquierda de cada fila.
          `
        },
        {
          element: `fake-template-export-btn`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: `
          Para exportar plantilla hacer click en <img class="small-icon d-inline" src="assets/icons/SVG/IMPRIMIR.svg">.
          `
        },
        {
          element: `mapRefDiv`,
          hasMedia: true,
          labelPosition: "left-start",
          content: `
          Luego de hacer click en <img class="small-icon d-inline" src="assets/icons/SVG/IMPRIMIR.svg">, dibujar un rectángulo
          en el mapa que <b>delimitará la zona del plano</b>.  
          <br>
          Para dibujar rectángulo, <b>hacer click y mantener mientras desplaza el cursor</b>.
          <br><br>
          Al terminar el rectángulo de zona, empezará la generación del plano.
          <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/planimetria/8-establecer-zona-de-plano.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video> 
          `,
          event: {
            "before-show": () => document.querySelector("body").appendChild(mapRefDiv),
            "hide": () => mapRefDiv.remove()
          }
        },
        {
          element: `fake-template-edit-btn`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: `
          Para mostrar ventana de edición de plantilla hacer click en <img class="small-icon d-inline" src="assets/icons/SVG/EDITAR.svg">.
          `
        },
        {
          element: `fake-template-delete-btn`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: `
          Para <b>eliminar</b> plantilla hacer click en <img class="small-icon d-inline" src="assets/icons/SVG/PAPEPERA_R.svg">.
          `
        },
        {
          element: `create-template-btn`,
          labelPosition: "left",
          content: `
          Para mostrar ventana de creación de plantilla hacer click en <span class="badge bg-info text-white">Crear nueva</span>.
          `
        }
      );

      if( ! this.thereIsOnlyOneModule )
      {
        steps.unshift(
          {
            element: `module-selector`,
            selectorPrefix:".",
            labelPosition: "left",
            content: 'Seleccionar <b>modulo</b>'
          },
          {
            element: `group-selector`,
            selectorPrefix:".",
            labelPosition: "left",
            content: 'Seleccionar <b>grupo</b>.'
          }
        );
      }
    }
    
    return steps;
  }
}
