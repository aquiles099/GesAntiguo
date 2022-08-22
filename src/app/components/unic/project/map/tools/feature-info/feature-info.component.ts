import { Component, Input, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Map, Layer, CircleMarker, Polyline, Polygon, LatLng, DomUtil, Marker } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import pointToLineDistance from "@turf/point-to-line-distance"
import {point, Position} from "@turf/helpers"
import { LayerHighlighter } from '../../../../../../models/unic/leaflet/layer-highlighter';

@Component({
  selector: 'feature-info-section',
  templateUrl: './feature-info.component.html',
  styleUrls: ['./feature-info.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class FeatureInfoComponent extends HideableSectionComponent 
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private selectedLayer:CircleMarker|Polygon|Polyline;

  private layerHighlighter:LayerHighlighter;

  public layersInPulseRange:Array<CircleMarker|Polygon|Polyline> = [];
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
        this.layerHighlighter.remove( this.selectedLayer );
        this.selectedLayer = null;
        this.featureProperties = [];
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

          if( layer instanceof Polyline || layer instanceof Polygon )
          {
            switch( layerGeometryType )
            {
              case "MultiLineString":
                isInRange = layer.toGeoJSON().geometry.coordinates.some( _latlngs => polygonIsInClickRange(_latlngs, _point));
                break;

              case "MultiPolygon":
                isInRange = layer.toGeoJSON().geometry.coordinates.some( _latlngsGroup => {

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
                isInRange = layer.getLatLng().distanceTo( event instanceof LatLng ? event : event.latlng ) <= this.clickRangeInMeters;
                break;

              case "LineString":
                isInRange = pointToLineDistance( _point, (layer.toGeoJSON() as any), {units: "meters"} ) <= this.clickRangeInMeters;
                break;

                case "Polygon":
                isInRange = layer.toGeoJSON().geometry.coordinates.some( _latlngs => polygonIsInClickRange(_latlngs, _point));
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
    this._changeDetector.detectChanges();
    this._clickOnLayer = true;
    this.clearLayersInPulseRange();
    this.onSelectLayer( event instanceof Layer ? event : event.layer);  
    setTimeout(() =>  this._clickOnLayer = false, 100);
  };

  public featureProperties:string[] = [];

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService
  )
  {
    super();
  }

  get selectedFeature():any
  {
    return this.selectedLayer ? this.selectedLayer.feature : null;
  }

  get isThereLayersNearToTheSelectedLayer():boolean
  {
    return this.layersInPulseRange.length > 0;
  }

  public async show():Promise<void>
  {
    DomUtil.addClass(this.map.getContainer(), 'cursor-help');

    this.map.on("click", this.onMapClickClosure);

    this._geojsonLayersService
        .getProjected()
        .forEach(
          fileLayer => fileLayer.layer.on("click", this.onLayerClickClosure)
        );

    this.layerHighlighter = new LayerHighlighter( this._geojsonLayersService.getProjected() );

    await super.show();
  }

  public onSelectLayer(layer:CircleMarker|Polygon|Polyline):void
  {    
    if(this.selectedLayer)
      this.layerHighlighter.remove( this.selectedLayer );

    this.layerHighlighter.apply( layer );

    this.selectedLayer = layer;

    this.featureProperties = this._geojsonLayersService.findByLayer(layer).file.enabledFeatureProperties;
    
    layer instanceof CircleMarker ?
    this.map.flyTo( layer.getLatLng(), 20, {duration: .25}) :
    this.map.flyToBounds( layer.getBounds(), { maxZoom: 20, duration: .25});

    this._changeDetector.detectChanges();
  }

  public sortLayersInPulseRange():void
  {
    let points = [], lines = [],  poligons = [];

    this.layersInPulseRange.forEach(layer => {

      switch( layer.feature.geometry.type )
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
      this.layerHighlighter.remove( this.selectedLayer );
      this.selectedLayer = null;
    }
    
    this.layersInPulseRange = [];
    this.sortedLayersInPulseRange = [];
    this.thereArelayersNearTheClick = false;
    this.lastClickLatLng = null;
    this.layerHighlighter = null;

    this.featureProperties = [];
      
    await super.hide();

    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    this._changeDetector.detectChanges();
  }

}
