import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewChecked,AfterViewInit , OnDestroy, Input,Output,EventEmitter   } from '@angular/core';
import * as L from 'leaflet';
import {EventsService} from 'src/app/services';
import { FormsModule } from '@angular/forms';
import { Router } from "@angular/router";
import { Control, Draw, DrawEvents, drawLocal, DrawMap, featureGroup, FeatureGroup, GeometryUtil, icon, latLng, latLngBounds, LatLngExpression, LatLngTuple, Marker, marker, TileLayer, tileLayer, Toolbar, Util, Polyline, Polygon, MapOptions, LatLngBounds } from 'leaflet';
import proj4 from 'proj4';
import domtoimage from 'dom-to-image-more';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from 'file-saver';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Observable, Observer } from 'rxjs';
import Swal from "sweetalert2";
import { FisotecService } from "src/app/services";
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation, fadeInRightOnEnterAnimation, fadeOutRightOnLeaveAnimation } from 'angular-animations';
import { MapService } from 'src/app/services/unic/map.service';
import { delayExecution } from 'src/app/shared/helpers';
import {  Modulo } from 'src/app/interfaces/medium/mapa/Modulo';
import LeafletWms from "leaflet.wms";
import { ControladorCapasBaseComponent } from '../../../../../../../../../../../projects/views/mapa/herramientas/controlador-capas-base/controlador-capas-base.component';
import { ProjectService } from 'src/app/services/unic/project.service';
import { Project } from 'src/app/interfaces/project';
import { ProjectsService } from 'src/app/services/unic/projects.service';
import { availableScales } from 'src/app/components/shared/map';
import { switchMap, catchError } from 'rxjs/operators';
import { isJsonString } from 'src/app/shared/helpers';
import { ToastrService } from 'ngx-toastr';
require("leaflet.path.drag/src/Path.Drag.js");
require("leaflet-editable/src/Leaflet.Editable.js");
require("src/assets/fonts/Arial-jsPdf.js");
const DURACION_ANIMACION = 250;

type TipoMedicion = "perimetro" | "area";

@Component({
  selector: 'app-mapa-leaft',
  templateUrl: './mapa-leaft.component.html',
  styleUrls: ['./mapa-leaft.component.css']
})
export class MapaLeaftComponent implements AfterViewChecked, OnDestroy{
  @Output() lo_que_envio_mapa = new EventEmitter();
  hijoActivo: boolean = true;
  capasBaseImagen: String[][];
  public editorDeBotoneraEsVisible: boolean = false;

  public toolBarButtonGroups: any[] = [
    {
      key: "Edición",
      value: "edition",
      enabled: true
    },
    {
      key: "Herramientas Zoom",
      value: "zoom",
      enabled: true
    },
    {
      key: "Herramientas GIS",
      value: "GIS",
      enabled: true
    },
    {
      key: "Herramientas mapa",
      value: "streetView",
      enabled: true
    },
    {
      key: "Herramientas medición",
      value: "measurement",
      enabled: true
    },
    {
      key: "Importacion",
      value: "importacion",
      enabled: true
    },
    {
      key: "GMAO",
      value: "gmao",
      enabled: true
    },
    {
      key: "Control de obras",
      value: "obras",
      enabled: true
    }
  ];

  private highlightedElementLayer:TileLayer.WMS;
  public selectedLayer:any;
  modulosProyecto: any[] = [];
  proyeccionProyecto: any;
  nombreProyeccion: string = "";
  datos: any;
  coordenadasPin: any;
  proyectoId: number;
  params$_: Subscription;
  proyectoLocal;
  mapReady: boolean = false;
  cursorCrossHair: boolean = false;
  cursorStreetView: boolean = false;
  cursorZoomZona: boolean = false;
  midiendoZona: Draw.Rectangle;
  southWest: any;
  northEast: any;
  AnalysisCharts:any;
  labelEscalaActual: string = "Escala: 14239";
  public proyectImagen: string;
  pdfFechaActual: string;
  titulo_mapa: string;
  tipo_mapa: string;
  titular_mapa: string;
  promotor_mapa: string;
  capas_formateadas: any;
  height_1:any='532px';
  //INFORMACION
  cursorInformacion: boolean = false;
  respuestaInformacion: any = {};
  hayRespuestaInformacion: boolean = false;

  //CATEGORIZADO
  cursorCategorizado: boolean = false;
  estiloPorDefecto: any;
  //ANALISIS
  cursorAnalisis: boolean = false;
  //GALERIA
  cursorGaleria: boolean = false;
  hayRespuestaGaleria: boolean = false;
  //NUEVO
  cursorNuevo: boolean = false;
  //EDICION
  cursorEdicion: boolean = false;
  hayRespuestaEdicion: boolean = false;
  //COPIAR
  cursorCopiar: boolean = false;
  hayRespuestaCopiar: boolean = false;
  //MOVER
  cursorMover: boolean = false;
  hayRespuestaMover: boolean = false;
  //BORRAR
  cursorBorrar: boolean = false;
  hayRespuestaBorrar: boolean = false;
  //FICHA CENTRO MANDO
  cursorFichasCM: boolean = false;
  //OCULTAR ZOOM
  cursorOcultarZoom: boolean = false;
  //MENU CIRCULAR
  cursorEditarMenu: boolean = false;
  botoneraZoomVisible: boolean = false;
  botoneraVisualizarVisible: boolean = true;
  botoneraHerramientasVisible: boolean = true;
  botoneraExportarVisible: boolean = true;
  botoneraEditarVisible: boolean = true;
  varrr: string;
  layers = [];
  fitBounds: number[][] = [[0, 0]];

  fitBoundsOptions: any = {
    maxZoom: 22,
    animated: true,
  };


  pegmanCoords: LatLngTuple;
  pegmanIcon = icon({
    iconUrl: 'assets/icons/pin_2.png',
    shadowUrl: 'assets/icons/marker-shadow.png',
    iconSize: [30, 30]
  });

  pegmanMarker: Marker = marker(null, { icon: this.pegmanIcon });

  /* CONTROL DE ESCALA */

  @ViewChild('controlDeEscala')
  private controlDeEscala:ElementRef<HTMLElement>;

  public mostrarControlDeEscala:boolean = true;

  public escalasDisponibles:any[] = availableScales;

  public cursorCoordenadas:string;

  public escalaActual:string;

  /*  */

  public datosDeModulos: Array<Modulo>;

  public map: DrawMap;

  public opcionesDeMapa: MapOptions;

  public capaBase: TileLayer = tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    crossOrigin: 'anonymous',
    className: 'OSM',
    maxZoom: 30,
    maxNativeZoom: 19,
    minZoom: 5
  });

  public mostrarSpinner:boolean = false;

  public drawOptions: any;

  public herramientaActualmenteAbierta: string;

  // MEDICION

  public capaDeElementosDibujados: FeatureGroup = featureGroup();

  public medicion: Draw.Polyline | Draw.Polygon;
  public tipoMedicion: TipoMedicion;
  public enMedicion: boolean = false;

  private funcionCierreMedicion: (event: any) => void = event => {
    this.realizarMedicion(event.layer);
    this.crearInstanciaDeMedicion();
    this._changeDetector.detectChanges();
  };

  // BUSCADOR DE DIRECCIONES

  @ViewChild('contenedorDeBuscadorDeDirecciones') contenedorDeBuscadorDeDirecciones;

  @ViewChild('buscadorDeDirecciones')buscadorDeDirecciones ;

  public direccionBuscada:string = null;

  public direccionesSugerida$:Observable<string[]>;

  // HERRAMIENTAS DE MAPA

  @ViewChild(ControladorCapasBaseComponent)
  public ControladorCapasBase: ControladorCapasBaseComponent;
