import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HideableSectionComponent } from '../../../../../shared/hideable-section/hideable-section.component';
import { GeoJSONFile } from '../../../../../../../models/unic/geojson/geojson-file';
import { GeojsonFilesService } from '../../../../../../../services/unic/geojson-files.service';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { PlanimetryTemplate, PlanimetryBox } from '../../../../../../../interfaces/geojson/planimetry/planimetry-template';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { delayExecution } from 'src/app/shared/helpers';

@Component({
  selector: 'plane-configuration-modal',
  templateUrl: './plane-configuration-modal.component.html',
  styleUrls: ['./plane-configuration-modal.component.css']
})
export class PlaneConfigurationModalComponent extends HideableSectionComponent
{
  @Input()
  public file:GeoJSONFile;

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
    private _geojsonFilesService: GeojsonFilesService,
    private _spinnerService:SpinnerService
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

  public async show():Promise<void>
  {    
    if( this.inEdition && ! this.selectedBox)
      this.getTemplateDataToEdit();

    super.show();
  }

  private getTemplateDataToEdit():void
  {
    let templateToEdit = this.file.planimetry_templates[this.templateIndexToEdit];    
    this.template = ObjectUtility.simpleCloning(templateToEdit);
    this.selectedBox = this.file.planimetry_boxes.find(box => box.model === templateToEdit.boxModel);
  }

  public toggleTemplateSectionVisibility(section:"miniature_map"|"graphic_scale"|"legend"):void
  {
    this.template[section].enabled = ! this.template[section].enabled; 
  }

  public async saveTemplateConfiguration():Promise<void>
  {
    try {

      this.savingTemplate = true;

      this.inEdition ?
      this.template.updated_at = new Date().toString() :
      this.template.created_at = new Date().toString();

      this.inEdition ?
      this.file.updatePlane(this.templateIndexToEdit, ObjectUtility.simpleCloning(this.template)) :
      this.file.addPlane(ObjectUtility.simpleCloning(this.template)) ;

      await this._geojsonFilesService.update(this.file);

      let message = this.inEdition ? "Plantilla actualizada." : "Plantilla registrada."; 

      this._toastrService.success(message,"Exito!");

      await this.hide(); 
    } 
    catch (error) 
    {
      console.error(error);
      this._toastrService.error(error.message);
    }
    finally
    {
      this.savingTemplate = false; 
    }
  }

  public async showBoxConfigurationModalEvent():Promise<void>
  {
    await super.hide();
    this.showBoxConfigurationModal.emit();
  }

  public async savePlaneBoxConfigurationAndShowModal(planeBox:PlanimetryBox):Promise<void>
  {
    try {

      this._spinnerService.updateText("Configurando cajetin...");
      this._spinnerService.show();

      await delayExecution(250);

      const boxExists = this.file.planimetry_boxes.some(_box => _box.model === planeBox.model);

      boxExists ?
      this.file.updatePlaneBox(planeBox) :
      this.file.addPlaneBox(planeBox);

      await this._geojsonFilesService.update(this.file);

      this.selectedBox = planeBox;
      this.template.boxModel = planeBox.model;
      
      await super.show(); 
    } 
    catch (error) 
    {
      console.error(error);
      this._toastrService.error(error.message);
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async hide():Promise<void>
  {    
    ObjectUtility.overrideValues( this.template );
    this.template.graphic_scale.enabled = true;
    this.template.miniature_map.enabled = true;
    this.template.legend.enabled = true;
    this.templateIndexToEdit = null;
    this.selectedBox = null;
    await super.hide();
  }
 
}
