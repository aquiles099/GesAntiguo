import { Component, Output, EventEmitter, Input } from '@angular/core';
import { HideableSectionComponent } from 'src/app/components/shared/hideable-section/hideable-section.component';
import { ProjectService } from 'src/app/services/unic/project.service';
import { ShepherdService } from 'angular-shepherd';
import { ToastrService } from 'ngx-toastr';
import { DrawMap, TileLayer, LatLngExpression } from 'leaflet';
import { Project } from '../../../../../../../interfaces/project';
import LeafletWms from 'leaflet.wms';
import { ApiService } from '../../../../../../../services/api.service';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { Capa } from '../../../../../../../interfaces/medium/mapa/Modulo';

@Component({
  selector: 'herramienta-resaltar-luminarias-por-cm',
  templateUrl: './resaltar-luminarias-por-cm.component.html',
  styleUrls: [
    './resaltar-luminarias-por-cm.component.css',
    '../../../../../../../../themes/styles/map-tool-bar.scss'
  ]
})
export class ResaltarLuminariasPorCmComponent extends HideableSectionComponent {

  @Input()
  public map:DrawMap;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  public commandCenters:string[] = [];
  public selectedCmName:string;
  
  private highlightedElementsLayer:TileLayer.WMS;

  private removedLayersWhenShowingTheTool:Capa[] = [];

  public showSpinner:boolean = false;

  constructor(
    private _projectService: ProjectService,
    private _projectLayersService: ProjectLayersService,
    private _shepherdService:ShepherdService,
    private _toastrService:ToastrService,
    private _apiService:ApiService
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

  public async show(): Promise<void>
  {
    try
    {
      this.showSpinner = true;

      await super.show();

      this.removeUnnecessaryLayers();

      await this.loadCommandCenters();

      this.createAndProjectHighlightLayer();
    }
    catch(error)
    {
      this._toastrService.error(error.mesagge,"Error");
      this.hide();
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  private removeUnnecessaryLayers():void
  {
    this._projectLayersService
        .obtenerCapas()
        .forEach(layer => {

          if( 
            layer.nombre_formateado !== 'luminaria' && 
            layer.nombre_formateado !== 'centro_mando' &&
            layer.proyectado 
          )
          {
            this.map.removeLayer( layer.capaWms );
            this.removedLayersWhenShowingTheTool.push( layer );
          }

        });
  }

  private async loadCommandCenters():Promise<void>
  {
    try
    {
      this.commandCenters = (await this._apiService.postNewApi(
        "proyectos/gis-smart-energy/centro-mando/lista.py", {
        "id_proyecto": this.project.id_proyecto,
        "atributos": [
            "descripcion",
            "geometria_leaflet",
        ]
      })).datos;

    }
    catch(error)
    {
      this._toastrService.error(error.mesagge,"Error");
    }
  }

  private createAndProjectHighlightLayer():void
  {
    const baseUrl = this._projectService.baseUrl;

    this.highlightedElementsLayer = new LeafletWms.overlay(baseUrl, ({
      layers: "gissmart_energy_gestlighting_luminaria",
      styles: "buffer_linea",
      className: "informacion_seleccionado",
      format: 'image/png',
      crossOrigin: true,
      transparent: true,
      opacity: 1,
      maxNativeZoom: 22,
      maxZoom: 22,
      tiled: false,
      cql_filter: null,
      env: "buffer:30",
    } as any));

    this.map.addLayer(this.highlightedElementsLayer);

    this.highlightedElementsLayer.bringToBack();
  }

  public onChangeCmSelector(cm:{[key:string]:string|number}):void
  {
    const cmGeometry = GeoJSONHelper.stringToGeometry((cm.geometria_leaflet as string)); 
    
    GeoJSONHelper.invertGeometryCoordinates(cmGeometry);
        
    this.map.flyTo((cmGeometry.coordinates as LatLngExpression), 17, {duration: .5});

    this.updateHiglightedElementsLayer();
  }

  private updateHiglightedElementsLayer():void
  {
    (this.highlightedElementsLayer.wmsParams as any).cql_filter = `centro_mando='${this.selectedCmName}'`;
    this.highlightedElementsLayer.setParams(({fake: Date.now()} as any));
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide(): Promise<void> 
  {
    this._shepherdService.tourObject = null;
    
    this.clearCommandCentersData();

    this.removedLayersWhenShowingTheTool.forEach(layer => 
      this.map.addLayer( layer.capaWms )
    );

    this.showSpinner = false;

    await super.hide();
  }

  private clearCommandCentersData():void
  {
    this.selectedCmName = null;
    this.commandCenters = [];

    this.map.removeLayer( this.highlightedElementsLayer );
    this.highlightedElementsLayer = null;
  }
}