/**/
 NuevoElemento:any;
 FiltroAvanzadoCaracteristicas:any;
 TablaDeElementos:any;
 edicionmultiple:any;
 filtrado:any;
 categorizado:any;
 solcicitud:any;
 ControObraFactura:any;
 ControObraInstalador:any;
 /****/
  // !!
  private routeReuseStrategy:any;
  disable:any=false;
  el_marker:any='';
  select_no_def:any=0;
  constructor(private servicioFisotec: FisotecService,private _mapService: MapService, private _toastrService:ToastrService,private router: Router, private _changeDetector: ChangeDetectorRef, public dialog: MatDialog, private _projectService:ProjectService, private _projectsService:ProjectsService,private event:EventsService) {
    this.event.subscribe('mapa_ampliar', (item) => {
      this.height_1='650px';
    });
    this.event.subscribe('mapa_reducir', (item) => {
      this.height_1='320px';
    });
    this.event.subscribe('mapa_nuevo', (item) => {
      this.disable=false;
    });
    this.event.subscribe('buscar_direcciontextarea', (item) => {
     
     this.direccionBuscada=item;
     this.alBuscarDireccion();
     /*this.buildAddressSearcherObserver();*/
    });
    this.routeReuseStrategy = this.router.routeReuseStrategy.shouldReuseRoute;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.opcionesDeMapa = {
      zoom: 15,
      zoomControl: false,
      center: [40.395347, -3.694041],
      editable: true,
      maxZoom:20
    };

    drawLocal.draw.handlers.polyline.tooltip.start = "Click para empezar a medir.";
    drawLocal.draw.handlers.polyline.tooltip.cont = "Click para seguir.";
    drawLocal.draw.handlers.polyline.tooltip.end = "Click en ultimo punto para terminar.";
    drawLocal.draw.handlers.polygon.tooltip.start = "Click para empezar a medir.";
    drawLocal.draw.handlers.polygon.tooltip.cont = "Click para seguir.";
    drawLocal.draw.handlers.polygon.tooltip.end = "Click en primer punto para terminar.";

    this.drawOptions = {
      draw: {
        marker: false,
        polyline: {
          shapeOptions: {
            color: '#218D8F'
          }
        },
        circle: false,
        polygon: {
          shapeOptions: {
            color: '#218D8F'
          }
        },
        circlemarker: false,
        rectangle: {
          shapeOptions: {
            color: '#218D8F'
          },
          showArea: false
        }
      },
      edit: {
        featureGroup: this.capaDeElementosDibujados
      }
    };
    this.event.subscribe('buscar_direccion', (item) =>{
      this.alBuscarDireccion2(item);
      this.direccionBuscada=item;
    });
    this.event.subscribe('buscar_direccion3', (item) =>{
      this.alBuscarDireccion3(item);
    });
    this.event.subscribe('select_layer', (item) =>{
      this.onSelectLayer(item);
    });
    this.event.subscribe('select_layer2', (item) =>{
      
    });

  }
  onUsuarioSeleccionado(item){
    let valor=item;
     this.lo_que_envio_mapa.emit(valor);
  }
  public async alBuscarDireccion3(item):Promise<void>{
    /*this.disable=true;*/
    if(  this.direccionBuscada.trim()){
      try{
        this.alternarVisibilidadDeSpinner();

        const response = await this._projectsService.consultarApi({
            "funcion": "localizacion_geolocalizar",
            "municipio": this._projectService.configuration.datos_municipio.nombre,
            "direccion": this.direccionBuscada
        });
        if( response.datos.error )
          throw new Error(response.datos.msg_error);

        let bbox = (response.datos.bbox as any[]);
        
        bbox = [ [  bbox[0], bbox[1] ], [ bbox[2], bbox[3] ] ];
        this.map.flyToBounds(bbox, { maxZoom: 30, duration: .50 });
        const bboxCenter = new LatLngBounds(bbox).getCenter();
        /***************************/
        /*
        setTimeout(() => marker.remove(), 5000);
        */
        const marker = new Marker(bboxCenter).addTo(this.map);
        /*this.onSelectLayer2(id_luminaria);*/
      }catch (error){
        console.error(error);
       /* this._toastrService.error(error.message,"Error");*/
      }finally{
        this.alternarVisibilidadDeSpinner();
      }
    }
  }
  public async onSelectLayer_quitarbuffer(layerData:any):Promise<void>{
    try{
     let marker;
      if( this.highlightedElementLayer )
        this.highlightedElementLayer.remove();
      if (this.el_marker=='') {
        }else{
          marker=this.el_marker;
          marker.remove();
          this.el_marker=marker;
        }
      this.selectedLayer = layerData;
      let local=JSON.parse(localStorage.getItem('localizacion'));
      //this.alBuscarDireccion2(local);
    }
    catch (error){
      /*this._toastrService.error(error.message);*/
    }
  }
  public async onSelectLayer_quitarbuffer_colocar_marker_zona(layerData:any):Promise<void>{
    try{
     let marker;
      let local=JSON.parse(localStorage.getItem('localizacion'));
      this.alBuscarDireccion_zona(local);
      if( this.highlightedElementLayer ){
        this.highlightedElementLayer.remove();
      }
       let bbox2 = JSON.parse(localStorage.getItem('valorbbox'));
      let bbox = (bbox2 as any[]);
      bbox = [ [  bbox[0], bbox[1] ], [ bbox[2], bbox[3] ] ];
      const bboxCenter = new LatLngBounds(bbox).getCenter();
      if (bbox2==''){
        if (this.el_marker==''){
          marker.remove();
          this.el_marker=marker;
        }else{
          marker=this.el_marker;
          marker.remove();
          this.el_marker=marker;
        }
        }else{
          if (this.el_marker==''){
          marker.remove();
          this.el_marker=marker;
          }else{
            marker=this.el_marker;
            marker.remove();
            this.el_marker=marker;
          }
        }
    }
    catch (error){
      console.log(error);
      /*this._toastrService.error(error.message);*/
    }
  }
  public async onSelectLayer(layerData:any):Promise<void>{
    try{
     let bbox2 = JSON.parse(localStorage.getItem('valorbbox'));
     let marker;
      setTimeout(() => {
        this.map.flyToBounds(([
          (bbox2 as number[]).slice(0,2).reverse(),
          (bbox2 as number[]).slice(2,4).reverse()
        ] as any),{ maxZoom: 20, duration: .50});
      });

      if( this.highlightedElementLayer )
        this.highlightedElementLayer.remove();
      let la_capa='gissmart_energy#gestlighting#luminaria';
      let luminaria_id=JSON.parse(localStorage.getItem('id_luminaria'));
      const filtroCapa = la_capa.split("#");
      const wmsOptions = {
        layers: filtroCapa.join("_"),
        styles: "buffer_linea",
        className: "informacion_seleccionado",
        format: 'image/png',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 19,
        maxZoom: 30,
        cql_filter: `id_${filtroCapa[2]}='${luminaria_id}'`,
        env: "buffer:30"
      };
      this.highlightedElementLayer = tileLayer.wms(this._projectService.baseUrl, wmsOptions);
      this.map.addLayer(this.highlightedElementLayer);
      let bbox = (bbox2 as any[]);
      bbox = [ [  bbox[0], bbox[1] ], [ bbox[2], bbox[3] ] ];
      const bboxCenter = new LatLngBounds(bbox).getCenter();
      if (bbox2==''){
        if (this.el_marker=='') {
          marker.remove();
          this.el_marker=marker;
        }else{
          marker=this.el_marker;
          marker.remove();
          this.el_marker=marker;
        }
        }else{
          if (this.el_marker==''){
           this.map.removeLayer(marker);
           this.el_marker=marker;
          }else{
           marker=this.el_marker;
           this.map.removeLayer(marker);
           this.el_marker=marker;
          }
        }
      this.selectedLayer = layerData;
      let local=JSON.parse(localStorage.getItem('localizacion'));
      //this.alBuscarDireccion2(local);
    }
    catch (error){
      /*this._toastrService.error(error.message);*/
    }
  }
  public async alBuscarDireccion2(item):Promise<void>{
    this.direccionBuscada=item;
    if(  this.direccionBuscada.trim())
    {
        
      try
      {
        /*this.alternarVisibilidadDeSpinner();*/
        let  marker;
        
        const response = await this._projectsService.consultarApi({
            "funcion": "localizacion_geolocalizar",
            "municipio": this._projectService.configuration.datos_municipio.nombre,
            "direccion": this.direccionBuscada
        });
         localStorage.setItem('valor_amarillo_res',JSON.stringify(response.datos));
        if( response.datos.error )
          throw new Error(response.datos.msg_error);

        let bbox = (response.datos.bbox as any[]);

        bbox = [ [  bbox[0], bbox[1] ], [ bbox[2], bbox[3] ] ];

        let bbox2 = JSON.parse(localStorage.getItem('valorbbox'));
        const bboxCenter = new LatLngBounds(bbox).getCenter();
        if (bbox2==''){
        if (this.el_marker==''){
          marker = new Marker(bboxCenter).addTo(this.map);
          this.el_marker=marker;
        }else{
          marker=this.el_marker;
          this.map.removeLayer(marker);
          marker = new Marker(bboxCenter).addTo(this.map);
          this.el_marker=marker;
        }
        }else{
          if (this.el_marker==''){
          marker = new Marker(bboxCenter).addTo(this.map);
          this.el_marker=marker;
        }else{
          marker=this.el_marker;
          this.map.removeLayer(marker);
          marker = new Marker(bboxCenter).addTo(this.map);
          this.el_marker=marker;
        }
        }

      }
      catch (error)
      {
        console.error(error);
      }
      finally
      {
        this.alternarVisibilidadDeSpinner();
      }
    }
  }
  public async alBuscarDireccion_zona(item):Promise<void>{
    this.direccionBuscada=item;    
    if(  this.direccionBuscada.trim())
    {
      try
      {
        /*this.alternarVisibilidadDeSpinner();*/
        let  marker:any;
        const response = await this._projectsService.consultarApi({
            "funcion": "localizacion_geolocalizar",
            "municipio": this._projectService.configuration.datos_municipio.nombre,
            "direccion": this.direccionBuscada
        });
         localStorage.setItem('valor_amarillo_res',JSON.stringify(response.datos));
        if( response.datos.error )
          throw new Error(response.datos.msg_error);

        let bbox = (response.datos.bbox as any[]);

        bbox = [ [  bbox[0], bbox[1] ], [ bbox[2], bbox[3] ] ];

        let bbox2 = JSON.parse(localStorage.getItem('valorbbox'));
        let bbox3 = (bbox2 as any[]);
         bbox3 = [ [  bbox3[0], bbox3[1] ], [ bbox3[2], bbox3[3] ] ];
        const bboxCenter = new LatLngBounds(bbox3).getCenter();
        if (bbox2==''){
        if (this.el_marker==''){
          marker = new Marker(bboxCenter).addTo(this.map);
          this.el_marker=marker;
        }else{
          marker=this.el_marker;
          marker.remove();
          marker = new Marker(bboxCenter).addTo(this.map);
          this.el_marker=marker;
        }
        }else{
           marker = new Marker(bboxCenter).addTo(this.map);
          this.el_marker=marker;
        }
        /*setTimeout(() => {
          this.map.flyToBounds(([
            (bbox2 as number[]).slice(0,2).reverse(),
            (bbox2 as number[]).slice(2,4).reverse()
          ] as any),{ maxZoom: 20, duration: .50});
        });*/

        /*const bboxCenter = new LatLngBounds(bbox).getCenter();*/

        /*const marker = new Marker(bboxCenter).addTo(this.map);

        setTimeout(() => marker.remove(), 5000);*/

      }
      catch (error)
      {
        console.error(error);
        /*this._toastrService.error(error.message,"Error");*/
      }
      finally
      {
        this.alternarVisibilidadDeSpinner();
      }
    }
  }
  public async onSelectLayer2(layerData,bbox):Promise<void>{
    
    
    try{
     let bbox2 = bbox;
     let bbox3 = (bbox2 as any[]);
         bbox3 = [ [  bbox3[0], bbox3[1] ], [ bbox3[2], bbox3[3] ] ];
     const bboxCenter = new LatLngBounds(bbox3).getCenter();
     setTimeout(()=>{
      let marker;
      if( this.highlightedElementLayer )
        this.highlightedElementLayer.remove();

      let la_capa='gissmart_energy#gestlighting#luminaria';
      let luminaria_id=layerData;
         this.map.flyToBounds(([
          (bbox3 as number[]).slice(0,2).reverse(),
          (bbox3 as number[]).slice(2,4).reverse()
        ] as any),{ maxZoom: 20, duration: .50});
       if (layerData=="No definido"){
         const marker = new Marker(bboxCenter).addTo(this.map);
       }else{
        const filtroCapa = la_capa.split("#");
        const wmsOptions = {
          layers: filtroCapa.join("_"),
          styles: "buffer_linea",
          className: "informacion_seleccionado",
          format: 'image/png',
          crossOrigin: true,
          transparent: true,
          opacity: 1,
          maxNativeZoom: 22,
          maxZoom: 22,
          cql_filter: `id_${filtroCapa[2]}='${luminaria_id}'`,
          env: "buffer:30"
        };
        this.map.flyToBounds(([
          (bbox3 as number[]).slice(0,2).reverse(),
          (bbox3 as number[]).slice(2,4).reverse()
        ] as any),{ maxZoom: 20, duration: .50});
        this.highlightedElementLayer = tileLayer.wms(this._projectService.baseUrl, wmsOptions);
        this.map.addLayer(this.highlightedElementLayer);

       }
        if (this.el_marker==''){
          this.map.addLayer(this.highlightedElementLayer);
        }else{
          marker=this.el_marker;
           this.map.removeLayer(marker);
           marker = new Marker(bboxCenter).addTo(this.map);
          this.el_marker=marker;
        }
      this.selectedLayer = layerData;
         },7000);
    }
    catch (error)
    {
      console.log(error);
      
    /*  this._toastrService.error(error.message);  */
    }
  }
  public async onSelectLayer_no_definido(direccion):Promise<void>{
    this.direccionBuscada=direccion;
    if(  this.direccionBuscada.trim() )
    {
      try
      {
        this.alternarVisibilidadDeSpinner();
        let  marker;
        const response = await this._projectsService.consultarApi({
            "funcion": "localizacion_geolocalizar",
            "municipio": this._projectService.configuration.datos_municipio.nombre,
            "direccion": this.direccionBuscada
        });
        if( response.datos.error ){
          throw new Error(response.datos.msg_error);
        }else{
          if (this.select_no_def==0){
            let bbox = (response.datos.bbox as any[]);
            bbox = [ [  bbox[0], bbox[1] ], [ bbox[2], bbox[3] ] ];
            console.log('select-layer-nodef');
            setTimeout(()=>{
             this.map.flyToBounds(bbox, { maxZoom: 22, duration: .50 });
              const bboxCenter = new LatLngBounds(bbox).getCenter();
              if (this.el_marker=='') {
                marker = new Marker(bboxCenter).addTo(this.map);
                this.el_marker=marker;
              }else{
                marker=this.el_marker;
                marker.remove(marker);
                marker = new Marker(bboxCenter).addTo(this.map);
                this.el_marker=marker;
              }
             },2000);
            this.select_no_def=1;
          }

        }
      }
      catch (error)
      {
        console.error(error);
       /* this._toastrService.error(error.message,"Error");*/
      }
      finally
      {
        this.alternarVisibilidadDeSpinner();
      }
    }
  
  }

  get nombreCapaBaseActual(): string {
    return this.capaBase.options.className;
  }

  get crs():string
  {
    return this._projectService.configuration ? this._projectService.configuration.datos_municipio.nombre_proyeccion : null;
  }


  get proyecto():Project
  {
    return this._projectService.project;
  }
  ngAfterViewInit(): void {
    this.proyectoLocal = this._projectService.project;
    this.proyectoId = this.proyectoLocal.id_proyecto;
    sessionStorage.setItem('proyecto', JSON.stringify(this.proyectoLocal));
    this.openProject();
    //this.buildAddressSearcherObserver();
  }

  private buildAddressSearcherObserver():void{
    
    this.direccionesSugerida$ = new Observable((observer: Observer<string>) => {
      observer.next(this.direccionBuscada);
    })
    .pipe(
      switchMap( async (query: string) => {
      
        
        if (query){
          const response = await this._projectsService.consultarApi({
              "funcion": "localizacion_rellenar",
              "municipio": this._projectService.configuration.datos_municipio.nombre,
              "direccion": query
          });
          let direccion_sug=response.datos.direcciones || [];
          this.event.publish('direccion_sugerida',direccion_sug);
          return response.datos.direcciones || [];

        }else{
          let direccion_sug=[];
          this.event.publish('direccion_sugerida',direccion_sug);
          return [];
        }
      }),
      catchError(error => {
        console.log(error);
        if( isJsonString(error.message) )
        {
          console.error(error);
          this._toastrService.error(error.message,"Error");
        }

        return [];
      })
    );
  }

  public async alBuscarDireccion():Promise<void>{
    if(  this.direccionBuscada.trim() )
    {
      try
      {
        this.alternarVisibilidadDeSpinner();
        let  marker;
        const response = await this._projectsService.consultarApi({
            "funcion": "localizacion_geolocalizar",
            "municipio": this._projectService.configuration.datos_municipio.nombre,
            "direccion": this.direccionBuscada
        });
        let item1=1;
        /*BUSCA SI EXISTE EL MARKER*/
        if( this.highlightedElementLayer )
          this.highlightedElementLayer.remove();
        if (this.el_marker=='' || this.el_marker==undefined) {
          }else{
            marker=this.el_marker;
            marker.remove();
            this.el_marker=marker;
          }
        /***************************/
        if( response.datos.error )
          throw new Error(response.datos.msg_error);
        let bbox = (response.datos.bbox as any[]);
        let bbox2=response.datos.bbox;
        let bbox3=bbox2[0]+','+bbox2[1]+','+bbox2[2]+','+bbox2[3];
        bbox = [ [  bbox[0], bbox[1] ], [ bbox[2], bbox[3] ] ];
        this.map.flyToBounds(bbox, { maxZoom: 22, duration: .50 });
        let item=1;
        this.event.publish('zona_marcada', item);
        localStorage.setItem('valorbboxguardar',JSON.stringify(bbox3));
        const bboxCenter = new LatLngBounds(bbox).getCenter();
       if (bbox2==''){
        if(this.el_marker=='' || this.el_marker==undefined){
            marker = new Marker(bboxCenter).addTo(this.map);
            this.el_marker=marker;
          }else{
            marker=this.el_marker;
            marker.remove();
            marker = new Marker(bboxCenter).addTo(this.map);
            this.el_marker=marker;
          }
        }else{
          if(this.el_marker=='' || this.el_marker==undefined){
            marker = new Marker(bboxCenter).addTo(this.map);
            this.el_marker=marker;
          }else{
            marker=this.el_marker;
            marker.remove();
            marker = new Marker(bboxCenter).addTo(this.map);
            this.el_marker=marker;
          }
        }


      }
      catch (error)
      {
        console.error(error);
       /* this._toastrService.error(error.message,"Error");*/
      }
      finally
      {
        this.alternarVisibilidadDeSpinner();
      }
    }
  }

  public alternarVisibilidadDeSpinner():void
  {
    this.mostrarSpinner = ! this.mostrarSpinner;
  }


  @HostListener("window:scroll",["$event"])
  @HostListener("window:resize", ["$event"])
  public establecerPosicionDeBuscadorDeDirecciones(event?:any):void
  {
    if( event )
    {
      /*this.buscadorDeDirecciones.nativeElement.style.left = this.contenedorDeBuscadorDeDirecciones.nativeElement.getBoundingClientRect().x + "px";
      this.buscadorDeDirecciones.nativeElement.style.top = this.contenedorDeBuscadorDeDirecciones.nativeElement.getBoundingClientRect().y + "px"; */
    }
  }

  public cambiarCapaBase(capa: TileLayer): void {
    this.capaBase = capa;
  }

  //Función que recibirá el nombre de una capa base y devolverá la url con su imagen
  urlDeCapaBase(titulo: string): string {
    let url: string = "";

    for (let [key, value] of this.capasBaseImagen) {
      if (key === titulo) {
        url = value + "";
      }
    }

    return url;
  }

  //Una vez cargada la vista, creamos la barra de herramientas y el div con las coordenadas
  public ngAfterViewChecked():void
  {
    this._changeDetector.detectChanges();
    this.establecerPosicionDeBuscadorDeDirecciones(true);
  }

  getInfoProyecto() {
    this.proyectImagen = JSON.parse(sessionStorage.getItem('proyecto')).icono;

    const datosInformacion = JSON.stringify({
      funcion: "informacion_modulos_proyecto",
      tipo: "web",
      usuario: sessionStorage.getItem('usuario'),
      clave_sesion: sessionStorage.getItem('clave_sesion'),
      plugin: sessionStorage.getItem('plugin'),
      id_proyecto: this.proyectoId,
    });

    this.servicioFisotec.conexionBackend(datosInformacion).then((res) => {
      if (!res.error) {
        let contador = 0;
        //Almacenamos el estilo por defecto
        this.estiloPorDefecto = res.estilos;
        //Obtemos la url base del proyecto y la parseamos para para preparla para hacer peticiones
        let url = this.proyectoLocal.url_base.split('wms?')[0] + "wms?";

        //Guardamos las imagenes para las capas base del mapa
        this.capasBaseImagen = [];
        for (let [key, value] of Object.entries(res.capas_base)) {
          this.capasBaseImagen.push([value["titulo"], value["url_image"]]);
        }

        const layerNames = [];
       
        /* CREAR OBJETO QUE CONTENDRA ESTRUTURA MODULOS > GRUPOS > CAPAS
        // EL CUAL PODRA SER USADO PARA UBICAR DATOS NECESARIOS RAPIDAMENTE.
        */

        this.datosDeModulos = res.modulos.map(datosDeModulo => {

          return {
            nombre: datosDeModulo.modulo,
            nombre_formateado: datosDeModulo.modulo_formateado,
            grupos: Object.keys(datosDeModulo.dic_modulo).map(nombreGrupo => {

              return {
                nombre: nombreGrupo,
                nombre_formateado: datosDeModulo.grupos_formateados[nombreGrupo],
                capas: datosDeModulo.dic_modulo[nombreGrupo].map(nombreDeCapa => {

                  const filtro_capa = Object.keys(datosDeModulo.tipos_geometria).find(
                    capaFiltro => capaFiltro.split("#")[capaFiltro.split("#").length - 1] === datosDeModulo.capas_formateadas[nombreDeCapa]
                  );

                  return {
                    nombre: nombreDeCapa,
                    nombre_formateado: datosDeModulo.capas_formateadas[nombreDeCapa],
                    filtro_capa: filtro_capa,
                    tipo_geometria: datosDeModulo.tipos_geometria[filtro_capa],
                    capaWms: null,
                    proyectado: true
                  };

                }),
                proyectado: true
              };

            }),
            proyectado: true
          }

        });

        this.layers = [];

        Object.keys(res.estilos).forEach((i) => {
          const structure = i.split('#').join('_');
          const moduleName = i.split('#')[2];
          const layerStyle = res.estilos[i];
          const layerName = moduleName.split('_').join(' ').toUpperCase();
          const wmsLayer =  LeafletWms.overlay(url, {
            layers: structure,
            styles: layerStyle,
            className: moduleName,
            format: 'image/png',
            crossOrigin: true,
            transparent: true,
            opacity: 1,
            maxNativeZoom: 22,
            maxZoom: 22,
            tiled: false,
            zIndex: 1000 - (this.layers.length + 1),
            interactive: true
          });

          layerNames.push(layerName);

          this.layers.push(wmsLayer);

          const nombreDeCapa = layerName.charAt(0) + layerName.substring(1).toLowerCase();

          this.datosDeModulos.forEach(modulo => {

            modulo.grupos.forEach(grupo => {

              const capaExisteEnElGrupo = grupo.capas.some( datosDeCapa => datosDeCapa.nombre === nombreDeCapa);

              if (capaExisteEnElGrupo)
              {
                grupo.capas = grupo.capas.map(datosDeCapa => {

                  if (datosDeCapa.nombre === nombreDeCapa)
                    datosDeCapa.capaWms = wmsLayer;

                  return datosDeCapa;

                });
              }

            });

          });

        });

        this.modulosProyecto = res.modulos;

        //Quitamos el spinner y mostramos el mapa
        this.mapReady = true;
        let elemento_id=JSON.parse(localStorage.getItem('elemento_id'));
        if (elemento_id=='No definido'){
         setTimeout(()=>{
          let direccion_2=JSON.parse(localStorage.getItem('direccion_2'));
          this.onSelectLayer_no_definido(direccion_2);
         },5000);
        }
        setTimeout(()=>{
         this.onInformacion();
         },10000);
      } else {
        Swal.fire({
          icon: "error",
          title: "ERROR",
          text: res.msg_error,
          confirmButtonText: "OK",
        }).then(() => {
          if (res.msg_error.includes("expirada")) {
            this.router.navigate(["/login"]);
          }
        });
      }
    });
  }

  openProject() {
    const datos = JSON.stringify({
      funcion: "entrar_proyecto",
      tipo: "web",
      usuario: sessionStorage.getItem('usuario'),
      clave_sesion: sessionStorage.getItem('clave_sesion'),
      plugin: sessionStorage.getItem('plugin'),
      id_proyecto: this.proyectoId,
      proyeccion: this.proyectoLocal.proyeccion,
      bd_proyecto: this.proyectoLocal.bd_proyecto,
    });

    this.servicioFisotec.conexionBackend(datos).then((res) => {
      if (!res.error) {

        //Guardamos la proyección del proyecto en una variable global
        this.proyeccionProyecto = <Map<string, string>>res.datos.proyeccion_formateada;
        this.nombreProyeccion = this.proyeccionProyecto.nombre_proyeccion;

        const bounds = (res?.datos?.bbox || []).reverse();
        this.fitBounds = [];
        this.fitBounds.push([bounds[2], bounds[3]]);
        this.fitBounds.push([bounds[0], bounds[1]]);

        this.northEast = [bounds[0], bounds[1]];
        this.southWest = [bounds[2], bounds[3]];
        this.getInfoProyecto();
      } else {

        //Si hay un error, lo mostramos en una alerta
        this._changeDetector.detectChanges();
        Swal.fire({
          icon: "error",
          title: "Ups...",
          text: res.msg_error,
          confirmButtonText: "OK",

          //Si el error ha sido por sesión expirada, redirigimos a la pantalla de login
        }).then(() => {
          if (res.msg_error.includes("expirada")) {
            this.router.navigate(["login"]);
          }
        });
      }
    });
  }

  public alCambiarSelectorDeEscala(event: any): void {
    this.map.setZoom(event.target.value);
    this.escalaActual = 'Escala: 1:' + this.getEscala();
  }

  public actualizarCursorDeCoordenadas(e: any): void {    
    if (this._projectService.configuration.datos_municipio){
      const reprojectedCoords = proj4(this._projectService.configuration.datos_municipio.nombre_proj4, [e.latlng.lng, e.latlng.lat]);
      this.cursorCoordenadas = 'X: ' + reprojectedCoords[0].toLocaleString() + ' Y: ' + reprojectedCoords[1].toLocaleString();
      this.escalaActual = 'Escala: 1:' + this.getEscala();
    }
  }

  public zoomEvento() {
    if (this.map) {
      this.labelEscalaActual = 'Escala: 1:' + this.getEscala();
    }
  }

  private getEscala(): number {
    return this._mapService.getScale();
  }

  onZoomMas() {
    this.map.zoomIn();
  }

  onZoomMenos() {
    this.map.zoomOut();
  }

  onZoomZona() {
    this.cursorZoomZona = !this.cursorZoomZona;
    if (!this.cursorZoomZona) {
      this.midiendoZona.disable();
      this.map.off('draw:created');
    } else {
      this.map.on('draw:created', (e) => {
        this.onDrawCreated(e);
      });
      drawLocal.draw.handlers.rectangle.tooltip.start = "";
      drawLocal.draw.handlers.simpleshape.tooltip.end = "";
      this.midiendoZona = new Draw.Rectangle(this.map, this.drawOptions.draw.rectangle);
      this.midiendoZona.enable();
    }
  }

  onZoomExtender() {
    var bounds = latLngBounds(this.southWest, this.northEast);
    this.map.flyToBounds(bounds);
  }

  onGaleria() {

    this.cerrarHerramientas("galeria");
    const divMap = this._mapService.map.getContainer();
    this.cursorGaleria = !this.cursorGaleria;
    if (!this.cursorGaleria) {
      divMap.classList.remove('cursorHelp');
      this.map.off('click');
      this.respuestaInformacion = null;
      this.hayRespuestaGaleria = false;



    }
    else {
      divMap.classList.add('cursorHelp');

      //Añadimos un temporizador para asegurarnos de que se han cerrado los eventos de otras herramientas
      setTimeout(() => {
        this.map.on('click', (e) => {
          this.onMapClick(e, "web_informacion_fotos");
        });
      }, 1000);
    }
  }

  //Información - Se ha pulsado el botón de información
  public onInformacion() {
      //Añadimos un temporizador para asegurarnos de que se han cerrado los eventos de otras herramientas
      setTimeout(() => {
        this.map.on('click', (e) => {
           localStorage.setItem('valorbbox',JSON.stringify(''));
            this.lo_que_envio_mapa.emit(e);
           
        });
      }, 1000);
    this.cerrarHerramientas("informacion");
  }

  actualizarLayerInfo() {
    this._changeDetector.detectChanges();
  }

  zoomZonaInfo(e) {
    var coor = e.reverse();
    var ne: LatLngExpression = [coor[0], coor[1]];
    var sw: LatLngExpression = [coor[2], coor[3]];
    var bounds = latLngBounds(sw, ne);
    this.map.fitBounds(bounds, { maxZoom: 20 });
  }

  informacionCerrado() {
    this.onInformacion();
  }

  galeriaCerrado() {
    this.onGaleria();
  }



  onCategorizado() {
    this.cerrarHerramientas("categorizado");

    this.cursorCategorizado = !this.cursorCategorizado;
    if (!this.cursorCategorizado) {

    } else {

    }
  }

  //Street View
  onStreetView() {

    this.herramientaActualmenteAbierta ="StreetViewMap";
    this.cerrarHerramientas("streetview");

    // Botones dentro de la barra superior
    this.cursorStreetView = !this.cursorStreetView;
    this.cursorCrossHair = !this.cursorCrossHair;
    this.pegmanCoords = this.cursorCrossHair ? this.pegmanCoords : null;

    if (!this.cursorStreetView) {

      this.pegmanMarker.remove();
      this.pegmanMarker.setLatLng(null);
      this.map.off('click');
      this._changeDetector.detectChanges();
      this._changeDetector.markForCheck();

    } else {
      setTimeout(() => {
        this.map.on('click', (e: any) => {
          if (this.cursorCrossHair) {
            this.pegmanCoords = [e.latlng.lat, e.latlng.lng];
            if (!this.pegmanMarker.getLatLng()) {
              this.pegmanMarker.setLatLng(this.pegmanCoords).addTo(this.map);
            } else {
              this.pegmanMarker.setLatLng(this.pegmanCoords);
            }

            this._changeDetector.detectChanges();
            this._changeDetector.markForCheck();
          }
        });
        this.herramientaActualmenteAbierta = null;

      }, 300);

    }
  }

  //Imprimir
  onImprimir() {

    document.getElementById('capturandoImagen').classList.remove('hidden');

    if (this.esIE()) {

      html2canvas(this._mapService.map.getContainer(), {
        allowTaint: true,
        useCORS: true
      }).then((canvas) => {
        canvas.toBlob(function (blob) {
          saveAs(blob, "image.png");
        }, 'image/png');

        document.getElementById('capturandoImagen').classList.add('hidden');
      }).catch(function (error) {
        document.getElementById('capturandoImagen').classList.add('hidden');
      
      });

    } else {

      domtoimage.toJpeg(this._mapService.map.getContainer(), {
        width: this.map.getSize().x,
        //height: this.map.getSize().y

      })
        .then(function (dataUrl) {
          var link = document.createElement('a');
          link.download = 'image.jpeg';
          link.href = dataUrl;
          link.click();
          document.getElementById('capturandoImagen').classList.add('hidden');
        }).catch(function (error) {
          document.getElementById('capturandoImagen').classList.add('hidden');
        
        }
        );
    }
  }

  //PDF


  //Nuevo
  onNuevo() {

    //En primer lugar, comprobaremos si hay otras herramientas abiertas, en cuyo caso las cerraremos
    this.cerrarHerramientas("nuevo");

    this.cursorNuevo = !this.cursorNuevo;
    if (!this.cursorNuevo) {
      this.map.off('click');


    } else {


    }

  }

  nuevoCerrado() {
    this.onNuevo();
  }

  //Edición
  onEdicion() {
    this.cerrarHerramientas("edicion");

    const divMap = this._mapService.map.getContainer();
    this.cursorEdicion = !this.cursorEdicion;
    if (!this.cursorEdicion) {
      divMap.classList.remove('cursorHelp');
      divMap.classList.remove('cursorNotAllowed');
      this.map.off('click');
      this.respuestaInformacion = null;
      this.hayRespuestaEdicion = false;


    } else {


      //Personalizamos el cursor que habrá sobre el mapa, poniendo el de help
      divMap.classList.add('cursorHelp');

      //Añadimos un temporizador para asegurarnos de que se han cerrado los eventos de otras herramientas
      setTimeout(() => {
        //Añadimos un evento que escucha un click sobre el mapa
        this.map.on('click', (e) => {

          //Llamamos a la función que gestionará dicho click, indicando la función que queremos llamar en el backend
          this.onMapClick(e, "informacion_edicion_alfanumerica_web");

          //Una vez hecho el click, deshabilitamos un nuevo click y cambiamos el cursor a not allowed
          this.map.off('click');
          divMap.classList.remove('cursorHelp');
          divMap.classList.add('cursorNotAllowed');
        });
      }, 1000);

    }
  }

  //Función que habilitará de nuevo el hacer click sobre el mapa para la edición
  permitirNuevoClickEdicion() {

    //Personalizamos el cursor que habrá sobre el mapa, poniendo el de help
    const divMap = this._mapService.map.getContainer();
    divMap.classList.remove('cursorNotAllowed');
    divMap.classList.add('cursorHelp');

    //Añadimos un evento que escucha un click sobre el mapa
    this.map.on('click', (e) => {

      //Llamamos a la función que gestionará dicho click, indicando la función que queremos llamar en el backend
      this.onMapClick(e, "informacion_edicion_alfanumerica_web");

      //Una vez hecho el click, deshabilitamos un nuevo click y cambiamos el cursor a not allowed
      this.map.off('click');
      divMap.classList.remove('cursorHelp');
      divMap.classList.add('cursorNotAllowed');
      this._changeDetector.detectChanges();
    });
  }

  edicionCerrado() {
    this.onEdicion();
  }

  //Copiar
  onCopiar() {
    this.cerrarHerramientas("copiar");

    const divMap = this._mapService.map.getContainer();
    this.cursorCopiar = !this.cursorCopiar;

    //Si estamos cerrando la herramienta
    if (!this.cursorCopiar) {
      divMap.classList.remove('cursorHelp');
      divMap.classList.remove('cursorNotAllowed');
      divMap.classList.remove('cursorCrossHair');
      this.map.off('click');
      this.respuestaInformacion = null;
      this.hayRespuestaCopiar = false;


      //Si estamos abriendo la herramienta
    } else {


      //Personalizamos el cursor que habrá sobre el mapa, poniendo el de help
      divMap.classList.add('cursorHelp');

      //Añadimos un temporizador para asegurarnos de que se han cerrado los eventos de otras herramientas
      setTimeout(() => {
        //Añadimos un evento que escucha un click sobre el mapa
        this.map.on('click', (e) => {

          //Llamamos a la función que gestionará dicho click, indicando la función que queremos llamar en el backend
          this.onMapClick(e, "informacion_copia_web");

          //Una vez hecho el click, deshabilitamos un nuevo click y cambiamos el cursor a not allowed
          this.map.off('click');
          divMap.classList.remove('cursorHelp');
          divMap.classList.add('cursorNotAllowed');
        });
      }, 1000);
    }

  }

  //Función que habilitará de nuevo el hacer click sobre el mapa para la edición
  permitirNuevoClickCopiar() {

    //Personalizamos el cursor que habrá sobre el mapa, poniendo el de help
    const divMap = this._mapService.map.getContainer();
    divMap.classList.remove('cursorNotAllowed');
    divMap.classList.add('cursorHelp');
    this.hayRespuestaCopiar = false;

    //Añadimos un evento que escucha un click sobre el mapa
    this.map.on('click', (e) => {

      //Llamamos a la función que gestionará dicho click, indicando la función que queremos llamar en el backend
      this.onMapClick(e, "informacion_copia_web");

      //Una vez hecho el click, deshabilitamos un nuevo click y cambiamos el cursor a not allowed
      this.map.off('click');
      divMap.classList.remove('cursorHelp');
      divMap.classList.add('cursorNotAllowed');
      this._changeDetector.detectChanges();
    });
  }

  copiarCerrado() {
    this.onCopiar();
    this._changeDetector.detectChanges();
  }

  //Mover
  onMover() {
    this.cerrarHerramientas("mover");

    const divMap = this._mapService.map.getContainer();
    this.cursorMover = !this.cursorMover;

    //Si estamos cerrando la herramienta
    if (!this.cursorMover) {
      divMap.classList.remove('cursorHelp');
      divMap.classList.remove('cursorNotAllowed');
      divMap.classList.remove('cursorCrossHair');
      this.map.off('click');
      this.respuestaInformacion = null;
      this.hayRespuestaMover = false;


      //Si estamos abriendo la herramienta
    } else {


      //Personalizamos el cursor que habrá sobre el mapa, poniendo el de help
      divMap.classList.add('cursorHelp');

      //Añadimos un temporizador para asegurarnos de que se han cerrado los eventos de otras herramientas
      setTimeout(() => {
        //Añadimos un evento que escucha un click sobre el mapa
        this.map.on('click', (e) => {

          //Llamamos a la función que gestionará dicho click, indicando la función que queremos llamar en el backend
          this.onMapClick(e, "informacion_mover_web");

          //Una vez hecho el click, deshabilitamos un nuevo click y cambiamos el cursor a not allowed
          this.map.off('click');
          divMap.classList.remove('cursorHelp');
          divMap.classList.add('cursorNotAllowed');
        });
      }, 1000);
    }

  }

  //Función que habilitará de nuevo el hacer click sobre el mapa para la edición
  permitirNuevoClickMover() {

    //Personalizamos el cursor que habrá sobre el mapa, poniendo el de help
    const divMap = this._mapService.map.getContainer();
    divMap.classList.remove('cursorNotAllowed');
    divMap.classList.add('cursorHelp');
    this.hayRespuestaMover = false;

    //Añadimos un evento que escucha un click sobre el mapa
    this.map.on('click', (e) => {

      //Llamamos a la función que gestionará dicho click, indicando la función que queremos llamar en el backend
      this.onMapClick(e, "informacion_mover_web");

      //Una vez hecho el click, deshabilitamos un nuevo click y cambiamos el cursor a not allowed
      this.map.off('click');
      divMap.classList.remove('cursorHelp');
      divMap.classList.add('cursorNotAllowed');
      this._changeDetector.detectChanges();
    });
  }

  moverCerrado() {
    this.onMover();
    this._changeDetector.detectChanges();
  }

  //Borrar
  onBorrar() {
    this.cerrarHerramientas("borrar");

    const divMap = this._mapService.map.getContainer();
    this.cursorBorrar = !this.cursorBorrar;

    //Si estamos cerrando la herramienta
    if (!this.cursorBorrar) {
      divMap.classList.remove('cursorHelp');
      divMap.classList.remove('cursorNotAllowed');
      divMap.classList.remove('cursorCrossHair');
      this.map.off('click');
      this.respuestaInformacion = null;
      this.hayRespuestaBorrar = false;


      //Si estamos abriendo la herramienta
    } else {


      //Personalizamos el cursor que habrá sobre el mapa, poniendo el de help
      divMap.classList.add('cursorHelp');

      //Añadimos un temporizador para asegurarnos de que se han cerrado los eventos de otras herramientas
      setTimeout(() => {
        //Añadimos un evento que escucha un click sobre el mapa
        this.map.on('click', (e) => {

          //Llamamos a la función que gestionará dicho click, indicando la función que queremos llamar en el backend
          this.onMapClick(e, "informacion_borrar_web");

          //Una vez hecho el click, deshabilitamos un nuevo click y cambiamos el cursor a not allowed
          this.map.off('click');
          divMap.classList.remove('cursorHelp');
          divMap.classList.add('cursorNotAllowed');
        });
      }, 1000);
    }
  }

  //Función que habilitará de nuevo el hacer click sobre el mapa para el borrado
  permitirNuevoClickBorrar() {

    //Personalizamos el cursor que habrá sobre el mapa, poniendo el de help
    const divMap = this._mapService.map.getContainer();
    divMap.classList.remove('cursorNotAllowed');
    divMap.classList.add('cursorHelp');
    this.hayRespuestaBorrar = false;

    //Añadimos un evento que escucha un click sobre el mapa
    this.map.on('click', (e) => {

      //Llamamos a la función que gestionará dicho click, indicando la función que queremos llamar en el backend
      this.onMapClick(e, "informacion_borrar_web");

      //Una vez hecho el click, deshabilitamos un nuevo click y cambiamos el cursor a not allowed
      this.map.off('click');
      divMap.classList.remove('cursorHelp');
      divMap.classList.add('cursorNotAllowed');
      this._changeDetector.detectChanges();
    });
  }

  borrarCerrado() {
    this.onBorrar();
    this._changeDetector.detectChanges();
  }

  onFichasCM() {
    this.cerrarHerramientas("fichas_centro_mando");

    this.cursorFichasCM = !this.cursorFichasCM;

    //Si estamos cerrando la herramienta
    if (!this.cursorFichasCM) {



      //Si estamos abriendo la herramienta
    } else {

    }
  }

  fichasCMCerrado() {
    this.onFichasCM();
    this._changeDetector.detectChanges();
  }

  public async alternarVisibilidadDeEditorDeBotonera(): Promise<void> {
    if (this.herramientaActualmenteAbierta)
      await this.alternarVisibilidadDeSeccion(this.herramientaActualmenteAbierta);
    this.editorDeBotoneraEsVisible = !this.editorDeBotoneraEsVisible;

    await delayExecution(DURACION_ANIMACION);
  }


  public toggleToolbarButtonGroupVisibility(buttonGroup: any): void {
    buttonGroup.enabled = !buttonGroup.enabled;
  }
  public toolbarButtonGroupIsEnabled(value: string): boolean {
    return this.toolBarButtonGroups.find(btnGroup => btnGroup.value === value).enabled;
  }

  //Editar Menu
  onEditarMenu() {
    this.cerrarHerramientas("editarmenu");
    this.cursorEditarMenu = !this.cursorEditarMenu;
  }

  //Función que cerrará si hay alguna herramienta abierta, a excepción de la que se le indique
  public async cerrarHerramientas(actual: string): Promise<void> {

    if (this.cursorInformacion && actual !== "informacion") {
      this.onInformacion();
    }
    if (this.cursorGaleria && actual !== "galeria") {
      this.onGaleria();
    }

    if (this.cursorEditarMenu && actual !== "editarmenu") {
      this.onEditarMenu();
    }
    if (this.cursorNuevo && actual !== "nuevo") {
      this.onNuevo();
    }
    if (this.cursorEdicion && actual !== "edicion") {
      this.onEdicion();
    }
    if (this.cursorCopiar && actual !== "copiar") {
      this.onCopiar();
    }
    if (this.cursorMover && actual !== "mover") {
      this.onMover();
    }
    if (this.cursorBorrar && actual !== "borrar") {
      this.onBorrar();
    }
    if (this.cursorFichasCM && actual !== "fichas_centro_mando") {
      this.onFichasCM();
    }
    if (this.cursorStreetView && actual !== "streetview") {
      this.onStreetView();
    }
    await delayExecution(DURACION_ANIMACION);
  }

  public async onMapReady(mapa: DrawMap):Promise<void>
  {
    const projectConfiguration = (await this._projectsService.getProjectConfigurationInfo(this.proyecto.id_proyecto)).datos;

    this._projectService.setConfiguration(projectConfiguration);

    this.map = mapa;

    this.map.on('click', (e: any) => {
      if (this.cursorCrossHair) {
        this.pegmanCoords = [e.latlng.lat, e.latlng.lng];
        if (!this.pegmanMarker.getLatLng()) {
          this.pegmanMarker.setLatLng(this.pegmanCoords).addTo(this.map);
        } else {
          this.pegmanMarker.setLatLng(this.pegmanCoords);
        }

        this._changeDetector.detectChanges();
        this._changeDetector.markForCheck();
      }
    })

    this.map.addInitHook = () => {

      const drawToolbar = Toolbar.extend({

        options: {
          polyline: {},
          polygon: {},
          rectangle: {},
          circle: {},
          marker: {}
        },

        initialize: function (options) {
          // Ensure that the options are merged correctly since L.extend is only shallow
          for (var type in this.opcionesDeMapa) {
            if (this.opcionesDeMapa.hasOwnProperty(type)) {
              if (options[type]) {
                options[type] = Object.assign({}, this.opcionesDeMapa[type], options[type]);
              }
            }
          }

          this._toolbarClass = 'leaflet-draw-draw';
        },

        getModeHandlers: function (map) {
          return [
            {
              enabled: this.opcionesDeMapa.polyline,
              handler: new Draw.Polyline(map, this.opcionesDeMapa.polyline),
              title: drawLocal.draw.toolbar.buttons.polyline
            },
            {
              enabled: this.opcionesDeMapa.polygon,
              handler: new Draw.Polygon(map, this.opcionesDeMapa.polygon),
              title: drawLocal.draw.toolbar.buttons.polygon
            },
            {
              enabled: this.opcionesDeMapa.rectangle,
              handler: new Draw.Rectangle(map, this.opcionesDeMapa.rectangle),
              title: drawLocal.draw.toolbar.buttons.rectangle
            },
            {
              enabled: this.opcionesDeMapa.circle,
              handler: new Draw.Circle(map, this.opcionesDeMapa.circle),
              title: drawLocal.draw.toolbar.buttons.circle
            },
            {
              enabled: this.opcionesDeMapa.marker,
              handler: new Draw.Marker(map, this.opcionesDeMapa.marker),
              title: drawLocal.draw.toolbar.buttons.marker
            }
          ];
        },

        // Get the actions part of the toolbar
        getActions: function (handler) {
          return [
            {
              enabled: handler.deleteLastVertex,
              title: drawLocal.draw.toolbar.undo.title,
              text: drawLocal.draw.toolbar.undo.text,
              callback: handler.deleteLastVertex,
              context: handler
            },
            {
              title: drawLocal.draw.toolbar.actions.title,
              text: drawLocal.draw.toolbar.actions.text,
              callback: this.disable,
              context: this
            }
          ];
        },

        setOptions: function (options) {
          for (var type in this._modes) {
            if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
              this._modes[type].handler.setOptions(options[type]);
            }
          }
        }
      });

      const drawControl = Control.extend({
        options: {
          position: 'bottomleft',
          draw: {},
          edit: false
        },

        initialize: function (options) {
          var id, toolbar;

          this._toolbars = {};

          // Initialize toolbars
          if (drawToolbar && this.opcionesDeMapa.draw) {
            toolbar = new drawToolbar();
            id = Util.stamp(toolbar);
            this._toolbars[id] = toolbar;

            // Listen for when toolbar is enabled
            this._toolbars[id].on('enable', this._toolbarEnabled, this);
          }
        },
      });

      const newDrawControl = new drawControl();
      this.map.addControl(newDrawControl);
    };

    this.map.addLayer(this.capaDeElementosDibujados);

    this._mapService.next(mapa);
  }

  visibleLayers(event) {
    this.layers.forEach(element => {
      const className = element.options.className;
      if (!event.includes(className)) {
        element.setOpacity(0);
      } else {
        element.setOpacity(1);
      }
    });

  }

  updateStreetViewMap(event) {
    this.map.flyTo([event.lat() - 0.0005, event.lng()], 18, { duration: 0.5, })
    this.pegmanMarker.setLatLng([event.lat(), event.lng()])
  }

  public onDrawCreated(e: any) {
    if (this.cursorZoomZona) {
      this.capaDeElementosDibujados.addLayer((e as DrawEvents.Created).layer);
      this.map.flyToBounds(this.capaDeElementosDibujados.getBounds());
      this.capaDeElementosDibujados.clearLayers();
      this.onZoomZona();
    }
  }

  public onDrawEditStop(e: any) {
    this.capaDeElementosDibujados.addLayer((e as DrawEvents.EditStop).target);
  }




  //Menu Circular - Pulsado boton
  onClickBtZoom() {
    this.botoneraZoomVisible = !this.botoneraZoomVisible;
  }

  onClickBtVisualizar() {
    this.botoneraVisualizarVisible = !this.botoneraVisualizarVisible;
  }

  onClickBtHerramientas() {
    this.botoneraHerramientasVisible = !this.botoneraHerramientasVisible;
  }

  onClickBtExportar() {
    this.botoneraExportarVisible = !this.botoneraExportarVisible;
  }

  onClickBtEditar() {
    this.botoneraEditarVisible = !this.botoneraEditarVisible;
  }

  //Funcion que devuelve true si el navegador es internet explorer
  esIE(): boolean {
    let ua = navigator.userAgent;
    let es_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
    return es_ie;
  }

  //devuelve la fecha actual en formato mes YYYY
  fechaActual(): string {
    let fecha = "";
    let mesActual = new Date().getMonth() + 1;

    switch (mesActual) {
      case 1: fecha = "Enero"
        break;
      case 2: fecha = "Febrero"
        break;
      case 3: fecha = "Marzo"
        break;
      case 4: fecha = "Abril"
        break;
      case 5: fecha = "Mayo"
        break;
      case 6: fecha = "Junio"
        break;
      case 7: fecha = "Julio"
        break;
      case 8: fecha = "Agosto"
        break;
      case 9: fecha = "Septiembre"
        break;
      case 10: fecha = "Octubre"
        break;
      case 11: fecha = "Noviembre"
        break;
      case 12: fecha = "Diciembre"
        break;
    }

    return fecha + " " + new Date().getFullYear();
  }

  //metodo que exporta el pdf
  exportarPdf(): void {
    document.getElementById('td_titulo_mapa').innerHTML = this.titulo_mapa;
    document.getElementById('td_tipo_mapa').innerHTML = this.tipo_mapa;
    document.getElementById('td_titular_mapa').innerHTML = this.titular_mapa;
    document.getElementById('td_promotor_mapa').innerHTML = this.promotor_mapa;
    document.getElementById('td_fecha_actual').innerHTML = this.pdfFechaActual;

    document.getElementById('infoPdf').classList.remove('none');
    document.getElementById('capturandoImagen').classList.remove('hidden');

    if (this.esIE()) {

      let h = this._mapService.map.getContainer().getBoundingClientRect().height + document.getElementById('infoPdf').getBoundingClientRect().height;
      const pdf = new jsPDF('landscape', 'px', [this.map.getSize().x, h]);
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();

      html2canvas(this._mapService.map.getContainer(), {
        allowTaint: true,
        useCORS: true
      }).then((canvas) => {
        pdf.addImage(canvas.toDataURL(), 'png', 0, 0, width, this.map.getSize().y);
      }).catch(function (error) {
        document.getElementById('capturandoImagen').classList.add('hidden');
        document.getElementById('infoPdf').classList.add('none');
      
      });

      html2canvas(document.getElementById('infoPdf')).then((canvas) => {
        var logoPdf = <HTMLImageElement>document.getElementById('logoPdf');
        logoPdf.src = null;
        logoPdf.src = this.proyectImagen;
        var img = new Image();
        img.src = canvas.toDataURL();
        pdf.addImage(canvas.toDataURL(),
          'png',
          0,
          this._mapService.map.getContainer().getBoundingClientRect().height,
          document.getElementById('infoPdf').getBoundingClientRect().width,
          document.getElementById('infoPdf').getBoundingClientRect().height);
        pdf.addImage(logoPdf.src, 'png',
          width - width / 3.45,
          this._mapService.map.getContainer().getBoundingClientRect().height + document.getElementById('infoPdf').getBoundingClientRect().height / 2,
          document.getElementById('logoPdf').getBoundingClientRect().width,
          document.getElementById('logoPdf').getBoundingClientRect().height);
        pdf.save('mapa.pdf');
        document.getElementById('capturandoImagen').classList.add('hidden');
        document.getElementById('infoPdf').classList.add('none');
      }).catch(function (error) {
        document.getElementById('capturandoImagen').classList.add('hidden');
        document.getElementById('infoPdf').classList.add('none');
      
      });

    } else {
      let h = this._mapService.map.getContainer().getBoundingClientRect().height + document.getElementById('infoPdf').getBoundingClientRect().height;
      //const pdf = new jsPDF('landscape', 'px', [this.map.getSize().x, document.body.scrollHeight]);
      const pdf = new jsPDF('landscape', 'px', [this.map.getSize().x, h]);
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();

      domtoimage.toPng(this._mapService.map.getContainer(), {
        width: this.map.getSize().x,
        height: height
      })
        .then(function (dataUrl) {
          pdf.addImage(dataUrl, 'png', 0, 0, width, height);
          pdf.save('mapa.pdf');

          document.getElementById('capturandoImagen').classList.add('hidden');
          document.getElementById('infoPdf').classList.add('none');
        }).catch(function (error) {
          document.getElementById('capturandoImagen').classList.add('hidden');
          document.getElementById('infoPdf').classList.add('none');
        
        }
        );
    }
  }

  onMapClick(e, funcion) {
    var coordenadas: string[] = [];
    var capasFiltro = {};
    this.respuestaInformacion = "";
    this.hayRespuestaEdicion = false;
    this.hayRespuestaInformacion = false;
    this.hayRespuestaEdicion = false;
    this.hayRespuestaBorrar = false;
    this.hayRespuestaGaleria = false;
    var result = proj4(this.proyeccionProyecto.proj4, [e.latlng.lng, e.latlng.lat]);
    coordenadas.push(result[0].toFixed(3));
    coordenadas.push(result[1].toFixed(3));
    for (let l of this.layers) {
      var layer = "";
      for (let [key, value] of Object.entries(this.estiloPorDefecto)) {
        if (key.replace(/#/g, '_') === l.wmsParams.layers) {
          layer = key;
        }
      }
      if (l.wmsParams.cql_filter === undefined) {
        capasFiltro[layer] = "";

      } else if (l.options.className !== "informacion_seleccionado") {
        capasFiltro[layer] = l.wmsParams.cql_filter;
        if (capasFiltro[layer] === "(include)") {
          capasFiltro[layer] = "";
        }
      }
    }


    let datos = "";
    if (funcion === "informacion_edicion_alfanumerica_web") {
      datos = JSON.stringify({
        funcion: funcion,
        tipo: "web",
        usuario: sessionStorage.getItem('usuario'),
        clave_sesion: sessionStorage.getItem('clave_sesion'),
        plugin: sessionStorage.getItem('plugin'),
        proyecto: this.proyectoLocal.bd_proyecto,
        proyeccion: this.proyectoLocal.proyeccion,
        pulsacion: coordenadas
      });

    } else {
      datos = JSON.stringify({
        funcion: funcion,
        tipo: "web",
        usuario: sessionStorage.getItem('usuario'),
        clave_sesion: sessionStorage.getItem('clave_sesion'),
        plugin: sessionStorage.getItem('plugin'),
        proyecto: this.proyectoLocal.bd_proyecto,
        proyeccion: this.proyectoLocal.proyeccion,
        pulsacion: coordenadas,
        capas_filtro: capasFiltro
      });
    }

    this.servicioFisotec.conexionBackend(datos).then((res) => {
      if (!res.error) {

        this.respuestaInformacion = res.datos;

        if (funcion === "informacion_edicion_alfanumerica_web") {
          this.hayRespuestaEdicion = true;
        } else if (funcion === "informacion_elementos_web") {
          this.hayRespuestaInformacion = true;
        } else if (funcion === "informacion_copia_web") {
          this.hayRespuestaCopiar = true;
        } else if (funcion === "informacion_mover_web") {
          this.hayRespuestaMover = true;
        } else if (funcion === "informacion_borrar_web") {
          this.hayRespuestaBorrar = true;
        } else if (funcion === "web_informacion_fotos") {
          this.hayRespuestaGaleria = true;
        }

        this._changeDetector.detectChanges();
      } else {
        Swal.fire({
          icon: "error",
          title: "ERROR",
          text: res.msg_error,
          confirmButtonText: "OK",
        }).then(() => {
          if (res.msg_error.includes("expirada")) {
            this.router.navigate(["/login"]);
          }
        });
      }

    });

  }

  //

  public async alternarVisibilidadDeSeccion(nombreDeSeccion: string): Promise<void>
  {
    this[nombreDeSeccion].isVisible ?
    await this.ocultarHerramientDeMapa(nombreDeSeccion) :
    await this.mostrarHerramientaDeMapa(nombreDeSeccion);
  }

  public async ocultarHerramientDeMapa(nombreDeSeccion: string): Promise<void>
  {
    await this[nombreDeSeccion].hide();

    if (this.AnalysisCharts.isActive && nombreDeSeccion !== "AnalysisCharts")
    {
      this.mostrarControlDeEscala = false;
      this.herramientaActualmenteAbierta = "AnalysisCharts";
      this.AnalysisCharts.show();
    }
    else {
      if (nombreDeSeccion === "AnalysisCharts")
        this.AnalysisCharts.desactivate();

      this.alOcultarHerramientaDeMapa();
    }
  }

  public async mostrarHerramientaDeMapa(nombreDeSeccion: string, moverControlDeEscala:boolean = true): Promise<void>
  {
    if (this.editorDeBotoneraEsVisible)
      await this.alternarVisibilidadDeEditorDeBotonera();

    if (this.herramientaActualmenteAbierta)
      await this[this.herramientaActualmenteAbierta].hide();

    if( nombreDeSeccion === "AnalysisCharts" )
    {
      this.mostrarControlDeEscala = false;
    }
    else
    {
      if( moverControlDeEscala )
        await this.moverControlDeEscala("left");
    }

    if (this.enMedicion)
      this.finalizarMedicion();

    await this[nombreDeSeccion].show();

    this.herramientaActualmenteAbierta = nombreDeSeccion;
  }

  public async alOcultarHerramientaDeMapa(): Promise<void>
  {
    this.herramientaActualmenteAbierta = null;
    await this.moverControlDeEscala("right");
  }

  public async alCerrarAnalisisGrafico():Promise<void>
  {
    this.herramientaActualmenteAbierta = null;
    await delayExecution(DURACION_ANIMACION);
    this.mostrarControlDeEscala = true;
  }

  private async moverControlDeEscala(direcction:"right"|"left"):Promise<void>
  {
    if( ! this.mostrarControlDeEscala )
    {
      this.mostrarControlDeEscala = true;
      await delayExecution(DURACION_ANIMACION);
    }

    direcction === "left" ?
    this.controlDeEscala.nativeElement.style.right =  "45%" :
    this.controlDeEscala.nativeElement.style.right = "1%";
  }

  /* MEDICION */

  public async iniciarMedicion(tipo: TipoMedicion): Promise<void> {
    if (!this.enMedicion) {
      if (this.herramientaActualmenteAbierta) {
        await this[this.herramientaActualmenteAbierta].hide();
        this.herramientaActualmenteAbierta = null;
        this.mostrarControlDeEscala = true;
      }

      this.map.on("draw:created", this.funcionCierreMedicion);
      this.tipoMedicion = tipo;
      this.enMedicion = true;
      this.crearInstanciaDeMedicion();
    }
    else {
      if (tipo !== this.tipoMedicion) {
        this.finalizarMedicion();
        this.iniciarMedicion(tipo);
      }
      else {
        this.finalizarMedicion();

        if (this.AnalysisCharts.isActive) {
          this.herramientaActualmenteAbierta = "AnalysisCharts";
          this.AnalysisCharts.show();
        }
      }
    }
  }

  private crearInstanciaDeMedicion(): void {
    switch (this.tipoMedicion) {
      case "perimetro":
        this.medicion = new Draw.Polyline(this.map, {
          shapeOptions: {
            color: '#218D8F'
          }
        });
        break;

      case "area":
        this.medicion = new Draw.Polygon(this.map, {
          shapeOptions: {
            color: '#218D8F'
          }
        });
        break;
    }

    this.medicion.enable();
  }

  private realizarMedicion(capa: Polyline | Polygon): void {
    switch (this.tipoMedicion) {
      case "perimetro":

        let distanciaEnMetros = 0, ultimoPunntoEvaluado;

        capa.getLatLngs().forEach(_latlng => {

          if (ultimoPunntoEvaluado)
            distanciaEnMetros += ultimoPunntoEvaluado.distanceTo(_latlng);

          ultimoPunntoEvaluado = _latlng;

        });

        capa.bindTooltip(distanciaEnMetros.toFixed(3) + " m", { 'permanent': true });

        break;

      case "area":

        const _area = GeometryUtil.geodesicArea((capa.getLatLngs()[0] as any)).toFixed(3);

        capa.bindTooltip(_area + " m2", { 'permanent': true });

        break;
    }

    this.capaDeElementosDibujados.addLayer(capa);
  }
  public async finalizarMedicion(): Promise<void> {
    this.medicion.disable();
    this.medicion = null;
    this.capaDeElementosDibujados.clearLayers();
    this.map.off("draw:created", this.funcionCierreMedicion);
    this.tipoMedicion = null;
    this.enMedicion = false;
  }
  public ngOnDestroy():void{
    this.router.routeReuseStrategy.shouldReuseRoute = this.routeReuseStrategy;
  }
}
