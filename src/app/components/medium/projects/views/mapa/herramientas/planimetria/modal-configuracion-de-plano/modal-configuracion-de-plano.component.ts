import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HideableSectionComponent } from '../../../../../../../shared/hideable-section/hideable-section.component';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { PlanimetryTemplate, PlanimetryBox } from '../../../../../../../../interfaces/geojson/planimetry/planimetry-template';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { delayExecution } from 'src/app/shared/helpers';
import { Capa } from '../../../../../../../../interfaces/medium/mapa/Modulo';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../../shared/helpers';

@Component({
  selector: 'modal-configuracion-de-plano',
  templateUrl: './modal-configuracion-de-plano.component.html',
  styleUrls: ['./modal-configuracion-de-plano.component.css']
})
export class ModalConfiguracionDePlanoComponent extends HideableSectionComponent
{
  @Input()
  public templates:PlanimetryTemplate[] = [];

  @Input()
  public templateBoxes:PlanimetryBox[] = [];

  @Input()
  public layer:Capa;

  @Output()
  public templatesUpdated:EventEmitter<PlanimetryTemplate[]> = new EventEmitter();

  public template:PlanimetryTemplate =  {
    title: null,
    map_image_src:null,
    miniature_map:{
      image_src: null,
      enabled:true
    },
    graphic_scale:{
      image_src: null,
      enabled:true
    },
    legend:{
      image_src: null,
      enabled:true
    },
    boxImageSrc:null,
    boxModel:null,
    created_at:null,
    updated_at:null
  };

  public selectedBox:PlanimetryBox;

  public templateIndexToEdit:number = null;

  public savingTemplate:boolean = false;

  @Output()
  public showBoxConfigurationModal:EventEmitter<void> = new EventEmitter; 

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

  get scaleEnabled():boolean
  {
    return this.template.graphic_scale.enabled;
  }

  get miniatureMapEnabled():boolean
  {
    return this.template.miniature_map.enabled;
  }

  get legendEnabled():boolean
  {
    return this.template.legend.enabled;
  }

  get inEdition():boolean
  {
    return Number.isInteger(this.templateIndexToEdit);
  }

  get templateIsValid():boolean
  {
    return this.template.title !== null && this.template.boxModel !== null;
  }
  
  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async show():Promise<void>
  {    
    if( this.inEdition && ! this.selectedBox)
      this.getTemplateDataToEdit();

    // limpiar servicio de tour.
    this._shepherdService.tourObject = null;

    await super.show();
  }

  private getTemplateDataToEdit():void
  {
    let templateToEdit = this.templates[this.templateIndexToEdit];    
    this.template = ObjectUtility.simpleCloning(templateToEdit);
    this.selectedBox = this.templateBoxes.find(box => box.model === templateToEdit.boxModel);
  }

  public toggleTemplateSectionVisibility(section:"miniature_map"|"graphic_scale"|"legend"):void
  {
    this.template[section].enabled = ! this.template[section].enabled; 
  }

