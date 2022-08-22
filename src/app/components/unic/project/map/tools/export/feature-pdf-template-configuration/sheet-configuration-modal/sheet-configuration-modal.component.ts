import { Component, ViewChild, Input } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { GeoJSONFile } from '../../../../../../../../models/unic/geojson/geojson-file';
import {Options as SortableJsOptions} from 'sortablejs';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { delayExecution } from 'src/app/shared/helpers';
import { GeojsonFilesService } from '../../../../../../../../services/unic/geojson-files.service';
import { FeatureSheetTemplate, PropertyGroup, SheetSection } from '../../../../../../../../interfaces/geojson/export/feature-sheet-template';

interface PdfTemplate
{
  title:string;
  property_groups:Array<PropertyGroup|SheetSection>;
}

@Component({
  selector: 'sheet-configuration-modal',
  templateUrl: './sheet-configuration-modal.component.html',
  styleUrls: ['./sheet-configuration-modal.component.css']
})
export class SheetConfigurationModalComponent extends HideableSectionComponent
{
  @ViewChild(ModalDirective)
  public modal:ModalDirective;

  @Input()
  public file:GeoJSONFile;

  public templateIndexToEdit:number = null;

  public search:string = "";

  public enabledFeatureProperties:string[] = [];
  public featurePropertiesSortableOptions: SortableJsOptions;
  public propertyGroupColumnsSortableOptions: SortableJsOptions;

  @ViewChild("propertyGroupCreationForm")
  public propertyGroupCreationForm:NgForm;

  public pdfTemplate:PdfTemplate;

  public newPropertyGroup:any;

  public savingTemplate:boolean = false;

  constructor(
    private _geojsonFilesService:GeojsonFilesService,
    private _toastrService:ToastrService
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
      const templateToEdit = this.file.feature_pdf_export_templates["sheet"][this.templateIndexToEdit];

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

      this.enabledFeatureProperties = this.file.enabledFeatureProperties.filter(property => ! selectedProperties.includes(property));
    }
    else
    {
      this.enabledFeatureProperties = [...this.file.enabledFeatureProperties];
    }

  }

  private getTemplateDataToEdit():void
  {
    let templateToEdit = this.file.feature_pdf_export_templates["sheet"][this.templateIndexToEdit];
    
    templateToEdit = ObjectUtility.complexCloning(templateToEdit);

    this.pdfTemplate.title = templateToEdit.title;
    this.pdfTemplate.property_groups = templateToEdit.propertiesGroups;
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
      removedPropertyGroup.columns.forEach(column => this.enabledFeatureProperties.push(...column));
      this.enabledFeatureProperties.sort();
    }
  }

  public removeProperty(position:number, column:Array<string>):void
  {
    const removedProperty =  column.splice(position, 1)[0];

    this.enabledFeatureProperties.push(removedProperty);
    this.enabledFeatureProperties.sort();
  }

  public async saveTemplateConfiguration():Promise<void>
  {
    try {

      this.savingTemplate = true;

      const templateToEdit = this.inEdition ? this.file.feature_pdf_export_templates["sheet"][this.templateIndexToEdit] : null;

      let template:FeatureSheetTemplate = {
        title: this.pdfTemplate.title,
        propertiesGroups: this.pdfTemplate.property_groups,
        mapImageSrc:null,
        featureImages: [],
        created_at: templateToEdit ? templateToEdit.created_at : new Date().toString(),
        updated_at: templateToEdit ? new Date().toString() : null
      };

      this.inEdition ?
      this.file.updateFeaturePdfExportTemplate("sheet", this.templateIndexToEdit, template) :
      this.file.addFeaturePdfExportTemplate("sheet", template);

      await this._geojsonFilesService.update(this.file);

      let message = this.inEdition ? "Plantilla actualizada." : "Plantilla registrada.";

      this._toastrService.success(message,"Exito!");

      await this.hide(); 
      
    } catch (error)
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
    ObjectUtility.overrideValues( this.pdfTemplate );

    this.pdfTemplate.property_groups = [
      "map",
      "images"
    ];

    this.templateIndexToEdit = null;

    this.search = "";
    
    super.hide();
  }

}
