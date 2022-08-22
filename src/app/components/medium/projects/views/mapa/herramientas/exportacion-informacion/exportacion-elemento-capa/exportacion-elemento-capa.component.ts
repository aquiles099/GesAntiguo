import { Component, Output, EventEmitter, ViewChild } from '@angular/core';
import { HideableSectionComponent } from '../../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { getTimeDiff, showPreconfirmMessage, delayExecution } from 'src/app/shared/helpers';
import { ModalConfiguracionDeFichaComponent } from './modal-configuracion-de-ficha/modal-configuracion-de-ficha.component';
import { ModalConfiguracionDeListadoComponent } from './modal-configuracion-de-listado/modal-configuracion-de-listado.component';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { ListingFeaturePdfExporter } from '../../../../../../../../models/unic/geojson/pdf-export/feature-listing-pdf-exporter';
import { FeatureListingTemplate } from '../../../../../../../../interfaces/geojson/export/feature-listing-template';
import { FeatureSheetTemplate } from '../../../../../../../../interfaces/geojson/export/feature-sheet-template';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { ProjectLayersService } from '../../../../../../../../services/medium/project-layers.service';
import {  Capa } from '../../../../../../../../interfaces/medium/mapa/Modulo';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../../shared/helpers';
const json2xlsx = require('json-as-xlsx');

interface _Step
{
  element: string;
  selectorPrefix?: string;
  labelPosition: string;
  content:string;
  event?: {[key:string]: () => void}
}