  public async saveTemplateConfiguration():Promise<void>
  {
    try {

      this._spinnerService.updateText("Actualizando planos de capa...");
      this._spinnerService.show();

      this.savingTemplate = true;

      this.inEdition ?
      this.template.updated_at = new Date().toString() :
      this.template.created_at = new Date().toString();

      this.inEdition ?
      this.templates.splice(this.templateIndexToEdit, 1, ObjectUtility.simpleCloning(this.template)) :
      this.templates = [...this.templates, ObjectUtility.simpleCloning(this.template)];

      await this._projectsService.consultarApi({
        "funcion": "web_actualizar_configuracion_planos",
        "proyecto": this._projectService.project.nombre,
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

  public async showBoxConfigurationModalEvent():Promise<void>
  {
    await super.hide();
    this._shepherdService.tourObject = null;
    this.showBoxConfigurationModal.emit();
  }

  public async hide():Promise<void>
  {    
    ObjectUtility.overrideValues( this.template );
    this.template.graphic_scale.enabled = true;
    this.template.miniature_map.enabled = true;
    this.template.legend.enabled = true;
    this.templateIndexToEdit = null;
    this.selectedBox = null;
    this._shepherdService.tourObject = null;
    await super.hide();
  }
  
  /* TOUR */

  public showTour():void
  {
    if( this.tourIsActive )
      return;

    if( this._shepherdService.tourObject )
    {
      const currentTour = this._shepherdService.tourObject;
      this._shepherdService.tourObject = null;
      this._shepherdService.addSteps(currentTour.steps);
    }
    else
    {
      this.buildTour();
    }   

    this._shepherdService.start();
  }

  private buildTour():void
  {
    const that = this;    
  
    const steps = this.buildTourSteps();

    const buttons = [
      {
        classes: 'btn-info',
        text: 'Expandir imagen',
        action(){
          const stepImages = document.querySelectorAll(".step-image");
          toggleFullscreen(stepImages[stepImages.length - 1]);
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
        if( ! step.hasImage  )
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
        element: `plane-example`,
        selectorPrefix: `.`,
        labelPosition: "right-start",
        content: `
        Aquí se verá la estructura del plano.   
        <br><br>
        Un plano se compone de 5 secciones:
        <ul>
          <li>Zona del mapa.</li>
          <li>Escala (<b>opcional</b>).</li>
          <li>Mapa miniatura (<b>opcional</b>).</li>
          <li>Leyenda (<b>opcional</b>).</li>
          <li>Cajetín.</li>
        </ul>       
        `
      },
      {
        element: `map-image`,
        selectorPrefix: `.`,
        labelPosition: "right-start",
        content: `
        La <b>zona del mapa</b> se delimita <b>al momento de exportar la plantilla</b>
        (dibujando un rectángulo con el cursor).
        `
      },
      {
        element: `scale`,
        labelPosition: "top",
        selectorPrefix: ".",
        hasImage: true,
        content: `
        La <b>escala</b> será determinada por el <b>nivel de zoom</b> que tenga el mapa al momento de generar la exportación 
        (<b>ver esquina inferior izquierda al abrir herramienta de planimetría</b>).
        <br><br>
        <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div> 
        <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none'; setTimeout(() => window.scrollTo(0,0), 500);" 
        class="hide step-image w-100 h-auto" src="assets/images/medium/tours/herramientas/planimetria/modal-de-creacion/4-escala.png">     
        `
      },
      {
        element: `miniature-map-image`,
        hasImage: true,
        labelPosition: "top",
        selectorPrefix: ".",
        content: `
        El <b>mapa miniatura</b> muestra <b>la delimitación de la zona</b> usada en el plano.
        <br><br>
        <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div> 
        <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none'; setTimeout(() => window.scrollTo(0,0), 500);" 
        class="hide step-image w-100 h-auto" src="assets/images/medium/tours/herramientas/planimetria/modal-de-creacion/5-mapa-miniatura.png">        
        `
      },
      {
        element: `legend`,
        hasImage: true,
        labelPosition: "top",
        selectorPrefix: ".",
        content: `
        La <b>leyenda</b> muestra la descripción del <b>categorizado 
        que esté aplicado en la capa seleccionada</b> para el plano 
        (ver herramienta <img class="d-inline small-icon" src="assets/icons/SVG/CATEGORIAS.svg">).
        <br><br>
        <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div> 
        <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none'; setTimeout(() => window.scrollTo(0,0), 500);" 
        class="hide step-image w-100 h-auto" src="assets/images/medium/tours/herramientas/planimetria/modal-de-creacion/6-leyenda.svg">        
      
        `
      },
      {
        element: `box`,
        hasImage: true,
        selectorPrefix: ".",
        labelPosition: "top",
        content: `
        El <b>cajetín</b> contiene la información especifica.
        <br>
        Existen <b>3 modelos predeterminados</b> de cajetín que se pueden configurar
        (<b>ver PASO 10 - ir al listado de cajetines</b>). 
        <br><br>
        <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div> 
        <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none'; setTimeout(() => window.scrollTo(0,0), 500);" 
        class="hide step-image w-100 h-auto" src="assets/images/medium/tours/herramientas/planimetria/modal-de-creacion/7-cajetin.svg">     
        `
      },
      {
        element: `plane-preview-section-title`,
        selectorPrefix: ".",
        labelPosition: "right",
        content: `
        El pdf del plano generado estará en formato <b>A3</b>.
        `
      },
      {
        element: `plane-settings-section`,
        selectorPrefix: ".",
        labelPosition: "left-start",
        content: `
        Para habilitar / deshabilitar las <b>secciones opcionales</b> del plano marque o desmarque la casillas correspondientes.
        `
      },
      {
        element: `plane-box-listing-modal-btn`,
        labelPosition: "left-start",
        content: `
        Para <b>seleccionar y configurar un cajetín</b> se debe ir al <b>listado de cajetines</b> haciendo click en <span class="badge bg-warning text-white">Seleccionar</span>.
        `
      },
      {
        element: `plane-box-preview`,
        labelPosition: "left-start",
        selectorPrefix: ".",
        content: `
        Una vez que se haya seleccionado (y configurado) un cajetín, se podrá previsualizar aquí.
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
