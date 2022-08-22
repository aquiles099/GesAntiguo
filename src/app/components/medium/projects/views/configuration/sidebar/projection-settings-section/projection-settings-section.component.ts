import { Component, Input, EventEmitter, Output } from '@angular/core';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { Map, geoJSON, TileLayer, FeatureGroup, LatLng, circleMarker, divIcon } from 'leaflet';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { delayExecution, showPreconfirmMessage, getFileContent } from 'src/app/shared/helpers';
import { GeojsonReprojectorService } from '../../../../../../../services/unic/geojson-reprojector.service';
import { ToastrService } from 'ngx-toastr';
import { checkIfTheFileExtensionIsCorrect, getFileExtension, lightenDarkenColor, getFileName } from '../../../../../../../shared/helpers';
import { ShapeFile } from '../../../../../../../models/unic/geojson/shape-file';
import swal from 'sweetalert2';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { GeometryType } from '../../../../../../../interfaces/geojson/i-geojson-file';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { POINT_COLOR } from '../../../../../../../interfaces/geojson/layer-style';
import { Feature } from 'geojson';
import { kml } from "@tmcw/togeojson";
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { ShepherdService } from 'angular-shepherd';
import { InformacionDeCapa } from '../../configuration.component';
import { XLSX } from '../../../../../../../models/unic/geojson/xlsx';

@Component({
  selector: 'projection-settings-section',
  templateUrl: './projection-settings-section.component.html',
  styleUrls: ['./projection-settings-section.component.css','../sidebar.component.css']
})
export class ProjectionSettingsSectionComponent extends HideableSectionComponent
{
  @Input()
  public isCollapsed:boolean;

  @Input()
  private map:Map;
  
  @Input()
  public projections:any;
  
  private geojsonLayer:FeatureGroup;
  public baseGeojson:any;
  private geojsonInConfiguration:any;

  public fileName:string;
  public layerGeometryType:string;
  private layer:InformacionDeCapa;

  public selectedCrs:number;

  public inConfirmationOfProjection:boolean = false;

  @Output()
  public configureLayer:EventEmitter<void> = new EventEmitter;

  public tourObject:any;

