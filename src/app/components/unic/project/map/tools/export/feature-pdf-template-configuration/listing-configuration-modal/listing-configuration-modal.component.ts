import { Component, Input} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { GeoJSONFile } from '../../../../../../../../models/unic/geojson/geojson-file';
import { GeojsonFilesService } from '../../../../../../../../services/unic/geojson-files.service';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { FeatureListingTemplate } from '../../../../../../../../interfaces/geojson/export/feature-listing-template';

@Component({
  selector: 'listing-configuration-modal',
  templateUrl: './listing-configuration-modal.component.html',
  styleUrls: ['./listing-configuration-modal.component.css']
})
export class ListingConfigurationModalComponent extends HideableSectionComponent
{
  @Input()
  public file:GeoJSONFile;

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

  public enabledFeatureProperties:Array<string> = []; 

  public search:string = "";

  constructor(
    private _toastrService:ToastrService,
    private _geojsonFilesService: GeojsonFilesService
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

  public async show():Promise<void>
  {
    this.getFeatureProperties();
    
    if( this.inEdition )
      this.getTemplateDataToEdit();

    super.show();
  }

  private getFeatureProperties():void
  {
    if( this.inEdition )
    {
      const templateToEdit = this.file.feature_pdf_export_templates.listing[this.templateIndexToEdit];
      this.enabledFeatureProperties = this.file.enabledFeatureProperties.filter(property => ! templateToEdit.columns.includes(property));
    }
    else
    {
      this.enabledFeatureProperties = this.file.enabledFeatureProperties;
    }
  }

  private getTemplateDataToEdit():void
  {
    let templateToEdit = this.file.feature_pdf_export_templates.listing[this.templateIndexToEdit];    
    this.template = ObjectUtility.simpleCloning(templateToEdit);
  }
  
  public addColumn(property:string):void
  {
    try {

      if( this.template.columns.length === 8 )
        throw new Error("El nro maximo de columnas permitidas es de 8.");

      this.enabledFeatureProperties = this.enabledFeatureProperties.filter(_property => _property !== property);
      this.template.columns.push(property);
      
    } catch (error)
    {
      this._toastrService.error(error.message, "Error.");
    }
  }

  public async removeColumn(position:number):Promise<void>
  {
    const removedProperty = this.template.columns.splice(position, 1)[0];
    this.enabledFeatureProperties.push(removedProperty);
    this.enabledFeatureProperties.sort();

    if( this.template.sortColumn === removedProperty )
      this.template.sortColumn = null;
  }

  public async saveTemplateConfiguration():Promise<void>
  {
    try {

      this.savingTemplate = true;

      this.inEdition ?
      this.template.updated_at = new Date().toString() :
      this.template.created_at = new Date().toString();

      this.inEdition ?
      this.file.updateFeaturePdfExportTemplate("listing", this.templateIndexToEdit, ObjectUtility.simpleCloning(this.template)) :
      this.file.addFeaturePdfExportTemplate("listing", ObjectUtility.simpleCloning(this.template));

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

  public async hide():Promise<void>
  {    
    ObjectUtility.overrideValues( this.template );
    this.template.sortMode = "asc";

    this.templateIndexToEdit = null;
    this.search = "";

    await super.hide();
  }
 
}
