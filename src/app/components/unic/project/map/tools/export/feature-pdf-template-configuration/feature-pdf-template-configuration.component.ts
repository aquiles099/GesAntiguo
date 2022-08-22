import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { HideableSectionComponent } from '../../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../../services/unic/geojson-layers.service';
import { GeoJSONFile } from '../../../../../../../models/unic/geojson/geojson-file';
import { ToastrService } from 'ngx-toastr';
import { GeoJSONLayer } from '../../../../../../../models/unic/geojson/geojson-layer';
import { Subscription } from 'rxjs';
import { FeatureSheetTemplate } from '../../../../../../../interfaces/geojson/export/feature-sheet-template';
import { getTimeDiff, showPreconfirmMessage, delayExecution } from 'src/app/shared/helpers';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { SheetConfigurationModalComponent } from './sheet-configuration-modal/sheet-configuration-modal.component';
import { ListingConfigurationModalComponent } from './listing-configuration-modal/listing-configuration-modal.component';
import { FeatureListingTemplate } from '../../../../../../../interfaces/geojson/export/feature-listing-template';
import { ListingFeaturePdfExporter } from '../../../../../../../models/unic/geojson/pdf-export/feature-listing-pdf-exporter';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectService } from '../../../../../../../services/unic/project.service';
const json2xlsx = require('json-as-xlsx');

@Component({
  selector: 'feature-pdf-template-configuration-section',
  templateUrl: './feature-pdf-template-configuration.component.html',
  styleUrls: ['./feature-pdf-template-configuration.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class FeaturePdfTemplateConfigurationComponent extends HideableSectionComponent 
{
  @ViewChild(SheetConfigurationModalComponent)
  public SheetConfigurationModal:SheetConfigurationModalComponent;

  @ViewChild(ListingConfigurationModalComponent)
  public ListingConfigurationModal:ListingConfigurationModalComponent;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  @Output()
  public showFeatureExportTool:EventEmitter<any> = new EventEmitter;

  public templateType:"sheet"|"listing";

  public listExportFormatTypes:string[] = [
    "pdf",
    "xlsx"
  ];

  public modules:string[] = [];
  
  public fileLayers:GeoJSONLayer[];
  public fileLayersSubscription:Subscription;

  public selectedFile:GeoJSONFile;

  public formData:any = {
    module: null,
    layer: null,
    format: "pdf"
  };

  constructor(
    private _geojsonLayersService:GeojsonLayersService,
    private _projectService:ProjectService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService
  )
  {
    super();
  }

  get templates():Array<FeatureSheetTemplate>
  {
    return this.selectedFile ? [...this.selectedFile.feature_pdf_export_templates[(this.templateType as any)]] : [];
  }

  get recentTemplates():Array<FeatureSheetTemplate>
  {
    return this.templates.length ? this.templates.filter(template => {

      const creationDate = new Date(template.created_at);

      return getTimeDiff(creationDate) < 7;

    }) :
    [];
  }

  public async show():Promise<void>
  {
    this.modules = this._geojsonLayersService.getModuleNames("projected");
    await super.show();
  }

  public onChangeModuleSelector():void
  {
    this.selectedFile = null;
    this.formData.layer = null;
    this.fileLayers = this._geojsonLayersService.getPerModule(this.formData.module, "projected");
  }
  
  public onChangeFileLayerSelect(fileLayer:GeoJSONLayer):void
  {
    this.selectedFile = fileLayer.file;
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

  public async onExport(template:FeatureSheetTemplate|FeatureListingTemplate):Promise<void>
  {
    this.templateType === "sheet" ?
    await this.showFeatureExportToolEvent(template as FeatureSheetTemplate) :
    await this.exportFeatureListing(template as FeatureListingTemplate);  
  }

  private async showFeatureExportToolEvent(template:FeatureSheetTemplate):Promise<void>
  {
    const fileLayer = this.fileLayers.find(fileLayer => fileLayer.layerName === this.formData.layer);

    await this.hide();
    
    this.showFeatureExportTool.emit({
      fileLayer: fileLayer,
      template: ObjectUtility.simpleCloning(template)
    });
  }

  private async exportFeatureListing(template:FeatureListingTemplate):Promise<void>
  {
    try 
    {
      this._spinnerService.updateText("Generando pdf...");
      this._spinnerService.show();

      await delayExecution(250);

      const pdf = new ListingFeaturePdfExporter(
        template, 
        this.selectedFile.getContent().features,
        this._projectService.project
      );

      if( this.formData.format === "xlsx" )
      {
        const rows = pdf.getRows().map(row => {

          return template.columns.reduce((obj, column, columnIndex) => {

            obj[column] = row[columnIndex];

            return obj;
          }, {});

        });

        const columns = template.columns.map(key => { return{ label: key, value: key }; });

        let data = [
          {
            sheet: template.title,
            columns: columns,
            content: rows 
          }
        ];
        
        let settings = {
          fileName: template.title,
          extraLength: 3, 
          writeOptions: {} 
        };
        
        json2xlsx(data, settings);
      }
      else
      {
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

  public async showTemplateConfigurationModal():Promise<void>
  {
    this.templateType === "sheet" ?
    await this.SheetConfigurationModal.show() :
    await this.ListingConfigurationModal.show();
  }

  public async editTemplate(index:number):Promise<void>
  { 
    const modal = this.templateType === "sheet" ?
    this.SheetConfigurationModal :
    this.ListingConfigurationModal;

    modal.templateIndexToEdit = index;
    
    await modal.show();
  }

  public async deleteTemplate(index:number):Promise<void>
  { 
    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Eliminar plantilla?",
        "Esta accion no es reversible."
      );
    
      if( userResponse.isConfirmed )
      {
        this.selectedFile.deleteFeaturePdfExportTemplate(this.templateType, index);
        await this._geojsonLayersService.geojsonFilesService.update( this.selectedFile );
        this._toastrService.success("Plantilla eliminada.","Exito!");
      }  
    } 
    catch (error) 
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
    
  }
 
  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    ObjectUtility.overrideValues(this.formData);
    this.formData.format = "pdf";

    this.selectedFile = null;
    await super.hide();
  }
}
