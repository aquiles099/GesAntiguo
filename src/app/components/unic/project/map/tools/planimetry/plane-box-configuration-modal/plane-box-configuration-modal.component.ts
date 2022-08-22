import { Component, EventEmitter, Input, Output} from '@angular/core';
import { PlanimetryBox } from 'src/app/interfaces/geojson/planimetry/planimetry-template';
import { HideableSectionComponent } from '../../../../../shared/hideable-section/hideable-section.component';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { delayExecution, getFileContent } from 'src/app/shared/helpers';
import { checkIfTheFileExtensionIsCorrect, sortArray } from '../../../../../../../shared/helpers';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { GeoJSONFile } from '../../../../../../../models/unic/geojson/geojson-file';
import { BoxImage } from '../../../../../../../interfaces/geojson/planimetry/planimetry-template';

@Component({
  selector: 'plane-box-configuration-modal',
  templateUrl: './plane-box-configuration-modal.component.html',
  styleUrls: ['./plane-box-configuration-modal.component.css']
})
export class PlaneBoxConfigurationModalComponent extends HideableSectionComponent
{
  @Input()
  public file:GeoJSONFile;

  public boxes:Array<PlanimetryBox> = [];

  public selectedBox:PlanimetryBox;

  public configurationSectionIsVisible:boolean = false; 

  @Output()
  public saveBoxConfiguration:EventEmitter<PlanimetryBox> = new EventEmitter;

  constructor(
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService
  )
  {
    super();
  }

  public async show():Promise<void>
  {
    this.getExistingBoxes();
    super.show();
  }

  private getExistingBoxes():void
  {
    this.boxes = this.file.planimetry_boxes.map(box => ObjectUtility.simpleCloning(box));

    sortArray(this.boxes, "asc", "model");

    const models = Array(3), boxTemplate = {
      model: null,
      title: null,
      designation: null,
      titular: null,
      sponsor: null,
      images: [],
      scale: null,
      number: null
    };

    for(let i = 1; i <= models.length; i++)
    {
      const modelExists = this.boxes.some(box => box.model === i);
  
      if( ! modelExists )
      {
        const model = ObjectUtility.simpleCloning(boxTemplate);
        model.model = i; 
        this.boxes = [...this.boxes, model];
      }
    }
  }

  public selectBox(box:PlanimetryBox):void
  {
    this.selectedBox = box;
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

  public async saveBoxConfigurationEvent():Promise<void>
  {
    const planeBox = ObjectUtility.simpleCloning(this.selectedBox);
    await this.hide(); 
    this.saveBoxConfiguration.emit( planeBox );
  }

  public async hide():Promise<void>
  {    
    this.selectedBox = null;
    this.configurationSectionIsVisible = false;
    await super.hide();
  }
 
}
