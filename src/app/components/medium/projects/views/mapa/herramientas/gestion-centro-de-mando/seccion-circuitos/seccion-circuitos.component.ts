import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';
import { Circuito } from '../../../../../../../../interfaces/medium/centro-mando';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ShepherdService } from 'angular-shepherd';

@Component({
  selector: 'seccion-circuitos',
  templateUrl: './seccion-circuitos.component.html',
  styleUrls: [
    './seccion-circuitos.component.css',
    '../gestion-centro-de-mando.component.css'
  ]
})
export class SeccionCircuitosComponent extends SeccionBaseComponent
{  
  @Input()
  public template:Circuito[]; 

  public selectedCircuit:Circuito;

  @Output()
  public circuitManagementEvent:EventEmitter<Circuito> = new EventEmitter; 

  @ViewChild(ModalDirective)
  public confirmationModal:ModalDirective;

  constructor(
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async loadData():Promise<void>
  {
    if( this.mode !== "new" )
    {
      try
      {
        const layerFilter = this.layer.filtro_capa.split("#");
  
        const circuits = (await this._projectsService.consultarApi({
            "funcion": "web_circuitos_centro_mando",
            "proyecto": this._projectService.project.bd_proyecto,
            "modulo": layerFilter[0],
            "grupo": layerFilter[1],
            "centro_mando": this.commandCenterId
        })).datos;

        this.template.push(...circuits);            
      }
      catch (error)
      {
        throw error;   
      }
    }
  } 

  public onSelectCircuit(circuit:Circuito):void
  {
    if( this.tourIsActive )
      return;
      
    this.selectedCircuit = circuit;
  }

  public newCircuit():void
  {
    this.circuitManagementEvent.emit();
  }
  
  public async copyCircuit():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Copiando circuito...");
      this._spinnerService.show();

      this.showLoading.emit();

      const newCircuitId = (await this._projectsService.consultarApi({
          "funcion": "web_clonar_circuito",
          "proyecto": this._projectService.project.nombre,
          "modulo": this.layer.modulo,
          "grupo": this.layer.grupo,
          "id_circuito": this.selectedCircuit.id_circuito,
      })).datos.id_circuito;

      const clone = ObjectUtility.simpleCloning( this.selectedCircuit );

      clone["id_circuito"] = newCircuitId;

      this.template.push(clone);

      this._toastrService.success("Circuito copiado.","Exito!");
    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
      this.hideLoading.emit();
    } 
  }

  public showOrUpdateCircuit():void
  {
    this.circuitManagementEvent.emit(this.selectedCircuit);
  }
  
  public async deleteCircuit():Promise<void>
  {
    try
    {
      this.confirmationModal.hide();
      
      this._spinnerService.updateText("Eliminando circuito...");
      this._spinnerService.show();

      this.showLoading.emit();

      await this._projectsService.consultarApi({
          "funcion": "web_eliminar_circuito",
          "proyecto": this._projectService.project.nombre,
          "modulo": this.layer.modulo,
          "grupo": this.layer.grupo,
          "id_circuito": this.selectedCircuit.id_circuito,
      });

      const circuitIndex = this.template.findIndex(circuit => circuit === this.selectedCircuit);

      this.template.splice(circuitIndex, 1);

      this.selectedCircuit = null;

      this._toastrService.success("Circuito eliminado.","Exito!");
    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
      this.hideLoading.emit();
    }
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
          _buttons = _buttons.slice(1);
        
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
          text: step.content
        };
  
        _steps.push(_step);
      }
  
      this._shepherdService.addSteps(_steps);
    }
  
    private buildTourSteps():any[]
    {     
      // remover tour de servicio global al cancelar / terminar tour.
      const onCancelOrCompleteTourClosure = () => this._shepherdService.tourObject = null;

      const steps = [
        {
          element: `circuits-table`,
          labelPosition: "left",
          content: `
          <ul>
            <li class="mb-1">
              Un centro de mando puede tener <b>uno o varios circuitos asociados</b>.
            </li>
            <li class="mb-1">
              En la tabla se podrán ver todos los circuitos asociados.
            </li>
            <li class="mb-1">
              Para <b>copiar, ver, editar o eliminar</b> un circuito existente,
              previamente se debe seleccionar <b>haciendo click</b> sobre el. 
            </li>
          </ul>
          `,
          event: {
            "before-show": () => {
              this._shepherdService.tourObject.once("cancel", onCancelOrCompleteTourClosure);
              this._shepherdService.tourObject.once("complete", onCancelOrCompleteTourClosure);
            }
          }
        },
        {
          element: `new-circuit-btn`,
          labelPosition: "left",
          content: `
          Para <b>crear</b> un nuevo circuito hacer
          click en <span class="badge-secondary">Nuevo</span> y se mostrará el formulario de creación.
          `
        },
        {
          element: `copy-circuit-btn`,
          labelPosition: "left",
          content: `
          Para <b>copiar</b> un circuito existente, seleccionarlo y hacer
          click en <span class="badge-secondary">Copiar</span>.
          <br>
          El nuevo circuito será creado y la tabla será actualizada.
          `
        },
        {
          element: `edit-circuit-btn`,
          labelPosition: "left",
          content: `
          Para <b>editar o ver</b> un circuito existente, seleccionarlo y hacer
          click en <span class="badge-secondary">Ver/editar</span> y se mostrará el formulario de edición.
          `
        },
        {
          element: `delete-circuit-btn`,
          labelPosition: "left",
          content: `
          Para <b>eliminar</b> un circuito existente, seleccionarlo y hacer
          click en <span class="badge-secondary">Eliminar</span>.
          `
        }
      ];
  
      return steps;
    }
}
