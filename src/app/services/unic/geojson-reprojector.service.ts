import { Injectable } from '@angular/core';
import { getFileContent, isJsonString } from '../../shared/helpers';
import { reproject } from 'reproject';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthenticatedUserService } from '../authenticated-user.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GeojsonReprojectorService
{
  public apiUrl = "//epsg.io/"; 

  public defaultCrs:string;  

  private paramsFormatter:(data:{[key:string]:string|number}) => string = 
  params =>  'datos='+ encodeURIComponent( JSON.stringify(params) );

  constructor(
    private http:HttpClient,
    private _authenticatedUserService:AuthenticatedUserService
  )
  {
    this.defaultCrs = environment.defaultProj4Crs;
  }

  public async getAvailableProjections():Promise<any>
  {
    const data = {
      funcion: "web_exportar_informacion",
      tipo: "web",
      usuario: this._authenticatedUserService.user.usuario,
      clave_sesion: this._authenticatedUserService.user.clave_sesion,
      plugin: 'SMART-GIS UNIC'
    };

    return this.http
                .post(
                  environment.apiUrl, 
                  this.paramsFormatter(data),{
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                  }
                })
                .pipe(
                  map((data:any) => {
                    
                    if( data.error)
                      throw new Error(data.msg_error)
                    
                    return data;
                  })
                )
                .toPromise();  
  }

  public async apply(data: File|any): Promise<any>
  {
      try {

          let geojson = data instanceof File ? await getFileContent(data) : JSON.stringify(data);
  
          if ( ! isJsonString(geojson) )
              throw new Error(`El archivo no es un GeoJSON valido.`);

          geojson = await this.reprojectIsRequiredAndReturn(geojson);
          
          return geojson;
                  
      } catch (error) {
          
          throw error;
      }
  }
  
  public async reprojectIsRequiredAndReturn(geojson: any): Promise<any>
  {
      try {

          if( typeof geojson === "string" )  
            geojson = JSON.parse(geojson);
                    
          const epsgCode = this.getCrsEpsgCode(geojson);

          if( epsgCode !== 4326 )
          {
            const epsgToProj4 = await this.getProj4OfEPSG(epsgCode);
            geojson = this.reproject(geojson, epsgToProj4);
            geojson.crs.properties.name = "urn:ogc:def:crs:EPSG::4326";            
          }
      }
      catch (error)
      {
          geojson.crs = null;
      }
      finally
      {
        return geojson;
      }
  }

  public getCrsEpsgCode(geojson:any):number
  {
    try {
      
      if( ! geojson.crs )
        throw new Error("CRS indefinido.");
  
      let crsName:string = geojson.crs.properties.name;
  
      if( ! crsName.includes("CRS84") && ! crsName.includes("EPSG") )
        throw new Error("CRS invalido.");

      return crsName.includes("CRS84") ? 4326 : Number( crsName.substring((crsName.indexOf('EPSG') + 6) ));

    }
    catch (error)
    {
      throw error;  
    }

  }

  public getProj4OfEPSG(code:number):Promise<string>
  {
    return fetch(`${this.apiUrl + code}.proj4`)
                .then( (response:Response) =>  response.body)
                .then( body =>  {
                  
                  const reader = body.getReader();

                  return new ReadableStream({
                    start(controller) {

                      function push() {

                        reader.read().then(({ done, value }) => {

                          if (done)
                          {
                            controller.close();
                            return;
                          }

                          controller.enqueue(value);

                          push();

                        });

                      }

                      push();
                    }
                  });

                })
                .then(stream => new Response(stream, { headers: { "Content-Type": "text/html" } }).text());  
    }

    public reproject(geojson:any, fromProj4:string, toProj4?:string):any
    {
        return  reproject(
            geojson,
            fromProj4,
            toProj4 ?? this.defaultCrs
        );
    }
      
}
