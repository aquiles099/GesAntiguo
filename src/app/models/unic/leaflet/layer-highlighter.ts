import { CircleMarker, Polyline, Polygon} from 'leaflet';
import { GeoJSONLayer } from '../geojson/geojson-layer';
import { lightenDarkenColor } from '../../../shared/helpers';

export class LayerHighlighter
{
  constructor(
    private fileLayers:Array<GeoJSONLayer>
  )
  {}

  public apply(layer:any):void
  {    
    layer instanceof CircleMarker ?
    this.highlightPoint(layer) :
    this.highlightPolyline(layer);
  }

  public remove(layer:any):void
  {
    layer instanceof CircleMarker ?
    this.opaquePoint(layer) :
    this.opaquePolyline(layer);
  }

  private highlightPoint(layer:CircleMarker):void
  {
    layer.setStyle({
          color: '#ffff00',
          fillColor: lightenDarkenColor('#ffff00', 30),
          weight: layer.options.weight * 2
        })
        .setRadius( layer.getRadius() * 2 );
  }

  private highlightPolyline(layer:Polyline|Polygon):void
  {
    layer.setStyle({
      stroke: true,
      color: '#ffff00',
      fillColor: lightenDarkenColor('#ffff00', 30),
      weight: layer.options.weight * 2
    });
  }

  private opaquePoint(layer:CircleMarker):void
  {
    const fileLayer = this.fileLayers.find(fileLayer => fileLayer.layer.hasLayer(layer));

    const styleOption = fileLayer.getLayerStyle(layer.feature);
    layer.setStyle(styleOption);
    
    let category = fileLayer.file.hasCategorization ? 
    fileLayer.file.getCategoryByFeature(layer.feature) : null;  

    layer.setRadius( category ? category.size : fileLayer.file.defaultStyle.size );
  }

  private opaquePolyline(layer:Polyline|Polygon):void
  {
    const fileLayer = this.fileLayers.find(fileLayer => fileLayer.layer.hasLayer(layer));

    const styleOption = fileLayer.getLayerStyle(layer.feature);

    layer.setStyle(styleOption);
  }
}