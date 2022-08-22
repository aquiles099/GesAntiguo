require("../../../../models/unic/leaflet/custom-markers.js");

import { icon, Map, MapOptions, Marker, tileLayer, TileLayer, Layer } from 'leaflet';
import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { ProjectService } from '../../../../services/unic/project.service';
import { Project } from '../../../../interfaces/project';
import { ProjectsService } from '../../../../services/unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { ConfigurationBarComponent } from './configuration-bar/configuration-bar.component';
import { showPreconfirmMessage } from 'src/app/shared/helpers';
import { GeojsonFilesService } from '../../../../services/unic/geojson-files.service';
import { GeojsonLayerImagesService } from '../../../../services/unic/geojson-layer-images.service';
import proj4 from 'proj4';
import { MapService } from '../../../../services/unic/map.service';
import { availableScales } from '../../../shared/map';
import { Router } from '@angular/router';
import { GeojsonFilesAnalysisChartsConfigurationsService } from '../../../../services/unic/geojson-files-analysis-charts-configurations.service';
import { Modulo } from '../../../../interfaces/medium/mapa/Modulo';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
Marker.prototype.options.icon = iconDefault;

const ANIMATION_DURATION = 250;

@Component({
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css'],
  animations: [
    fadeInOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class ConfigurationComponent implements OnInit, OnDestroy
{
  public map:Map;

  public modules:Modulo[] = [];
  public availableProjections:any = {};

  public showSpinner:boolean = true;

  public baseLayer:TileLayer = tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    crossOrigin: 'anonymous',
    className: 'OSM',
    maxNativeZoom: 19,
    maxZoom: 22,
    minZoom: 5
  }); 

  public layers:Array<Layer> = [];

  public options:MapOptions = {
    zoom: 17,
    zoomControl: false,
    center: [40.395347, -3.694041],
    preferCanvas: true
  };

  public cursorCoordinates: string;
  public currentScale: string;

  public availableScales: any[] = availableScales

  public projectBBox: number[][] = null;

  @ViewChild(ConfigurationBarComponent)
  public ConfigurationBar:ConfigurationBarComponent;

  private routeReuseStrategy:any;

  constructor(
    private _geojsonFilesService:GeojsonFilesService,
    private _geojsonFilesAnalysisChartsConfigurationsService:GeojsonFilesAnalysisChartsConfigurationsService,
    private _geojsonLayerImagesService:GeojsonLayerImagesService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _mapService:MapService,
    private toastr:ToastrService,
    private changeDetector:ChangeDetectorRef,
    private router:Router
  ){
    this.routeReuseStrategy = this.router.routeReuseStrategy.shouldReuseRoute;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get crs():string
  {
    return this._projectService.configuration ? this._projectService.configuration.datos_municipio.nombre_proyeccion : null;
  }

  get currentBaseLayer():string
  {
    return this.baseLayer.options.className;
  }

  public async ngOnInit(): Promise<void>
  {
    try {
               
      const projectConfiguration = (await this._projectsService.getProjectConfigurationInfo(this.project.id_proyecto)).datos;

      this._projectService.setConfiguration(projectConfiguration);

      this.projectBBox = this._projectService.bbox; 

      const municipalityLayer = tileLayer.wms(projectConfiguration.geoserver.ruta, ({
        layers: projectConfiguration.geoserver.layer,
        format: 'image/png',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        cql_filter: `id=${projectConfiguration.datos_municipio.municipio}`
        }) as any);

      this.map.addLayer(municipalityLayer);

      this.modules = projectConfiguration.modulos;
     
      this.availableProjections = (await this._projectsService.getAvailableProjections(this.project.id_proyecto)).datos.capas;

    } catch (error)
    {
      console.error(error);
      this.toastr.error(error.message,"Error");   
      this.router.navigateByUrl("/unic/home/proyectos");
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public async onMapReady(map:Map):Promise<void>
  {
    this.map = map;

    this._mapService.next(map);

    this.changeDetector.detectChanges();

    if (! this._geojsonFilesService.establishedConnection )
      await this._geojsonFilesService.openIDBConnection();

    await this._geojsonFilesService.load();

    if (! this._geojsonFilesAnalysisChartsConfigurationsService.establishedConnection )
      await this._geojsonFilesAnalysisChartsConfigurationsService.openIDBConnection();
    
    await this._geojsonFilesAnalysisChartsConfigurationsService.load();

    if (! this._geojsonLayerImagesService.establishedConnection )
      await this._geojsonLayerImagesService.openIDBConnection();
  }

  public onChangeScaleSelect(event: any): void {
    this.map.setZoom(event.target.value);
    this.currentScale = 'Escala: 1:' + this.getScale();
  }

  public onLeafletMouseMove(e: any): void {
    const reprojectedCoords = proj4(this._projectService.configuration.datos_municipio.nombre_proj4, [e.latlng.lng, e.latlng.lat]);
    this.cursorCoordinates = 'X: ' + reprojectedCoords[0].toLocaleString() + ' Y: ' + reprojectedCoords[1].toLocaleString();
    this.currentScale = 'Escala: 1:' + this.getScale();
  }

  private getScale(): number
  {
    return this._mapService.getScale();
  }

  public onMapZoom(): void {
    this.currentScale = 'Escala: 1:' + this.getScale();
  }

  public async canDeactivate():Promise<boolean>
  {
    return this.ConfigurationBar.thereWereChanges ?
    (await showPreconfirmMessage(
      "¡Espera!",
      "Hay cambios que no han sido guardados, ¿desea salir sin salvar cambios?.",
      "question",
      "Si, salir",
      "No, permanecer aqui"
    )).isConfirmed :
    true;
  }

  public ngOnDestroy():void
  {
    this.router.routeReuseStrategy.shouldReuseRoute = this.routeReuseStrategy;
  }

}
