import { getFileContent, parseToArrayBuffer} from '../../../shared/helpers';
import { reproject } from 'reproject';
import { environment } from '../../../../environments/environment';

const shpwrite = require('shp-write');
const shp2geojson = require('shpjs/dist/shp.js');
const JSZip = require('jszip');
const getEPSGCode = require("get-epsg-code");

export class ShapeFile
{
    private file: File;
    private zip: typeof JSZip;

    constructor()
    {
    }

    get getFile():File
    {
        return this.file;
    }

    get getZip(): typeof JSZip
    {
        return this.zip;
    }

    public async fromZip(file:File):Promise<void>
    {
        try {
            
            const jsZip = new JSZip();
          
            await jsZip.loadAsync( await getFileContent(file, "buffer") );

            this.isAValidZip(jsZip);

            this.file = file;

            this.zip = jsZip;

        } catch (error)
        {
            console.error(error);
            throw error;
        }        
    }

    public isAValidZip(jsZip: typeof JSZip):void
    {
        try {
            
            const shpFile =  jsZip.file(/.shp$/i)[0],
                  shxFile =  jsZip.file(/.shx$/i)[0],
                  dbfFile = jsZip.file(/.dbf$/i)[0];
    
            if( ! shpFile || ! shxFile || ! dbfFile)
              throw new Error("Comprimido no valido.");
              
        } catch (error)
        {
            throw error;
        }
    }

    public async fromGeojson(geojson:any):Promise<void>
    {
        const fileName = geojson.name ?? "geojson";

        const zipOptions = {
            types: {
                point: fileName,
                polygon: fileName,
                line: fileName
            }
        };

        const base64 = await shpwrite.zip(geojson, zipOptions);

        const bytes = parseToArrayBuffer(base64, true);

        this.zip = new JSZip();
          
        await this.zip.loadAsync( bytes );

        await this.addProjectionFileInZip(geojson);
        
        const blob = await this.zip.generateAsync({type: "blob"});

        this.file = new File([blob],`${fileName}.zip`,{type: "application/zip"});

    } 

    private async addProjectionFileInZip(geojson:any):Promise<void>
    {
        const fileName = geojson.name ?? "geojson";

        let crs: string = geojson.crs.properties.name;

        let epsgCode = crs.substring((crs.indexOf('EPSG') + 6)); // EPSG::
        
        let proj = await this.getEPSGInAnotherCrsFormat(epsgCode,"wkt");
        
        this.zip.file(`${fileName}.prj`, proj);
    }

    public async toGeojson():Promise<any>
    {
        try{
          
            let geojson = await shp2geojson( await this.file.arrayBuffer() );

            geojson["name"] = this.file.name.split(".")[0];

            const epsgCode = await this.getProjectionToEPSG();

            if( epsgCode && Number.parseInt(epsgCode) !== 4326 )
            {
                const epsgToProj4 = await this.getEPSGInAnotherCrsFormat(epsgCode,"proj4");
      
                // reproyectar geojson a crs que posea comprimido de shape 
                // (la libreria lo proyecta en epsg 4326 por defecto).
                geojson =  reproject(
                    geojson,
                    environment.defaultProj4Crs,
                    epsgToProj4
                );
            }

            console.log(epsgCode);
            
            geojson["crs"] = epsgCode ?  { "type": "name", "properties": { "name": `urn:ogc:def:crs:EPSG::${epsgCode}` } } : null;
  
            return geojson;
            
        } 
        catch (error)
        {
          console.error(error);
          throw error;
        }
    }

    public async getProjectionToEPSG():Promise<string>
    {
        try
        {
            const prjFile = this.zip.file(/.prj$/i)[0];
    
            const wkt = await prjFile.async("text");

            return prjFile ? getEPSGCode( wkt ) : null;
        } 
        catch (error)
        {
            return null;
        }
    }

    private getEPSGInAnotherCrsFormat(code:number|string, format:string):Promise<any>
    {
      return fetch(`//epsg.io/${code}.${format}`)
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
}