import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import {Options as SortableJsOptions} from 'sortablejs';
import { HideableSectionComponent } from '../../../../../../../../shared/hideable-section/hideable-section.component';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { delayExecution } from 'src/app/shared/helpers';
import { PropertyGroup, SheetSection, FeatureSheetTemplate } from '../../../../../../../../../interfaces/geojson/export/feature-sheet-template';
import { Capa } from '../../../../../../../../../interfaces/medium/mapa/Modulo';
import { ObjectUtility } from '../../../../../../../../../shared/object-utility';
import { ProjectsService } from '../../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../../../services/spinner.service';
import Swal from 'sweetalert2';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../../../shared/helpers';

interface PdfTemplate
{
  title:string;
  property_groups:Array<PropertyGroup|SheetSection>;
}

@Component({
  selector: 'modal-configuracion-de-ficha',
  templateUrl: './modal-configuracion-de-ficha.component.html',
  styleUrls: ['./modal-configuracion-de-ficha.component.css']
})
export class ModalConfiguracionDeFichaComponent extends HideableSectionComponent
{

  @Input()
  public templates:FeatureSheetTemplate[] = [];

  @Input()
  public layer:Capa;

  public templateIndexToEdit:number = null;

  @Output()
  public templatesUpdated:EventEmitter<FeatureSheetTemplate[]> = new EventEmitter();

  public search:string = "";

  public properties:string[] = [];
  public featurePropertiesSortableOptions: SortableJsOptions;
  public propertyGroupColumnsSortableOptions: SortableJsOptions;

  @ViewChild("propertyGroupCreationForm")
  public propertyGroupCreationForm:NgForm;

  public pdfTemplate:PdfTemplate;

  public newPropertyGroup:any;

  public savingTemplate:boolean = false;

  constructor(
    private _toastrService:ToastrService,
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _spinnerService:SpinnerService,
    private _shepherdService:ShepherdService
  )
  {
    super();

    this.featurePropertiesSortableOptions = {
      group: {
        name: 'feature-properties',
        put: ['feature-properties','property-group']
      }
    };

    this.propertyGroupColumnsSortableOptions = {
      group: {
        name: 'feature-properties',
        put: ['feature-properties','property-group']
      }
    };

    this.pdfTemplate = {
      title: null,
      property_groups: [
        "map",
        "images"
      ]
    }

    this.newPropertyGroup = {
      title:"",
      columns: null
    };
  }

  get inEdition():boolean
  {
    return Number.isInteger(this.templateIndexToEdit);
  }

