import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HideableSectionComponent } from '../../../../../../../../shared/hideable-section/hideable-section.component';
import { FeatureListingTemplate } from '../../../../../../../../../interfaces/geojson/export/feature-listing-template';
import { ObjectUtility } from '../../../../../../../../../shared/object-utility';
import { Capa } from '../../../../../../../../../interfaces/medium/mapa/Modulo';
import { ProjectsService } from '../../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../../../services/spinner.service';
import Swal from 'sweetalert2';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../../../shared/helpers';

@Component({
  selector: 'modal-configuracion-de-listado',
  templateUrl: './modal-configuracion-de-listado.component.html',
  styleUrls: ['./modal-configuracion-de-listado.component.css']
})
export class ModalConfiguracionDeListadoComponent extends HideableSectionComponent
{
  @Input()
  public templates:FeatureListingTemplate[] = [];

  @Input()
  public layer:Capa;

  @Output()
  public templatesUpdated:EventEmitter<FeatureListingTemplate[]> = new EventEmitter();

  public template:FeatureListingTemplate =  {
    title: null,
    columns: [],
    sortColumn: "",
    sortMode: "asc",
    created_at: null,
    updated_at: null
  };

  public templateIndexToEdit:number = null;

  public savingTemplate:boolean = false;

  public properties:Array<string> = [];

  public search:string = "";

