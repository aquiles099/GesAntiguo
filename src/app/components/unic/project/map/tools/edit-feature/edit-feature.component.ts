import { Component, Input, ChangeDetectorRef, Output, EventEmitter, NgZone } from '@angular/core';
import { Map, Layer, LatLng, CircleMarker, Polyline, Polygon, DomUtil } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { delayExecution } from 'src/app/shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { ObjectUtility } from '../../../../../../shared/object-utility';
import { LayerLocator } from '../../../../../../models/unic/leaflet/layer-locator';
import { Subscription } from 'rxjs';
import { GeoJSONFile } from '../../../../../../models/unic/geojson/geojson-file';
import { FeaturePropertyValues } from '../../../../../../interfaces/geojson/i-geojson-file';

@Component({
  selector: 'edit-feature-section',
  templateUrl: './edit-feature.component.html',
  styleUrls: ['./edit-feature.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class EditFeatureComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  public layerLocator:LayerLocator;
  public layerFile:GeoJSONFile;
  public selectedFeature:any;
  private selectedFeatureSubscription:Subscription;

  public featurePropertyValues:FeaturePropertyValues

  public inEdition:boolean = false;

  private onMapClick:(event:any) => void = event => {
    this.layerLocator.onMapClick(event);
    this._changeDetector.detectChanges();
  };

  private onLayerClick:(event:any) => void = event => {
    this.layerLocator.onLayerClick(event);
    this._changeDetector.detectChanges();
  };

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _ngZone:NgZone
  )
  {
    super();
  }

  get selectedLayer():Layer
  {
    return this.layerLocator.selectedLayer;
  }

  get thereArelayersNearTheClick():boolean
  {
    return this.layerLocator.thereArelayersNearTheClick;
  }

  get sortedLayersInPulseRange():Array<any>
  {
    return this.layerLocator.sortedLayersInPulseRange;
  }
 
  get lastClickLatLng():LatLng
  {
    return this.layerLocator.lastClickLatLng;
  }

  public async show():Promise<void>
  {
    this.layerLocator = new LayerLocator(
      this._geojsonLayersService.getProjected(),
      this.map
    );

    this.selectedFeatureSubscription = this.layerLocator.selectedFeatureObservable.subscribe(
      feature => {

        this.selectedFeature = feature
        this.inEdition = this.selectedLayer && ! this.layerLocator.layersInPulseRange.length || this.layerLocator.layersInPulseRange.length === 1;
    
        if( this.selectedLayer )
        {
          this.layerFile = this._geojsonLayersService.findByLayer(this.selectedLayer).file;
          this.featurePropertyValues = this.layerFile.getFeaturePropertyValues();
        }
        else
        {
          this.layerFile = null;
          this.featurePropertyValues = null;
        }

    });

    this.map.on("click", this.onMapClick);

    this._geojsonLayersService.getProjected().forEach(
      fileLayer => fileLayer.layer.on("click", this.onLayerClick)
    );

    DomUtil.addClass(this.map.getContainer(), 'cursor-help');

    await super.show();
  }

  public onSelectLayer(layer:CircleMarker|Polyline|Polygon):void
  {
    this.layerLocator.onSelectLayer(layer);
    this._changeDetector.detectChanges();
  }

  public activateEdition():void
  {
    this.inEdition = true;
    this._changeDetector.detectChanges();
  }

  public async saveChanges():Promise<void>
  {
    this._ngZone.run( async () => {
      try
      {
        this._spinnerService.updateText("Actualizando elemento...");
        this._spinnerService.show();

        await delayExecution(250);
        
        const fileLayer = this._geojsonLayersService.findByLayer( this.layerLocator.selectedLayer );

        fileLayer.file.updateFeature( ObjectUtility.simpleCloning( this.selectedFeature) );

        await this._geojsonLayersService.rebuildAndUpdate(fileLayer);

        fileLayer.layer.on("click", this.onLayerClick);

        this.layerLocator.selectedLayer = null;
        this.selectedFeature = null;
        this.inEdition = false;

        this._toastrService.success("Elemento actualizado.","Exito!");

        if( this.lastClickLatLng )
          this.layerLocator.onMapClick(this.lastClickLatLng);
      }
      catch (error) 
      {
        console.error(error);
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        this._spinnerService.cleanText();
        this._spinnerService.hide();
      }
    });
  }

  public showLayersInPulseRange():void
  {
    this.inEdition = false;
    this.layerLocator.onMapClick( this.lastClickLatLng );
    this._changeDetector.detectChanges();
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.map.off("click", this.onMapClick);

    this._geojsonLayersService.getProjected() .forEach(
      fileLayer => fileLayer.layer.off("click", this.onLayerClick)
    );

    this.layerLocator.deselectLayer();

    this.layerLocator = null;

    this.selectedFeature = null;

    this.layerFile = null;

    this.featurePropertyValues = null;

    this.inEdition = false;

    this.selectedFeatureSubscription.unsubscribe();

    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');
      
    await super.hide();
  }

}
