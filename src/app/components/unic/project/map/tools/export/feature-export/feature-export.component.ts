import { Component, Input, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Map, Polyline, Polygon, CircleMarker} from 'leaflet';
import { HideableSectionComponent } from '../../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../../services/unic/geojson-layers.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { LayerHighlighter } from '../../../../../../../models/unic/leaflet/layer-highlighter';
import { FeatureSheetTemplate } from '../../../../../../../interfaces/geojson/export/feature-sheet-template';
import { FeatureSheetPdfExporter } from '../../../../../../../models/unic/geojson/pdf-export/feature-sheet-pdf-exporter';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { MapService } from '../../../../../../../services/unic/map.service';
import { GeojsonLayerImagesService } from '../../../../../../../services/unic/geojson-layer-images.service';
import { GeoJSONLayer } from 'src/app/models/unic/geojson/geojson-layer';
import { delayExecution } from 'src/app/shared/helpers';

@Component({
  selector: 'feature-export-section',
  templateUrl: './feature-export.component.html',
  styleUrls: ['./feature-export.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class FeatureExportComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  public selectedFileLayer:GeoJSONLayer;
  public pdfTemplate:FeatureSheetTemplate;

  private layerHighlighter:LayerHighlighter;

  public selectedLayer:CircleMarker|Polyline|Polygon;
 
  private onLayerClickClosure: (event:any) => void = event => 
  {
    if( this.selectedLayer )
      this.layerHighlighter.remove(this.selectedLayer);

    this.layerHighlighter.apply(event.layer);

    this.selectedLayer = event.layer;

    event.layer instanceof CircleMarker ?
    this.map.flyTo( event.layer.getLatLng(), 20, {duration: .50}) :
    this.map.flyToBounds( event.layer.getBounds(), { duration: .50});

    this._changeDetector.detectChanges();
  };

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService,
    private _geojsonLayerImagesService:GeojsonLayerImagesService,
    private _projectService:ProjectService,
    private _mapService:MapService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService
  )
  {
    super();
  }

  public async show():Promise<void>
  {
    this._geojsonLayersService
        .getProjected()
        .forEach(fileLayer => {
          
          if( fileLayer !== this.selectedFileLayer )
            this.map.removeLayer(fileLayer.layer);

        });

    this.selectedFileLayer.layer.on("click", this.onLayerClickClosure);          

    this.layerHighlighter = new LayerHighlighter( [this.selectedFileLayer] );
    
    this.map.doubleClickZoom.disable(); 

    await super.show();
  }

  public async export():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Generando pdf...");
      this._spinnerService.show();

      await delayExecution(250);

      const mapImageRequired = this.pdfTemplate.propertiesGroups.some(propertyGroup => typeof propertyGroup === "string" && propertyGroup === "map");
      
      if( mapImageRequired )
        await this.addMapScreenshotInPdfTemplate();

      const featureImagesCollectionRequired = this.pdfTemplate.propertiesGroups.some(propertyGroup => typeof propertyGroup === "string" && propertyGroup === "images");

      if( featureImagesCollectionRequired )
        await this.addFeatureImageCollectionInPdfTemplate();

      const pdfExporter = new FeatureSheetPdfExporter(
        this.pdfTemplate,
        (this.selectedLayer as any).feature,
        this._projectService.project
      );

      await pdfExporter.build();

      pdfExporter.download();

      this._toastrService.success("Pdf generado.","Exito!");
    } 
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }
  }

  private async addMapScreenshotInPdfTemplate():Promise<void>
  {
    let currentMapZoom = this.map.getZoom();
    
    this.map.removeLayer( this.selectedFileLayer.layer );
    
    this.map.addLayer( this.selectedLayer );

    if( this.selectedLayer.feature.geometry.type === "Point")
      this.map.setZoom(20);
        
    this.pdfTemplate.mapImageSrc = await this._mapService.getMapScreenshot();

    this.map.removeLayer( this.selectedLayer );

    this.map.addLayer( this.selectedFileLayer.layer );

    this.map.setZoom(currentMapZoom);
  }

  private async addFeatureImageCollectionInPdfTemplate():Promise<void>
  {
    const layerImageGallery = await this._geojsonLayerImagesService.find( this.selectedFileLayer.layerId );
    
    if( layerImageGallery )
    {
      const featureImageCollection = layerImageGallery.features.find(feature => feature.id == (this.selectedLayer as any).feature.id);

      if( featureImageCollection )
        this.pdfTemplate.featureImages = [...featureImageCollection.images];
    }
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this._spinnerService.updateText("Proyectando capas...");
    this._spinnerService.show();

    this.pdfTemplate = null;

    this.selectedFileLayer.layer.off("click", this.onLayerClickClosure);

    this._geojsonLayersService.getProjected().forEach(fileLayer => {
    
      if( fileLayer !== this.selectedFileLayer )
        this.map.addLayer(fileLayer.layer);

    });

    this.selectedFileLayer = null;

    if( this.selectedLayer )
    {
      this.layerHighlighter.remove( this.selectedLayer );
      this.selectedLayer = null;
    }
    
    this.layerHighlighter = null;

    this.map.doubleClickZoom.enable(); 

    await super.hide();

    this._spinnerService.hide();
    this._spinnerService.cleanText();

  }

}