  get pdfTemplateIsValid():boolean
  {
    return this.pdfTemplate.title !== null && this.pdfTemplate.property_groups.length > 0;
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

      await this.getFeatureProperties();

      if( this.inEdition )
        this.getTemplateDataToEdit();

      await super.show();
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
      "funcion": "web_lista_atributo_ficha",
      "proyecto": this._projectService.project.nombre,
      "modulo": this.layer.modulo,
      "grupo": this.layer.grupo,
      "capa": this.layer.nombre
    })).datos.atributos;

    this.properties = this.properties.map((property:any) => property.nombre);

    if( this.inEdition )
    {
      const templateToEdit = this.templates[this.templateIndexToEdit];

      const selectedProperties:string[] = [];

      templateToEdit.propertiesGroups.forEach(
        propertyGroup => {

          if( typeof propertyGroup !== "string" )
          {
            propertyGroup.columns.forEach(
                column => selectedProperties.push(...column)
            )
          }
        }
      );

      this.properties = this.properties.filter(property => ! selectedProperties.includes(property));
    }
  }

  private getTemplateDataToEdit():void
  {
    let templateToEdit = this.templates[this.templateIndexToEdit];

    templateToEdit = ObjectUtility.complexCloning(templateToEdit);

    this.pdfTemplate.title = templateToEdit.title;
    this.pdfTemplate.property_groups = templateToEdit.propertiesGroups;
  }

  public propertyMatchesSearch(property:string):boolean
  {
    return property.toLowerCase().includes(this.search.toLowerCase());
  }

  public addPropertyGroup():void
  {
    try
    {
      if(this.newPropertyGroup.columns > 3)
      {
        this.newPropertyGroup.columns = 3;
        throw new Error("El maximo de columnas permitidas por grupo es de 3.");
      }

      const columns = [];

      for(let i = 0; i < this.newPropertyGroup.columns; i++)
      {
        columns.push([]);
      }

      this.pdfTemplate.property_groups.push({
        title: this.newPropertyGroup.title,
        columns: columns
      });

      this.propertyGroupCreationForm.reset();

    } catch (error)
    {
      this._toastrService.error(error.message,"Error");
    }
  }

  public async removePropertyGroup(position:number, htmlContainerRef:HTMLElement):Promise<void>
  {
    htmlContainerRef.classList.add("animate__fadeOut");

    await delayExecution(250);

    const removedPropertyGroup = this.pdfTemplate.property_groups.splice(position, 1)[0];

    if( ! (typeof removedPropertyGroup === "string") )
    {
      removedPropertyGroup.columns.forEach(column => this.properties.push(...column));
      this.properties.sort();
    }
  }

  public removeProperty(position:number, column:Array<string>):void
  {
    if( this.tourIsActive )
      return;

    const removedProperty =  column.splice(position, 1)[0];

    this.properties.push(removedProperty);
    this.properties.sort();
  }

  public async saveTemplateConfiguration():Promise<void>
  {
    try {

      this._spinnerService.updateText("Actualizando fichas de capa...");
      this._spinnerService.show();

      this.savingTemplate = true;

      const templateToEdit = this.inEdition ? this.templates[this.templateIndexToEdit] : null;

      let template:FeatureSheetTemplate = {
        title: this.pdfTemplate.title,
        propertiesGroups: this.pdfTemplate.property_groups,
        mapImageSrc:null,
        featureImages: [],
        created_at: templateToEdit ? templateToEdit.created_at : new Date().toString(),
        updated_at: templateToEdit ? new Date().toString() : null
      };

      this.inEdition ?
      this.templates.splice(this.templateIndexToEdit, 1, template) :
      this.templates = [...this.templates, template];

      await this._projectsService.consultarApi({
        "funcion": "web_actualizar_configuracion_fichas",
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

    } catch (error)
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
    ObjectUtility.overrideValues( this.pdfTemplate );

    this.pdfTemplate.property_groups = [
      "map",
      "images"
    ];

    this.templateIndexToEdit = null;

    this.search = "";

    this._shepherdService.tourObject = null;

    super.hide();
  }

    /* TOUR */

    public showTour():void
    {
      if( this.tourIsActive )
        return;
  
      this.buildTour();

      const removeFakePropertyGroupClosure = () => {
        const fakePropertyGroupIndex = this.pdfTemplate.property_groups.findIndex((item:any) => item.fake);

        if(fakePropertyGroupIndex !== -1)
          this.pdfTemplate.property_groups.splice(fakePropertyGroupIndex,1);
      }
  
      this._shepherdService.tourObject.on("complete", removeFakePropertyGroupClosure);
      this._shepherdService.tourObject.on("cancel", removeFakePropertyGroupClosure);

      const fakePropertyGroup = {
        "fake": true,
        "title": "grupo de prueba",
        "columns": [
            [
                "Distancia eje",
                "Cantidad lámparas"
            ],
            [
                "Alta",
                "Equipo auxiliar"
            ]
        ]
    };

    this.pdfTemplate.property_groups.unshift(fakePropertyGroup);

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
           element: `${step.selectorPrefix ?? "#"}${step.element}`, 
           on: step.labelPosition
         },
         buttons: _buttons,
         title: `PASO ${i + 1}`,
         text: step.content,
         when: step.event
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
          content: `${this.inEdition ? "Actualizar (<b>opcional</b>)" : "Añadir"} el nombre de la plantilla.`
        },
        {
          element: `property-group-creation-form`,
          labelPosition: "bottom",
          content: `
          <ul>
            <li class="mb-1">
              Una ficha tiene <b>uno o más grupos de atributos</b>.
            </li>
            <li class="mb-1">
              Para añadir un grupo de atributos:
                <ol>
                  <li>Colocar un título.</li>
                  <li>Colocar el número de columnas que tendrá (3 cómo máximo).</li>
                  <li>Hacer click en <span class="badge bg-warning text-white"><i class="fas fa-plus"></i></span>.</li>
                </ol>
            </li>
            <li class="mb-1">
              Los grupos se irán listando, uno debajo del otro, en el <b>contendor de la parte inferior derecha</b>.
            </li>
          </ul>          
          `
        },
        {
          element: `property-group-creation-form`,
          hasMedia: true,
          labelPosition: "bottom",
          content: `
          Un grupo puede tener tantos atributos cómo se quiera. En cuanto al
          número de columnas, puede ser de <b>1 cómo mínimo y de 3 cómo máximo</b>.
          <br><br>
          <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div> 
          <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none';" 
          class="hide step-media w-100 h-auto" src="assets/images/medium/tours/herramientas/disenador-de-fichas/2-grupos-de-propiedades.png">
          `
        },
        {
          element: `attributes-listing`,
          labelPosition: "right-start",
          content: `
          Aquí se mostrarán los atributos disponibles de la capa seleccionada para
          ${action} los grupos en la plantilla. 
          `
        },
        {
          element: `attributes-finder`,
          labelPosition: "right",
          content: 'Puede filtrar los atributos con el buscador.'
        },
        {
          element: `sheet-template-content`,
          selectorPrefix: `.`,
          labelPosition: "left-start",
          content: `
          Aquí se mostrará la estructura de la ficha.
          <br>
          Las fichas se generan en base a un elemento del mapa y se componen de:
          <br>
          <ol>
            <li class="mb-1">
              Una captura de la zona del mapa donde está el elemento seleccionado.
            </li>
            <li class="mb-1">
              <b>Opciónal</b> - imagenes adjuntas (si tiene) al elemento seleccionado 
              (<b>ver herramienta de Galería -</b> <img class="small-icon d-inline mx-1" src="assets/icons/SVG//MOSTRARFOTO.svg">).
            </li>
            <li class="mb-1">
              Uno o varios grupos de propiedades.
            </li>
          </ol>
          Puede desplazarse verticalmente en el contenedor en caso de que hallan varias secciones.
          `
        },
        {
          element: `map-capture`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: `
            La sección de captura de mapa <b>no puede ser eliminada</b> y se puede <b>ordenar</b>
            (<b>ver PASO 9 - ordenar secciones</b>).
          `
        },
        {
          element: `element-images`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: `
            La sección de imagenes del elemento es opciónal (<b>se puede eliminar</b>) 
            y también se puede <b>ordenar</b>.
          `
        },
        {
          element: `sheet-template-content`,
          selectorPrefix: `.`,
          labelPosition: "left-start",
          hasMedia: true,
          content: `
          Para ordenar las secciónes en la plantilla, <b>arrástrar con el cursor los contenedores entre si</b>.
          <br>
          Para mover una sección con mayor facilidad, mantener el cursor desde su parte superior 
          (<b>por donde se encuentra su título</b>). 
          <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/disenador-de-fichas/9-ordenar-secciones.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video>
          `
        },
        {
          element: `fake-property-group`,
          selectorPrefix: `.`,
          labelPosition: "left-start",
          hasMedia: true,
          content: `
          Para añadir atributos a las columnas de un grupo, <b>arrástrarlos con el cursor desde el listado</b>.
          <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/disenador-de-fichas/10-anadir-atributos.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video>
          `
        },
        {
          element: `fake-property-group-columns`,
          selectorPrefix: ".",
          hasMedia: true,
          labelPosition: "left",
          content: `
            Puede mover los atributos de un grupo entre sus columnas <b>arrástrandolos con el cursor</b>.
            <br><br>
            <div style="display: none">Error al cargar video.</div>
            <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                  class="step-media" loop autoplay muted>
              <source src="assets/images/medium/tours/herramientas/disenador-de-fichas/11-mover-atributos-entre-columnas.mp4" type="video/mp4">
              Tu navegador no soporta videos.
            </video>
          `
        },
        {
          element: `sheet-template-content`,
          selectorPrefix: `.`,
          labelPosition: "left-start",
          hasMedia: true,
          content: `
          También puede mover los atributos entre grupos.
          <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/disenador-de-fichas/12-mover-atributos-entre-grupos.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video>
          `
        },
        {
          element: `fake-property-group-remove-property-btn`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: `
            Para <b>eliminar</b> un atributo de un grupo 
            hacer click en la <b>X</b> que se encuentra en su extremo derecho.
          `
        },
        {
          element: `delete-section-btn`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: `
            Para <b>eliminar</b> una sección hacer click en <img class="small-icon d-inline mx-1" src="assets/icons/SVG//PAPEPERA.svg">.
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
