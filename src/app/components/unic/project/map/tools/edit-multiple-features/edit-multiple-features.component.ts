import { Component, Input, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Map, Polygon } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { delayExecution, typeValue } from 'src/app/shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { GeoJSONLayer } from '../../../../../../models/unic/geojson/geojson-layer';
import { GeoJSONHelper } from '../../../../../../models/geojson-helper';
import { LayerHighlighter } from '../../../../../../models/unic/leaflet/layer-highlighter';
import { isset } from '../../../../../../shared/helpers';
import { FeaturePropertyValues } from '../../../../../../interfaces/geojson/i-geojson-file';

@Component({
  selector: 'edit-multiple-features-section',
  templateUrl: './edit-multiple-features.component.html',
  styleUrls: ['./edit-multiple-features.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class EditMultipleFeaturesComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  public projectModules:string[] = [];
  public selectedModuleName:string = null;

  public fileLayers:GeoJSONLayer[] = [];
  public selectedFileLayer:GeoJSONLayer = null;
  public selectedLayerName:string = null;

  public featurePropertyValues:FeaturePropertyValues;

  private layerHighlighter:LayerHighlighter;

  public polygon:Polygon;

  public inEdition:boolean = false;

  public inPropertiesEdition:"confirming"|"editing" = null;

  public helpText:string;

  public featuresWithinPolygon:any[] = [];
  public featuresToEdit:any[] = [];

  public propertiesToEdit:string[] = [];

  public editionData:{[propertyName:string]: string|number};

  private updateHelpText:(event:any) => void = event =>
  {
    event.layer.editor._drawnLatLngs.length + 1 < event.layer.editor.MIN_VERTEX ?
    this.helpText = `Click para continuar polígono` :
    this.helpText = `Click en último punto para terminar polígono`;
  };
  
  private onDrawingPolygon: (event:any) => void = event => 
  {
    try
    {
      if( this.featuresToEdit.length )
        this.toggleHighlightingOfLayersToEdit(false);
  
      this.featuresWithinPolygon = GeoJSONHelper.getFeaturesWithinGeometry(
        this.polygon.toGeoJSON(),
        this.selectedFileLayer.file.getContent().features,
        false
      );

      if( ! this.featuresWithinPolygon.length )
        throw new Error("No hay elementos dentro del polígono dibujado.");
  
      this.featuresToEdit = [...this.featuresWithinPolygon];
  
      this.map.flyToBounds(this.polygon.getBounds(), { maxZoom: this.map.getZoom(), duration: .50 });
  
      this.toggleHighlightingOfLayersToEdit(true);
  
      this.map.editTools.stopDrawing();
  
      this.polygon.disableEdit();
    }
    catch(error)
    {
      this.polygon.remove();
      setTimeout(() => this.drawPolygon(), 250);
    }
    finally
    {
      this._changeDetector.detectChanges();
    }
  };

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService
  )
  {
    super();
  }

  get drawingPolygon():boolean
  {
    return this.map.editTools.drawing();
  }
  
  get thereAreFeaturesWithinPolygon():boolean
  {
    return this.featuresWithinPolygon.length > 0;
  }

  get thereAreSelectedFeaturesToEdit():boolean
  {
    return this.featuresToEdit.length > 0;
  }

  get inConfirmationOfProperties():boolean
  {
    return this.inPropertiesEdition === "confirming";
  }

  get featureProperties():Array<string>
  {
    return this.selectedFileLayer ? this.selectedFileLayer.file.enabledFeatureProperties : [];
  }

  get thereAreSelectedPropertiesToEdit():boolean
  {
    return this.propertiesToEdit.length > 0;
  }

  get inEditionOfProperties():boolean
  {
    return this.inPropertiesEdition === "editing";
  }

  get propertiesToEditHaveValues():boolean
  {
    return Object.values(this.editionData).every(value => isset(value));
  }

  public async show():Promise<void>
  {
    try
    {  
      this.fileLayers = this._geojsonLayersService.getProjected();

      this.projectModules = this._geojsonLayersService.getModuleNames("projected");
  
      this.map.doubleClickZoom.disable(); 
      
      const changePolygonColor = event => event.layer.setStyle({color: 'mediumseagreen'}) ;

      this.map.on('editable:drawing:click', this.updateHelpText);
      this.map.on('editable:drawing:commit', this.onDrawingPolygon);
      this.map.on('editable:editing', changePolygonColor);

      await super.show();
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
  }

  public onChangingModuleSelector(moduleName:string):void
  {
    this.selectedModuleName = moduleName;
    this.selectedLayerName = null;
    this.selectedFileLayer = null;
    this.featurePropertyValues = null;
    this.fileLayers = this._geojsonLayersService.getPerModule(this.selectedModuleName, "projected");
  }
  
  public async onChangingLayerSelector(fileLayer:GeoJSONLayer):Promise<void>
  {
    this.selectedFileLayer = fileLayer;

    this.layerHighlighter = new LayerHighlighter([fileLayer]);

    this.featurePropertyValues = fileLayer.file.getFeaturePropertyValues();
  }

  public drawPolygon():void
  {
    this.polygon = this.map.editTools.startPolygon();
    this.helpText = "Haga click en el mapa para iniciar polígono. <br><br> Encierre los elementos que desea editar.";
    this.inEdition  = true;
    this._changeDetector.detectChanges();
  }

  public updateFeaturesToEdit(feature:any):void
  {
    const featureLayer = this.selectedFileLayer.findFeatureLayer(feature.id);

    if( this.featureIsSelected(feature.id) )
    {
      this.featuresToEdit = this.featuresToEdit.filter(_feature => _feature.id !== feature.id );
      this.layerHighlighter.remove(featureLayer);
    }
    else
    {
      this.featuresToEdit = [...this.featuresToEdit, feature];
      this.layerHighlighter.apply(featureLayer);
    }

    this._changeDetector.detectChanges();
  }

  public featureIsSelected(id:number):boolean
  {
    return this.featuresToEdit.some(feature => feature.id === id);
  }

  public showFeaturesConfirmation():void
  {
    this.inPropertiesEdition = null;
    this.propertiesToEdit = [];
  }
 
  public showConfirmationOfProperties():void
  {
    this.inPropertiesEdition = "confirming";
    this.editionData = null;
  }

  public updatePropertiesToEdit(property:string):void
  {
    this.propertyIsSelected(property) ?
    this.propertiesToEdit = this.propertiesToEdit.filter(_property => _property !== property ) :
    this.propertiesToEdit = [...this.propertiesToEdit, property];

    this._changeDetector.detectChanges();
  }

  public propertyIsSelected(name:string):boolean
  {
    return this.propertiesToEdit.some(propertyName => propertyName === name);
  }

  public showEditionOfProperties():void
  {
    this.inPropertiesEdition = "editing";
    
    this.editionData = this.propertiesToEdit.reduce((object, propertyName) => {
      object[propertyName] = null;
      return object;
    }, {});
  }

  public async updateFeatures():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando elementos, por favor espere...");
      this._spinnerService.show();

      await delayExecution(250);

      const geojson = this.selectedFileLayer.file.getContent(false);

      for(const feature of this.featuresToEdit)
      {
        Object.keys(this.editionData).forEach(propertyName => feature.properties[propertyName] = typeValue( this.editionData[propertyName] ));
        const featureIndex = geojson.features.findIndex(_feature => _feature.id === feature.id);
        geojson.features[featureIndex] = feature;
      }

      this.selectedFileLayer.file.updateContent(geojson);
      
      await this._geojsonLayersService.rebuildAndUpdate(this.selectedFileLayer);

      this._toastrService.success("Elementos actualizados.","Exito!");

      this.redraw();

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

  public redraw():void
  {
    this.polygon.remove();

    if( this.featuresToEdit.length )
    {
      this.toggleHighlightingOfLayersToEdit(false);
      this.featuresToEdit = [];
      this.featuresWithinPolygon = [];
      this.inPropertiesEdition = null;
      this.propertiesToEdit = [];
      this.editionData = null;    
      this.drawPolygon();
    }
    else
    {
      this.polygon = null;
      this.map.editTools.stopDrawing();
      this.inEdition = false;
    }    
  }

  private toggleHighlightingOfLayersToEdit(highlight:boolean):void
  {
    this.featuresToEdit.forEach(feature => {

      const featureLayer = this.selectedFileLayer.findFeatureLayer(feature.id);
      
      highlight ?
      this.layerHighlighter.apply(featureLayer) :
      this.layerHighlighter.remove(featureLayer);

    });
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {      
    this.clear();

    this.map.doubleClickZoom.enable();

    this.map.off('editable:drawing:click', this.updateHelpText);
    this.map.off('editable:drawing:commit', this.onDrawingPolygon);
    this.map.off('editable:editing');
    
    await super.hide();
  }

  private clear():void
  {
    if( this.polygon)
    {
      this.polygon.remove();
      this.polygon = null;
      this.map.editTools.stopDrawing();
      this.toggleHighlightingOfLayersToEdit(false);
      this.featuresToEdit = [];
      this.featuresWithinPolygon = [];
      this.inPropertiesEdition = null;
      this.propertiesToEdit = [];
      this.editionData = null;    
      this.inEdition = false;
    }

    this.projectModules = [];
    this.selectedModuleName = null;

    this.layerHighlighter = null;

    this.fileLayers = [];

    if( this.selectedFileLayer )
    {
      this.selectedFileLayer = null;
      this.selectedLayerName = null;
      this.featurePropertyValues = null;
    }
  }

}