  constructor(
    private _spinnerService: SpinnerService,
    private _geojsonReprojectorService:GeojsonReprojectorService,
    private _toastr:ToastrService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _shepherdService:ShepherdService
  )
  {
    super(); 
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public getAvailableCrs():Array<any>
  {
    return Object.values(this.projections).map((projection:any) => projection.id_proyeccion);
  }

  public async onSelectLayerFile(event:any, layer?:InformacionDeCapa):Promise<void>
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

      this.baseGeojson = await this.getFileContent(file);

      const layerGeometry = layer ? layer.geometria : this.layer.geometria;

      this.checkIfTheFeatureGeometryAreAllowedForTheLayer(this.baseGeojson.features, layerGeometry);

      this.checkIfTheNumberOfFeaturePropertiesIsValid( this.baseGeojson );

      let geojsonCrsEpsgCode = this.getCrsEpsgCodeOfGeojson(this.baseGeojson);

      if( geojsonCrsEpsgCode )
      {
        await this.checkIfTheGeojsonIsInTheAllowedRange(this.baseGeojson);
        this.inConfirmationOfProjection = false;
      }
      else
      {
        this._spinnerService.hide();

        await swal.fire({
          title: 'Archivo sin CRS.',
          text: `El archivo será reproyectado a crs EPSG:4326 para que luego confirme si es visible en el mapa y,
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
    
      await this.projectLayer(geojsonCrsEpsgCode);

      this.map.flyToBounds(
        this.inConfirmationOfProjection ? (this._projectService.bbox as any) : this.geojsonLayer.getBounds(),
        {maxZoom: 15, duration: 0.25}
      );

      if( layer )
        this.layer = layer;

      this.fileName = getFileName(file);
      this.layerGeometryType = this.getLayerGeometryTypeLabel( layerGeometry );

      if( this.baseGeojson.hasOwnProperty("name") )
        this.baseGeojson["name"] = this.layerGeometryType; 
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

  public async projectLayer(crsCode:number, proj4?:string):Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Proyectando capa...");
      this._spinnerService.show();

      await delayExecution(250);

      this.selectedCrs = crsCode;

      proj4 = proj4 ?? await this._geojsonReprojectorService.getProj4OfEPSG(crsCode);
      
      this.geojsonInConfiguration = this._geojsonReprojectorService.reproject( this.baseGeojson, proj4);

      this.geojsonInConfiguration["crs"] = {
        "type": "name",
        "properties": {
          "name": `urn:ogc:def:crs:EPSG::${crsCode}`
        }
      };
      
      if(this.geojsonLayer)
        this.map.removeLayer( this.geojsonLayer );
      
      this.geojsonLayer = geoJSON(this.geojsonInConfiguration, {
        pointToLayer: (feature:Feature, latLng:LatLng) =>  {    
          
            return circleMarker(latLng, {
              color: POINT_COLOR,
              opacity: 1,
              fillColor: lightenDarkenColor(POINT_COLOR, 30),
              fillOpacity: 0.5,
              radius: 6
            });
        }
      });

      this.map.addLayer( this.geojsonLayer );
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
      multilinestring:"Multi-línea",
      multipolygon:"Multi-polígono"
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

          await this.projectLayer(epsgNumericCode, proj4);

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

      await this.checkIfTheGeojsonIsInTheAllowedRange( this.geojsonInConfiguration );

      this.map.flyToBounds(this.geojsonLayer.getBounds() ,{maxZoom: 15, duration: 0.25});

      this.inConfirmationOfProjection = false;

      this._spinnerService.hide();
    }
    catch(error)
    {
      this._toastr.error(error.message, "Error");
      await this.hide();
    }
  }

  public async saveSettings():Promise<void>
  {
    try
    {
      const userResponse = await showPreconfirmMessage(
        `¿Añadir proyección ${this.selectedCrs}?`,
        "Una vez que confirme la acción el CRS será definido a EPSG:4326 (CRS por defecto para API de mapa).",
        "question",
        "Si, añadir",
        "No, cancelar"
      );
  
      if( userResponse.value )
      {
        this._spinnerService.updateText("Creando capa...");
        this._spinnerService.show();
    
        await delayExecution(250);

        let geojsonCopy = ObjectUtility.simpleCloning(this.geojsonInConfiguration);

        for(let feature of geojsonCopy.features)
          GeoJSONHelper.reproyectGeometry(undefined, this._projectService.configuration.datos_municipio.nombre_proj4, feature.geometry);
    
        const wmsLayerStyle = (await this._projectsService.consultarApi({
          "funcion": "web_cargar_datos_capa_multiple",
          "proyecto": this._projectService.project.nombre,
          "proyeccion": this._projectService.project.proyeccion,
          "modulo": this.layer.modulo,
          "grupo": this.layer.grupo,
          "capa": this.layer.nombre,
          "features": geojsonCopy.features
        })).datos.estilo;
  
        this.layer.capaWms.setParams(({
          styles: Object.values(wmsLayerStyle)[0],
          fake: Date.now(),
        } as any));
  
        this.layer.activo = this.layer.configurado = true;
        
        this.configureLayer.emit();
  
        await this.hide();
  
        this._spinnerService.hide();
        this._spinnerService.cleanText();
  
        this._toastr.success("Capa registrada.","Exito!");
      }  
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

  public async hide():Promise<void>
  {
    await super.hide();

    if( this.geojsonLayer )
    {
      this.map.removeLayer( this.geojsonLayer );
      this.geojsonLayer = null;
      this.baseGeojson = null;
      this.geojsonInConfiguration = null;
      this.selectedCrs = null;
      this.fileName = null;
      this.layerGeometryType = null;
      this.layer = null;
    }
  }

  /* TOUR */

  public showTour():void
  {
    if( this.tourObject )
      this._shepherdService.addSteps( this.tourObject.steps );
    else
      this.buildTour();

    this._shepherdService.start();
  }

  private buildTour():void
  {
    const that = this;    
  
    const steps = this.buildTourSteps();

    const buttons = [
      {
        classes: 'btn-secondary',
        text: 'Atras',
        action(){
          that._shepherdService.back();
        }
      },
      {
        classes: 'btn-info',
        text: 'Siguiente',
        action(){
            that._shepherdService.next();
        }
      }
    ];
    
    const _steps = [];

    for( let i = 0, stepsLength = steps.length; i < stepsLength; i++ )
    {
      let _buttons = [...buttons]; 

      if( i === 0 )
      {
        _buttons = _buttons.slice(1);
      }
      
      if( i === (stepsLength - 1)  )
      {
        _buttons[1] = {..._buttons[1]};
        _buttons[1].text = 'Finalizar';
        _buttons[1].action = () => that._shepherdService.complete();
      }

      const step = steps[i];
      
      const _step = {
        id: step.element,
        attachTo: { 
          element: `${
            step.element === "confirm-btn" ||
            step.element === "map-container" ||
            step.element === "default-epsg" ? "." : "#"}${step.element}`, 
          on: step.labelPosition
        },
        buttons: _buttons,
        title: `PASO ${i + 1}`,
        text: step.text,
        when: step.event ?? null
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);

    this._shepherdService.tourObject.on("cancel", () => {
      
      const mapDivRef = document.getElementById("mapDivref");
      
      if( mapDivRef )
        mapDivRef.remove();

    });

    this.tourObject = this._shepherdService.tourObject;
  }

  private buildTourSteps():any[]
  {
    const mapDivref = document.createElement("DIV");

    mapDivref.style.left = "47.5%";
    mapDivref.style.right = "2.5%";
    mapDivref.style.top = "0%";
    mapDivref.style.bottom = "0%";
    mapDivref.style.width = "50%";
    mapDivref.style.height = "80%";
    mapDivref.style.margin = "auto";
    mapDivref.style.border = "1px solid red";
    mapDivref.style.zIndex = "1200";
    mapDivref.style.position = "fixed";
    mapDivref.id = "mapDivref";

    const steps = [
      {
        element: 'mapDivref',
        labelPosition: "left",
        text: `Si no se muestran los elementos de la capa en el mapa puede intentar visualizarlos con otra proyección.`,
        event: {
          "before-show": () => document.querySelector("body").appendChild(mapDivref),
          "hide": () => mapDivref.remove()
        }
      },
      {
        element: `projections-list`,
        labelPosition: "right",
        text: `Se muestra aquí el listado de posibles proyecciones para el municipio.`
      },
      {
        element: `default-epsg`,
        labelPosition: "right",
        text: `Si el archivo cargado no tiene proyección establecida será cargado en EPSG:4326.`
      },
      {
        element: `custom-projection`,
        labelPosition: "right",
        text: `Si la proyección que se busca no esta en el listado, seleccionar "Proyección personalizada". 
        <br> A continuación se mostrará una ventana donde se debe colocar el codigo EPSG de la proyección buscada (ejemplo, EPSG:4326)`
      },
      {
        element: `file-layer-input`,
        labelPosition: "right",
        text: `También puede cargar un nuevo archivo de geometrías para al capa.`,
      },
      {
        element: `confirm-btn`,
        labelPosition: "top",
        text: `
        Una vez configurada la proyección de capa, guardar cambios y se mostrará listado de capas nuevamente. 
        <br> 
        También podra ver la capa cargada en el mapa con el estilo por defecto.
        `,
      },
    ];

    return steps;
  }
}
