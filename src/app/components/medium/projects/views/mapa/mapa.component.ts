require("leaflet.path.drag/src/Path.Drag.js");
require("leaflet-editable/src/Leaflet.Editable.js");

require("src/assets/fonts/Arial-jsPdf.js");

import "leaflet/dist/images/marker-shadow.png";

import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewChecked, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Control, Draw, DrawEvents, drawLocal, DrawMap, featureGroup, FeatureGroup, GeometryUtil, icon, latLngBounds, LatLngExpression, LatLngTuple, Marker, marker, TileLayer, tileLayer, Toolbar, Util, Polyline, Polygon, MapOptions, LatLngBounds } from 'leaflet';
import LeafletWms from "leaflet.wms";
import proj4 from 'proj4';
import { saveAs } from 'file-saver';
import { Observable, Observer, Subscription } from 'rxjs';
import Swal from "sweetalert2";
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation, fadeInRightOnEnterAnimation, fadeOutRightOnLeaveAnimation } from 'angular-animations';
import { MapService } from '../../../../../services/unic/map.service';
import { delayExecution } from 'src/app/shared/helpers';
import { SolicitudComponent } from './herramientas/solicitud/solicitud.component';
import { ControlObraFuturaComponent } from './herramientas/control-obra-futura/control-obra-futura.component';
import { ControlObraDefinirInstaladorComponent } from './herramientas/control-obra-definir-instalador/control-obra-definir-instalador.component';
import {  Capa, Modulo } from '../../../../../interfaces/medium/mapa/Modulo';

import { ControladorCapasBaseComponent } from './herramientas/controlador-capas-base/controlador-capas-base.component';
import { CategorizadoComponent } from "./herramientas/categorizado/categorizado.component";
import { ProjectService } from '../../../../../services/unic/project.service';
import { Project, ConfiguracionDeProyecto } from '../../../../../interfaces/project';
import { ProjectsService } from '../../../../../services/unic/projects.service';
import { availableScales } from '../../../../shared/map';
import { switchMap, catchError } from 'rxjs/operators';
import { isJsonString } from '../../../../../shared/helpers';
import { ToastrService } from 'ngx-toastr';

/* HERRAMIENTAS DE MAPA */
// CREACION Y EDICION
import { NuevoElementoComponent } from './herramientas/nuevo-elemento/nuevo-elemento.component';
import { MoverElementoComponent } from './herramientas/mover-elemento/mover-elemento.component';
import { EditarElementoComponent } from './herramientas/editar-elemento/editar-elemento.component';
import { CopiarElementoComponent } from "./herramientas/copiar-elemento/copiar-elemento.component";
import { EliminarElementoComponent } from './herramientas/eliminar-elemento/eliminar-elemento.component';
// ANALISIS E INFORMACION
import { AnalisisGraficoComponent } from './herramientas/analisis-grafico/analisis-grafico.component';
import { InformacionElementoComponent } from './herramientas/informacion-elemento/informacion-elemento.component';
import { StreetViewMapComponent } from "./herramientas/street-view-map/street-view-map.component";
import { ProjectLayersService } from '../../../../../services/medium/project-layers.service';
import { FiltroDeElementosComponent } from './herramientas/filtro-de-elementos/filtro-de-elementos.component';
import { SpinnerService } from '../../../../../services/spinner.service';
import { ExportacionElementoCapaComponent } from './herramientas/exportacion-informacion/exportacion-elemento-capa/exportacion-elemento-capa.component';
import { FichaElementoComponent } from './herramientas/exportacion-informacion/ficha-elemento/ficha-elemento.component';
import { PlanimetriaComponent } from './herramientas/planimetria/planimetria.component';
import { GaleriaDeElementoComponent } from './herramientas/galeria-de-elemento/galeria-de-elemento.component';
import { GestionCentroDeMandoComponent } from './herramientas/gestion-centro-de-mando/gestion-centro-de-mando.component';
import { GestionArchivoExternoComponent } from './herramientas/gestion-archivo-externo/gestion-archivo-externo.component';
import { FichasCentrosDeMandoComponent } from './herramientas/fichas-centros-de-mando/fichas-centros-de-mando.component';
import { ShepherdService } from 'angular-shepherd';
import { ZoomAjustarComponent } from './herramientas/zoom-ajustar/zoom-ajustar.component';
import { EdicionMultipleComponent } from './herramientas/edicion-multiple/edicion-multiple.component';
import { ExportarArchivoComponent } from './herramientas/exportar-archivo/exportar-archivo.component';
import { TablaDeElementosComponent } from './herramientas/tabla-de-elementos/tabla-de-elementos.component';
import { ResaltarLuminariasPorCmComponent } from './herramientas/resaltar-luminarias-por-cm/resaltar-luminarias-por-cm.component';

const DURACION_ANIMACION = 250;

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

type TipoMedicion = "perimetro" | "area";

interface ButtonGroup
{
  key: string;
  value: string;
  visible: boolean,
  enabled: boolean;
}

@Component({
  templateUrl: "./mapa.component.html",
  styleUrls: ['./mapa.component.css', '../../../../../../themes/styles/map.scss'],
  animations: [
    fadeInOnEnterAnimation({ duration: DURACION_ANIMACION }),
    fadeOutOnLeaveAnimation({ duration: DURACION_ANIMACION }),
    fadeInRightOnEnterAnimation({ duration: DURACION_ANIMACION }),
    fadeOutRightOnLeaveAnimation({ duration: DURACION_ANIMACION })
  ]
})
export class MapaComponent implements OnInit, AfterViewChecked, OnDestroy
{

  /* VARIABLES DE MAPA */

  public map: DrawMap;
  public opcionesDeMapa: MapOptions;
  public drawOptions: any;
  public capaDeElementosDibujados: FeatureGroup = featureGroup();

  public layers = [];

  public capaBase: TileLayer;

  public datosDeModulos: Array<Modulo>;

  public mostrarSpinner:boolean = false;

  public mapaCargado: boolean = false;

  public cursorZoomZona: boolean = false;

  public midiendoZona: Draw.Rectangle;

  public estiloPorDefecto: any;

