import { Component, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Map, DomUtil, TileLayer, tileLayer, LatLng } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { MapService } from '../../../../../../../services/unic/map.service';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { CarouselConfig } from 'ngx-bootstrap/carousel';
import { checkIfTheFileExtensionIsCorrect, getFileExtension, toggleFullscreen, getFileName } from '../../../../../../../shared/helpers';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { getFileContent } from 'src/app/shared/helpers';
import { ShepherdService } from 'angular-shepherd';

interface Image
{
  nombre:string;
  url:string;
  fecha:string;
}
@Component({
  selector: 'herramienta-galeria-de-elemento',
  templateUrl: './galeria-de-elemento.component.html',
  styleUrls: ['./galeria-de-elemento.component.css','../../../../../../../../themes/styles/map-tool-bar.scss'],
  providers: [
    { provide: CarouselConfig, useValue: { interval: 0, noPause: false, showIndicators: false } }
  ]
})
export class GaleriaDeElementoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  private elementsInClickRange:any[] = [];

  private layerFilters:{[filter:string]:string} = {};

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private highlightedElementLayer:TileLayer.WMS;

  public showSpinner:boolean = false;

  public selectedLayer:any;

  private onMapClick: (event:any) => void = event => 
  {
    this._ngZone.run( async () => {

      try
      {
        this.map.off("click", this.onMapClick);

        this._mapService.disableEvents();

        this.showSpinner = true;

        const latlng:LatLng = event.latlng;

        const point = {
          type: "Point",
          coordinates: [latlng.lng, latlng.lat]
        };

        GeoJSONHelper.reproyectGeometry(
          null,
          this._projectService.configuration.datos_municipio.nombre_proj4, 
          point
        );
        
        const data = (await this._projectsService.consultarApi({
            funcion: "web_informacion_fotos",
            proyecto: this.project.bd_proyecto,
            proyeccion: this.project.proyeccion,
            pulsacion: point.coordinates,
            capas_filtro: this.layerFilters
        })).datos;

        this.inTheGallery = false;
        this.selectedLayer = null;
        this.selectedImage = null;
        this.selectedImageIndex = 0;      

        if( this.highlightedElementLayer )
        {
          this.highlightedElementLayer.remove();
          this.highlightedElementLayer = null;
        }
          
        this.elementsInClickRange = [];

        for( const [id, elementData] of Object.entries(data))
          this.elementsInClickRange.push(elementData);

        if( this.elementsInClickRange.length === 1 )
        {
          this.onSelectLayer(this.elementsInClickRange[0]);
          this.showGallery();
        }
      }
      catch (error)
      {
        this._toastrService.error(error.message, "Error");
      }
      finally
      {
        this._mapService.enableEvents();
        this.map.on("click", this.onMapClick);
        this.showSpinner = false;
      }
    });
  };

  public inTheGallery:boolean = false;

  public selectedImage:Image;
  public selectedImageIndex:number = 0;

  constructor(
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _projectLayersService:ProjectLayersService,
    private _mapService:MapService,
    private _spinnerService:SpinnerService,
    private _ngZone:NgZone,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get thereArelayersNearTheClick():boolean
  {
    return this.elementsInClickRange.length > 0;
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async show():Promise<void>
  {
    this.layerFilters = this._projectLayersService.obtenerFiltrosDeCapas();

    this.map.on("click", this.onMapClick);

    this.map.doubleClickZoom.disable(); 

    DomUtil.addClass(this.map.getContainer(), 'cursor-help');

    await super.show();
  }

  public async onSelectLayer(layerData:any):Promise<void>
  {
    try
    {
      if( layerData.bbox )
      {
        this.map.flyToBounds(([
          (layerData.bbox as number[]).slice(0,2).reverse(),
          (layerData.bbox as number[]).slice(2,4).reverse()
        ] as any),{duration: .50});
      }

      if( this.highlightedElementLayer )
        this.highlightedElementLayer.remove();

      const filtroCapa = layerData.capa.split("#");

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
        cql_filter: `id_${filtroCapa[2]}='${layerData.id}'`,
        env: "buffer:30"
      };

      this.highlightedElementLayer = tileLayer.wms(this._projectService.baseUrl, wmsOptions);

      this.map.addLayer(this.highlightedElementLayer);

      this.selectedLayer = layerData;

    }
    catch (error)
    {
      this._toastrService.error(error.message);  
    }
  }

  public async showGallery():Promise<void>
  {
    this.inTheGallery = true;

    if( this.selectedLayer.fotos.length )
      this.selectedImage = this.selectedLayer.fotos[0];
  }

  public async onChangeImageInput(event:any):Promise<void>
  {
    try {
    
      const image:File = event.target.files[0];

      if( ! image)
        return;
      
      if( ! checkIfTheFileExtensionIsCorrect([image], ["png", "jpeg", "jpg"]) )
        throw new Error("El archivo debe ser una imagen png, jpeg o jpg.");
        
      this._spinnerService.updateText("Cargando imagen...");
      this._spinnerService.show();

      const layerFilter = this.selectedLayer.capa.split("#");

      let imageSrc = (await getFileContent(image,"dataURL"));
      
      imageSrc = imageSrc.substring( imageSrc.indexOf(",") );

      const responseData = (await this._projectsService.consultarApi({
        "funcion": "web_subir_foto_elemento",
        "proyecto": this.project.bd_proyecto,
        "modulo": layerFilter[0],
        "grupo": layerFilter[1],
        "capa": layerFilter[2],
        "id_elemento": this.selectedLayer.id,
        "titulo": getFileName(image),
        "extension": getFileExtension(image),
        "foto": imageSrc
      })).datos;

      this.selectedLayer.fotos = [...responseData.fotos];

      this.selectedImageIndex = this.selectedLayer.fotos.findIndex(image => image.url === responseData.url);
      
      this.selectedImage = this.selectedLayer.fotos[this.selectedImageIndex];

      this._toastrService.success("Imagen añadida.", "Exito!");

    } catch (error) 
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      event.target.value = null;
      this._spinnerService.hide();
      this._spinnerService.cleanText(); 
    }
  }

  public async removeImage():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Removiendo imagen...");
      this._spinnerService.show();

      const layerFilter = this.selectedLayer.capa.split("#");

      await this._projectsService.consultarApi({
        "funcion": "web_eliminar_foto_elemento",
        "proyecto": this.project.bd_proyecto,
        "modulo": layerFilter[0],
        "grupo": layerFilter[1],
        "capa": layerFilter[2],
        "id_elemento": this.selectedLayer.id,
        "url_foto": this.selectedImage.url
      });

      this.selectedLayer.fotos = this.selectedLayer.fotos.filter(image => image.fecha !== this.selectedImage.fecha);

      if( this.selectedLayer.fotos.length )
      {
        this.selectedImageIndex === this.selectedLayer.fotos.length ?
        this.selectedImage = this.selectedLayer.fotos[this.selectedImageIndex - 1] : 
        this.selectedImage = this.selectedLayer.fotos[this.selectedImageIndex]; 
      }
      else
      {
        this.selectedImage = null;
        this.selectedImageIndex = null;
      }

      this._toastrService.success("Imagen eliminada.", "Exito!");

    } catch (error) 
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText(); 
    }
  }

  public changeCarouselImage(direction:"right"|"left"):void
  {
    if( direction === "right" )
    {
      this.selectedImageIndex = this.selectedImageIndex + 1 > this.selectedLayer.fotos.length - 1 ? 
      0 : this.selectedImageIndex + 1;
    }
    else
    {
      this.selectedImageIndex = this.selectedImageIndex - 1 < 0 ? 
      this.selectedLayer.fotos.length - 1 : this.selectedImageIndex - 1;
    } 

    this.selectedImage = this.selectedLayer.fotos[ this.selectedImageIndex ];
  }

  public toggleFullscreen(event:any):void
  {
    toggleFullscreen(event);
  }

  public onSelectImage(image:Image):void
  {
    this.selectedImage = image;
    
    this.selectedImageIndex = this.selectedLayer.fotos.findIndex(_image => _image.fecha === image.fecha);        
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    if( this.selectedLayer )
    {
      this.highlightedElementLayer.remove();
      this.highlightedElementLayer = null;
      this.selectedLayer = null;
      this.selectedImage = null;
      this.selectedImageIndex = 0;        
    }

    this.layerFilters = {};
    this.elementsInClickRange = [];
    this.showSpinner = false;  
    this.inTheGallery = false;

    this.map.doubleClickZoom.enable(); 
    this.map.off("click", this.onMapClick);
    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    this._shepherdService.tourObject = null;

    await super.hide();
  }

  public clear():void
  {     
    this.highlightedElementLayer.remove();
    this.highlightedElementLayer = null;
    this.selectedLayer = null;

    if( this.elementsInClickRange.length === 1 )
      this.elementsInClickRange = [];
  }
    
   /* TOUR */

   public showTour():void
   {
     if( this.tourIsActive )
       return;
 
     this.buildTour();
 
     this._shepherdService.start();
   }
 
   private buildTour():void
   {
     const that = this;    
   
     const steps = this.buildTourSteps();
 
     const buttons = [
       {
         classes: 'btn-info',
         text: 'Expandir recurso',
         action(){
           const mediaResources = document.querySelectorAll(".step-media");
           toggleFullscreen(mediaResources[mediaResources.length - 1]);
         }
       },
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
       
       const step = steps[i];
 
       if( i === 0 )
      {
        _buttons = _buttons.slice(2);
      }
      else
      {
        if( ! step.hasMedia  )
          _buttons = _buttons.slice(1);  
      }
       
      if( i === (stepsLength - 1)  )
      {
        const lastBtnIndex = _buttons.length - 1;
        _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (mas a la derecha) siempre sera el de avanzar / finalizar.
        _buttons[lastBtnIndex].text = 'Finalizar';
        _buttons[lastBtnIndex].action = () => that._shepherdService.complete();
      }
      
      const _step = {
        id: step.element,
        attachTo: { 
          element: `#${step.element}`, 
          on: step.labelPosition
        },
        buttons: _buttons,
        title: `PASO ${i + 1}`,
        text: step.content,
        beforeShowPromise: step.beforeShowPromise ?? null
      };

      _steps.push(_step);
     }
 
     this._shepherdService.addSteps(_steps);
   }
 
   private buildTourSteps():any[]
   {
     const steps = [
       {
         element: `element-galery-top-section`,
         labelPosition: "left",
         content: `
         Una vez que se haya seleccionado un elemento, se mostrarán las opciones de galería.
        `,
        beforeShowPromise: () => new Promise(resolve => setTimeout(resolve, 250))
        },
       {
         element: `element-galery-upload-image-btn`,
         labelPosition: "left",
         content: `
         Para <b>cargar</b> una imagen hacer click en <img class="mx-1 small-icon d-inline" src="assets/icons/SVG/CARGAR.svg">.
         <br> 
          Los formatos permitidos son <b>png, jpeg y jpg</b>.
         <br> 
         El limite de imagenes por cada elemento es de <b>10</b>.
        `
       },
       {
         element: `element-galery-remove-image-btn`,
         labelPosition: "left",
         content: `
         Para <b>borrar</b> una imagen hacer click en <img class="mx-1 small-icon d-inline" src="assets/icons/SVG/PAPEPERA.svg">.
        `
       },
       {
         element: `element-galery-zoom-in-btn`,
         labelPosition: "left-end",
         hasMedia: true,
         content: `
         Para expandir una imagen hacer click en <img class="mx-1 small-icon d-inline" src="assets/icons/SVG/AMPLIAR.svg"> 
         y se mostrará una ventana donde se podrán ver las imagenes a mayor tamaño. 
         <br>
         Para ver una imagen en pantalla completa <b>hacer click en ella</b>.  
         <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/galeria/4-modal-imagen-expandida.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video>
         `
        },
        {
          element: `element-galery-imagen-data`,
          labelPosition: "bottom",
          hasMedia: true,
          content: `
          Aquí se verá el nombre de la imagen <b>que esté seleccionada</b> y la fecha en la que fue subida. 
          <br><br>
          <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div> 
          <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none';" 
          class="hide step-media w-100 h-auto" src="assets/images/medium/tours/herramientas/galeria/5-informacion-imagen.png">
          `
        },
        {
          element: `element-galery-bottom-section`,
          labelPosition: "top",
          hasMedia: true,
          content: `
          En la <b>parte inferior de la barra</b> se podrá ver y seleccionar las imagenes adjuntas al elemento.          
          <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/galeria/6-listado-imagenes.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video>
          `
        }
     ];
  
     return steps;
   }
}

