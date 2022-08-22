import { Component, Input, ChangeDetectorRef, Output, EventEmitter, NgZone, ViewChild } from '@angular/core';
import { Map, Layer, CircleMarker, Polyline, Polygon, LatLng, Marker, DomUtil } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import pointToLineDistance from "@turf/point-to-line-distance"
import {point, Position} from "@turf/helpers"
import { delayExecution } from 'src/app/shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { LayerHighlighter } from '../../../../../../models/unic/leaflet/layer-highlighter';
import { GeojsonLayerImagesService } from '../../../../../../services/unic/geojson-layer-images.service';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'remove-feature-section',
  templateUrl: './remove-feature.component.html',
  styleUrls: ['./remove-feature.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class RemoveFeatureComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private layerHighlighter:LayerHighlighter;

  public selectedLayer:CircleMarker|Polyline|Polygon;

  public layersInPulseRange:Array<CircleMarker|Polyline|Polygon> = [];
  public sortedLayersInPulseRange:any[] = [];
  public thereArelayersNearTheClick:boolean = false;

  public clickRangeInMeters:number = 5;

  private _clickOnLayer:boolean = false;

  public lastClickLatLng:LatLng;

  public onMapClickClosure: (event:any) => void = event => {

    if( ! this._clickOnLayer )
    {
        if(this.selectedLayer)
        {
          this.layerHighlighter.remove(this.selectedLayer);
          this.selectedLayer = null;
        }

      this.layersInPulseRange = [];
      this.sortedLayersInPulseRange = [];

      const polygonIsInClickRange = (_latlngs, _point) => {

        if(_latlngs)
        {
          const lineFeature = new Polyline(_latlngs).toGeoJSON();
          lineFeature.geometry.coordinates = (lineFeature.geometry.coordinates as Position[]).map(_latlng => [_latlng[1], _latlng[0]]);
          return pointToLineDistance( _point, (lineFeature as any), {units: "meters"} ) <= this.clickRangeInMeters;
        }
        else
        {
          return false;
        }
        
      };

      this._geojsonLayersService.getProjected().forEach(fileLayer => {

        fileLayer.layer.eachLayer((layer:CircleMarker|Polyline|Polygon) => {

          let isInRange = false, _point;

          if( event instanceof LatLng )
          {
            _point = point([event.lng, event.lat]);
          }
          else
          {
            this.lastClickLatLng = event.latlng;
            _point = point([event.latlng.lng, event.latlng.lat]);
          }
          
          const layerGeometryType = layer.feature.geometry.type;

          if( layerGeometryType.includes("Multi") )
          {
            switch( layerGeometryType )
            {
              case "MultiLineString":
                isInRange = (layer as Polygon).toGeoJSON().geometry.coordinates.some( _latlngs => polygonIsInClickRange(_latlngs, _point));
                break;

              case "MultiPolygon":
                isInRange = (layer as Polygon).toGeoJSON().geometry.coordinates.some( _latlngsGroup => {

                  return _latlngsGroup.some( _latlngs => polygonIsInClickRange(_latlngs, _point));

                });
                break;              
            }

          }
          else
          {
            switch( layerGeometryType )
            {
              case "Point":
                isInRange = (layer as CircleMarker).getLatLng().distanceTo( event instanceof LatLng ? event : event.latlng ) <= this.clickRangeInMeters;
                break;

              case "LineString":
                isInRange = pointToLineDistance( _point, ((layer as Polyline).toGeoJSON() as any), {units: "meters"} ) <= this.clickRangeInMeters;
                break;

                case "Polygon":
                isInRange = (layer as Polygon).toGeoJSON().geometry.coordinates.some( _latlngs => polygonIsInClickRange(_latlngs, _point));
                break;
            }
          
          }

          if( isInRange )
            this.layersInPulseRange.push(layer);

        });

      });

      if( this.layersInPulseRange.length === 1 )
      {
        this.onLayerClickClosure( this.layersInPulseRange[0] );
      }
      else
      {
        this.thereArelayersNearTheClick = this.layersInPulseRange.length > 0;
        
        if( this.thereArelayersNearTheClick )
          this.sortLayersInPulseRange();
  
        this._changeDetector.detectChanges();
      }
    }
    
  };

  public onLayerClickClosure: (event:any) => void = event => {
    this.lastClickLatLng = null;
    this.clearLayersInPulseRange();
    this.onSelectLayer(event instanceof Layer ? event : event.layer);  
    this._clickOnLayer = true;
    setTimeout(() =>  this._clickOnLayer = false, 100);
  };

  @ViewChild(ModalDirective)
  public confirmationModal:ModalDirective;

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService,
    private _geojsonLayerImagesService:GeojsonLayerImagesService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _ngZone:NgZone
  )
  {
    super();
  }

  get isThereLayersNearToTheSelectedLayer():boolean
  {
    return this.layersInPulseRange.length > 0;
  }

  public async show():Promise<void>
  {
    this.map.on("click", this.onMapClickClosure);

    this._geojsonLayersService
        .getProjected()
        .forEach(
          fileLayer => fileLayer.layer.on("click", this.onLayerClickClosure)
        );

    this.layerHighlighter = new LayerHighlighter( this._geojsonLayersService.getProjected() );

    DomUtil.addClass(this.map.getContainer(), 'cursor-help');

    await super.show();
  }

  public onSelectLayer(layer:CircleMarker|Polyline|Polygon):void
  {
    if(this.selectedLayer)
      this.layerHighlighter.remove(this.selectedLayer);

    this.layerHighlighter.apply(layer);

    this.selectedLayer = layer;

    layer instanceof CircleMarker ?
    this.map.flyTo( layer.getLatLng(), 20, {duration: .50}) :
    this.map.flyToBounds( layer.getBounds(), { maxZoom: 20, duration: .50});

    this._changeDetector.detectChanges();
  }

  public sortLayersInPulseRange():void
  {
    let points = [], lines = [],  poligons = [];

    this.layersInPulseRange.forEach(layer => {

      switch( (layer as any).feature.geometry.type )
      {
        case "Point":
          points.push(layer);
          break;

        case "LineString":
        case "MultiLineString":
          lines.push(layer);
          break;
          
        case "Polygon":
        case "MultiPolygon":
          poligons.push(layer)
          break;
      }

    });

    points = points.map((layer, index) => { return { name: `Punto ${index + 1}`, layer: layer }});
    lines = lines.map((layer, index) => { return { name: `Linea ${index + 1}`, layer: layer }});
    poligons = poligons.map((layer, index) => { return { name: `Polígono ${index + 1}`, layer: layer }});

    this.sortedLayersInPulseRange = [...points, ...lines, ...poligons];
  }

  public async removeSelectedFeature():Promise<void>
  {
    this._ngZone.run( async () => {

      try
      {
        this.confirmationModal.hide();
        
        this._spinnerService.updateText("Removiendo elemento...");
        this._spinnerService.show();

        await delayExecution(250);

        const fileLayer = this._geojsonLayersService.findByLayer( this.selectedLayer );

        await this.removeFeatureImages( fileLayer.layerId );

        fileLayer.file.deleteFeatures([ (this.selectedLayer as any).feature.id ]);

        await this._geojsonLayersService.rebuildAndUpdate(fileLayer);

        fileLayer.layer.on("click", this.onLayerClickClosure);

        this.selectedLayer = null;

        this._toastrService.success("Elemento eliminado.","Exito!");

        if( this.lastClickLatLng )
          this.onMapClickClosure(this.lastClickLatLng);
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

  private async removeFeatureImages(layerId:number):Promise<void>
  {
    const layerImageGallery = await this._geojsonLayerImagesService.find(layerId);

    if( layerImageGallery )
    {
      const {feature} = this.selectedLayer;

      const featureImageCollectionIndex = layerImageGallery.features.findIndex(record => record.id === feature.id);

      if( featureImageCollectionIndex !== -1 )
      {
        layerImageGallery.features.splice( featureImageCollectionIndex, 1 );
        await this._geojsonLayerImagesService.update(layerImageGallery);
      }
    }

  }

  public clearLayersInPulseRange():void
  {
    this.layersInPulseRange = [];
    this.sortedLayersInPulseRange = [];
    this.thereArelayersNearTheClick = false;
    this._changeDetector.detectChanges();
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.map.off("click", this.onMapClickClosure);

    this._geojsonLayersService
        .getProjected()
        .forEach(
          fileLayer => fileLayer.layer.off("click", this.onLayerClickClosure)
        );

    if( this.selectedLayer )
    {
      this.layerHighlighter.remove(  this.selectedLayer );
      this.selectedLayer = null;
    }

    this.layerHighlighter = null;
    this.layersInPulseRange = [];
    this.sortedLayersInPulseRange = [];
    this.thereArelayersNearTheClick = false;
    this.lastClickLatLng = null;

    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');
      
    await super.hide();

    this._changeDetector.detectChanges();
  }
}