  public permisosDeUsuarioSobreModulos:{[nombreModulo:string]:{[nombreGrupo:string]:string}};

  @ViewChild("toolbar")
  public barraDeBotones:ElementRef<HTMLElement>;

  public barraDeHerramientasEsDesplazable:boolean = false;

  public tourObject:any;

  //GMAO
  public gmaoActivo: boolean = false;

  //CONTROL DE OBRA
  public controlObraActiva: boolean = false;

  /* CONTROL DE BOTONERA */

  public editorDeBotoneraEsVisible: boolean = false;

  public toolBarButtonGroups: ButtonGroup[] = [
    {
      key: "Creación y edición",
      value: "edition",
      visible: true,
      enabled: true
    },
    {
      key: "Herramientas Zoom",
      value: "zoom",
      visible: false,
      enabled: true
    },
    {
      key: "Herramientas GIS",
      value: "GIS",
      visible: true,
      enabled: true
    },
    {
      key: "Herramientas mapa",
      value: "streetView",
      visible: true,
      enabled: true
    },
    {
      key: "Buscador de direcciones",
      value: "addressFinder",
      visible: true,
      enabled: true
    },
    {
      key: "Herramientas medición",
      value: "measurement",
      visible: true,
      enabled: true
    },
    {
      key: "Importacion",
      value: "importacion",
      visible: false,
      enabled: true
    },
    {
      key: "GMAO",
      value: "gmao",
      visible: false,
      enabled: true
    },
    {
      key: "Control de obras",
      value: "works",
      visible: false,
      enabled: true
    }
  ];

  /* CONTROL DE ESCALA */

  @ViewChild('controlDeEscala')
  private controlDeEscala:ElementRef<HTMLElement>;

  public mostrarControlDeEscala:boolean = true;

  public escalasDisponibles:any[] = availableScales;

  public cursorCoordenadas:string = 'X:  Y: ';

  public escalaActual:string;

  // MEDICION

  public medicion: Draw.Polyline | Draw.Polygon;
  public tipoMedicion: TipoMedicion;
  public enMedicion: boolean = false;

  private funcionCierreMedicion: (event: any) => void = event => {
    this.realizarMedicion(event.layer);
    this.crearInstanciaDeMedicion();
    this._changeDetector.detectChanges();
  };

  // BUSCADOR DE DIRECCIONES

  @ViewChild('contenedorDeBuscadorDeDirecciones')
  public contenedorDeBuscadorDeDirecciones:ElementRef<HTMLElement>;

  @ViewChild('buscadorDeDirecciones')
  public buscadorDeDirecciones:ElementRef<HTMLElement>;

  public direccionBuscada:string = null;

  public direccionesSugerida$:Observable<string[]>;

  // HERRAMIENTAS

  public herramientaActualmenteAbierta: string;
  public ocultandoOMostrandoHerramienta:boolean = false;

  @ViewChild(ZoomAjustarComponent)
  public zoomajustar: ZoomAjustarComponent;

  @ViewChild(ControladorCapasBaseComponent)
  public ControladorCapasBase: ControladorCapasBaseComponent;

  @ViewChild(NuevoElementoComponent)
  public NuevoElemento: NuevoElementoComponent;

  @ViewChild(GestionCentroDeMandoComponent)
  public GestionCentroDeMando: GestionCentroDeMandoComponent;

  @ViewChild(MoverElementoComponent)
  public MoverElemento: MoverElementoComponent;

  @ViewChild(EditarElementoComponent)
  public EditarElemento: EditarElementoComponent;

  @ViewChild(CopiarElementoComponent)
  public CopiarElemento: CopiarElementoComponent;

  @ViewChild(EliminarElementoComponent)
  public EliminarElemento: EliminarElementoComponent;

  @ViewChild(AnalisisGraficoComponent)
  public AnalisisGrafico: AnalisisGraficoComponent;

  @ViewChild(InformacionElementoComponent)
  public InformacionElemento: InformacionElementoComponent;

  @ViewChild(StreetViewMapComponent)
  public StreetViewMap: StreetViewMapComponent;

  @ViewChild(GestionArchivoExternoComponent)
  public GestionArchivoExterno: GestionArchivoExternoComponent;

  @ViewChild(FiltroDeElementosComponent)
  public FiltroDeElementos: FiltroDeElementosComponent;

  @ViewChild(GaleriaDeElementoComponent)
  public GaleriaDeElemento: GaleriaDeElementoComponent;

  @ViewChild(FichasCentrosDeMandoComponent)
  public FichasCentrosDeMando: FichasCentrosDeMandoComponent;

  @ViewChild(ExportacionElementoCapaComponent)
  public ExportacionElementoCapa:ExportacionElementoCapaComponent;

  @ViewChild(FichaElementoComponent)
  public FichaElemento:FichaElementoComponent;

  @ViewChild(ResaltarLuminariasPorCmComponent)
  public ResaltarLuminariasPorCm:ResaltarLuminariasPorCmComponent;

  @ViewChild(PlanimetriaComponent)
  public Planimetria:PlanimetriaComponent;
  
  @ViewChild(TablaDeElementosComponent)
  public TablaDeElementos: TablaDeElementosComponent;

  @ViewChild(EdicionMultipleComponent)
  public EdicionMultiple: EdicionMultipleComponent;

 @ViewChild(ExportarArchivoComponent)
 public ExportarArchivo: ExportarArchivoComponent;

  @ViewChild(CategorizadoComponent)
  public categorizado: CategorizadoComponent;

  @ViewChild(SolicitudComponent)
  public solcicitud: SolicitudComponent;

  @ViewChild(ControlObraFuturaComponent)
  public ControObraFactura: ControlObraFuturaComponent;

  @ViewChild(ControlObraDefinirInstaladorComponent)
  public ControObraInstalador: ControlObraDefinirInstaladorComponent;

  // !!
  private routeReuseStrategy:any;

  private routeDataSubscription:Subscription;

