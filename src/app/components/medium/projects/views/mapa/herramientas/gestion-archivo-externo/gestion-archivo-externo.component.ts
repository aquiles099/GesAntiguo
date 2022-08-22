import { Component, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Map, GeoJSON, geoJSON, circleMarker } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { ProjectLayersService } from 'src/app/services/medium/project-layers.service';
import { delayExecution, getFileContent } from 'src/app/shared/helpers';
import { Project } from '../../../../../../../interfaces/project';
import swal from 'sweetalert2';
import { GeojsonReprojectorService } from '../../../../../../../services/unic/geojson-reprojector.service';
import { ShapeFile } from '../../../../../../../models/unic/geojson/shape-file';
import { kml } from "@tmcw/togeojson";
import { XLSX } from "../../../../../../../models/unic/geojson/xlsx";
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { getFileExtension, checkIfTheFileExtensionIsCorrect, lightenDarkenColor, getFileName, toggleFullscreen } from '../../../../../../../shared/helpers';
import { Feature } from 'geojson';
import { POINT_COLOR } from '../../../../../../../interfaces/geojson/layer-style';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { ShepherdService } from 'angular-shepherd';

@Component({
  selector: 'herramienta-gestion-archivo-externo',
  templateUrl: './gestion-archivo-externo.component.html',
  styleUrls: ['./gestion-archivo-externo.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class GestionArchivoExternoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  public availableProjections:Array<number> = [];

  public selectedCrs:number;

  public geojsonLayers:any[] = [];

  public settingLayer:boolean = false;

  private layerInConfiguration:GeoJSON;
  public geojsonInConfiguration:any;
  public loadedFileName:string;

  constructor(
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _projectLayersService:ProjectLayersService,
    private _geojsonReprojectorService:GeojsonReprojectorService,
    private _spinnerService:SpinnerService,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async show():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Removiendo capas...");
      this._spinnerService.show();
  
      await delayExecution(250);
  
      this._projectLayersService
          .obtenerCapas()
          .forEach(capa => this.map.removeLayer( capa.capaWms ));
  
      if( ! this.availableProjections.length )
      {
        const availableProjections = (await this._projectsService.getAvailableProjections(this.project.id_proyecto)).datos.capas;
        this.availableProjections = Object.values(availableProjections).map((data:any) => data.id_proyeccion);
      }
  
      await super.show();
    }
    catch (error)
    {
      this._toastrService.error(error, "Error");
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  public setLayer():void
  {
    this.settingLayer = true;
  } 

  public showMainSection():void
  {
    if(this.layerInConfiguration)
      this.map.removeLayer( this.layerInConfiguration );

    this.clear();
  
    this.settingLayer = false;
  } 

  public async whenUploadingFile(event:any):Promise<void>
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
    
      this.geojsonInConfiguration = await this.getFileContent(file);

      if( !  this.geojsonInConfiguration.hasOwnProperty("name") )
        this.geojsonInConfiguration["name"] = `Capa ${this.geojsonLayers.length + 1}`;

      let crsCode, 
        layerHasCrs = true;

      try
      {
        crsCode = this._geojsonReprojectorService.getCrsEpsgCode( this.geojsonInConfiguration );
      }
      catch (error)
      {
        crsCode = 4326;
        layerHasCrs = false;
      }
  
      await this.projectLayer(crsCode);

      if( layerHasCrs )
        this.map.flyToBounds( this.layerInConfiguration.getBounds() );

      this.loadedFileName = getFileName(file);
    } 
    catch (error) 
    {
      console.error(error);      
      this._toastrService.error(error.message, "Error");
      throw error;
    }
    finally
    {
      event.target.value = null;
      this._spinnerService.hide();
      this._spinnerService.cleanText(); 
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
  
      proj4 = proj4 ?? await this._geojsonReprojectorService.getProj4OfEPSG( this.selectedCrs  );
      
      let geojson = ObjectUtility.simpleCloning(this.geojsonInConfiguration);

      geojson = this._geojsonReprojectorService.reproject(geojson, proj4);
      
      if(this.layerInConfiguration)
        this.map.removeLayer( this.layerInConfiguration );
      
      this.layerInConfiguration = geoJSON(geojson, {
        pointToLayer: (feature:Feature, latLng:any) =>  {    
         
            return circleMarker(latLng, {
              color: POINT_COLOR,
              opacity: 1,
              fillColor: lightenDarkenColor(POINT_COLOR, 30),
              fillOpacity: 0.5,
              radius: 6
            });
        }
      });

      this.map.addLayer( this.layerInConfiguration );
    } 
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
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

    return content;
  }

  public selectCrs(crsCode:number):void
  {
    this.selectedCrs = crsCode;
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
      heightAuto: false,
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

          if( this.availableProjections.includes(this.selectedCrs) )
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

  public saveLayer():void
  {
    this.geojsonLayers.push({
      name: this.geojsonInConfiguration.name,
      layer: this.layerInConfiguration
    });

    this.layerInConfiguration = null;
    this.geojsonInConfiguration = null;
    this.selectedCrs = null;
    this.loadedFileName = null; 

    this.settingLayer = false;
  }

  public async deleteLayer(layerData:any):Promise<void>
  {
    this._spinnerService.updateText("Removiendo capa...");
    this._spinnerService.show();

    await delayExecution(250);

    this.geojsonLayers = this.geojsonLayers.filter(_layerData => _layerData !== layerData);

    this.map.removeLayer( layerData.layer );
  
    this._spinnerService.hide();
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this._spinnerService.updateText("Proyectando capas...");
    this._spinnerService.show();

    await delayExecution(250);

    this._projectLayersService
        .obtenerCapas()
        .forEach(capa => this.map.addLayer( capa.capaWms ));

    if(this.layerInConfiguration)
      this.map.removeLayer( this.layerInConfiguration );
  
    this.clear();

    await super.hide();

    this._shepherdService.tourObject = null;

    this._spinnerService.hide();
    this._spinnerService.cleanText();
  }

  private clear():void
  {    
    this.layerInConfiguration = null;
    this.geojsonInConfiguration = null;
    this.selectedCrs = null;
    this.loadedFileName = null;
  }

   /* TOUR */

   public showTour():void
   {
     if( this.tourIsActive )
       return;
 
     this.buildTour();

    const onCancelTourClosure = () => {

      const mapRefDiv = document.getElementById("mapRefDiv");
      
      if( mapRefDiv )
        mapRefDiv.remove();

      this.geojsonInConfiguration = null;
    }

    this._shepherdService.tourObject.on("cancel", onCancelTourClosure);
 
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
       
       const step = steps[i];
 
      if( i === 0) 
        _buttons = _buttons.slice(1);  
       
      if( i === (stepsLength - 1)  )
      {
        const lastBtnIndex = _buttons.length - 1;
        _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (mas a la derecha) siempre sera el de avanzar / finalizar.
        _buttons[lastBtnIndex].text = 'Finalizar';
        _buttons[lastBtnIndex].action = () => that._shepherdService.complete();
      }
      
      const _step = {
        id: step.element,
        attachTo: { 
          element: `${step.selectorPrefix ?? "#"}${step.element}`, 
          on: step.labelPosition
        },
        buttons: _buttons,
        title: `PASO ${i + 1}`,
        text: step.content,
        beforeShowPromise: step.beforeShowPromise ?? null,
        when: step.event
      };

      _steps.push(_step);
     }
 
     this._shepherdService.addSteps(_steps);
   }
 
   private buildTourSteps():any[]
   {
    const mapRefDiv = document.createElement("DIV");

    mapRefDiv.style.left = "2.5%";
    mapRefDiv.style.right = "32.5%";
    mapRefDiv.style.top = "0%";
    mapRefDiv.style.bottom = "0%";
    mapRefDiv.style.width = "40%";
    mapRefDiv.style.height = "50%";
    mapRefDiv.style.margin = "auto";
    mapRefDiv.style.border = "1px solid red";
    mapRefDiv.style.zIndex = "1200";
    mapRefDiv.style.position = "fixed";
    mapRefDiv.id = "mapRefDiv";

     const steps = [
        {
          element: `external-file-management-upload-file-btn`,
          labelPosition: "left",
          content:`
          Para cargar un archivo de geometrías hacer click en 
          <span class="badge-secondary"><img src="assets/icons/SVG/CARGAR.svg" alt="icono-cargar" class="small-icon d-inline"> &nbsp; Cargar archivo </span>.
          <br><br> 
          Los formatos de archivo soportados son: 
          <br><br> 
          <ul>
          <li class="mb-1">Geojson.</li>
          <li class="mb-1">Shape (<b>comprimido con archivos necesarios solo en formato ZIP</b>).</li>
          <li class="mb-1">XLSX (<b>geometrías deben tener atributo "GEOM"</b>).</li>
          <li class="mb-1">Kml.</li>
          <li class="mb-1">Dxf.</li>
          </ul> 
          `,
          beforeShowPromise: () => {
            this.settingLayer = true;
            this.geojsonInConfiguration = {name: ""};
            return new Promise(resolve => setTimeout(resolve, 350))
          }
        },
        {
          element: `external-file-management-uploaded-file-name`,
          labelPosition: "bottom",
          content: `
          Aquí se podrá ver el nombre del archivo cargado.
          `
        },
        {
          element: `external-file-management-uploaded-geojson-name`,
          labelPosition: "left",
          content: `
          Aquí se podrá ver el nombre del geojson cargado, el cual <b>identificará</b> la capa en el listado.
          <br>
          Puede modificarse si se quiere.
          `
        },
        {
          element: 'mapRefDiv',
          labelPosition: "left",
          content: `Si no se muestran los elementos de la capa cargada en el mapa, puede intentar <b>visualizarlos con otra proyección</b>.`,
          event: {
          "before-show": () => document.querySelector("body").appendChild(mapRefDiv),
          "hide": () => mapRefDiv.remove()
          }
        },
        {
          element: `external-file-management-projections-listing`,
          labelPosition: "left",
          content: `Aquí podrá ver el <b>listado de posibles proyecciones</b> para el municipio.`
        },
        {
          element: `default-epsg`,
          labelPosition: "right",
          selectorPrefix: ".",
          content: `Si el archivo cargado <b>no tiene proyección establecida</b> sera cargado en <b>EPSG:4326</b>.`
        },
        {
          element: `external-file-management-custom-projection`,
          labelPosition: "top",
          content: `Si la proyección buscada no está en el listado, seleccionar "<b>Proyección personalizada</b>". 
          <br> A continuación se mostrará una ventana donde 
          deberá colocar el codigo EPSG de la proyección que se busca (ejemplo, EPSG:4326).
          `
        },
        {
          element: `external-file-management-save-layer-btn`,
          labelPosition: "top",
          content: `Para guardar la capa cargada hacer click en <span class="badge bg-info text-white">Guardar</span>.`,
          beforeShowPromise: () => {
            this.settingLayer = true;
            this.geojsonInConfiguration = {name: ""};
            return new Promise(resolve => setTimeout(resolve, 350))
          }
        },
        {
          element: `external-file-management-layer-list`,
          labelPosition: "left",
          content:`
            <ul>
              <li class="mb-1">
                Aquí podrá ver el listado de capas cargadas.
              </li>
              <li class="mb-1">
                Las capas de archivos externos <b>siempre estarán proyectadas</b> sobre el mapa.
              </li>
              <li class="mb-1">
                Para <b>eliminar</b> una capa hacer click en <img class="d-inline small-icon" src="assets/icons/SVG/PAPEPERA.svg">.
              </li>
            </ul>
          `,
           beforeShowPromise: () => {
            this.settingLayer = false;
            this.geojsonInConfiguration = null;
            return new Promise(resolve => setTimeout(resolve, 350));
          }
        },
      ];

    if( ! this.settingLayer )
    {
      steps.unshift( {
        element: `external-file-management-add-layer-btn`,
        labelPosition: "left",
        content: `
        Para mostrar la sección de carga de archivo hacer click en <span class="badge bg-warning text-white">
        <img src="assets/icons/SVG/CARGAR_white.svg" alt="cargar" class="small-icon d-inline"> Añadir capa </span>.
        `,
        beforeShowPromise: () => {
          this.settingLayer = false;
          this.geojsonInConfiguration = null;
          return new Promise(resolve => setTimeout(resolve, 350))
        }
      });
    }

     return steps;
   }
}
