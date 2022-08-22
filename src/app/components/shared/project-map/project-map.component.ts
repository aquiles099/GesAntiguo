import { icon, Map, MapOptions, Marker, tileLayer, TileLayer, Layer, drawLocal, LeafletEvent, LeafletMouseEvent, LatLng } from 'leaflet';
import { Component, ChangeDetectorRef, Input, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { Project, ConfiguracionDeProyecto } from '../../../interfaces/project';
import proj4 from 'proj4';
import LeafletWms from 'leaflet.wms';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { environment } from '../../../../environments/environment';

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
  selector: 'app-project-map',
  templateUrl: './project-map.component.html',
  styleUrls: [
    './project-map.component.css',
    '../../../../themes/styles/map.scss'
  ],
  animations: [
    fadeInOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class ProjectMapComponent implements AfterViewChecked
{
  @Input()
  public project:Project;
  
  @Input()
  public projectConfiguration:ConfiguracionDeProyecto

  @Input()
  public layerStyles:{[key:string]: string}

  @Input()
  public functionalities:{[key:string]: any} = {
    showMarkerOnClick: true,
    reprojectMapClickGeom: false
  };
  
  @Output()
  public onClick:EventEmitter<{x: number, y:number}> = new EventEmitter;

  @Output()
  public mapReady:EventEmitter<Map> = new EventEmitter;

  public map:Map;

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

  public projectBBox: number[][]|number[] = null;

  private lastMapClickMarker:Marker;

  constructor(
    private changeDetector:ChangeDetectorRef
  ){
  }

  get crs():string
  {
    return this.projectConfiguration ? this.projectConfiguration.datos_municipio.nombre_proyeccion : null;
  }

  public ngAfterViewChecked(): void
  {
    this.changeDetector.detectChanges();
  }

  public async onMapReady(map:Map):Promise<void>
  {
    this.map = map;
    
    this.changeDetector.detectChanges();

    this.buildAndAddProjectLayers();

    this.mapReady.emit(map);
    
    this.showSpinner = false;
  }

  public buildAndAddProjectLayers():void
  {
    this.showSpinner = true;
    
    this.projectBBox = [
      (this.projectConfiguration.bbox as number[]).slice(0,2).reverse(),
      (this.projectConfiguration.bbox as number[]).slice(2,4).reverse()
    ]; 

    const municipalityLayer = tileLayer.wms(this.projectConfiguration.geoserver.ruta, ({
      layers: this.projectConfiguration.geoserver.layer,
      format: 'image/png',
      crossOrigin: true,
      transparent: true,
      opacity: 1,
      maxNativeZoom: 22,
      maxZoom: 22,
      cql_filter: `id=${this.projectConfiguration.datos_municipio.municipio}`
      }) as any);

    this.map.addLayer(municipalityLayer);

    this.addLayersByDefinedStyles();
  }

  private addLayersByDefinedStyles():void
  {
    let url = this.project.url_base.split('wms?')[0] + "wms?";

    for( let [layerStructure, style] of Object.entries( this.layerStyles ) )
    {
      // layerStructure: modulo.nombre_formateado#grupo.nombre_formateado#capa.nombre_formateado.

      let layerStructureArray = layerStructure.split('#');

      const wmsLayer = LeafletWms.overlay(url, {
        layers: layerStructureArray.join('_'),
        styles: style,
        className: layerStructure[ layerStructureArray.length - 1 ],
        format: 'image/gif',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        tiled: false,
        zIndex: 1000 - (this.layers.length + 1)
      });

      this.layers.push( wmsLayer );
    }
  }

  public onMapMouseMove(e: any): void {
    const reprojectedCoords = proj4(this.projectConfiguration.datos_municipio.nombre_proj4, [e.latlng.lng, e.latlng.lat]);
    this.cursorCoordinates = 'X: ' + reprojectedCoords[0].toLocaleString() + ' Y: ' + reprojectedCoords[1].toLocaleString();
  }

  public onMapClick(event:LeafletMouseEvent):void
  {
    if( this.functionalities.showMarkerOnClick )
    {
      let point = {x: event.latlng.lng, y: event.latlng.lat };

      if( this.functionalities.reprojectMapClickGeom )
      {
        const reprojectedCoords = proj4(this.projectConfiguration.datos_municipio.nombre_proj4, [event.latlng.lng, event.latlng.lat]);
        point.x = reprojectedCoords[0];
        point.y = reprojectedCoords[1];
      }
      
      this.updateMapMarkerPosition(event.latlng);
  
      this.onClick.emit(point);
    }
  }

  public updateMapMarkerPosition(latLng:LatLng|{lat:number, lng:number}, reproject:boolean = false):void
  {
    if( reproject )
    {
      const reprojectedCoords = proj4(this.projectConfiguration.datos_municipio.nombre_proj4, environment.defaultProj4Crs, [latLng.lng, latLng.lat]);
      latLng = new LatLng(reprojectedCoords[1], reprojectedCoords[0]);
    }

    if( ! (latLng instanceof LatLng) )
      latLng = new LatLng(latLng.lat, latLng.lng);

    if( this.lastMapClickMarker )
      this.lastMapClickMarker.remove();

    this.lastMapClickMarker = new Marker(latLng).addTo(this.map);

    this.map.flyTo(this.lastMapClickMarker.getLatLng(), 19);
  }

  public reset():void
  {
    this.removeMarker();
    this.map.flyToBounds((this.projectBBox as any));
  }

  public removeMarker():void
  {
    this.lastMapClickMarker.remove();
  }
}