  constructor(
    private _mapService: MapService,
    private _toastrService:ToastrService,
    private _spinnerService: SpinnerService,
    private router: Router,
    private _changeDetector: ChangeDetectorRef,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _projectLayersService:ProjectLayersService,
    private _shepherdService:ShepherdService,
    private route:ActivatedRoute
  ) {

    this.routeReuseStrategy = this.router.routeReuseStrategy.shouldReuseRoute;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.opcionesDeMapa = {
      zoom: 17,
      zoomControl: false,
      center: [40.395347, -3.694041],
      editable: true,
      preferCanvas: true
    };

    this.capaBase = _mapService.getBaseLayers().find(layer => layer.options.className === "OSM");

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

    // prevenir que dibujos se cancelen al presionar tecla escape.
    (Draw.Feature as any).prototype._cancelDrawing = () => {};
  }

  get nombreCapaBaseActual(): string{
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
 
  get configuracionDeProyecto():ConfiguracionDeProyecto
  {
    return this._projectService.configuration;
  }

  get seccionesActivasEnBotonera():number
  {
    return this.toolBarButtonGroups.filter(data => data.enabled).length;
  }

  get tourEstaActivo():boolean
  {
    return this._shepherdService.isActive;
  }

  get usuarioEnMapaTienePermisoComoVisor():boolean
  {
    return Object.values(this.permisosDeUsuarioSobreModulos)
                  .some(
                    permisosPorGrupo => Object.values(permisosPorGrupo).some(permiso => permiso  === "Visor")
                  );
  }
  
  get usuarioEnMapaTienePermisoComoInstalador():boolean
  {
    return Object.values(this.permisosDeUsuarioSobreModulos)
                  .some(
                    permisosPorGrupo => Object.values(permisosPorGrupo).some(permiso => permiso  === "Instalador")
                  );
  }

  public ngOnInit(): void
  {
    sessionStorage.setItem('proyecto', JSON.stringify(this.proyecto));

    this.construirObservableDeBuscadorDeDirecciones();
    
    this.routeDataSubscription = this.route.data.subscribe(data => {

      this.permisosDeUsuarioSobreModulos = data.userPermissions;

      if( this.usuarioEnMapaTienePermisoComoVisor )
      {
        this.toolBarButtonGroups.find(btnGroup => btnGroup.value = "edition").enabled = false;
      }
      else if( this.usuarioEnMapaTienePermisoComoInstalador )
      {
        this.toolBarButtonGroups
          .forEach(btnGroup => {
          
            btnGroup.value === 'GIS' || btnGroup.value === 'works' ?
            btnGroup.visible = true :
            btnGroup.enabled = false;
            
          });
      }

    });

  }

  public ngAfterViewChecked():void
  {
    this._changeDetector.detectChanges();
    this.establecerPosicionDeBuscadorDeDirecciones(true);
  }

  public comprobarSiBarraDeHerramientasEsDesplazable():void
  {
    if( this.barraDeBotones )
    {
      let gruposDeBotones = Array.from(this.barraDeBotones.nativeElement.querySelectorAll(".toolbar-btn-group"));

      // filtrar boton de organizar botonera  por se incluye  en variable 'grupoDeBotonesDeConfiguracion'.
      gruposDeBotones = gruposDeBotones.filter(grupo => grupo.id !== "sortToolbarBtn");

      const grupoDeBotonesDeConfiguracion = this.barraDeBotones.nativeElement.querySelector(".config-btn-group");

      const anchoDeBotonera = gruposDeBotones.reduce((acumulador, grupoDeBotones:HTMLElement)  => acumulador += grupoDeBotones.offsetWidth, 0);

      const anchoDeVentana = (window as any).visualViewport ? (window as any).visualViewport.width : window.screen.width;

      const  anchoRealDeBotonera = anchoDeBotonera + (grupoDeBotonesDeConfiguracion as any).offsetWidth;

      this.barraDeHerramientasEsDesplazable = anchoRealDeBotonera > anchoDeVentana;
    }
    else
    {
      this.barraDeHerramientasEsDesplazable = false;
    }
  }

  private construirObservableDeBuscadorDeDirecciones():void
  {
    this.direccionesSugerida$ = new Observable((observer: Observer<string>) => {
      observer.next(this.direccionBuscada);
    })
    .pipe(
      switchMap( async (query: string) => {

        if (query)
        {
          const response = await this._projectsService.consultarApi({
              "funcion": "localizacion_rellenar",
              "municipio": this._projectService.configuration.datos_municipio.nombre,
              "direccion": query
          });

          return response.datos.direcciones || [];
        }

        return [];
      }),
      catchError(error => {

        if( isJsonString(error.message) )
        {
          console.error(error);
          this._toastrService.error(error.message,"Error");
        }

        return [];
      })
    );
  }

  public async alBuscarDireccion():Promise<void>
  {
    if(  this.direccionBuscada.trim() )
    {
      try
      {
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

        this.map.flyToBounds(bbox, { maxZoom: 18, duration: .50 });

        const bboxCenter = new LatLngBounds(bbox).getCenter();

        const marker = new Marker(bboxCenter).addTo(this.map);

        setTimeout(() => marker.remove(), 5000);

      }
      catch (error)
      {
        console.error(error);
        this._toastrService.error(error.message,"Error");
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
    if( event && this.buscadorDeDirecciones )
    {
      this.buscadorDeDirecciones.nativeElement.style.left = this.contenedorDeBuscadorDeDirecciones.nativeElement.getBoundingClientRect().x + "px";
      this.buscadorDeDirecciones.nativeElement.style.top = this.contenedorDeBuscadorDeDirecciones.nativeElement.getBoundingClientRect().y + "px";
    }
  }

  public cambiarCapaBase(capa: TileLayer): void
  {
    this.capaBase = capa;
    this._mapService.baseLayer = capa;
  }

  public async onMapReady(mapa: DrawMap):Promise<void>
  {
    try
    {              
      //Guardamos los datos del municipio en el sessionStorage
      sessionStorage.setItem("municipio", this.configuracionDeProyecto.datos_municipio.nombre);
      sessionStorage.setItem("provincia", this.configuracionDeProyecto.datos_municipio.provincia);

      this.map = mapa;

      this.map.fitBounds( (this._projectService.bbox as any) );

      // provisional
      let url = this.configuracionDeProyecto.geoserver.ruta.replace("http","https");

      const capaDeContornoMunicipio = LeafletWms.overlay(url, {
        layers: this.configuracionDeProyecto.geoserver.layer,
        format: 'image/gif',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        tiled: false,
        cql_filter: `id=${this.configuracionDeProyecto.datos_municipio.municipio}`
      });

      this.map.addLayer(capaDeContornoMunicipio);

      this.map.addLayer(this.capaDeElementosDibujados);

      this.aplicarFuncionalidadDeDibujoEnMapa();

      await this.obtenerYAgregarCapasDeProyecto();

      this._mapService.next(mapa);
      this._mapService.baseLayer = this.capaBase;

      this.comprobarSiBarraDeHerramientasEsDesplazable();

      this.mapaCargado = true;
    }
    catch (error)
    {
      if(!error.message.includes("_leaflet_pos")){
        Swal.fire({
          icon: "error",
          title: "ERROR",
          text: error.message,
          confirmButtonText: "OK",
          heightAuto: false
        });
      }

      const url = error.message.includes("expirada") ? "/login" : "/medium/home";

      this.router.navigateByUrl(url);
    }
  }

  private aplicarFuncionalidadDeDibujoEnMapa():void
  {
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
  }

  private async obtenerYAgregarCapasDeProyecto():Promise<void>
  {
    try
    {
      //Almacenamos el estilo por defecto
      this.estiloPorDefecto = this._projectService.layerStyles;

      //Obtemos la url base del proyecto y la parseamos para para preparla para hacer peticiones
      let url = this.proyecto.url_base.split('wms?')[0] + "wms?";

      // provisional.
      url = url.replace("http","https");

      const crearYRetornarCapaWMS = (capa:Capa) => {

        const wmsLayer = LeafletWms.overlay(url, {
          layers: capa.filtro_capa.split('#').join('_'),
          styles: capa.estilo_por_defecto,
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

        this.layers.push(wmsLayer);

        return wmsLayer;
      };

      /* CASO ESPECIAL PROYECTO CASTRO URDIALES
      * AGREGAR CAPA "MEDICIONES LUMINICAS" PARA GIS SMART > GESLIGHTHING
      */

      if( this._projectService.configuration.datos_municipio.nombre === "Castro-Urdiales" )
      {
        const moduloGSE = this._projectService.moduleInformation.modulos.find(infoModulo => infoModulo.modulo === 'GIS-SMART ENERGY');

        if( moduloGSE )
        {
          if( moduloGSE.dic_modulo["Gestlighting"] )
          {
            moduloGSE.dic_modulo["Gestlighting"].push("Mediciones lumínicas");
            moduloGSE.tipos_geometria["gissmart_energy#gestlighting#mmll"] = "POINT";
            moduloGSE.capas_formateadas["Mediciones lumínicas"] = "mmll";
          } 
        }
      }

      /* CREAR OBJETO QUE CONTENDRA ESTRUTURA MODULOS > GRUPOS > CAPAS
      // EL CUAL PODRA SER USADO PARA UBICAR DATOS NECESARIOS "RAPIDAMENTE".
      */

      this.datosDeModulos = this._projectService.moduleInformation.modulos.map(datosDeModulo => {

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

                const estiloDeCapa = this._projectService.moduleInformation.estilos[filtro_capa] ?? "";

                const leyenda = url + "REQUEST=GetLegendGraphic&transparent=true&"+
                "style=" + estiloDeCapa + "&SCALE=2000&VERSION=1.0.0&FORMAT=image/png&LAYER=" + 
                filtro_capa.split("#").join("_") + "&LEGEND_OPTIONS=FontName:Raleway;fontSize:14;columnheight:199";

                const capa = {
                  modulo: datosDeModulo.modulo,
                  grupo: nombreGrupo,
                  nombre: nombreDeCapa,
                  nombre_formateado: datosDeModulo.capas_formateadas[nombreDeCapa],
                  filtro_capa: filtro_capa,
                  tipo_geometria: datosDeModulo.tipos_geometria[filtro_capa],
                  estilo_por_defecto: estiloDeCapa,
                  capaWms: null,
                  proyectado: true,
                  leyenda: leyenda
                };

                capa.capaWms = crearYRetornarCapaWMS(capa);

                return capa;

              }),
              proyectado: true
            };

          }),
          proyectado: true
        }

      });

      // a;adiendo informacion de modulos al servicio de capas de proyecto
      this._projectLayersService.next(this.datosDeModulos);

    }
    catch (error)
    {
      throw error;
    }
  }

  public alCambiarSelectorDeEscala(event: any): void{
    this.map.setZoom(event.target.value);
    this.escalaActual = 'Escala: 1:' + this.getEscala();
  }

  public actualizarCursorDeCoordenadas(e: any):void{
    const reprojectedCoords = proj4(this._projectService.configuration.datos_municipio.nombre_proj4, [e.latlng.lng, e.latlng.lat]);
    this.cursorCoordenadas = 'X: ' + reprojectedCoords[0].toLocaleString() + ' Y: ' + reprojectedCoords[1].toLocaleString();
    this.escalaActual = 'Escala: 1:' + this.getEscala();
  }

  private getEscala(): number
  {
    return this._mapService.getScale();
  }

  /* ZOOM */

  onZoomMas()
  {
    if( this.tourEstaActivo )
      return;

    this.map.zoomIn();
  }

  onZoomMenos()
  {
    if( this.tourEstaActivo )
      return;

    this.map.zoomOut();
  }

  onZoomZona()
  {
    if( this.tourEstaActivo )
      return;

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

  public onZoomExtender():void
  {
    if( this.tourEstaActivo )
      return;

    this.map.flyToBounds((this._projectService.bbox as any));
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

  public async alternarVisibilidadDeEditorDeBotonera(): Promise<void>
  {
    if ( this.tourEstaActivo )
    return;

    if (this.herramientaActualmenteAbierta)
      await this.alternarVisibilidadDeSeccion(this.herramientaActualmenteAbierta);

    if( this.herramientaActualmenteAbierta &&
        (this.herramientaActualmenteAbierta !== "AnalisisGrafico" ||
        ! this.AnalisisGrafico.isActive)
     )
      await this.alternarVisibilidadDeSeccion( this.herramientaActualmenteAbierta );

    this.editorDeBotoneraEsVisible = !this.editorDeBotoneraEsVisible;

    await delayExecution(DURACION_ANIMACION);
  }

  public toggleToolbarButtonGroupVisibility(buttonGroup: any): void
  {
    buttonGroup.visible = ! buttonGroup.visible;
    
    setTimeout(() => {
      this.establecerPosicionDeBuscadorDeDirecciones();
      this.comprobarSiBarraDeHerramientasEsDesplazable();
    });
  }

  public toolbarButtonGroupIsVisible(value: string): boolean
  {
    const btnGroup = this.toolBarButtonGroups.find(btnGroup => btnGroup.value === value);

    return btnGroup.enabled && btnGroup.visible;
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

  //

  public async alternarVisibilidadDeSeccion(nombreDeSeccion: string, moverControlDeEscala:boolean = true): Promise<void>
  {
    if( this.ocultandoOMostrandoHerramienta || this.tourEstaActivo )
      return;

    this.ocultandoOMostrandoHerramienta = true;
    
    this[nombreDeSeccion].isVisible ?
    await this.ocultarHerramientDeMapa(nombreDeSeccion) :
    await this.mostrarHerramientaDeMapa(nombreDeSeccion, moverControlDeEscala);

    this.ocultandoOMostrandoHerramienta = false;
  }

  public async ocultarHerramientDeMapa(nombreDeSeccion?: string): Promise<void>
  {
    nombreDeSeccion = nombreDeSeccion ?? this.herramientaActualmenteAbierta;

    await this[nombreDeSeccion].hide();

    if (this.AnalisisGrafico.isActive && nombreDeSeccion !== "AnalisisGrafico")
    {
      this.mostrarControlDeEscala = false;
      this.herramientaActualmenteAbierta = "AnalisisGrafico";
      this.AnalisisGrafico.show();
    }
    else
    {
      // *Analisis de graficos: puede quedar activo (suspendido) mientras se utilizan otras herramientas.
      // AL cerrarlo se debe "desactivar" para remover el analisis "suspendido".
      if (nombreDeSeccion === "AnalisisGrafico")
        this.AnalisisGrafico.desactivate();

      this.alOcultarHerramientaDeMapa();
    }
  }

  public async mostrarHerramientaDeMapa(nombreDeSeccion: string, moverControlDeEscala:boolean = true): Promise<void>
  {
    if (this.editorDeBotoneraEsVisible)
      await this.alternarVisibilidadDeEditorDeBotonera();

    if (this.herramientaActualmenteAbierta)
    {
      if( this.herramientaActualmenteAbierta === "GestionCentroDeMando" )
      {
        // *Gestion centro de mando: para editar/ver un centro de mando la herramienta de edicion/informacion de elementos se cierra
        // y mantiene "suspendida" la informacion de la ultima pulsacion (elementos, capa, etc).
        // Al cerrar la herramienta de gestion para mostrar otra herramienta DIFERENTE la herramienta con informacion "suspendida"
        // debe limpiarse (metodo beforeClosingTool).

        if (this.GestionCentroDeMando.mode === "update")
          this.EditarElemento.beforeClosingTool();

        if (this.GestionCentroDeMando.mode === "details")
          this.InformacionElemento.beforeClosingTool();
      }

      await this[this.herramientaActualmenteAbierta].hide();
    }

    if( nombreDeSeccion === "AnalisisGrafico" )
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
    this.controlDeEscala.nativeElement.style.right =  this.herramientaActualmenteAbierta === 'GestionCentroDeMando' ? "57.5%" : "45%" :
    this.controlDeEscala.nativeElement.style.right = "1%";
  }

  public async abrirGestionCentroDeMando(data:any):Promise<void>
  {
    try
    {
      this.ocultandoOMostrandoHerramienta = true;

      this.herramientaActualmenteAbierta = "GestionCentroDeMando";
      this.moverControlDeEscala("left");
      await this.GestionCentroDeMando.setDataAndShow(data);
    }
    catch(error)
    {
      console.error(error);
      this._toastrService.error(error.message, "Error.");
      await this.ocultarHerramientDeMapa();
    }
    finally
    {
      this.ocultandoOMostrandoHerramienta = false;
    }
  }

  public async alCerrarGestionCentroDeMando(data:{layer:Capa; mode:string;}):Promise<void>
  {
    switch( data.mode )
    {
      case "new":
        await this.NuevoElemento.whenClosingCommandCenterManagementTool(data.layer);
        this.herramientaActualmenteAbierta = "NuevoElemento";
        break;

      case "update":
        await this.EditarElemento.whenClosingCommandCenterManagementTool();
        this.herramientaActualmenteAbierta = "EditarElemento";
        break;

      case "details":
        await this.InformacionElemento.whenClosingCommandCenterManagementTool();
        this.herramientaActualmenteAbierta = "InformacionElemento";
        break;
    }

    this.moverControlDeEscala("left");
  }

  /*  */

  public async capturaDeMapa(): Promise<void> {
    if( this.tourEstaActivo )
    return;

    try {

      this._spinnerService.updateText("Por favor, espere...");
      this._spinnerService.show();

      const imgSrc = await this._mapService.getMapScreenshot();

      saveAs(imgSrc, `${this.proyecto.nombre}_mapa.jpeg`);

      setTimeout(() => {
        
        for(let [layerType, unloadedLayersNumber] of  Object.entries( this._mapService.lastScreenshot.unloadedLayers ))
        {
          if( unloadedLayersNumber > 0 )
            this._toastrService.warning(`${unloadedLayersNumber} capas ${layerType.toUpperCase()} no pudieron ser cargadas en el plano.`);
        }

      });
    }
    catch (error) {
      console.error(error);
      this._toastrService.error("Captura de mapa no ha podido ser generada.", "Error.");
    }
    finally
    {
      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }

   }

  /* MEDICION */

  public async iniciarMedicion(tipo: TipoMedicion): Promise<void> {

    if ( this.tourEstaActivo )
      return;

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

        if (this.AnalisisGrafico.isActive) {
          this.herramientaActualmenteAbierta = "AnalisisGrafico";
          this.AnalisisGrafico.show();
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

   /*
   * EXPORTACION DE INFORMACION
    */

   public async toggleFeaturePdfTemplateConfigurationToolVisibility(type:"sheet"|"listing"):Promise<void>
   {
     if( this.ExportacionElementoCapa.isVisible && this.ExportacionElementoCapa.templateType === type )
     {
      await this.ocultarHerramientDeMapa("ExportacionElementoCapa");
     }
     else
     {
      await this.ExportacionElementoCapa.changeType(type);

      if( ! this.ExportacionElementoCapa.isVisible )
        await this.mostrarHerramientaDeMapa("ExportacionElementoCapa");
     }
   }

   public async mostrarHerramientaDeExportacionDeFicha(data:any):Promise<void>
   {
     this.FichaElemento.pdfTemplate = data.template;
     this.FichaElemento.setLayer(data.layerFilter);
     await this.FichaElemento.show();
     this.herramientaActualmenteAbierta = 'FichaElemento';
   }

  /* ///////////////////////  */

  //Función que cambiará el estilo de la capa luminaria al estilo Control_Obra
  revisionLuminaria() {
    this.controlObraActiva = !this.controlObraActiva;

    //Activando la revisión
    if(this.controlObraActiva) {

      let cqlfilter = "";
      //Guardamos el filtro que hay activo en ese momento para luminaria, para al salir dejarlo así
      for(let [key, value] of Object.entries(this._projectLayersService.obtenerFiltrosDeCapas())){
        if(key === "gissmart_energy#gestlighting#luminaria"){
          if(value !== "") {
            cqlfilter = value;
          }
        }

      }

      //Comprobamos si la capa tiene aplicado algún flitro, en cuyo caso lo guardamos en una variable
      this.layers.forEach((layer) => {
        if(layer.options.className === "luminaria") {
          if(layer.wmsParams.cql_filter) {
            cqlfilter = layer.wmsParams.cql_filter;
          }
        }
      });

      //Obtemos la url base del proyecto y la parseamos para para preparla para hacer peticiones
      let url = this.proyecto.url_base.split('wms?')[0] + "wms?";

      //Hacemos la petición wms para la nueva capa de control de obras
      const wmsLayer = LeafletWms.overlay(url, ({
        layers: "gissmart_energy_gestlighting_luminaria",
        styles: "Control_Obra",
        className: "control_obra",
        format: 'image/gif',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        zIndex: 900,
        tiled: false
      }));

      if(cqlfilter !== ""){
        wmsLayer.setParams({ cql_filter: cqlfilter });
      }

      //Añadimos la capa
      this.layers.push(wmsLayer);
      wmsLayer.bringToBack();

      //Añadimos la capa al selector de capas
      this.anadirAlArbol(wmsLayer, "Control de obra", "control_obra", "Control_Obra", "gissmart_energy_gestlighting_luminaria");


    //Desactivando la revisión
    } else {

      //Quitamos la capa de control de obra
      this.layers.forEach((layer) => {
        if(layer.wmsParams.className === "control_obra") {
          const index = this.layers.indexOf(layer, 0);
          if (index > -1) {
            this.layers.splice(index, 1);
          }
        }
      });

      //Quitamos la capa del selector de capas
      this.quitarDelArbol("control_obra");

     }

     //Si la herramientas de control de obra están abiertas, las cerramos
     if(this.herramientaActualmenteAbierta === "ControObraFactura"){
      this.alternarVisibilidadDeSeccion('ControObraFactura');
     }
     if(this.herramientaActualmenteAbierta === "ControObraInstalador"){
      this.alternarVisibilidadDeSeccion('ControObraInstalador');
     }

  }

  anadirAlArbol(wms, nombre, nombre_formateado, estilo, layer) {
    let temporal: Array<Modulo> = [];


    this.datosDeModulos.forEach((modulo) => {
      temporal.push(modulo);

      if(modulo.nombre_formateado === "gissmart_energy") {
        modulo.grupos.forEach((grupo) => {
          if(grupo.nombre_formateado === "gestlighting") {

            let url = this._projectService.project.url_base.split('wms?')[0] + "wms?";
            let leyenda = url + "REQUEST=GetLegendGraphic&transparent=true&"+
                "style=" + estilo + "&SCALE=2000&VERSION=1.0.0&FORMAT=image/png&LAYER="+layer+"&LEGEND_OPTIONS=FontName:Raleway;fontSize:14;columnheight:199";


              let nuevaCapa: Capa = {
                modulo: modulo.nombre,
                grupo: grupo.nombre,
                capaWms: wms,
                filtro_capa: "",
                estilo_por_defecto: estilo,
                nombre: nombre,
                nombre_formateado: nombre_formateado,
                proyectado: true,
                tipo_geometria: "POINT",
                leyenda: leyenda
              };
              grupo.capas.push(nuevaCapa);
              //this._projectLayersService.next(this.datosDeModulos);

          }
        });
      }
    });

    this.datosDeModulos = [];
    this.datosDeModulos = temporal;

  }


  quitarDelArbol(nombre_formateado) {
    this.datosDeModulos.forEach((modulo) => {
      if(modulo.nombre_formateado === "gissmart_energy") {
        modulo.grupos.forEach((grupo) => {
          if(grupo.nombre_formateado === "gestlighting") {
            grupo.capas.forEach((capa) => {
              if(capa.nombre_formateado === nombre_formateado) {
                const index = grupo.capas.indexOf(capa, 0);
                if (index > -1) {
                  grupo.capas.splice(index, 1);
                }
              }
            });
          }
        });
      }
    });
  }

  public activarGMAO():void
  {
    if ( this.tourEstaActivo )
      return;

    this.gmaoActivo = !this.gmaoActivo;

     //Activando la revisión
     if(this.gmaoActivo) {

      let cqlfilter = "";
      //Guardamos el filtro que hay activo en ese momento para luminaria, para al salir dejarlo así
      for(let [key, value] of Object.entries(this._projectLayersService.obtenerFiltrosDeCapas())){
        if(key === "gissmart_energy#gestlighting#luminaria"){
          if(value !== "") {
            cqlfilter = value;
          }
        }

      }

      //Comprobamos si la capa tiene aplicado algún flitro, en cuyo caso lo guardamos en una variable
      this.layers.forEach((layer) => {
        if(layer.options.className === "luminaria") {
          if(layer.wmsParams.cql_filter) {
            cqlfilter = layer.wmsParams.cql_filter;
          }
        }
      });

      //Obtemos la url base del proyecto y la parseamos para para preparla para hacer peticiones
      let url = this.proyecto.url_base.split('wms?')[0] + "wms?";

      //Hacemos la petición wms para la nueva capa de control de obras
      const wmsLayer = LeafletWms.overlay(url, ({
        layers: "alcaudete_desarrollo:solicitud",
        styles: "",
        className: "gmao",
        format: 'image/gif',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        zIndex: 900,
        tiled: false
      }));

      if(cqlfilter !== ""){
        wmsLayer.setParams({ cql_filter: cqlfilter });
      }

      //Añadimos la capa
      this.layers.push(wmsLayer);
      wmsLayer.bringToBack();

      //Añadimos la capa al selector de capas
      this.anadirAlArbol(wmsLayer, "GMAO", "gmao", "", "alcaudete_desarrollo:solicitud");
    //Desactivando la revisión
  } else {

    //Quitamos la capa de control de obra
    this.layers.forEach((layer) => {
      if(layer.wmsParams.className === "gmao") {
        const index = this.layers.indexOf(layer, 0);
        if (index > -1) {
          this.layers.splice(index, 1);
        }
      }
    });

    //Quitamos la capa del selector de capas
    this.quitarDelArbol("gmao");

   }

  }

  /* TOUR */

  public async showTour():Promise<void>
  {
    if( this.herramientaActualmenteAbierta )
      await this.alternarVisibilidadDeSeccion(this.herramientaActualmenteAbierta);

    if( this.tourObject )
      this._shepherdService.addSteps( this.tourObject.steps );
    else
      this.buildTour();

    const btnSectionsCurrentlyOpened = this.toolBarButtonGroups.filter(obj => obj.visible).map(obj => obj.key);

    const showBtnSectionsthatWereOpen = () => {

      this.toolBarButtonGroups.filter(obj => ! btnSectionsCurrentlyOpened.includes(obj.key))
                              .forEach(obj => obj.visible = false)

      setTimeout(() => {
        this.establecerPosicionDeBuscadorDeDirecciones();
        this.comprobarSiBarraDeHerramientasEsDesplazable();
      });
    };

    this._shepherdService.tourObject.on("cancel", showBtnSectionsthatWereOpen);
    this._shepherdService.tourObject.on("complete", showBtnSectionsthatWereOpen);

    this._shepherdService.start();
  }

  private buildTour():void
  {
    const that = this;

    const steps = this.buildTourSteps();

    if( this.usuarioEnMapaTienePermisoComoVisor )
      steps.splice(1,1);

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
          element: `#${step.element}`,
          on: step.labelPosition
        },
        buttons: _buttons,
        title: step.title,
        text: step.text,
        when: step.event ?? null,
        beforeShowPromise: step.beforeShowPromise ?? null
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);

    this.tourObject = this._shepherdService.tourObject;
  }

  private buildTourSteps():any[]
  {
    const steps:any = [
      {
        element: `mapToolbar`,
        labelPosition: "bottom",
        text: 'Puede interactuar en el mapa con la barra de herramientas.',
        event: {
          "before-show": () => {
            this.toolBarButtonGroups.forEach(obj => obj.visible = true);
            setTimeout(() => {
              this.establecerPosicionDeBuscadorDeDirecciones();
              this.comprobarSiBarraDeHerramientasEsDesplazable();
            });
          }
        }
      },
      {
        element: `creation-edition-btns-section`,
        labelPosition: "bottom",
        title: "Creación y edición",
        text: `<ul>
            <li>Nuevo elemento.</li>
            <li>Mover elemento.</li>
            <li>Edición de elemento.</li>
            <li>Edición de multiples elementos.</li>
            <li>Copiar elemento.</li>
            <li>Fichas por centro de mando.</li>
            <li>Borrar elemento.</li>
          </ul>
        `
      },
      {
        element: `zoom-btns-section`,
        labelPosition: "bottom",
        title: "Zoom",
        text: `<ul>
            <li>Zoom inicial.</li>
            <li>Disminuir zoom.</li>
            <li>Aumentar zoom.</li>
            <li>Zoom en zona.</li>
          </ul>
        `
      },
      {
        element: `information-btns-section`,
        labelPosition: "bottom",
        title: "Análisis e información",
        text: `<ul>
            <li>Galería.</li>
            <li>Filtro de elementos por atributos.</li>
            <li>Categorizado de elementos.</li>
            <li>Tabla de elementos con filtro.</li>
            <li>Gráficos de análisis.</li>
            <li>Información de elemento.</li>
          </ul>
        `
      },
      {
        element: `street-view-btns-section`,
        labelPosition: "bottom",
        title: "Street view map y captura",
        text: `<ul>
            <li>Street view map de google.</li>
            <li>Captura de mapa.</li>
          </ul>
        `
      },
      {
        element: `measurement-btns-section`,
        labelPosition: "bottom",
        title: "Medición",
        text: `<ul>
            <li>Medición de perímetro.</li>
            <li>Medición de área.</li>
          </ul>
        `
      },
      {
        element: `import-layer-btns-section`,
        labelPosition: "bottom",
        title: "Exportación de archivo externo",
        text: `Carga de archivos de capas (geojson, shape en comprimido zip, kml y xlsx).`
      },
      {
        element: `gmao-btns-section`,
        labelPosition: "bottom",
        title: "GMAO",
        text: `Activar / desactivar GMAO.`
      },
      {
        element: `works-btns-section`,
        labelPosition: "bottom",
        title: "Control de obras",
        text: `<ul>
            <li>Activar control de obras.</li>
            <li>Definir luminaria obra.</li>
            <li>Definir instalador obra.</li>
          </ul>
        `
      },
      {
        element: `address-finder`,
        labelPosition: "bottom",
        title: "Buscador de direcciones",
        text: `
          Para usar el buscador:
          <ol>
            <li>
              Escribir una dirección.
            </li>
            <li>
              Esperar a que se muestre alguna sugerencia.
            </li>
            <li>
              Seleccionar una sugerencia y la ubicación se mostrará en el mapa.
            </li>
          </ol> 
        `,
        beforeShowPromise: () => new Promise(resolve => {
          this.barraDeBotones.nativeElement.scrollTo({
                top: 0,
                left:this.barraDeBotones.nativeElement.offsetWidth
              });
            setTimeout(resolve, 100);
        }),
      },
      {
        element: `sortToolbarBtn`,
        labelPosition: "bottom",
        title: "Ordenar barra de herramientas",
        text: `
        Para mostrar la <b>herramienta de organizar la barra de botones</b> hacer click en 
        <img class="small-icon d-inline" src="assets/icons/SVG/PERSONALIZAR.svg">.`
      },
      {
        element: `layerControllerBtn`,
        labelPosition: "bottom",
        title: "Gestión de capas",
        text: `
        Para mostrar la <b>herramienta de gestión de capas de proyecto</b> 
        hacer click en <img class="small-icon d-inline" src="assets/icons/SVG/CAPAS.svg">.`
      },
      {
        element: `project-selector`,
        labelPosition: "bottom",
        title: "Listado de proyectos.",
        text: `Puede moverse entre los proyectos activos desde el listado sin necesidad de salir del mapa.`
      },
      {
        element: `export-options`,
        labelPosition: "bottom",
        title: "Opciones de exportación.",
        text: `Puede generar documentos PDF de listados, fichas, planos. También se puede exportar información de capas en diversos formatos.`,
        event: {
          "show": () => this.ocultarHerramientDeMapa("ControladorCapasBase")
        }
      },
      {
        element: `layer-controller`,
        labelPosition: "left",
        title: "Gestión de capas",
        text: `Active / desactive módulos > grupos > capas del mapa desde ésta herramienta (<img class="small-icon d-inline" src="assets/icons/SVG/CAPAS.svg">).`,
        beforeShowPromise: () => {
          return ! this.ControladorCapasBase.isVisible ?
          this.mostrarHerramientaDeMapa("ControladorCapasBase") :
          Promise.resolve();
        }
      },
      {
        element: `eye-icon-module-1`,
        labelPosition: "left",
        title: null,
        text: `
        Para activar o desactivar un módulo, grupo o capa sobre el mapa,
        hacer click en <img class="small-icon d-inline" src="assets/icons/SVG/VISUALIZAR.svg">.`
      },
      {
        element: `arrow-down-icon-module-1`,
        labelPosition: "left",
        title: null,
        text: `
        Para ocultar o mostrar la estructura módulo > grupo > capa 
        hacer click en <i class="fas fa-chevron-up"></i> / <i class="fas fa-chevron-down"></i> 
        .
        `
      }
    ];

    if( this.ControladorCapasBase.listadosDeCapas.length )
    {
      const optionalSteps:any = [
        {
          element: `arrow-down-layer-1`,
          labelPosition: "left",
          title: null,
          text: `Cada capa tiene una  leyenda. Puede ocultar o mostrar 
          la imagen haciendo click en  <i class="fas fa-chevron-up"></i> / <i class="fas fa-chevron-down"></i>.`
        },
        {
          element: `legend-layer-1`,
          labelPosition: "left",
          title: null,
          text: `En la leyenda se puede ver el significado del estilo de los elementos de una capa.`,
          beforeShowPromise: () => {
            this.ControladorCapasBase.listadosDeCapas[0].colapsado = false;
            return new Promise(resolve => setTimeout(resolve, DURACION_ANIMACION));
          },
          event: {
            "hide": () => this.ControladorCapasBase.listadosDeCapas[0].colapsado = true
          }
        }
      ];

      steps.push(...optionalSteps);
    }

    steps.push(...[
      {
        element: `base-layers-list`,
        labelPosition: "left",
        title: "Capas base",
        text: `
        Puede cambiar la capa base del mapa haciendo click sobre una de las mostradas.
        Por defecto se muestra la capa OSM.
        `,
        beforeShowPromise: () => {
          
          if( ! this.ControladorCapasBase.isVisible)
            this.mostrarHerramientaDeMapa("ControladorCapasBase");

          return new Promise(resolve => setTimeout(resolve, DURACION_ANIMACION));
        }
      },
      {
        element: `control-de-escala`,
        labelPosition: "top",
        title: "Control de escala",
        text: `
          Aquí se puede ver la información referente a la posición del cursor sobre el mapa,
          proyección de proyecto y escala actual.
        `,
        beforeShowPromise: async () => {
          
          if( this.ControladorCapasBase.isVisible )
            await this.ocultarHerramientDeMapa("ControladorCapasBase");
          
          return new Promise(resolve => setTimeout(resolve, DURACION_ANIMACION));
        }
      },
      {
        element: `cursor-coordenadas`,
        labelPosition: "top",
        text: `longitud (X) y latitud (Y) del cursor sobre el mapa.`
      },
      {
        element: `project-crs`,
        labelPosition: "top",
        text: `Nombre de proyección del proyecto.`
      },
      {
        element: `current-scale`,
        labelPosition: "top",
        text: `Escala actual del mapa.`
      },
      {
        element: `scale-selector`,
        labelPosition: "top",
        text: `Puede ver el listado de escalas disponibles haciendo click en el selector para cambiar la actual.`
      }
    ]);

    return steps;
  }

  ////////////////

  public ngOnDestroy():void
  {
    this.router.routeReuseStrategy.shouldReuseRoute = this.routeReuseStrategy;
    this._spinnerService.cleanText();
    this._shepherdService.tourObject = null;
    this.routeDataSubscription.unsubscribe();
  }

}
