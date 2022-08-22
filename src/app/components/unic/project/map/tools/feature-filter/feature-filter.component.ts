import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Map } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { GeoJSONFile } from '../../../../../../models/unic/geojson/geojson-file';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { delayExecution } from 'src/app/shared/helpers';
import { GeoJSONLayer } from '../../../../../../models/unic/geojson/geojson-layer';
import { Subscription } from 'rxjs';

@Component({
  selector: 'feature-filter-section',
  templateUrl: './feature-filter.component.html',
  styleUrls: ['./feature-filter.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class FeatureFilterComponent extends HideableSectionComponent implements OnInit, OnDestroy {

  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  public modules:string[] = [];
  public selectedModuleName:string = null;

  public fileLayers:GeoJSONLayer[];
  public fileLayersSubscription:Subscription;

  public selectedFile:GeoJSONFile;
  public selectedFileLayerName:string = null;

  public isThereAnyLayerWithActiveFilter:boolean;

  public featurePropertiesOfSelectedFile:Array<string> = [];
  public propertyValues:Array<string|number> = [];
  public filterProperty:string = null;

  public search:string = null;

  constructor(
    private _geojsonLayersService:GeojsonLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService
  )
  {
    super();
  }

  public ngOnInit():void
  {
    this.fileLayersSubscription = this._geojsonLayersService.fileLayer$.subscribe(
      fileLayers => this.isThereAnyLayerWithActiveFilter = fileLayers.some(fileLayer => fileLayer.file.hasPropertyWithFilter)
    );
  }

  public async show():Promise<void>
  {
    this.modules = this._geojsonLayersService.getModuleNames("projected");
    await super.show();
  }

  public onChangeModuleSelector():void
  {
    this.selectedFile = null;
    this.selectedFileLayerName = null;
    this.featurePropertiesOfSelectedFile = null;
    this.filterProperty = null;
    this.fileLayers = this._geojsonLayersService.getPerModule( this.selectedModuleName, "projected" );
  }

  public onChangeFileLayerSelect(fileLayer:GeoJSONLayer):void
  {
    this.selectedFile = fileLayer.file;
    this.featurePropertiesOfSelectedFile = [...fileLayer.file.enabledFeatureProperties];
    this.filterProperty = null;
  }

  public async addOrRemoveValueOnPropertyFilter(value:string|number):Promise<void>
  {
    this.selectedFile.valueExistsOnPropertyFilter(value, this.filterProperty) ?
    this.selectedFile.removeValueOnPropertyFilter(value, this.filterProperty) :
    this.selectedFile.addValueOnPropertyFilter(value, this.filterProperty);
        
    await this.updateAndRebuildSelectedFileLayer();
  }

  public async removeFilterOnProperty():Promise<void>
  {
    this.selectedFile.removeFilterOnProperty(this.filterProperty);

    await this.updateAndRebuildSelectedFileLayer();
  }

  public async updateAndRebuildSelectedFileLayer():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando filtro de capa...");
      this._spinnerService.show();
      
      await delayExecution(250);
      
      await this._geojsonLayersService.rebuildAndUpdate(this.selectedFile.name);
      
      this._toastrService.success("Filtro de capa actualizado.","Exito!");
            
    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async removeFilterOnAllLayers():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Removiendo filtros...");
      this._spinnerService.show();
      
      await delayExecution(250);

      const fileLayersWithFilter = this._geojsonLayersService.getProjected().filter(fileLayer => fileLayer.file.hasPropertyWithFilter);

      for(let fileLayer of fileLayersWithFilter)
      {
        fileLayer.file.removeFilterOnAllProperties();
        await this._geojsonLayersService.rebuildAndUpdate(fileLayer);
      }
      
      this._toastrService.success("Filtros removidos.","Exito!");
            
    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.selectedModuleName = null;
    this.selectedFile = null;
    this.selectedFileLayerName = null;
    this.featurePropertiesOfSelectedFile = [];
    this.filterProperty = null;
    this.search = null;
    await super.hide();
  }

  public ngOnDestroy():void
  {
    this.fileLayersSubscription.unsubscribe();
  }
}
