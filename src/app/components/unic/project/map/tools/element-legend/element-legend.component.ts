import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Map } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { delayExecution } from 'src/app/shared/helpers';
import { GeoJSONLayer } from '../../../../../../models/unic/geojson/geojson-layer';
import { ObjectUtility } from '../../../../../../shared/object-utility';

@Component({
  selector: 'element-legend',
  templateUrl: './element-legend.component.html',
  styleUrls: ['./element-legend.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class ElementLegendComponent extends HideableSectionComponent
{
  public modules:string[] = [];

  public fileLayers:GeoJSONLayer[];

  public selectedFileLayer:GeoJSONLayer;

  public formData:any = {
    module: null,
    layer: null,
    property: null,
  };

  public featureProperties:Array<string> = [];
  constructor(
    private _geojsonLayersService:GeojsonLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService
  )
  {
    super();
  }

  public async show():Promise<void>
  {
    this.modules = this._geojsonLayersService.getModuleNames("projected");
    await super.show();
  }

  public onChangeModuleSelector():void
  {
    this.selectedFileLayer = null;
    this.formData.layer = null;
    this.featureProperties = null;
    this.fileLayers = this._geojsonLayersService.getPerModule( this.formData.module, "projected" );
  }

  public onChangeFileLayerSelect(fileLayer:GeoJSONLayer):void
  {
    this.selectedFileLayer = fileLayer;
    this.featureProperties = [...fileLayer.file.enabledFeatureProperties];
  }

  public async addLegend():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando capa...");
      this._spinnerService.show();
      
      await delayExecution(250);
      
      await this._geojsonLayersService.enableLabel(this.selectedFileLayer, this.formData.property);
      
      this._toastrService.success("Capa actualizada.","Exito!");
            
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

  public async removeLegend():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando capa...");
      this._spinnerService.show();
      
      await delayExecution(250);
      
      await this._geojsonLayersService.disableLabel(this.selectedFileLayer);
      
      this._toastrService.success("Capa actualizada.","Exito!");
            
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

  public async removeLegendOnAllLayers():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Removiendo legendas...");
      this._spinnerService.show();
      
      await delayExecution(250);

      const fileLayersWithLabel = this._geojsonLayersService.getProjected().filter(fileLayer => fileLayer.label);

      for(let fileLayer of fileLayersWithLabel)
        await this._geojsonLayersService.disableLabel(fileLayer);
      
      this._toastrService.success("Legendas removidas.","Exito!");
            
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

  public async hide():Promise<void>
  {
    ObjectUtility.overrideValues(this.formData);
    this.selectedFileLayer = null;
    this.featureProperties = [];
    await super.hide();
  }
}