  constructor(
    private _toastrService:ToastrService,
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _spinnerService:SpinnerService,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get inEdition():boolean
  {
    return Number.isInteger(this.templateIndexToEdit);
  }

  get templateIsValid():boolean
  {
    return this.template.title && this.template.columns.length && this.template.sortColumn && this.sortCriteriaExistsOnSelectedColumns;
  }

  get sortCriteriaExistsOnSelectedColumns():boolean
  {
    return this.template.columns.includes( this.template.sortColumn );
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async show():Promise<void>
  {
    try
    {
      this._spinnerService.show();

      if( this.inEdition )
        this.getTemplateDataToEdit();

      await this.getFeatureProperties();

      super.show();
    }
    catch (error)
    {

      if(this.templates.length > 0){
        this._toastrService.error(error.message);
      } else {
          Swal.fire({
            icon: "info",
            title: "Error",
            text: "Debe configurar algún atributo para esta herramienta.",
            confirmButtonText: "OK",
          });
      }
      this.hide();
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  private async getFeatureProperties():Promise<void>
  {
    this.properties = (await this._projectsService.consultarApi({
      "funcion": "web_lista_atributo_listado",
      "proyecto": this._projectService.project.nombre,
      "modulo": this.layer.modulo,
      "grupo": this.layer.grupo,
      "capa": this.layer.nombre
    })).datos.atributos;

    this.properties = this.properties.map((property:any) => property.nombre);

    if( this.inEdition )
      this.properties = this.properties.filter(property => ! this.template.columns.includes(property));
  }

  private getTemplateDataToEdit():void
  {
    let templateToEdit = this.templates[this.templateIndexToEdit];
    this.template = ObjectUtility.simpleCloning(templateToEdit);
  }

  public propertyMatchesSearch(property:string):boolean
  {
    return property.toLowerCase().includes(this.search.toLowerCase());
  }

  public addColumn(property:string):void
  {
    try {

      if( this.tourIsActive )
        return;

      if( this.template.columns.length === 8 )
        throw new Error("El nro maximo de columnas permitidas es de 8.");

      this.properties = this.properties.filter(_property => _property !== property);
      this.template.columns.push(property);

    } catch (error)
    {
      this._toastrService.error(error.message, "Error.");
    }
  }

  public async removeColumn(position:number):Promise<void>
  {
    if( this.tourIsActive )
      return;

    const removedProperty = this.template.columns.splice(position, 1)[0];
    this.properties.push(removedProperty);
    this.properties.sort();

    if( this.template.sortColumn === removedProperty )
      this.template.sortColumn = null;
  }

  public async saveTemplateConfiguration():Promise<void>
  {
    try {

      this._spinnerService.updateText("Actualizando plantillas de capa...");
      this._spinnerService.show();

      this.savingTemplate = true;

      this.inEdition ?
      this.template.updated_at = new Date().toString() :
      this.template.created_at = new Date().toString();

      this.inEdition ?
      this.templates.splice(this.templateIndexToEdit, 1, ObjectUtility.simpleCloning(this.template)) :
      this.templates = [...this.templates, ObjectUtility.simpleCloning(this.template)];

      await this._projectsService.consultarApi({
        "funcion": "web_actualizar_configuracion_listados",
        "proyecto": this._projectService.project.id_proyecto,
        "modulo": this.layer.modulo,
        "grupo": this.layer.grupo,
        "capa": this.layer.nombre,
        "configuracion": this.templates
      });

      this.templatesUpdated.emit(this.templates);

      let message = this.inEdition ? "Plantilla actualizada." : "Plantilla registrada.";

      this._toastrService.success(message,"Exito!");

      await this.hide();
    }
    catch (error)
    {
      this._toastrService.error(error.message);
    }
    finally
    {
      this.savingTemplate = false;
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async hide():Promise<void>
  {
    ObjectUtility.overrideValues( this.template );
    this.template.sortMode = "asc";

    this.templateIndexToEdit = null;
    this.search = "";

    this._shepherdService.tourObject = null;

    await super.hide();
  }

  /* TOUR */

  public showTour():void
  {
    if( this.tourIsActive )
      return;

    this.buildTour();

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
       text: step.content
     };

     _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps():any[]
  {
    const action = this.inEdition ? "editar" : "crear";

    const steps = [
      {
        element: `template-name`,
        labelPosition: "right",
        content: `${this.inEdition ? "Actualizar (opcional)" : "Añadir"} el nombre de la plantilla.`
      },
      {
        element: `layer-attributes-listing`,
        labelPosition: "right",
        content: `
        Aquí se mostrarán los atributos disponibles de la capa seleccionada para
        ${action} el listado. 
        Para seleccionarlos <b>hacer click</b> sobre ellos. 
        `
      },
      {
        element: `attributes-finder`,
        labelPosition: "right",
        content: 'Puede filtrar los atributos con el buscador.'
      },
      {
        element: `attributes-listing-container`,
        labelPosition: "left-start",
        hasMedia: true,
        content: `
        Aquí se irán listando los atributos seleccionados.
        <br>
        <ul>
          <li class="mb-1">
            Cuando exporte la plantilla, el orden de los atributos irá <b>de izquierda a derecha</b>
            en una tabla (<b>de arriba hacia abajo en el listado que ve en pantalla</b>).     
          </li>
          <li class="mb-1">
            Puede establecer el orden de los atributos <b>arrastrándolos con el cursor</b>.
          </li>
          <li class="mb-1">
            Para eliminar un atributo del listado hacer click en la <b>X</b> que se muestra en el extremo derecho del elemento.
          </li>
        </ul>
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/disenador-de-listados/4-organizar-atributos.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video>
        `
      },
      {
        element: `sort-column-selector`,
        hasMedia: true,
        labelPosition: "left",
        content: `
        Aquí se mostrarán los <b>atributos seleccionados</b>.
        Seleccionar el atributo por el cual se ordenarán los datos en la tabla al exportar la plantilla (<b>ver imagen</b>).
        <br><br>
        <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div> 
        <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none';" 
        class="hide step-media w-100 h-auto" src="assets/images/medium/tours/herramientas/disenador-de-listados/5-ordenacion-de-datos.png">
        `
      },
      {
        element: `sort-mode-selector`,
        labelPosition: "left",
        content: `
        Seleccionar el modo de ordenación para el atributo seleccionado en el <b>paso anterior</b>.
        `
      },
      {
        element: `save-template-btn`,
        labelPosition: "top",
        content: `
        Para ${action} la plantilla hacer click en <span class="badge bg-info text-white">${this.inEdition ? "Actualizar" : "Crear"}</span>.
        `
      },
      {
        element: `cancel-btn`,
        labelPosition: "top",
        content: `
        Para cerrar la ventana hacer click en <span class="badge-outline-info">Cancelar</span> o sobre la <b>X</b> en la parte superior
        derecha.
        `
      }
    ];
 
    return steps;
  }

}
