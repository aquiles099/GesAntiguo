import { Component, Input, ChangeDetectorRef, Output, EventEmitter, NgZone } from '@angular/core';
import { Map, Polyline, Polygon, Marker, CircleMarker, DomUtil } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { LayerHighlighter } from '../../../../../../models/unic/leaflet/layer-highlighter';
import { ObjectUtility } from '../../../../../../shared/object-utility';
import { delayExecution } from 'src/app/shared/helpers';
import { ProjectService } from '../../../../../../services/unic/project.service';
import { GeojsonLayerImagesService, FeatureImageCollection } from '../../../../../../services/unic/geojson-layer-images.service';

@Component({
  selector: 'copy-feature-section',
  templateUrl: './copy-feature.component.html',
  styleUrls: ['./copy-feature.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class CopyFeatureComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private selectedLayer:CircleMarker|Polyline|Polygon;
  private newLayer:Marker|Polyline|Polygon;
  private newLayers:Array<Marker|Polyline|Polygon> = [];

  public imageCopyingEnabled:boolean = false;
  public imagesOfSelectedFeature:FeatureImageCollection;

  private layerHighlighter:LayerHighlighter;

  public buildingFeatureState:"waiting"|"inProgress"|"finished" = "waiting";

  public helpText:string = "Seleccione un elemento.";

  public onLayerClickClosure: (event:any) => void = event => this.onSelectLayer(event.layer);

  private updateHelpText:(event:any) => void = (e) => {
    
    if( this.selectedLayer.feature.geometry.type !== "Point" )
    {
      const isAPolygon = this.selectedLayer.feature.geometry.type.includes("Polygon");

      e.layer.editor._drawnLatLngs.length + 1 < e.layer.editor.MIN_VERTEX ?
      this.helpText = `Click para continuar ${ isAPolygon ? "polígono" : "línea" }.` :
      this.helpText = `Click en último punto para terminar ${ isAPolygon ? "polígono" : "línea" }.`;
    }
  }

  private onDrawnLayer: (event:any) => void = event => {

    if( ! this.drawnLayerIsWithinTheMunicipality() )
      return;
      
    if( this.selectedLayer.feature.geometry.type.includes("Multi") && this.buildingFeatureState === "inProgress" )
    {
      setTimeout(() => {

        (this.newLayer as any).editor.newShape();

        if( ! this.map.listens("contextmenu") )
        {
          this.map.once("contextmenu", (event:any) => {

            event.originalEvent.stopPropagation();

            if ( event.originalEvent.ctrlKey)
            {
              if( ! this.drawnLayerIsWithinTheMunicipality() )
                return;
      
              this.newLayers.push( this.newLayer );
              this.drawLayer();
            }

          });
        }

        this.helpText = `
        Click en mapa para iniciar nuevo ${this.selectedLayer.feature.geometry.type.includes('Polygon') ? "polígono" : "línea"} . <br><br> 
        <kdb>ctrl + click derecho</kdb> para terminar.`;

        this._changeDetector.detectChanges();

      }, 200);
    }
    else
    {
      if( ! this.drawnLayerIsWithinTheMunicipality() )
        return;

      this.newLayers.push( this.newLayer );
      setTimeout(() => this.drawLayer(), 200);
    }

    this._changeDetector.detectChanges();
  };

  private drawnLayerIsWithinTheMunicipality: (event?:any) => boolean = (event) =>
  {
    const layer = event ? event.layer : this.newLayer;

    const featureIsWithinTheMunicipality = this._projectService.checkIfTheFeaturesAreWithinTheMunicipality( 
      [ layer.toGeoJSON() ]
    );

    if( ! featureIsWithinTheMunicipality )
    {
      // evento existe solo accion de "mover" elemento o "mover vertice" de elemento.
      if( event )
      {
        this.newLayers = this.newLayers.filter(_layer => _layer !== layer);
        layer.remove();
      }

      // uso de "setTimeout" y NgZone para generar macrotareas (y que UI se actualize al momento).
      setTimeout(() => this.drawLayer());     
      this._ngZone.run(() => {
        this._toastrService.error("El elemento no puede estar fuera de el municipio.", "Error.");
        this.newLayer.remove();
      });
    }

    return featureIsWithinTheMunicipality;
  };

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService,
    private _geojsonLayerImagesService:GeojsonLayerImagesService,
    private _projectService:ProjectService,
    private _toastrService:ToastrService,
    private _ngZone:NgZone,
    private _spinnerService:SpinnerService
  )
  {
    super();
  }

  get thereAreCopiedFeatures():boolean
  {
    return this.newLayers.length > 0;
  }

  public async show():Promise<void>
  {

    this._geojsonLayersService
        .getProjected()
        .forEach(
          fileLayer => fileLayer.layer.on("click", this.onLayerClickClosure)
        );
        
    this.map.on('editable:drawing:click', this.updateHelpText);
    this.map.on("editable:drawing:commit", this.onDrawnLayer);

    this.map.doubleClickZoom.disable(); 

    this.layerHighlighter = new LayerHighlighter( this._geojsonLayersService.getProjected() );

    DomUtil.addClass(this.map.getContainer(), 'cursor-help');

    await super.show();
  }

  public async onSelectLayer(layer:CircleMarker|Polyline|Polygon):Promise<void>
  {
    if(this.selectedLayer)
      this.layerHighlighter.remove(this.selectedLayer);

    this.layerHighlighter.apply(layer);

    this.selectedLayer = layer;

    await this.getFeatureImageCollection();

    layer instanceof CircleMarker ?
    this.map.flyTo( layer.getLatLng(), 20, {duration: .50}) :
    this.map.flyToBounds( layer.getBounds(), { maxZoom: 20, duration: .50});

    this.helpText = `Elemento ID ${ layer.feature.id } seleccionado.`;

    this._changeDetector.detectChanges();
  }

  private async getFeatureImageCollection():Promise<void>
  {
    try
    {      
      const geojsonLayer = this._geojsonLayersService.findByLayer( this.selectedLayer );
      
      let layerImageGallery = await this._geojsonLayerImagesService.find(geojsonLayer.layerId);
  
      if( ! layerImageGallery )
        throw new Error("Capa de elemento no tienen galeria de imagenes.");

      this.imagesOfSelectedFeature = layerImageGallery.features.find(record => record.id === this.selectedLayer.feature.id);
    }
    catch (error)
    {
      this.imagesOfSelectedFeature = null;
    }
    finally
    {
    }
  }

  public drawLayer():void
  {    
    this._geojsonLayersService
        .getProjected()
        .forEach(
          fileLayer => fileLayer.layer.off("click", this.onLayerClickClosure)
        );

    const feature = this.selectedLayer.feature;

    switch( feature.geometry.type )
    {
      case "Point":
        this.newLayer = this.map.editTools.startMarker();
        this.helpText = "Click para agregar marcador.";
        break;

      case "LineString":
      case "MultiLineString":
        this.newLayer = this.map.editTools.startPolyline();
        this.helpText = "Click para iniciar línea.";
        break;

      case "Polygon":
      case "MultiPolygon":
        this.newLayer = this.map.editTools.startPolygon();
        this.helpText = `Click para iniciar polígono.`;
        break;
    }

    // comprobar si despues que se mueve elemento dibujado, permanece dentro del municipio.
    this.newLayer.on("editable:dragend", this.drawnLayerIsWithinTheMunicipality);

    // comprobar si despues que se mueve un vertice del elemento dibujado, permanece dentro del municipio.
    // (linea y poligono).
    if( feature.geometry.type !== "Point" )
      this.newLayer.on("editable:vertex:dragend", this.drawnLayerIsWithinTheMunicipality);

    this.buildingFeatureState = "inProgress";
  }

  public toggleImageCopyingEnabledState():void
  {
    this.imageCopyingEnabled = ! this.imageCopyingEnabled;
    this._changeDetector.detectChanges();
  }

  public async saveChanges():Promise<void>
  {
    try 
    {
      this._spinnerService.updateText("Guardando cambios...");
      this._spinnerService.show();

      await delayExecution(250);

      const selectedFeature = ObjectUtility.simpleCloning( this.selectedLayer.feature ),
            fileLayer = this._geojsonLayersService.findByLayer(this.selectedLayer),
            newFeatures = [];

      for(const newLayer of this.newLayers)
      {
        const newFeature = newLayer.toGeoJSON();

        newFeature.properties = selectedFeature.properties;

        fileLayer.file.addNewFeature(newFeature);

        newFeatures.push(newFeature);
      }

      if( this.imageCopyingEnabled )
        await this.copyImageCollectionToNewFeature( newFeatures );  

      await this._geojsonLayersService.rebuildAndUpdate(fileLayer);

      this.selectedLayer = null;

      this._toastrService.success("Elementos copiados.","Exito!");

      this.clear();

    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }
  }

  private async copyImageCollectionToNewFeature(newFeatures:any[]):Promise<void>
  {
    const geojsonLayer = this._geojsonLayersService.findByLayer( this.selectedLayer );

    const layerImageGallery = await this._geojsonLayerImagesService.find(geojsonLayer.layerId);

    for( const newFeature of newFeatures )
    {
      const featureImageCopy = ObjectUtility.simpleCloning(this.imagesOfSelectedFeature);

      featureImageCopy.id = newFeature.id;

      layerImageGallery.features.push(featureImageCopy);
    }

    await this._geojsonLayerImagesService.update(layerImageGallery);
    
  }

  public clear():void
  {
    if( this.map.editTools.drawing )
      this.map.editTools.stopDrawing();
    
    this.removeCopying();

    if( this.selectedLayer )
    {
      this.layerHighlighter.remove(  this.selectedLayer );
      this.selectedLayer = null;
    }
    
    this.imageCopyingEnabled = false;
    this.imagesOfSelectedFeature = null;
        
    this._geojsonLayersService
        .getProjected()
        .forEach(
          fileLayer => fileLayer.layer.on("click", this.onLayerClickClosure)
        );
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.removeCopying();

    if( this.selectedLayer )
    {
      this.layerHighlighter.remove(  this.selectedLayer );
      this.selectedLayer = null;
    }

    this.imageCopyingEnabled = false;
    this.imagesOfSelectedFeature = null;

    if( this.map.editTools.drawing )
      this.map.editTools.stopDrawing();

    this._geojsonLayersService
        .getProjected()
        .forEach(
          fileLayer => fileLayer.layer.off("click", this.onLayerClickClosure)
        );

    this.map.off('editable:drawing:click', this.updateHelpText);
    this.map.off("editable:drawing:commit");   

    this.map.doubleClickZoom.enable(); 

    this.layerHighlighter = null;

    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    await super.hide();
  }

  private removeCopying():void
  {
    this.newLayers.forEach(layer => layer.remove());
    this.newLayers = [];
    
    if( this.newLayer )
    {
      this.newLayer.remove();
      this.newLayer = null;
    }

    this.helpText = "Seleccione un elemento.";

    this.buildingFeatureState = "waiting";
  }

}
