import { LayerHighlighter } from './layer-highlighter';
import { Polyline, Polygon, LatLng, Layer, Map, CircleMarker } from 'leaflet';
import { Position, point } from '@turf/helpers';
import pointToLineDistance from '@turf/point-to-line-distance';
import { GeoJSONLayer } from '../geojson/geojson-layer';
import { BehaviorSubject, Observable } from 'rxjs';

export class LayerLocator
{  
  private fileLayers:Array<GeoJSONLayer>;
  private map:Map;

  private layerHighlighter:LayerHighlighter;

  public selectedLayer:CircleMarker|Polyline|Polygon;
  private selectedFeatureSubject:BehaviorSubject<any>;
  public selectedFeatureObservable:Observable<any>;

  public layersInPulseRange:Array<CircleMarker|Polyline|Polygon> = [];
  public sortedLayersInPulseRange:any[] = [];

  public thereArelayersNearTheClick:boolean = false;
  
  public clickRangeInMeters:number = 5;

  private _clickOnLayer:boolean = false;

  public lastClickLatLng:LatLng;

  public onMapClick: (event:any) => void = event => {

    if( ! this._clickOnLayer )
    {
      this.deselectLayer();

      this.clearLayersInPulseRange();

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

      this.fileLayers.forEach(fileLayer => {

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
          
          const layerGeometryType = (layer as any).feature.geometry.type;

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
        this.onLayerClick( this.layersInPulseRange[0] );
      }
      else
      {
        this.thereArelayersNearTheClick = this.layersInPulseRange.length > 0;
        
        if( this.thereArelayersNearTheClick )
          this.sortLayersInPulseRange();
      }
    }
    
  };

  public onLayerClick: (event:any) => void = event => {
    this.lastClickLatLng = null;
    this.clearLayersInPulseRange();
    this.onSelectLayer( event instanceof Layer ? event : event.layer);  
    this._clickOnLayer = true;
    setTimeout(() =>  this._clickOnLayer = false, 100);
  };

  constructor(
    fileLayers:Array<GeoJSONLayer>,
    map:Map
  )
  {
    this.fileLayers = fileLayers;
    this.map = map;
    this.layerHighlighter = new LayerHighlighter(fileLayers);

    this.selectedFeatureSubject = new BehaviorSubject(null);
    this.selectedFeatureObservable = this.selectedFeatureSubject.asObservable();
  }

  get isThereLayersNearToTheSelectedLayer():boolean
  {
    return this.layersInPulseRange.length > 0;
  }

  public onSelectLayer(layer:CircleMarker|Polyline|Polygon):void
  {
    this.deselectLayer();

    this.layerHighlighter.apply(layer);

    this.selectedLayer = layer;

    this.selectedFeatureSubject.next( ( this.selectedLayer as any ).feature );

    layer instanceof CircleMarker ?
    this.map.flyTo(layer.getLatLng(), 20, {duration: .50}) :
    this.map.flyToBounds( layer.getBounds(), { maxZoom: 20, duration: .50});
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

        case "Polygon":
        case "MultiPolygon":
          poligons.push(layer)
          break;

        case "LineString":
        case "MultiLineString":
          lines.push(layer);
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
  }

  public deselectLayer():void
  {
    if( this.selectedLayer )
    {
      this.layerHighlighter.remove(  this.selectedLayer );
      this.selectedLayer = null;
      this.selectedFeatureSubject.next( null );
    }     
  }
}