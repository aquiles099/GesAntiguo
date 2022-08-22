import { icon, Map, MapOptions, Marker, tileLayer, TileLayer, Layer } from 'leaflet';
import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ProjectService } from '../../../../../services/unic/project.service';
import { Project } from '../../../../../interfaces/project';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import proj4 from 'proj4';
import { MapService } from '../../../../../services/unic/map.service';
import { availableScales } from '../../../../shared/map';
import { ActivatedRoute, Router } from '@angular/router';
import LeafletWms from 'leaflet.wms';
import { GeometryType, GEOMETRY_TYPES } from '../../../../../interfaces/geojson/i-geojson-file';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../services/spinner.service';

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

export interface InformacionDeCapa
{
  id: number;
  capaWms: TileLayer.WMS;
  estilo_por_defecto: string;
  filtro_capa: string;
  grupo: string;
  modulo: string;
  nombre: string;
  nombre_formateado:string;
  activo: boolean;
  configurado:boolean;
  geometria: GeometryType;
}

@Component({
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css'],
  animations: [
    fadeInOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class ConfigurationComponent implements OnDestroy
{
  public map:Map;
  public availableProjections:any = {};

  public showSpinner:boolean = true;

  public baseLayer:TileLayer = tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    crossOrigin: 'anonymous',
    className: 'OSM',
    maxNativeZoom: 19,
    maxZoom: 22,
    minZoom: 5
  }); 

  public modules:{[nombreModulo:string]: InformacionDeCapa[]}[] = [];
  public layers:Array<Layer> = [];
  public layersWithInfo:Array<InformacionDeCapa> = [];

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

  private routeReuseStrategy:any;
  private routeDataSubscription:Subscription;

  constructor(
    private _projectService:ProjectService,
    private _toastrService:ToastrService,
    private _mapService:MapService,
    private changeDetector:ChangeDetectorRef,
    private _spinnerService:SpinnerService,
    private router:Router,
    private route:ActivatedRoute
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

  private obtenerYAgregarCapasDeProyecto():void
  {
    try
    {
      //Obtemos la url base del proyecto y la parseamos para para preparla para hacer peticiones
      let url = this.project.url_base.split('wms?')[0] + "wms?";

      const crearYRetornarCapaWMS = capa => {

        const wmsLayer = LeafletWms.overlay(url, {
          layers: capa.filtro_capa.split('#').join('_'),
          styles: capa.estilo_por_defecto ?? "",
          className: capa.nombre_formateado,
          format: 'image/gif',
          crossOrigin: true,
          transparent: true,
          opacity: 1,
          maxNativeZoom: 22,
          maxZoom: 22,
          tiled: false,
          zIndex: 1000 - (this.layers.length + 1)
        });

        return wmsLayer;
      };

      /* CREAR OBJETO QUE CONTENDRA ESTRUTURA MODULOS > GRUPOS > CAPAS
      // EL CUAL PODRA SER USADO PARA UBICAR DATOS NECESARIOS "RAPIDAMENTE".
      */

      const modules = {};

      this._projectService
          .configuration
          .modulos
          .forEach(modulo => {

            modulo.grupos.forEach(grupo => {

              grupo.capas.forEach(capa => {

                const _capa = {
                  capaWms: null,
                  activo: null
                };

                const filtroCapa = `${modulo.nombre_formateado}#${grupo.nombre_formateado}#${capa.nombre_formateado}`;

                const datosAdicionales = {
                  modulo: modulo.nombre,
                  grupo: grupo.nombre,
                  filtro_capa: filtroCapa,
                  geometria: GEOMETRY_TYPES.find(type => type.toLowerCase() === capa.tipo_geometria.toLowerCase()),
                  estilo_por_defecto: this._projectService.layerStyles[filtroCapa],
                  capaWms: null,
                };

                Object.assign(_capa, capa, datosAdicionales);
          
                _capa.capaWms = crearYRetornarCapaWMS(_capa);
    
                if( _capa.activo )
                  this.layers.push( _capa.capaWms );
          
                if( ! modules[modulo.nombre] )
                  modules[modulo.nombre] = [];
    
                modules[modulo.nombre].push(_capa);

                this.layersWithInfo.push((_capa as any));

              });

            });

          });

      for(let [name, layers] of Object.entries(modules))
        this.modules.push(({name, layers} as any));

    }
    catch (error)
    {
      throw error;
    }
  }

  public async onMapReady(map:Map):Promise<void>
  {
    this.map = map;

    this._mapService.next(map);
    
    this.changeDetector.detectChanges();

    this.loadProjectDataInTheView();

    this.showSpinner = false;
  }

  public loadProjectDataInTheView():void
  {
    this.routeDataSubscription = this.route.data.subscribe(availableProjections => {

      this.showSpinner = true;
      
      this.projectBBox = this._projectService.bbox; 

      const municipalityLayer = tileLayer.wms(this._projectService.configuration.geoserver.ruta, ({
        layers: this._projectService.configuration.geoserver.layer,
        format: 'image/png',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        cql_filter: `id=${this._projectService.configuration.datos_municipio.municipio}`
        }) as any);

      this.map.addLayer(municipalityLayer);
      
      this.availableProjections = availableProjections;

      this.obtenerYAgregarCapasDeProyecto();

    });
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
    try
    {
      this._spinnerService.updateText("Aplicando cambios realizados...");
      this._spinnerService.show();
      await this._projectService.loadInformationAndConfiguration()
    }
    catch (error)
    {
      this._toastrService.error("Los cambios realizados no han podido ser cargados. Por favor recargue el sitio.");
    }
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
      return true;
    }    
  }

  public ngOnDestroy():void
  {
    this.router.routeReuseStrategy.shouldReuseRoute = this.routeReuseStrategy;
    this.routeDataSubscription.unsubscribe();
  }

}