@Component({
  selector: 'herramienta-exportacion-elemento-capa',
  templateUrl: './exportacion-elemento-capa.component.html',
  styleUrls: ['./exportacion-elemento-capa.component.css','../../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class ExportacionElementoCapaComponent extends HideableSectionComponent
{
  @ViewChild(ModalConfiguracionDeFichaComponent)
  public ModalConfiguracionDeFicha:ModalConfiguracionDeFichaComponent;

  @ViewChild(ModalConfiguracionDeListadoComponent)
  public ModalConfiguracionDeListado:ModalConfiguracionDeListadoComponent;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  @Output()
  public activarExportacionDeFicha:EventEmitter<any> = new EventEmitter;

  @Output()
  public showSheetsPerCommandCentersTool:EventEmitter<any> = new EventEmitter;

  public templates:Array<FeatureListingTemplate|FeatureSheetTemplate> = [];

  public templateType:"sheet"|"listing";

  public listExportFormatTypes:string[] = [
    "pdf",
    "xlsx"
  ];

  public formData:any = {
    module: null,
    group: null,
    layer: null,
    format: "pdf"
  };

  public showSpinner:boolean = false;

  public selectedLayer:Capa;

  constructor(
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _projectLayersService:ProjectLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get recentTemplates():Array<FeatureSheetTemplate|FeatureListingTemplate>
  {
    return this.templates.length ? this.templates.filter(template => {

      const creationDate = new Date(template.created_at);

      return getTimeDiff(creationDate) < 7;

    }) :
    [];
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  get thereIsOnlyOneModule():boolean
  {
    return this._projectLayersService.modulesNumber === 1;
  }

  public async changeType(type:"listing"|"sheet"):Promise<void>
  {
    try
    {
      this.showSpinner = true;

      this.templateType = type;

      if( this.selectedLayer )
        await this.getTemplates();
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

      await this.getTemplates();
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

  private async getTemplates():Promise<void>
  {
    this.templates = [];

    this.templates = (await this._projectsService.consultarApi({
      "funcion": this.templateType === "listing" ? "web_lista_configuracion_listados" : "web_lista_configuracion_fichas",
      "proyecto": this._projectService.project.id_proyecto,
      "modulo": this.selectedLayer.modulo,
      "grupo": this.selectedLayer.grupo,
      "capa": this.selectedLayer.nombre
    })).datos;
  }

  public getTemplateAge(template:FeatureSheetTemplate):string
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

  public async showTemplateConfigurationModal():Promise<void>
  {
    this.templateType === "sheet" ?
    await this.ModalConfiguracionDeFicha.show() :
    await this.ModalConfiguracionDeListado.show();
  }

  public async editTemplate(template:FeatureListingTemplate|FeatureSheetTemplate):Promise<void>
  {
    const modal = this.templateType === "sheet" ?
    this.ModalConfiguracionDeFicha :
    this.ModalConfiguracionDeListado;

    modal.templateIndexToEdit = this.templates.findIndex(_template => _template === template);
    
    await modal.show();
  }

  public updateTemplates(templates:Array<FeatureListingTemplate|FeatureSheetTemplate>):void
  {
    this.templates = [...templates];
  }

  public async deleteTemplate(template:FeatureListingTemplate|FeatureSheetTemplate):Promise<void>
  {
    let deletedTemplate;

    const templateIndex = this.templates.findIndex(_template => _template === template);

    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Eliminar plantilla?",
        "Esta accion no es reversible."
      );

      if( userResponse.isConfirmed )
      {
        this._spinnerService.show();

        deletedTemplate = this.templates.splice(templateIndex, 1);

        this.templates = [...this.templates];

        await this._projectsService.consultarApi({
          "funcion": this.templateType === "listing" ? "web_actualizar_configuracion_listados" : "web_actualizar_configuracion_fichas",
          "proyecto": this._projectService.project.id_proyecto,
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

  public async onExport(template:FeatureSheetTemplate|FeatureListingTemplate):Promise<void>
  {
    this.templateType === "sheet" ?
    await this.showFeatureExportToolEvent(template as FeatureSheetTemplate) :
    await this.exportFeatureListing(template as FeatureListingTemplate);
  }

  private async showFeatureExportToolEvent(template:FeatureSheetTemplate):Promise<void>
  {
    const data = {
      layerFilter: this.selectedLayer.filtro_capa,
      template: ObjectUtility.simpleCloning(template)
    };

    await this.hide();

    this.activarExportacionDeFicha.emit(data);
  }

  private async exportFeatureListing(template:FeatureListingTemplate):Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Exportando datos...");
      this._spinnerService.show();

      await delayExecution(250);

      const orderingElements = {};

      orderingElements[template.sortColumn] = template.sortMode;

      const data = (await this._projectsService.consultarApi({
        "funcion": "web_datos_configuracion_listados",
        "proyecto": this._projectService.project.nombre,
        "modulo": this.formData.module,
        "grupo": this.formData.group,
        "capa": this.formData.layer,
        "filtros": this.selectedLayer.capaWms.wmsParams.cql_filter ?? "",
        "atributos": template.columns,
        "ordenacion": orderingElements
      })).datos;

      if( this.formData.format === "xlsx" )
      {
        const columns = template.columns.map(key => { return{ label: key, value: key }; });

        let sheets = [
          {
            sheet: template.title,
            columns: columns,
            content: data
          }
        ];

        let settings = {
          fileName: template.title,
          extraLength: 3,
          writeOptions: {}
        };

        json2xlsx(sheets, settings);
      }
      else
      {
        const features = data.map(obj => {
          return {
            properties: obj
          };
        });

        const pdf = new ListingFeaturePdfExporter(
          template,
          features,
          this._projectService.project
        );

        await pdf.build();

        pdf.download();
      }

      this._toastrService.success("Exportación generada.","Exito!");
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public showSheetsPerCommandCentersToolEvent():void
  {
    this.showSheetsPerCommandCentersTool.emit();
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.templates = [];

    this.formData.format = "pdf";

    this.showSpinner = false;
    this.selectedLayer = null;

    this._shepherdService.tourObject = null;

    await super.hide();
  }

  /* TOUR */

  public showTour():void
  {
    if( this.tourIsActive )
      return;

    this.buildTour();
      
    const onCancelOrCompleteTourClosure = () => {
      this.templates = this.templates.filter((template:FeatureListingTemplate) => Array.isArray( template.columns ));
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
    const steps:_Step[] = [
      {
        element: `layer-selector`,
        selectorPrefix:".",
        labelPosition: "left",
        content: 'Seleccionar <b>capa</b>.'
      }
    ];
    
    if( ! this.thereIsOnlyOneModule )
    {
      steps.push( 
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
    
    if( this.templateType === "listing" )
    {
      steps.push( {
        element: `format-selector`,
        labelPosition: "left",
        content: `
        Seleccionar formato en el que será exportado el listado (<b>pdf o xls</b>).
        `
      });
    }

    steps.push(
    {
        element: `recent-template-list`,
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
              "title": "plantilla test",
              "columns":null,
              "sortColumn": null,
              "sortMode": "asc",
              "created_at": now.toString(),
              "updated_at": now.toString()
            });             

            }
          }
      },
      {
        element: `template-list`,
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
        Para exportar plantilla en el formato seleccionado hacer click en <img class="small-icon d-inline" src="assets/icons/SVG/IMPRIMIR.svg">.
        `
      },
      {
        element: `fake-template-edit-btn`,
        selectorPrefix: ".",
        labelPosition: "left",
        content: `
        Para mostrar ventana de edición de plantilla hacer click en <img class="small-icon d-inline" src="assets/icons/SVG/EDITAR.svg.
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
        element: `action-btn-section`,
        labelPosition: "left",
        content: `
        Para mostrar ventana de creación de plantilla hacer click en <span class="badge bg-info text-white">Crear nueva</span>.
        `
      }
    );

    if( this.templateType === "sheet" )
    {
      steps.push(({
          element: "action-btn-section",
          labelPosition: "left",
          hasMedia: true,
          content: `
          Al seleccionar una capa de "Centro de mando" se mostrará el botón para activar la herramienta de <b>Fichas por centro de mando</b>.
          <br><br>
          <div style="display: none">Error al cargar video.</div>
           <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                 class="step-media" loop autoplay muted>
             <source src="assets/images/medium/tours/herramientas/exportacion-informacion-elemento/13-fichas-por-cm-2.mp4" type="video/mp4">
             Tu navegador no soporta videos.
           </video> 
          `
        } as any));
    }

    return steps;
  }
}
