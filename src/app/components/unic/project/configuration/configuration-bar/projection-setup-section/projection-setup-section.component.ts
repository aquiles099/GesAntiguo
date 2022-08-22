import { Component, Input, EventEmitter, Output, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { LayerStyleConfigurationModalComponent } from './layer-style-configuration-modal/layer-style-configuration-modal.component';
import { Map, geoJSON, TileLayer, FeatureGroup, LatLng } from 'leaflet';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { delayExecution, showPreconfirmMessage, getFileContent } from 'src/app/shared/helpers';
import { GeojsonReprojectorService } from '../../../../../../services/unic/geojson-reprojector.service';
import { ToastrService } from 'ngx-toastr';
import { checkIfTheFileExtensionIsCorrect, getFileExtension, getFileName } from '../../../../../../shared/helpers';
import { ShapeFile } from '../../../../../../models/unic/geojson/shape-file';
import swal from 'sweetalert2';
import { GeoJSONLayer } from '../../../../../../models/unic/geojson/geojson-layer';
import { ProjectService } from '../../../../../../services/unic/project.service';
import { GeometryType } from '../../../../../../interfaces/geojson/i-geojson-file';
import { GeoJSONHelper } from '../../../../../../models/geojson-helper';
import { LayerStyle, POINT_COLOR, POLYLINE_COLOR } from '../../../../../../interfaces/geojson/layer-style';
import { Feature } from 'geojson';
import { LayerInfo } from '../configuration-bar.component';
import { kml } from "@tmcw/togeojson";
import { XLSX } from "../../../../../../models/unic/geojson/xlsx";
@Component({
  selector: 'projection-setup-section',
  templateUrl: './projection-setup-section.component.html',
  styleUrls: ['./projection-setup-section.component.css','../configuration-bar.component.css']
})
export class ProjectionSetupSectionComponent extends HideableSectionComponent
{
  @Input()
  public isCollapsed:boolean;

  @Input()
  private map:Map;
  
  @Input()
  public projections:any;
  
  @Input()
  public modules:any[] = [];

  @Input()
  public fileNames:Array<string>;

  public fileLayer:GeoJSONLayer;
  public layerDefaultStyle:LayerStyle;

  private layer:FeatureGroup;
  private geojson:any;

  public selectedCrs:number;

  public inConfirmationOfProjection:boolean = false;

  @ViewChild(LayerStyleConfigurationModalComponent)
  public LayerStyleConfigurationModal:LayerStyleConfigurationModalComponent;

  @Output()
  public configureLayer:EventEmitter<GeoJSONLayer> = new EventEmitter;

  constructor(
    private _spinnerService: SpinnerService,
    private _geojsonReprojectorService:GeojsonReprojectorService,
    private _toastr:ToastrService,
    private _projectService:ProjectService,
  )
  {
    super();
  }

  public async show():Promise<void>
  {
    this._spinnerService.updateText("Removiendo capas...");
    this._spinnerService.show();
    
    await delayExecution(250);

    this.map.eachLayer(layer => layer instanceof TileLayer || this.map.removeLayer(layer) );

    this._spinnerService.hide();

    await super.show(); 
  }

  public getAvailableCrs():Array<any>
  {
    return Object.values(this.projections).map((projection:any) => projection.id_proyeccion);
  }

  public async onSelectLayerFile(event:any, layerInfo?:LayerInfo):Promise<void>
  {
    try {
      
      const file:any = event.target.files[0];

      if( ! file )
        return;

      this._spinnerService.updateText("Cargando archivo de capa...");
      this._spinnerService.show();

      await delayExecution(250);

      if( ! checkIfTheFileExtensionIsCorrect([file], ["geojson","zip","kml","xlsx"]) )
        throw new Error("El archivo no es un geojson valido, por favor intente de nuevo.");

      const thereAreSomeFileWithTheSameName = this.fileNames.filter(name => ! this.fileLayer || name !== this.fileLayer.fileName)
                                                            .includes( getFileName(file) );

      if( thereAreSomeFileWithTheSameName )
        throw new Error("Ya hay una archivo de capa con el mismo nombre.");
        
      let fileContent = await this.getFileContent(file);

      const layerGeometryType = layerInfo ? layerInfo.geometry : this.fileLayer.geometryType;

      this.checkIfTheFeatureGeometryAreAllowedForTheLayer(fileContent.features, layerGeometryType);

      this.checkIfTheNumberOfFeaturePropertiesIsValid( fileContent );

      let geojsonCrsEpsgCode = this.getCrsEpsgCodeOfGeojson(fileContent);

      if( geojsonCrsEpsgCode )
      {
        await this.checkIfTheGeojsonIsInTheAllowedRange(fileContent);
        this.inConfirmationOfProjection = false;
      }
      else
      {
        this._spinnerService.hide();

        await swal.fire({
          title: 'Archivo sin CRS.',
          text: `El archivo sera reproyectado a crs EPSG:4326 para que luego confirme si es visible en el mapa y,
           de no ser visible, intente mostrarlo con las proyecciones que se muestran en el listado.`,
          showCancelButton: false,
          icon: "info",
          confirmButtonText: 'Aceptar'
        });
        
        this.inConfirmationOfProjection = true;

        geojsonCrsEpsgCode = 4326;

        this._spinnerService.show();

        await delayExecution(250);
      }

      const layerDefaultStyle = {
        shape: layerGeometryType === "Point" ? "circle" : "0",
        color: layerGeometryType === "Point" ? POINT_COLOR : POLYLINE_COLOR,
        size: layerGeometryType === "Point" ? 6 : 3
      };

      this.fileLayer = new GeoJSONLayer({
        name: getFileName(file),
        layer_id: layerInfo ? layerInfo.id : this.fileLayer.layerId,
        layer_name: layerInfo ? layerInfo.name : this.fileLayer.layerName,
        module_name: layerInfo ? layerInfo.moduleName : this.fileLayer.moduleName,
        geometry_type: layerGeometryType,
        content: fileContent,
        default_style: layerDefaultStyle,
        feature_property_values: {},
        disabled_feature_properties: [],
        feature_filter: {},
        feature_property_categories: {},
        categorization: null,
        status: "projected",
        enabled: true,
        feature_pdf_export_templates: {
          sheet: [],
          listing: [],
        },
        planimetry_templates: [],
        planimetry_boxes: [],
        generatedPlanesNumber: 0
      });
    
      await this.projectFileLayer(geojsonCrsEpsgCode);

        this.map.flyToBounds(
          this.inConfirmationOfProjection ? (this._projectService.bbox as any) : this.layer.getBounds(),
          {maxZoom: 15, duration: 0.25}
        );

    } 
    catch (error) 
    {
      console.error(error);      
      this._toastr.error(error.message, "Error");
      throw error;
    }
    finally
    {
      event.target.value = null;
      this._spinnerService.hide();
      this._spinnerService.cleanText(); 
    }

  }

  private async getFileContent(file:File):Promise<any>
  {
    let content;

    switch (getFileExtension(file))
    {
      case "geojson":
        content = JSON.parse( await getFileContent(file));
        break;

      case "zip":
        const shapeFile = new ShapeFile();
        await shapeFile.fromZip(file);
        content = await shapeFile.toGeojson();
        break;

      case "kml":
        const xml = await getFileContent(file);
        content = kml(new DOMParser().parseFromString(xml, "text/xml"));
        break;

      case "xlsx":
        content = await XLSX.toGeojson(file);
        break;
    }

    GeoJSONHelper.removeInvalidFeatures(content);
    GeoJSONHelper.removeDepthInFeatures(content.features);

    return content;
  }

  private checkIfTheFeatureGeometryAreAllowedForTheLayer(features:any[], geometryType:GeometryType):void
  {
    try 
    {
      const featureGeometryIsAllowed = features.every(feature => GeoJSONHelper.matchFeatureGeometryType(feature, geometryType));

      if( ! featureGeometryIsAllowed )
        throw new Error("El archivo que intenta cargar tiene elementos con geometría distinta a la permitida por la capa.");
    }
    catch (error)
    {
      throw error;      
    }
  }

  private async checkIfTheGeojsonIsInTheAllowedRange(data:any):Promise<void>
  {
    try
    {
      // reproyectar geojson a epsg:4326 si es requerido para poder evaluar
      // si hay elementos fuera del rango del municipio.
      const geojson = await this._geojsonReprojectorService.apply(data);
      
      const featuresAreWithinTheMunicipality = this._projectService.checkIfTheFeaturesAreWithinTheMunicipality( geojson.features );

      if( ! featuresAreWithinTheMunicipality )
        throw new Error("El archivo que intenta cargar tiene elementos fuera del rango del municipio.");
    } 
    catch (error)
    {
      throw error;
    }
  }

  private checkIfTheNumberOfFeaturePropertiesIsValid(fileContent:any):void
  {
    try
    {
      if(Object.keys(fileContent.features[0].properties).length > 50)
        throw new Error("El número de atributos por elemento excede el permitido (50)");
    }
    catch(error)
    {
      throw error;
    }
  }

  private getCrsEpsgCodeOfGeojson(fileContent:any):number
  {
    try
    {
      return this._geojsonReprojectorService.getCrsEpsgCode(fileContent);
    }
    catch(error)
    {
      return null;
    }
  }

  public async setFileLayerAndProject(fileLayer:GeoJSONLayer):Promise<void>
  {
    this.fileLayer = fileLayer;

    this.layerDefaultStyle = this.fileLayer.file.defaultStyle;

    const fileLayerCrs = this._geojsonReprojectorService.getCrsEpsgCode(fileLayer.file.getContent(false));

    await this.projectFileLayer(fileLayerCrs);

    this.map.flyToBounds(this.layer.getBounds() ,{maxZoom: 15, duration: 0.5});
  }

  public async projectFileLayer(crsCode:number, proj4?:string):Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Proyectando capa...");
      this._spinnerService.show();

      await delayExecution(250);

      this.selectedCrs = crsCode;

      proj4 = proj4 ?? await this._geojsonReprojectorService.getProj4OfEPSG(crsCode);
      
      this.geojson = this._geojsonReprojectorService.reproject( this.fileLayer.file.getContent(false), proj4);

      this.geojson["crs"] = {
        "type": "name",
        "properties": {
          "name": `urn:ogc:def:crs:EPSG::${crsCode}`
        }
      };
      
      if(this.layer)
        this.map.removeLayer( this.layer );
      
      this.layer = geoJSON(this.geojson, {
        pointToLayer: (feature:Feature, latLng:LatLng) => this.fileLayer.getPointLayer(feature, latLng),
        style: (feature:Feature) => this.fileLayer.getLayerStyle(feature)
      });

      this.map.addLayer( this.layer );
    } 
    catch (error)
    {
      console.error(error);
      this._toastr.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public getLayerGeometryTypeLabel(selected:string):string
  { 
    const types = {
      point:"Punto",
      linestring:"Línea",
      polygon:"Polígono",
      multilinestring:"Multi-Línea",
      multipolygon:"Multi-Polígono"
    };

    return types[selected.toLowerCase()] || "desconocido";
  }
  
  public async testFileWithCustomProjection(radioRef:HTMLInputElement):Promise<void>
  {
   const userResponse = await swal.fire({
      title: 'Coloque codigo de proyección:',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off',
        placeholder: "EPSG:4326"
      },
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async (epsgCode:string) => {

        try {

          const epsgNumericCode = Number(epsgCode.substr(5));
          
          const isValid = epsgCode.toLowerCase().includes("epsg:") && Number.isInteger( epsgNumericCode );
   
          if( ! isValid )
            throw new Error("Codigo invalido.");
          
          const proj4 = await this._geojsonReprojectorService.getProj4OfEPSG( epsgNumericCode );
          
          if( ! proj4 || ! proj4.includes("+proj")  )
            throw new Error("Proyección no encontrada.");

          await this.projectFileLayer(epsgNumericCode, proj4);

          if( this.getAvailableCrs().includes(this.selectedCrs) )
            radioRef.checked = false;
          
        } catch (error) {
          
            swal.showValidationMessage(`Error: ${error.message}`);
        }

      },
      allowOutsideClick: () => !swal.isLoading()
    });

    if( userResponse.isDenied || userResponse.isDismissed )
      radioRef.checked = false;
  }

  public async confirmProyection():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Añadiendo proyección...");
      this._spinnerService.show();

      await delayExecution(250);

      await this.checkIfTheGeojsonIsInTheAllowedRange( this.geojson );

      this.map.flyToBounds(this.layer.getBounds() ,{maxZoom: 15, duration: 0.25});

      this.inConfirmationOfProjection = false;

      this._spinnerService.hide();
    }
    catch(error)
    {
      this._toastr.error(error.message, "Error");
      await this.hide();
    }
  }

  public async updateLayerStyle(style:LayerStyle):Promise<void>
  {
    this._spinnerService.updateText("Actualizando capa...");
    this._spinnerService.show();

    await delayExecution(250);

    this.fileLayer.file.setDefaultStyle = style;

    this.map.removeLayer( this.layer );

    this.layer = geoJSON(this.geojson, {
      pointToLayer: (feature:Feature, latLng:LatLng) => this.fileLayer.getPointLayer(feature, latLng),
      style: (feature:Feature) => this.fileLayer.getLayerStyle(feature)
    });
    
    this.map.addLayer( this.layer );

    this._spinnerService.hide();
    this._spinnerService.cleanText();
  }

  public async saveSettings():Promise<void>
  {
    const userResponse = await showPreconfirmMessage(
      `¿Añadir proyección ${this.selectedCrs}?`,
      "Una vez que confirme la acción el CRS sera definido a EPSG:4326 (CRS por defecto para API de mapa).",
      "question",
      "Si, añadir",
      "No, cancelar"
    );

    if( userResponse.value )
    {
      this._spinnerService.updateText("Guardando proyección...");
      this._spinnerService.show();
  
      await delayExecution(250);

      this.geojson["crs"] = { "type": "name", "properties": { "name": `urn:ogc:def:crs:EPSG::4326` } };
      this.fileLayer.file.updateContent(this.geojson);
      this.fileLayer.build();

      this.configureLayer.emit(this.fileLayer);

      await this.hide();

      this._spinnerService.hide();
      this._spinnerService.cleanText();

      this._toastr.success("Capa reproyectada.","Exito!");
    }
  }

  public async removeChangesAndHide():Promise<void>
  {
    if( this.layerDefaultStyle )
      this.fileLayer.file.setDefaultStyle = this.layerDefaultStyle;

    await this.hide();
  }

  public async hide():Promise<void>
  {
    await super.hide();

    if( this.layer )
    {
      this.map.removeLayer( this.layer );
      this.layer = null;
      this.geojson = null;
      this.selectedCrs = null;
      this.fileLayer = null;
      this.layerDefaultStyle = null;
    }
  }
}
