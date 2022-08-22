import { geoJSON, Layer, GeoJSONOptions, circleMarker, PathOptions, FeatureGroup, LatLng, canvas, CircleMarker, Polyline, Polygon } from 'leaflet';
import {Feature} from 'geojson';
import { GeoJSONFile } from './geojson-file';
import { IGeoJSONFile, GeoJSONFileStatus, GeometryType } from '../../../interfaces/geojson/i-geojson-file';
import { lightenDarkenColor } from '../../../shared/helpers';

interface _PathOptions extends PathOptions
{
  shape:string;
  label:string;
}

interface LayerConstraints
{
  filter:boolean;
  categorization:boolean;
}
export class GeoJSONLayer
{
  public file: GeoJSONFile;
  public layer:FeatureGroup;

  public label:string = null;

  private CustomMarker:any = CircleMarker.extend({
      _updatePath: function ()
      {
        switch( this.options.shape )
        {
            case "square":
              this._renderer._updateSquare(this);
              break;
            case "rectangle":
              this._renderer._updateRectangle(this);
              break;
            case "trapezoid":
              this._renderer._updateTrapezoid(this);
              break;
            case "parallelogram":
              this._renderer._updateParallelogram(this);
              break;
              case "triangle-up":
              this._renderer._updateTriangle(this);
              break;
            case "triangle-right":
              this._renderer._updateTriangleRight(this);
              break;
            case "triangle-left":
              this._renderer._updateTriangleLeft(this);
              break;
            case "triangle-down":
              this._renderer._updateTriangleBottom(this);
              break;
            case "star":
              this._renderer._updateStar(this);
              break;
            default:
              this._renderer._updateCircle(this);
              break;
        }
      }
  });
  
  constructor(
    file:GeoJSONFile|IGeoJSONFile,
    private constraints?:LayerConstraints
  )
  {
    this.file = file instanceof GeoJSONFile ? file : new GeoJSONFile(file);
    this.build();
  }

  /**
   * setters
   */
  
  set setStatus(status:GeoJSONFileStatus)
  {
    this.file.setStatus = status;
  }
  
  set setCategorization(property:string)
  {
    this.file.setCategorization = property;
  }

  /**
   * getters
   */
  
  get layerId():number
  {
    return this.file.layerId;
  }
  
  get fileName():string
  {
    return this.file.name;
  }

  get defaultStyle():_PathOptions
  {    
    return  {
      color: this.file.defaultStyle.color,
      opacity: 1,
      fillColor: lightenDarkenColor(this.file.defaultStyle.color, 30),
      fillOpacity: 0.5,
      weight: this.geometryType === "Point" ? 3 : this.file.defaultStyle.size,
      dashArray: this.geometryType === "Point" ? null : this.file.defaultStyle.shape,
      shape: this.file.defaultStyle.shape,
      label: this.label
    };
  }

  get geometryType():GeometryType
  {
    return this.file.geometryType;
  }

  get isProjected():boolean
  {
    return this.file.isProjected;
  }
  
  get enabled():boolean
  {
    return this.file.enabled;
  }

  get layerName():string
  {
    return this.file.layer_name;
  }
  
  get moduleName():string
  {
    return this.file.module_name;
  }

  /**
   * methods 
   */

  public rebuild(file:GeoJSONFile|IGeoJSONFile):void
  {
    this.file = file instanceof GeoJSONFile ? file : new GeoJSONFile(file);
    this.build();
  }

  public build():void
  {
    const options:GeoJSONOptions = {
      pointToLayer: (feature:Feature, latLng:LatLng) => this.getPointLayer(feature, latLng),
      style: (feature:Feature) => this.getLayerStyle(feature)
    };

    this.layer = geoJSON(this.file.getContent( ! this.constraints || this.constraints.filter ), options);
  }

  public getPointLayer(feature:Feature, latLng:LatLng):any
  {    
    let layer:Layer, 
        category = this.file.getCategoryByFeature(feature),  
        defaultStyle = this.file.defaultStyle;

    if( defaultStyle.shape !== "circle" || category )
    {
      const color = ( ! this.constraints || this.constraints.categorization ) && category ? category.color : defaultStyle.color,
            size = ( ! this.constraints || this.constraints.categorization ) && category ? category.size : defaultStyle.size;

      layer = new this.CustomMarker(latLng, {
        radius: size,
        fillColor: lightenDarkenColor(color, 30),
        color: color
      });
    }
    else
    {
      layer = circleMarker(latLng, {
        radius: defaultStyle.size
      });
    }

    return layer;
  }

  public getLayerStyle(feature):_PathOptions
  {
    const categorization = this.file.categorizationProperty;
    
    let category = this.file.getCategorization().find(category => category.value == feature.properties[categorization]);

    let options:any = {};

    if( ( ! this.constraints || this.constraints.categorization ) && category )
    {
      options = {
        color: category.color,
        weight: feature.geometry.type === "Point" ? 3 : category.size,
        fillColor: lightenDarkenColor(category.color, 30),
        dashArray: feature.geometry.type === "Point" ? null : category.shape,
        dashOffset: '0',
        shape: category.shape,
        label: this.label
      }
    }
    else
    {
      options = this.defaultStyle;
    }

    return options;
  }

  public findFeatureLayer(id:number|string):CircleMarker|Polyline|Polygon
  {
    try 
    {
      let layer = null;
  
      this.layer.eachLayer(_layer => {
  
        if( (_layer as any).feature.id == id)
          layer = _layer;
  
      });

      if( ! layer )
        throw new Error("Capa de elemento no existe.");
  
      return layer;
    } 
    catch (error)
    {
      throw error;  
    }
  }

}
