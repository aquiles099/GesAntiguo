require("../../../../models/unic/leaflet/custom-markers.js");
import "leaflet/dist/images/marker-shadow.png";

import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewChecked, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { icon, MapOptions, Marker, tileLayer, TileLayer, FeatureGroup, featureGroup, Draw, Polyline, drawLocal, Polygon, DrawMap, GeometryUtil, LatLngBounds } from 'leaflet';
import { ProjectService } from '../../../../services/unic/project.service';
import { Project } from '../../../../interfaces/project';
import { ToastrService } from 'ngx-toastr';
import { MapService } from '../../../../services/unic/map.service';
import { GeojsonLayersService } from '../../../../services/unic/geojson-layers.service';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation, fadeInRightOnEnterAnimation, fadeOutRightOnLeaveAnimation } from 'angular-animations';
import proj4 from 'proj4';
import { saveAs } from 'file-saver';
import { delayExecution } from 'src/app/shared/helpers';
import { ProjectsService } from '../../../../services/unic/projects.service';
import { Observable, Observer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { isJsonString } from '../../../../shared/helpers';
import { ActivatedRoute, Router } from '@angular/router';
import { availableScales } from '../../../shared/map';
import { GeojsonFilesAnalysisChartsConfigurationsService } from '../../../../services/unic/geojson-files-analysis-charts-configurations.service';

/* MAP TOOLS */
import { LayerControllerComponent } from './tools/layer-controller/layer-controller.component';
import { AnalysisChartsComponent } from './tools/analysis-charts/analysis-charts.component';
import { FeatureInfoComponent } from './tools/feature-info/feature-info.component';
import { NewFeatureComponent } from './tools/new-feature/new-feature.component';
import { EditFeatureComponent } from './tools/edit-feature/edit-feature.component';
import { RemoveFeatureComponent } from './tools/remove-feature/remove-feature.component';
import { EditFeatureGeometryComponent } from './tools/edit-feature-geometry/edit-feature-geometry.component';
import { SpinnerService } from '../../../../services/spinner.service';
import { StreetViewMapComponent } from './tools/street-view-map/street-view-map.component';
import { FeatureFilterComponent } from './tools/feature-filter/feature-filter.component';
import { CopyFeatureComponent } from './tools/copy-feature/copy-feature.component';
import { CategorizeFeatureComponent } from './tools/categorize-feature/categorize-feature.component';
import { FeatureImageGalleryComponent } from './tools/feature-image-gallery/feature-image-gallery.component';
import { FeaturePdfTemplateConfigurationComponent } from './tools/export/feature-pdf-template-configuration/feature-pdf-template-configuration.component';
import { FeatureExportComponent } from './tools/export/feature-export/feature-export.component';
import { PlanimetryComponent } from './tools/planimetry/planimetry.component';
import { ExportLayerFileComponent } from './tools/export-layer-file/export-layer-file.component';
import { FeatureTableComponent } from './tools/feature-table/feature-table.component';
import { FilteredFeatureTableComponent } from './tools/filtered-feature-table/filtered-feature-table.component';
import { EditMultipleFeaturesComponent } from './tools/edit-multiple-features/edit-multiple-features.component';
import LeafletWms from 'leaflet.wms';

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

require("leaflet.path.drag/src/Path.Drag.js");
require("leaflet-editable/src/Leaflet.Editable.js");

require("src/assets/fonts/Arial-jsPdf.js");

const ANIMATION_DURATION = 250;

@Component({
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css', '../../../../../themes/styles/map.scss'],
  animations: [
    fadeInOnEnterAnimation({ duration: ANIMATION_DURATION }),
    fadeOutOnLeaveAnimation({ duration: ANIMATION_DURATION }),
    fadeInRightOnEnterAnimation({ duration: ANIMATION_DURATION }),
    fadeOutRightOnLeaveAnimation({ duration: ANIMATION_DURATION })
  ]
})
export class MapComponent implements OnInit, AfterViewChecked, OnDestroy
{
  public showSpinner: boolean = true;
  public showToolsMenu: boolean = false;

  public drawnItemsLayer: FeatureGroup = featureGroup();

  public map: DrawMap;

  public baseLayer: TileLayer = tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    crossOrigin: 'anonymous',
    className: 'OSM',
    maxNativeZoom: 19,
    maxZoom: 22,
    minZoom: 5
  });

  public options: MapOptions = {
    zoom: 17,
    zoomControl: false,
    center: [40.395347, -3.694041],
    editable: true,
    preferCanvas: true
  };

  public cursorCoordinates: string;
  public currentScale: string;

  @ViewChild('scaleControl')
  private scaleControl:ElementRef<HTMLElement>;
  public showScaleControl:boolean = true;

  public availableScales:any[] = availableScales;

  public toolBarButtonGroups: any[] = [
    {
      key: "Creación y Edición",
      value: "edition",
      enabled: true
    },
    {
      key: "Análisis e información",
      value: "analysis",
      enabled: true
    },
    {
      key: "Captura y street view",
      value: "streetView",
      enabled: true
    },
    {
      key: "Medición",
      value: "measurement",
      enabled: true
    }
  ];

  public showSmallSpinner:boolean = false;

  /* MEASUREMENT */

  public measurement: Draw.Polyline | Draw.Polygon;
  public measurementType: string;
  public inMeasurement: boolean = false;

  private onMeasuringClosure: (event: any) => void = event => {
    this.calculateMeasurement(event.layer);
    this.buildMeasurementInstance();
    this._changeDetector.detectChanges();
  };

  // SEARCH ADDRESS

  @ViewChild('addressFinderContainer')
  public addressFinderContainer:ElementRef<HTMLElement>;

  @ViewChild('addressSearcher')
  public addressSearcher:ElementRef<HTMLElement>;

  public addressSearched:string = null;

  public suggestedDirection$:Observable<string[]>;

  /**
   *  MAP TOOLS
   */

  public currentlyOpenSection: string;

  public hidingOrShowingTool:boolean = false;

  @ViewChild(LayerControllerComponent)
  public LayerController: LayerControllerComponent;

  @ViewChild(AnalysisChartsComponent)
  public AnalysisCharts: AnalysisChartsComponent;

  @ViewChild(FeatureInfoComponent)
  public FeatureInfo: FeatureInfoComponent;

  @ViewChild(NewFeatureComponent)
  public NewFeature: NewFeatureComponent;

  @ViewChild(RemoveFeatureComponent)
  public RemoveFeature: RemoveFeatureComponent;

  @ViewChild(EditFeatureComponent)
  public EditFeature: EditFeatureComponent;

  @ViewChild(EditMultipleFeaturesComponent)
  public EditMultipleFeatures: EditMultipleFeaturesComponent;

  @ViewChild(EditFeatureGeometryComponent)
  public EditFeatureGeometry: EditFeatureGeometryComponent;

  @ViewChild(CopyFeatureComponent)
  public CopyFeature: CopyFeatureComponent;

  @ViewChild(StreetViewMapComponent)
  public StreetViewMap: StreetViewMapComponent;

  @ViewChild(FeatureFilterComponent)
  public FeatureFilter: FeatureFilterComponent;

  @ViewChild(CategorizeFeatureComponent)
  public CategorizeFeature: CategorizeFeatureComponent;

  @ViewChild(FeatureImageGalleryComponent)
  public FeatureImageGallery: FeatureImageGalleryComponent;

  @ViewChild(FeaturePdfTemplateConfigurationComponent)
  public FeaturePdfTemplateConfiguration:FeaturePdfTemplateConfigurationComponent;

  @ViewChild(FeatureExportComponent)
  public FeatureExport:FeatureExportComponent;

  @ViewChild(PlanimetryComponent)
  public Planimetry:PlanimetryComponent;

  @ViewChild(ExportLayerFileComponent)
  public ExportLayerFile:ExportLayerFileComponent;

  @ViewChild(FilteredFeatureTableComponent)
  public FilteredFeatureTable:FilteredFeatureTableComponent;

  @ViewChild(FeatureTableComponent)
  public FeatureTable:FeatureTableComponent;

  private routeReuseStrategy:any;

  constructor(
    private _projectsService: ProjectsService,
    private _projectService: ProjectService,
    private toastr: ToastrService,
    private _spinnerService: SpinnerService,
    private _mapService: MapService,
    private _geojsonLayersService: GeojsonLayersService,
    private _geojsonFilesAnalysisChartsConfigurationsService:GeojsonFilesAnalysisChartsConfigurationsService,
    private _changeDetector: ChangeDetectorRef,
    private router:Router
  ) {
    this.routeReuseStrategy = this.router.routeReuseStrategy.shouldReuseRoute;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    drawLocal.draw.handlers.polyline.tooltip.start = "Click para empezar a medir.";
    drawLocal.draw.handlers.polyline.tooltip.cont = "Click para seguir.";
    drawLocal.draw.handlers.polyline.tooltip.end = "Click en ultimo punto para terminar.";
    drawLocal.draw.handlers.polygon.tooltip.start = "Click para empezar a medir.";
    drawLocal.draw.handlers.polygon.tooltip.cont = "Click para seguir.";
    drawLocal.draw.handlers.polygon.tooltip.end = "Click en primer punto para terminar.";

    // prevenir que dibujos se cancelen al presionar tecla escape.
    (Draw.Feature as any).prototype._cancelDrawing = () => {};
  }

  get currentBaseLayer(): string {
    return this.baseLayer.options.className;
  }

  get crs():string
  {
    return this._projectService.configuration ? this._projectService.configuration.datos_municipio.nombre_proyeccion : null;
  }

  get project():Project
  {
    return this._projectService.project;
  }

  public async ngOnInit(): Promise<void>
  {
    this.buildAddressSearcherObserver();
  }

  private buildAddressSearcherObserver():void
  {
    this.suggestedDirection$ = new Observable((observer: Observer<string>) => {
      observer.next(this.addressSearched);
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
          this.toastr.error(error.message,"Error");
        }

        return [];
      })
    );
  }

  public ngAfterViewChecked(): void
  {
    this._changeDetector.detectChanges();
    this.setPositionOfSearcherCompleter(true);
  }

  @HostListener("window:scroll",["$event"])
  @HostListener("window:resize", ["$event"])
  public setPositionOfSearcherCompleter(event?:any):void
  {
    if( event )
    {
      this.addressSearcher.nativeElement.style.left = this.addressFinderContainer.nativeElement.getBoundingClientRect().x + "px";
      this.addressSearcher.nativeElement.style.top = this.addressFinderContainer.nativeElement.getBoundingClientRect().y + "px";     
    }
  }

  public async onMapReady(map: DrawMap): Promise<void>
  {
    try
    {
      const projectConfiguration = (await this._projectsService.getProjectConfigurationInfo(this.project.id_proyecto)).datos;

      this._projectService.setConfiguration(projectConfiguration);

      this.map = map;

      map.fitBounds( (this._projectService.bbox as any) );

      // provisional
      let url = projectConfiguration.geoserver.ruta.replace("http","https");

      const municipalityLayer = LeafletWms.overlay(url, ({
        layers: projectConfiguration.geoserver.layer,
        format: 'image/png',
        crossOrigin: true,
        transparent: true,
        opacity: 1,
        maxNativeZoom: 22,
        maxZoom: 22,
        cql_filter: `id=${projectConfiguration.datos_municipio.municipio}`
      } as any));

      this.map.addLayer(municipalityLayer);

      this.map.addLayer(this.drawnItemsLayer);

      this._mapService.next(map);
      this._mapService.baseLayer = this.baseLayer;

      await this._geojsonLayersService.loadExistingLayers();

      await this._geojsonFilesAnalysisChartsConfigurationsService.load();

      this.showSpinner = false;

    }
    catch (error)
    {
      console.error(error);
      this.toastr.error(error.message,"Error");
      this.router.navigateByUrl("/unic/home/proyectos");
    }
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

  public async onSearchAddress():Promise<void>
  {
    if(  this.addressSearched.trim() )
    {
      try
      {
        this.toggleSmallSpinnerVisibility();

        const response = await this._projectsService.consultarApi({
            "funcion": "localizacion_geolocalizar",
            "municipio": this._projectService.configuration.datos_municipio.nombre,
            "direccion": this.addressSearched
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
        this.toastr.error(error.message,"Error");
      }
      finally
      {
        this.toggleSmallSpinnerVisibility();
      }
    }
  }

  public toggleSmallSpinnerVisibility():void
  {
    this.showSmallSpinner = ! this.showSmallSpinner;
  }

  public async toggleToolsMenuVisibility():Promise<void>
  {
    if( this.currentlyOpenSection && (this.currentlyOpenSection !== "AnalysisCharts" || ! this.AnalysisCharts.isActive) )
      await this.toggleSectionVisibility( this.currentlyOpenSection );

    this.showToolsMenu = !this.showToolsMenu;

    await delayExecution(ANIMATION_DURATION);
  }

  public toggleToolbarButtonGroupVisibility(buttonGroup: any): void {
    buttonGroup.enabled = !buttonGroup.enabled;
  }

  public toolbarButtonGroupIsEnabled(value: string): boolean {
    return this.toolBarButtonGroups.find(btnGroup => btnGroup.value === value).enabled;
  }

  public changeBaseLayer(baseLayer: TileLayer): void
  {
    this.baseLayer = baseLayer;

    this._mapService.baseLayer = this.baseLayer;
    
    // establecer zIndex de capa base en 0 para evitar que cubra alguna otra capa.
    this.baseLayer.setZIndex(0);

    if( ! this.baseLayer.hasEventListeners("loading") && ! this.baseLayer.hasEventListeners("load"))
    {
      this.baseLayer.on({
        "loading": () => this._mapService.loadingWmsLayer( (this.baseLayer as any)._leaflet_id ),
        "load": () => this._mapService.wmsLayerLoaded( (this.baseLayer as any)._leaflet_id )
      });
    }
  }

  public async toggleSectionVisibility(sectionName: string, moveScaleControl:boolean = true): Promise<void>
  {
    if( this.hidingOrShowingTool )
      return;
    
    this.hidingOrShowingTool = true;

    this[sectionName].isVisible ?
    await this.hideMapTool(sectionName) :
    await this.showMapTool(sectionName, moveScaleControl);

    this.hidingOrShowingTool = false;
  }

  public async hideMapTool(sectionName:string):Promise<void>
  {
    await this[sectionName].hide();

    if( this.AnalysisCharts.isActive && sectionName !== "AnalysisCharts" )
    {
      this.showScaleControl = false;

      this.currentlyOpenSection = "AnalysisCharts";
      this.AnalysisCharts.show();
    }
    else
    {
      if(sectionName === "AnalysisCharts")
        this.AnalysisCharts.desactivate();

      await this.onHideMapTool();
    }
  }

  public async showMapTool(sectionName:string, moveScaleControl:boolean = true):Promise<void>
  {
    if(this.showToolsMenu)
      await this.toggleToolsMenuVisibility();

    if (this.currentlyOpenSection)
      await this[this.currentlyOpenSection].hide();

    if( sectionName === "AnalysisCharts" )
    {
      this.showScaleControl = false;
    }
    else
    {
      if( moveScaleControl )
        await this.moveScaleControl("left");
    }

    if (this.inMeasurement)
      this.finishMeasurement();

    await this[sectionName].show();

    this.currentlyOpenSection = sectionName;
  }

  public async onHideMapTool(): Promise<void>
  {
    this.currentlyOpenSection = null;
    await this.moveScaleControl("right");
  }

  public async onHideAnalysisCharts():Promise<void>
  {
    this.currentlyOpenSection = null;
    await delayExecution(ANIMATION_DURATION);
    this.showScaleControl = true;
  }

  private async moveScaleControl(direcction:"right"|"left"):Promise<void>
  {
    if( ! this.showScaleControl )
    {
      this.showScaleControl = true;
      await delayExecution(ANIMATION_DURATION);
    }

    direcction === "left" ?
    this.scaleControl.nativeElement.style.right =  "45%" :
    this.scaleControl.nativeElement.style.right = "1%";
  }

  /* MEASUREMENT */

  public async startMeasurement(type: string): Promise<void>
  {
    if (!this.inMeasurement)
    {
      if (this.currentlyOpenSection) {
        await this[this.currentlyOpenSection].hide();
        this.currentlyOpenSection = null;
        this.showScaleControl = true;
      }

      this.map.on("draw:created", this.onMeasuringClosure);
      this.measurementType = type;
      this.inMeasurement = true;
      this.buildMeasurementInstance();
    }
    else {
      if (type !== this.measurementType) {
        this.finishMeasurement();
        this.startMeasurement(type);
      }
      else {
        this.finishMeasurement();

        if( this.AnalysisCharts.isActive)
        {
          this.currentlyOpenSection = "AnalysisCharts";
          this.AnalysisCharts.show();
        }
      }
    }
  }

  private buildMeasurementInstance(): void {
    switch (this.measurementType) {
      case "perimeter":
        this.measurement = new Draw.Polyline(this.map, {
          shapeOptions: {
            color: '#218D8F'
          }
        });
        break;

      case "area":
        this.measurement = new Draw.Polygon(this.map, {
          shapeOptions: {
            color: '#218D8F'
          }
        });
        break;
    }

    this.measurement.enable();
  }

  private calculateMeasurement(layer: Polyline | Polygon): void {
    switch (this.measurementType) {
      case "perimeter":

        let distanceInMeters = 0, lastPointEvaluated;

        layer.getLatLngs().forEach(_latlng => {

          if (lastPointEvaluated)
            distanceInMeters += lastPointEvaluated.distanceTo(_latlng);

          lastPointEvaluated = _latlng;

        });

        layer.bindTooltip(distanceInMeters.toFixed(3) + " m", { 'permanent': true });

        break;

      case "area":

        const _area = GeometryUtil.geodesicArea((layer.getLatLngs()[0] as any)).toFixed(3);

        //console.log( area( (layer.toGeoJSON() as any) ) );

        layer.bindTooltip(_area + " m2", { 'permanent': true });

        break;
    }

    this.drawnItemsLayer.addLayer(layer);
  }

  public async finishMeasurement(): Promise<void> {
    this.measurement.disable();
    this.measurement = null;
    this.drawnItemsLayer.clearLayers();
    this.map.off("draw:created", this.onMeasuringClosure);
    this.measurementType = null;
    this.inMeasurement = false;
  }

  /*  */

  public async mapScreenshot(): Promise<void> {
    try
    {
      this._spinnerService.updateText("Por favor, espere...");
      this._spinnerService.show();

      const imgSrc = await this._mapService.getMapScreenshot();

      saveAs(imgSrc, `${this.project.nombre}_mapa.jpeg`);
    }
    catch (error) {
      console.log(error);
      this.toastr.error("Captura de mapa no ha podido ser generada.", "Error.");
    }
    finally
    {
      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }

   }

   /*
   * FEATURE EXPORT
    */

   public async toggleFeaturePdfTemplateConfigurationToolVisibility(type:"sheet"|"listing"):Promise<void>
   {
     if( this.FeaturePdfTemplateConfiguration.isVisible && this.FeaturePdfTemplateConfiguration.templateType === type )
     {
      await this.hideMapTool("FeaturePdfTemplateConfiguration");
     }
     else
     {
      this.FeaturePdfTemplateConfiguration.templateType = type;

      if( ! this.FeaturePdfTemplateConfiguration.isVisible )
        await this.showMapTool("FeaturePdfTemplateConfiguration");
     }
   }

   public async showFeatureExportTool(data:any):Promise<void>
   {
     this.FeatureExport.pdfTemplate = data.template;
     this.FeatureExport.selectedFileLayer = data.fileLayer;
     await this.FeatureExport.show();
     this.currentlyOpenSection = 'FeatureExport';
   }

   public ngOnDestroy():void
   {
     this.router.routeReuseStrategy.shouldReuseRoute = this.routeReuseStrategy;
   }

}
