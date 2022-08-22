import { getFileContent } from 'src/app/shared/helpers';
import { getFileName } from '../../../shared/helpers';
import { GeoJSONHelper } from '../../geojson-helper';

const xlsx2json = require('xlsx');
const json2xlsx = require('json-as-xlsx');

export class XLSX
{
    public static async toGeojson(file:File):Promise<any>
    {
      const binary = await getFileContent(file,"binary");

      const workbook = xlsx2json.read(binary, {type:"binary"});

      let worksheet = workbook.Sheets[ workbook.SheetNames[0] ];
      
      const rows = xlsx2json.utils.sheet_to_json(worksheet, { raw: true });

      const features = rows.map(row => {

        let feature = {
          type: "Feature",
          properties: {},
          geometry: GeoJSONHelper.stringToGeometry(row.geom)
        };

        delete row.geom;

        for( let [property, value] of Object.entries(row))
        {
          feature.properties[property] = value === "-" ? null : value;
        }
  
        return feature;
      })

      return {
          type: "FeatureCollection",
          name: getFileName(file),
          features: features
      };
    }

    public static async fromGeojson(geojson:any):Promise<void>
    {  
      const rows = geojson.features.map(feature => {
  
        feature["geom"] = GeoJSONHelper.geometryToString(feature.geometry);
  
        delete feature.geometry;
        delete feature.id;
        delete feature.type;
        delete feature.properties["ID"];
  
        if( Object.keys(feature.properties).length )
        {
          for(let [key, value] of Object.entries(feature.properties) )
          {
            feature[key] = value ?? "-";
          }
  
          delete feature.properties;
        }
  
        return feature;
      });
    
      let data = [
        {
          sheet: geojson.name ?? "geojson",
          columns: Object.keys(rows[0]).map(key => {
            return{ label: key, value: key };
          }),
          content: rows
        }
      ];
      
      let settings = {
        fileName: geojson.name ?? "geojson",
        extraLength: 3, 
        writeOptions: {} 
      };
      
      json2xlsx(data, settings);
    }
  
}