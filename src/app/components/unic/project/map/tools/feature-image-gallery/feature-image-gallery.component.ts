import { Component, Input, Output, EventEmitter, ChangeDetectorRef, NgZone } from '@angular/core';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { LatLng, Map, CircleMarker, Polyline, Polygon } from 'leaflet';
import { LayerLocator } from '../../../../../../models/unic/leaflet/layer-locator';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { GeojsonLayerImagesService, LayerImageGallery, FeatureImage } from '../../../../../../services/unic/geojson-layer-images.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { Subscription } from 'rxjs';
import { delayExecution, getFileContent } from 'src/app/shared/helpers';
import { checkIfTheFileExtensionIsCorrect, getFileName, toggleFullscreen } from '../../../../../../shared/helpers';
import { CarouselConfig } from 'ngx-bootstrap/carousel';

@Component({
  selector: 'feature-image-gallery',
  templateUrl: './feature-image-gallery.component.html',
  styleUrls: ['./feature-image-gallery.component.css','../../../../../../../themes/styles/map-tool-bar.scss'],
  providers: [
    { provide: CarouselConfig, useValue: { interval: 0, noPause: false, showIndicators: false } }
  ]
})
export class FeatureImageGalleryComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  public layerLocator:LayerLocator;

  public selectedFeature:any;
  private selectedFeatureSubscription:Subscription;

  public featureImageCollection:Array<FeatureImage>;
  public selectedFeatureImage:FeatureImage;
  public selectedFeatureImageIndex:number;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private onMapClick:(event:any) => void = event => {
    this.layerLocator.onMapClick(event);
    this._changeDetector.detectChanges();
  };

  private onLayerClick:(event:any) => void = event => {
    this.layerLocator.onLayerClick(event);
  };

  public inTheGallery:boolean = false;

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService,
    private _toastrService:ToastrService,
    private _geojsonLayerImagesService:GeojsonLayerImagesService,
    private _spinnerService:SpinnerService,
    private _ngZone:NgZone
  )
  { 
    super();
  }

  get selectedLayer():CircleMarker|Polyline|Polygon
  {
    return this.layerLocator.selectedLayer;
  }

  get thereArelayersNearTheClick():boolean
  {
    return this.layerLocator.thereArelayersNearTheClick;
  }

  get sortedLayersInPulseRange():Array<any>
  {
    return this.layerLocator.sortedLayersInPulseRange;
  }
 
  get lastClickLatLng():LatLng
  {
    return this.layerLocator.lastClickLatLng;
  }

  public async show():Promise<void>
  {    
    this.layerLocator = new LayerLocator(
      this._geojsonLayersService.getProjected(),
      this.map
    );

    this.map.on("click", this.onMapClick);

    this._geojsonLayersService.getProjected().forEach(
      fileLayer => fileLayer.layer.on("click", this.onLayerClick)
    );

    this.selectedFeatureSubscription = this.layerLocator.selectedFeatureObservable.subscribe(feature => {

      this.selectedFeature = feature;
      this.inTheGallery = this.selectedLayer && ! this.layerLocator.layersInPulseRange.length || this.layerLocator.layersInPulseRange.length === 1;

      if(feature)
       this.getImagesOfSelectedFeature();
       
    });

    await super.show();
  }

  public onSelectLayer(layer:CircleMarker|Polyline|Polygon):void
  {
    this.layerLocator.onSelectLayer(layer);
    this._changeDetector.detectChanges();
  }

  public showGallery():void
  {
    this.inTheGallery = true;
    this._changeDetector.detectChanges();
  }

  public async onChangeImageInput(event:any):Promise<void>
  {
    this._ngZone.run( async () => {

      try {
      
        const images:any = event.target.files;
  
        if(images)
        {
          if( images.length > 4 )
            throw new Error("Solo puede cargar una maximo de 4 imagenes.");

          this._spinnerService.updateText("Cargando archivo...");
          this._spinnerService.show();
  
          await delayExecution(250);

          let loadedImagesNumber = images.length;

          for(let image of images)
          {
            if( ! checkIfTheFileExtensionIsCorrect([image], ["png", "jpeg", "jpg"]) )
              throw new Error("El archivo debe ser una imagen png, jpeg o jpg.");
                
            const imageSrc = await getFileContent(image,"dataURL");
    
            const geojsonLayer = this._geojsonLayersService.findByLayer( this.selectedLayer );
    
            let layerImageGallery = await this._geojsonLayerImagesService.find(geojsonLayer.layerId);
    
            if( layerImageGallery )
            {
              const featureImages = layerImageGallery.features.find(record => record.id === this.selectedFeature.id);
    
              if( featureImages )
              {                
                if( featureImages.images.length === 4 )
                  throw new Error("El elemento seleccionado ya cumplio el limite de imagenes.");
                
                const missingImagesNumber = (4 - featureImages.images.length);

                if( missingImagesNumber  < loadedImagesNumber )
                  throw new Error(`El número de imagenes que desea cargar excede el número de faltantes (${missingImagesNumber}).`);
    
                featureImages.images.push({
                  file_name: getFileName(image),
                  upload_date: new Date().toString(),
                  src:imageSrc
                });
              }
              else
              {
                layerImageGallery.features.push({
                  id: this.selectedFeature.id,
                  images:[
                    {
                      file_name: getFileName(image),
                      upload_date: new Date().toString(),
                      src:imageSrc
                    }
                  ]
                });
              }
              
              await this._geojsonLayerImagesService.update(layerImageGallery);
            }
            else
            {
              layerImageGallery = {
                layer_id: geojsonLayer.layerId,
                features: [
                  {
                    id: this.selectedFeature.id,
                    images:[
                      {
                        file_name: getFileName(image),
                        upload_date: new Date().toString(),
                        src:imageSrc
                      }
                    ]
                  }
                ]
              };
    
              await this._geojsonLayerImagesService.save(layerImageGallery);
            }

            --loadedImagesNumber;
          }
          
          await this.getImagesOfSelectedFeature();

          this._toastrService.success("Imagen/es añadida/s.", "Exito!");
        }
  
      } catch (error) 
      {
        console.error(error);      
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        event.target.value = null;
        this._spinnerService.hide();
        this._spinnerService.cleanText(); 
      }

    });
  }

  private async getImagesOfSelectedFeature():Promise<void>
  {  
    const layerImageGallery = await this.getLayerImageGallery();

    const selectedFeatureHasImages = layerImageGallery && layerImageGallery.features.some(record => record.id === this.selectedFeature.id);
    
    if( selectedFeatureHasImages )
    {
      this.featureImageCollection = [...layerImageGallery.features.find(record => record.id === this.selectedFeature.id).images];
      this.selectedFeatureImage = this.featureImageCollection[0];
      this.selectedFeatureImageIndex = 0;
    }
    else
    {
      this.featureImageCollection = [];
      this.selectedFeatureImage = null;
      this.selectedFeatureImageIndex = null;
    }

    this._changeDetector.detectChanges(); 
  }

  private async getLayerImageGallery():Promise<LayerImageGallery>
  {
    const geojsonLayer = this._geojsonLayersService.findByLayer( this.selectedLayer );
  
    return await this._geojsonLayerImagesService.find(geojsonLayer.layerId);
  }

  public async removeImage():Promise<void>
  {
    this._ngZone.run( async () => {

      try
      {       
        const layerImageGallery = await this.getLayerImageGallery();
    
        const featureImageCollectionIndex = layerImageGallery.features.findIndex(record => record.id === this.selectedFeature.id);
        
        layerImageGallery.features[ featureImageCollectionIndex ].images = layerImageGallery.features[ featureImageCollectionIndex ].images.filter(
          image => image.upload_date !== this.selectedFeatureImage.upload_date
        );
    
        await this._geojsonLayerImagesService.update(layerImageGallery);
  
        await this.getImagesOfSelectedFeature();
  
        this._toastrService.success("Imagen removida.", "Exito!");
  
        this._changeDetector.detectChanges();
  
      } catch (error) 
      {
        console.error(error);      
        this._toastrService.error(error.message, "Error");
      }

    });
  }

  public changeCarouselImage(direction:"right"|"left"):void
  {
    if( direction === "right" )
    {
      this.selectedFeatureImageIndex = this.selectedFeatureImageIndex + 1 > this.featureImageCollection.length - 1 ? 
      0 : this.selectedFeatureImageIndex + 1;
    }
    else
    {
      this.selectedFeatureImageIndex = this.selectedFeatureImageIndex - 1 < 0 ? 
      this.featureImageCollection.length - 1 : this.selectedFeatureImageIndex - 1;
    } 

    this.selectedFeatureImage = this.featureImageCollection[ this.selectedFeatureImageIndex ];

    this._changeDetector.detectChanges();
  }

  public toggleFullscreen(event:any):void
  {
    toggleFullscreen(event);
  }

  public onSelectImage(image:FeatureImage):void
  {
    this.selectedFeatureImage = image;
    
    this.selectedFeatureImageIndex = this.featureImageCollection.findIndex(_image => _image.upload_date === image.upload_date);
        
    this._changeDetector.detectChanges();
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.map.off("click", this.onMapClick);

    this._geojsonLayersService.getProjected() .forEach(
      fileLayer => fileLayer.layer.off("click", this.onLayerClick)
    );

    this.layerLocator.deselectLayer();

    this.layerLocator = null;

    this.featureImageCollection = [];
    this.selectedFeatureImage = null;
    this.selectedFeatureImageIndex = null;
    this.inTheGallery = false;

    this.selectedFeatureSubscription.unsubscribe();

    await super.hide();

    this._changeDetector.detectChanges();
  }

}
