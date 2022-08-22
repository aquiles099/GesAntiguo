import { Component, EventEmitter, Input, Output} from '@angular/core';
import { PlanimetryBox } from 'src/app/interfaces/geojson/planimetry/planimetry-template';
import { HideableSectionComponent } from '../../../../../../../shared/hideable-section/hideable-section.component';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { delayExecution, getFileContent } from 'src/app/shared/helpers';
import { checkIfTheFileExtensionIsCorrect, sortArray, toggleFullscreen } from '../../../../../../../../shared/helpers';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { BoxImage } from '../../../../../../../../interfaces/geojson/planimetry/planimetry-template';
import { ShepherdService } from 'angular-shepherd';

@Component({
  selector: 'modal-configuracion-de-cajetin',
  templateUrl: './modal-configuracion-de-cajetin.component.html',
  styleUrls: ['./modal-configuracion-de-cajetin.component.css']
})
export class ModalConfiguracionDeCajetinComponent extends HideableSectionComponent
{  
  @Input()
  public boxes:Array<PlanimetryBox> = [];

  public selectedBox:PlanimetryBox;

  public configurationSectionIsVisible:boolean = false; 

  @Output()
  public updateTemplateBoxes:EventEmitter<PlanimetryBox> = new EventEmitter;

  constructor(
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

  public async show():Promise<void>
  {
    this.getExistingBoxes();
    super.show();
  }

  private getExistingBoxes():void
  {
    for(let i = 1; i <= Array(3).length; i++)
    {
      const modelExists = this.boxes.some(box => box.model === i);
  
      if( ! modelExists )
      {
        this.boxes.push({
          model: i,
          title: null,
          designation: null,
          titular: null,
          sponsor: null,
          images: [],
          scale: null,
          number: null
        });
      }
    }

    sortArray(this.boxes, "asc", "model");
  }

  public selectBox(box:PlanimetryBox):void
  {
    if( this.tourIsActive )
      return;

    this.selectedBox = ObjectUtility.simpleCloning(box);
  }

  public showConfigurationSection():void
  {
    this.configurationSectionIsVisible = true;     
  }

  public hideConfigurationSection():void
  {
    this.getExistingBoxes(); 
    this.selectedBox = null;
    this.configurationSectionIsVisible = false;
  }

  public async onAddImage(event, position:"right"|"left"):Promise<void>
  {
    try {
      
      const image:any = Array.from(event.target.files)[0];

      if(image)
      {
        this._spinnerService.updateText("Cargando archivo...");
        this._spinnerService.show();

        await delayExecution(250);
        
        if( ! checkIfTheFileExtensionIsCorrect([image], ["png", "jpeg", "jpg"]) )
          throw new Error("El archivo debe ser una imagen png, jpeg o jpg.");
        
        const imageData = {
          src: await getFileContent(image,"dataURL"),
          name: image.name,
          position: position
        };

        const existingImageIndex = this.selectedBox.images.findIndex(img => img.position === position);

        existingImageIndex !== -1 ?
        this.selectedBox.images.splice(existingImageIndex, 1, imageData) : 
        this.selectedBox.images.push(imageData);
      }

    } catch (error) 
    {
      console.error(error);      
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      event.target.value = null;
      this._spinnerService.hide();
      this._spinnerService.cleanText(); 
    }
  }

  public removeImage(position:"left"|"right"):void
  {
    const existingImageIndex = this.selectedBox.images.findIndex(img => img.position === position);
    this.selectedBox.images.splice(existingImageIndex, 1); 
  }

  public getImageOfSelectedBox(position:"left"|"right"):BoxImage
  {
    return this.selectedBox ? 
    this.selectedBox.images.find(image => image.position === position) :
    null;
  }

  public async updateTemplateBoxesEvent():Promise<void>
  {
    const planeBox = ObjectUtility.simpleCloning(this.selectedBox);
    await this.hide(); 
    this.updateTemplateBoxes.emit( planeBox );
  }

  public async hide():Promise<void>
  {    
    this.selectedBox = null;
    this.configurationSectionIsVisible = false;
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
        when: step.event,
        beforeShowPromise: step.beforeShowPromise
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps():any[]
  {
    const steps = [];
    
    if( ! this.configurationSectionIsVisible )
    {
      this.selectedBox = this.boxes[1];

      steps.push(
        {
          element: `box-listing`,
          labelPosition: "top",
          content: `
          Para seleccionar uno de los 3 cajetines predeterminados <b>hacer click sobre el</b>.       
          `
        },
        {
          element: `configure-box-btn`,
          labelPosition: "top",
          content: `
          Para mostrar la <b>vista de configuración de cajetín</b>
          hacer click en <span class="badge bg-info text-white">Aceptar</span>.
          `
        },
        {
          element: `back-to-plane-configuration-btn`,
          labelPosition: "top",
          content: `
          Para volver a la <b>vista de configuración de plano</b> hacer click en
          <span class="badge-outline-info">Cancelar</span>  o sobre la <b>X</b> en la parte superior
          derecha.
          `,
          beforeShowPromise: () => {

            let delay = 0;
            
            if( this.configurationSectionIsVisible )
            {
              this.configurationSectionIsVisible = false;
              delay = 500;
            }
  
            return new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      );
    }

    steps.push(
      {
        element: `box-configuration-form`,
        labelPosition: "right-start",
        content: `
          Para configurar, agregar valores en los campos.
        `,
        beforeShowPromise: () => {

          let delay = 0;
          
          if( ! this.configurationSectionIsVisible )
          {
            this.configurationSectionIsVisible = true;
            delay = 500;

            const onCancelOrCompleteTourClosure = () => {
              this.configurationSectionIsVisible = false;
              this.selectedBox = null;
            };

            this._shepherdService.tourObject.once("complete", onCancelOrCompleteTourClosure);
            this._shepherdService.tourObject.once("cancel", onCancelOrCompleteTourClosure);
          }

          return new Promise(resolve => setTimeout(resolve, delay));
        }
      },
      {
        element: `box-ref`,
        labelPosition: "left-start",
        content: `
          Mientras se configuran los campos se puede previsualizar el contenido aquí.          
        `
      }
    );
    
    if( this.selectedBox?.model > 1 )
    {
      steps.push(
        {
          element: `upload-images-btns-section`,
          labelPosition: "right-start",
          content: `
          Para <b>cargar</b> una imagen hacer click en 
          <span class="badge-secondary">
            <img class="mx-1 small-icon d-inline" src="assets/icons/SVG/CARGAR.svg">
            cargar imagen
          </span>.
          <br><br> 
           Los formatos permitidos son <b>png, jpeg y jpg</b>.
          `
        }
      );
    }
    
    steps.push(
      {
        element: `save-box-configuration-btn`,
        labelPosition: "top",
        content: `
        Para <b>guardar la configuración y seleccionar el cajetín</b> hacer click en <span class="badge bg-info text-white">Aceptar</span>.
        <br>
        Se mostrará nuevamente la <b>vista de configuración de plano</b> y el cajetín se podrá previsualizar. 
        `
      },
      {
        element: `back-to-box-listing-btn`,
        labelPosition: "top",
        content: `
        Para volver al listado de cajetines hacer click en <span class="badge-outline-info">Cancelar</span> o sobre la <b>X</b> en la parte superior
        derecha.
        `
      }
    );
  
    return steps;
  }
 
}
