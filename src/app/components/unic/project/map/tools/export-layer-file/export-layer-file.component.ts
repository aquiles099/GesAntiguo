import { Component, Output, EventEmitter, ViewChild } from '@angular/core';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { GeoJSONFile } from '../../../../../../models/unic/geojson/geojson-file';
import { GeoJSONLayer } from '../../../../../../models/unic/geojson/geojson-layer';
import { GeojsonReprojectorService } from '../../../../../../services/unic/geojson-reprojector.service';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { parseToArrayBuffer } from '../../../../../../shared/helpers';
import { delayExecution } from 'src/app/shared/helpers';
import { ProjectsService } from '../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../services/unic/project.service';
import { NgForm } from '@angular/forms';

import tokml from "geojson-to-kml";
import saveAs from 'file-saver';
import { XLSX } from '../../../../../../models/unic/geojson/xlsx';

@Component({
  selector: 'export-layer-file-section',
  templateUrl: './export-layer-file.component.html',
  styleUrls: ['./export-layer-file.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class ExportLayerFileComponent extends HideableSectionComponent
{
  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  public modules:string[] = []; 

  public fileLayers:GeoJSONLayer[] = [];
  public file:GeoJSONFile;

  @ViewChild(NgForm)
  private form:NgForm;

  public formData:any = {
    moduleName:null,
    layerName:null,
    format:null,
    projection:null
  };
  
  public formats = [
    "geojson",
    // "shape",
    "kml",
    "xlsx",
    "dxf"
  ];

  public availableProjections:any[] = [];
  
  constructor(
    private _geojsonLayersService:GeojsonLayersService,
    private _geojsonReprojectorService:GeojsonReprojectorService,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService,
    private _projectsService:ProjectsService,
    private _projectService:ProjectService
  )
  {
    super();
  }

  public async show():Promise<void>
  {
    try
    {
      this._spinnerService.show();
      
      await delayExecution(250);

      this.availableProjections = (await this._geojsonReprojectorService.getAvailableProjections() ).datos.proyecciones.map(projection => projection.id);
      
      this.modules = this._geojsonLayersService.getModuleNames("enabled");
  
      await super.show();
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  public onChangeModuleSelector():void
  {
    this.file = null;    
    this.formData.layerName = null;
    this.fileLayers = this._geojsonLayersService.getPerModule(this.formData.moduleName,"enabled");    
  }
  
  public onChangeFileLayerSelect(fileLayer:GeoJSONLayer):void
  {
    this.file = fileLayer.file;    
  }

  public onChangeFormatSelector(format:string):void
  {
    if(format === "kml")
      this.formData.projection = 4326;
  }

  public async onSubmit():Promise<void>
  {
    try {
    
      this._spinnerService.updateText("Exportando archivo...");
      this._spinnerService.show();
      
      await delayExecution(250);

      const geojson = await this.reprojectFileContentAndReturn();

      let file = null;
  
      switch( this.formData.format )
      {
        case "geojson":
          file = new File([ parseToArrayBuffer(geojson) ], `${this.file.layer_name}.geojson`, { type: "application/geo+json"});
          break;
  
        case "shape":
          // file = new File([ shape ], `${this.file.layer_name}.zip`, { type: "application/zip"});
          break;
      
        case "kml":
          const kml = await tokml(geojson,{
            documentName: this.file.layer_name,
            name: this.file.layer_name,
            description: 'description',
            timestamp: Date.now().toString()
          });
          file = new File([ parseToArrayBuffer(kml) ], `${this.file.layer_name}.kml`, { type: "application/vnd.google-earth.kml+xml"});
          break;
      
        case "xlsx":
          await XLSX.fromGeojson(geojson);
          return;
        
        case "dxf":

          const apiResponse = (await this._projectsService.consultarApi({
            funcion: "web_transformar_dxf",
            id_proyecto: this._projectService.project.id_proyecto,
            nombre: this.file.layer_name,
            features: geojson.features
          })).datos;

          const dxf = await (await fetch(apiResponse.url)).text();

          file = new File([ parseToArrayBuffer(dxf) ], `${this.file.layer_name}.dxf`, { type: "application/dxf"});
          break;
      }

      await saveAs(file);   

    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error("Hubo un error al exportar archivo. por favor intente de nuevo.","Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  private async reprojectFileContentAndReturn():Promise<any>
  {
    let crsCode = this.availableProjections.find(crsCode => crsCode === this.formData.projection);

    let geojson;

    if( crsCode === 4326)
    {
      geojson = this.file.getContent();
    }
    else
    {
      const proj4 = await this._geojsonReprojectorService.getProj4OfEPSG(crsCode);

      geojson = this._geojsonReprojectorService.reproject( 
        this.file.getContent(),
        this._geojsonReprojectorService.defaultCrs,
        proj4
      );
    }

    if( ! geojson.crs )
    {
      geojson.crs = {
        properties: {
          name: null
        }
      }; 
    }

    geojson.name = this.file.layer_name;

    geojson.crs.properties.name = `urn:ogc:def:crs:EPSG::${crsCode}`;  

    // remover campo ID (el cual es añadido internamente cuando se configura la capa).
    geojson.features.forEach(feature => delete feature.properties.ID); 

    return geojson;
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.form.reset();
    this.file = null;
    this.availableProjections = [];
    
    await super.hide();
  }
}
