import { Component, ChangeDetectorRef, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { GeoJSONLayer } from 'src/app/models/unic/geojson/geojson-layer';
import { Map, Polygon, Marker, Polyline } from 'leaflet';
import { GeoJSONFile } from '../../../../../../models/unic/geojson/geojson-file';
import { ObjectUtility } from '../../../../../../shared/object-utility';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { delayExecution } from 'src/app/shared/helpers';
import { ProjectService } from '../../../../../../services/unic/project.service';
import { FeaturePropertyValues } from '../../../../../../interfaces/geojson/i-geojson-file';

@Component({
  selector: 'new-feature-section',
  templateUrl: './new-feature.component.html',
  styleUrls: ['./new-feature.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class NewFeatureComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;
  
  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  public modules:string[] = [];
  public selectedModuleName:string = null;

  public fileLayers:Array<GeoJSONLayer> = [];
  public selectedFileLayerName:string = null;

  public file:GeoJSONFile;
  public featurePropertyValues:FeaturePropertyValues;

  public newFeature:any;
  public newFeatureLayer:Marker|Polyline|Polygon;

  public buildingFeatureState:"waiting"|"inProgress"|"finished" = "waiting";

  public helpText:string = null;

  private updateHelpText:(event:any) => void = (e) => {
    
    if( this.file.geometryType !== "Point" )
    {
      const isAPolygon = this.file.geometryType.includes("Polygon");

      e.layer.editor._drawnLatLngs.length + 1 < e.layer.editor.MIN_VERTEX ?
      this.helpText = `Click para continuar ${ isAPolygon ? "polígono" : "línea" }.` :
      this.helpText = `Click en último punto para terminar ${ isAPolygon ? "polígono" : "línea" }.`;
    }
  }

  private onDrawingALayer: (event:any) => Promise<void> = async event => 
  {
    this._spinnerService.updateText("Dibujando elemento...");
    this._spinnerService.show();

    await delayExecution(250);
    
    if( this.file.geometryType.includes("Multi") && this.buildingFeatureState === "inProgress" )
    {
      if( ! this.drawnLayerIsWithinTheMunicipality() )
      {
        this._spinnerService.hide();
        return;
      }

      setTimeout(() => {

          (this.newFeatureLayer as any).editor.newShape();

          if( ! this.map.listens("contextmenu") )
          {
            this.map.once("contextmenu", (event:any) => {
  
              if ( event.originalEvent.ctrlKey)
              {  
                if( ! this.drawnLayerIsWithinTheMunicipality() )
                {
                  this._spinnerService.hide();
                  return;
                }
      
                this.map.editTools.stopDrawing();
                this.buildingFeatureState = "finished";  

                this.helpText = null;
                            
                this._changeDetector.detectChanges();
              }

            });
          }
          
          this.helpText = this.file.geometryType.includes('Polygon') ? `
                          Click en mapa para iniciar nuevo polígono. <br><br> 
                          Click sobre polígono para iniciar agujero. <br><br>
                          <kdb>Ctrl + click derecho</kdb> para terminar.` :
                          `Click en mapa para iniciar nueva línea. <br><br> <kdb>ctrl + click derecho</kdb> para terminar`;

          this._changeDetector.detectChanges();
        }, 200);
    }
    else
    {
      if( ! this.drawnLayerIsWithinTheMunicipality() )
      {
        this._spinnerService.hide();
        return;
      }
      
      this.buildingFeatureState = "finished";

      this.helpText = this.file.geometryType.includes('Polygon') ? 
      `<kdb>Ctrl + click</kdb> sobre polígono para iniciar agujero.`: "";
    }

    setTimeout(() => {
      this._spinnerService.hide();
      this._changeDetector.detectChanges();
    });
  };

  private drawnLayerIsWithinTheMunicipality: () => boolean = () =>
  {
    const featureIsWithinTheMunicipality = this._projectService.checkIfTheFeaturesAreWithinTheMunicipality( 
      [ this.newFeatureLayer.toGeoJSON() ]
    );

    if( ! featureIsWithinTheMunicipality )
    {
      // uso de "setTimeout" y NgZone para generar macrotareas (y que UI se actualize al momento).
      setTimeout(() => this.drawLayer());     
      this._ngZone.run(() => {
        this._toastrService.error("El elemento no puede estar fuera de el municipio.", "Error.");
        this.newFeatureLayer.remove();
      });
    }

    return featureIsWithinTheMunicipality;
  };

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _projectService:ProjectService,
    private _ngZone:NgZone
  )
  {
    super();
  }

  get drawing():boolean
  {
    return this.map.editTools.drawing();
  }

  public async show():Promise<void>
  {
    try
    {  
      this.modules = this._geojsonLayersService.getModuleNames("projected");
  
      this.map.on('editable:drawing:click', this.updateHelpText);
      this.map.on("editable:drawing:commit", this.onDrawingALayer);
      
      this.map.doubleClickZoom.disable(); 
  
      await super.show();
    }
    catch (error)
    {
      this._toastrService.error(error.message,"Error.");
    }
  }

  public async onChangeModuleSelector():Promise<void>
  {
    if( this.file )
    {
      this.file = null;
      this.selectedFileLayerName = null;
    }
    
    this.fileLayers = this._geojsonLayersService.getPerModule(this.selectedModuleName, "projected");
  }

  public async onChangeFileLayerSelect(fileLayer:GeoJSONLayer):Promise<void>
  {
    this.file  = fileLayer.file;
    this.featurePropertyValues = fileLayer.file.getFeaturePropertyValues();
  }

  public drawLayer():void
  {    
    switch( this.file.geometryType )
    {
      case "Point":
        this.newFeatureLayer = this.map.editTools.startMarker();
        this.helpText = "Click en mapa para agregar marcador.";
        break;

      case "LineString":
      case "MultiLineString":
        this.newFeatureLayer = this.map.editTools.startPolyline();
        this.helpText = "Click en mapa para iniciar línea.";
        break;

      case "Polygon":
      case "MultiPolygon":

        this.newFeatureLayer = this.map.editTools.startPolygon();
        
        // evento pora iniciar agujero sobre poligono una vez que este es dibujado.
        this.newFeatureLayer.on('click', (event:any) => {

          if ((event.originalEvent.ctrlKey || event.originalEvent.metaKey) &&
             (this.newFeatureLayer as any).editEnabled() &&
             this.file.geometryType !== "MultiPolygon"
            )
            {
              (this.newFeatureLayer as any).editor.newHole(event.latlng);
            }

        });

        this.helpText = "Click en mapa para iniciar polígono.";

        break;
    }

    // comprobar si despues que se mueve elemento dibujado, permanece dentro del municipio.
    this.newFeatureLayer.on("editable:dragend", this.drawnLayerIsWithinTheMunicipality);

    // comprobar si despues que se mueve un vertice del elemento dibujado, permanece dentro del municipio.
    // (linea y poligono).
    if( this.file.geometryType !== "Point" )
      this.newFeatureLayer.on("editable:vertex:dragend	", this.drawnLayerIsWithinTheMunicipality);

    this.buildNewFeatureStructure();

    this.buildingFeatureState = "inProgress";
  }

  private buildNewFeatureStructure():void
  {
    this.newFeature =  {
      "type": "Feature",
      "properties": this.file.featureProperties.reduce((object, key) => {
        object[key] = null;
        return object;
      }, {}),
      "geometry": {
        "type": this.file.geometryType,
        "coordinates": null
      }
    };
  }  

  public async saveChanges():Promise<void>
  {
    this._ngZone.run( async () => {
      try {

        this._spinnerService.updateText("Añadiendo elemento...");
  
        this._spinnerService.show();
  
        await delayExecution(250);
  
        this.newFeature.geometry.coordinates = this.newFeatureLayer.toGeoJSON().geometry.coordinates;
        
        this.file.addNewFeature( ObjectUtility.simpleCloning( this.newFeature ) );
  
        await this._geojsonLayersService.rebuildAndUpdate(this.file.name);
        
        this._toastrService.success("Elemento añadido.","Exito!");
  
      } catch (error)
      {
        console.error(error);
        this._toastrService.error(error.message,"Error.");  
      }
      finally
      {
        this.clear();
        this.drawLayer();
        this._spinnerService.hide();
        this._spinnerService.cleanText();
      }
    });
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.clear();
    this.map.off("editable:drawing:commit");   
    this.map.off('editable:drawing:click', this.updateHelpText);
    this.selectedModuleName  = null;
    this.selectedFileLayerName  = null;
    this.file = null;
    this.featurePropertyValues = null;
    this.map.doubleClickZoom.enable(); 
    await super.hide();
  }

  public clear():void
  {
    this.map.editTools.stopDrawing();

    if( this.newFeatureLayer )
    {
      this.newFeatureLayer.remove();
      this.newFeatureLayer = null;
    }

    this.newFeature = null;
    this.buildingFeatureState = "waiting";

    this.helpText = null;

    this._changeDetector.detectChanges();
  }
}
