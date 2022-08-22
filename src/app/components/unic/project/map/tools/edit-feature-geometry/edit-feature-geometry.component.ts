import { Component, Input, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Map, Polyline, Polygon, Marker, CircleMarker, DomUtil } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { delayExecution } from 'src/app/shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { LayerHighlighter } from '../../../../../../models/unic/leaflet/layer-highlighter';
import { Feature } from 'geojson';
import { ProjectService } from '../../../../../../services/unic/project.service';

@Component({
  selector: 'edit-feature-geometry-section',
  templateUrl: './edit-feature-geometry.component.html',
  styleUrls: ['./edit-feature-geometry.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class EditFeatureGeometryComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  private layerHighlighter:LayerHighlighter;

  public selectedLayer:CircleMarker|Polyline|Polygon;
  public editableLayer:Marker|Polyline|Polygon;

  public helpText:string = "Seleccione un elemento para editar";

  private onLayerClickClosure: (event:any) => void = event => 
  {
    if( this.selectedLayer )
      this.layerHighlighter.remove(this.selectedLayer);

    this.layerHighlighter.apply(event.layer);

    this.selectedLayer = event.layer;

    event.layer instanceof CircleMarker ?
    this.map.flyTo( event.layer.getLatLng(), 20, {duration: .50}) :
    this.map.flyToBounds( event.layer.getBounds(), { maxZoom: 20, duration: .50});

    this._changeDetector.detectChanges();
  };

  private drawnLayerIsWithinTheMunicipality: () => void = () =>
  {
    const featureIsWithinTheMunicipality = this._projectService.checkIfTheFeaturesAreWithinTheMunicipality( 
      [ (this.editableLayer as any).toGeoJSON() ]
    );

    if( ! featureIsWithinTheMunicipality )
    {
      this._toastrService.error("El elemento no puede estar fuera de el municipio.", "Error.");
       this.editableLayer.remove();
       this.buildEditableLayer();
    }
  };

  constructor(
    private _changeDetector:ChangeDetectorRef,    
    private _geojsonLayersService:GeojsonLayersService,
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private _spinnerService:SpinnerService
  )
  {
    super();
  }

  get drawing():boolean
  {
    return this.map.editTools.drawing();
  }

  public async show():Promise<void>
  {
    this._geojsonLayersService
        .getProjected()
        .forEach(fileLayer => fileLayer.layer.on("click", this.onLayerClickClosure));

    this.layerHighlighter = new LayerHighlighter( this._geojsonLayersService.getProjected() );
    
    this.map.doubleClickZoom.disable(); 

    DomUtil.addClass(this.map.getContainer(), 'cursor-help');

    await super.show();
  }

  public buildEditableLayer():void
  {
    this._geojsonLayersService
        .getProjected()
        .forEach(fileLayer => fileLayer.layer.off("click", this.onLayerClickClosure));

    const fileLayer = this._geojsonLayersService.findByLayer( this.selectedLayer );
    
    const feature = this.selectedLayer.toGeoJSON();

    let coordinates = this.invertLayerGeometryCoordinates(feature);

    switch( feature.geometry.type )
    {
      case "Point":
        this.editableLayer = new Marker((coordinates as any)).addTo( fileLayer.layer );
        this.helpText = "Mueva el elemento a la posición deseada.";
        break;

      case "LineString":
      case "MultiLineString":
        this.editableLayer = new Polyline( (coordinates as any) ).addTo( fileLayer.layer );
        this.helpText = "Mueva el elemento o sus vertices a la posición deseada.";
        break;

      case "Polygon":
      case "MultiPolygon":
        this.editableLayer = new Polygon( (coordinates as any) ).addTo( fileLayer.layer );

        this.editableLayer.on('click', (event:any) => {

          if ((event.originalEvent.ctrlKey || event.originalEvent.metaKey) && this.editableLayer.editEnabled())
            (this.editableLayer as any).editor.newHole(event.latlng);

        });

        this.helpText = "Mueva el elemento o sus vertices a la posición deseada. <br><br> Presione <kdb>Ctrl</kdb> + click sobre polígono para iniciar agujero.";
        
        break;
    }

      // comprobar si despues que se mueve elemento editado, permanece dentro del municipio.
      this.editableLayer.on("editable:dragend", this.drawnLayerIsWithinTheMunicipality);

      // comprobar si despues que se mueve un vertice del elemento editado, permanece dentro del municipio.
      // (linea y poligono).
      if( feature.geometry.type !== "Point" )
        this.editableLayer.on("editable:vertex:dragend	", this.drawnLayerIsWithinTheMunicipality);

    this.editableLayer.enableEdit();
  }

  private invertLayerGeometryCoordinates(feature:Feature, lngFirst:boolean=true):number[]|number[][]
  {
    let coordinates;

    switch( feature.geometry.type )
    {
      case "Point":
        coordinates = [
          feature.geometry.coordinates[ Number(lngFirst) ],
          feature.geometry.coordinates[ Number( !lngFirst ) ]
        ];
        break;

      case "LineString":
        coordinates = feature.geometry.coordinates.map(
          _latlng => [  
              _latlng[ Number(lngFirst) ],
              _latlng[ Number( !lngFirst ) ]
            ]
        );
        break;

      case "Polygon":
      case "MultiLineString":
        coordinates = feature.geometry.coordinates.map( 
          _latlngsGroup => _latlngsGroup.map( _latlng => {
            return [ 
              _latlng[ Number(lngFirst) ],
              _latlng[ Number( !lngFirst ) ]
           ]
          })
        );
        break;

      case "MultiPolygon":
        coordinates = feature.geometry.coordinates.map( arrayGroup => 
          arrayGroup.map(
            _latlngsGroup => _latlngsGroup.map( _latlng => {
              return [ 
                _latlng[ Number(lngFirst) ],
                _latlng[ Number( !lngFirst ) ]
             ]
            })
          )
        );
        break;
    }

    return coordinates;
  }

  public async saveChanges():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando elemento...");
      this._spinnerService.show();

      await delayExecution(250);

      const feature = this.selectedLayer.feature;

      feature.geometry.coordinates = this.invertLayerGeometryCoordinates( this.editableLayer.toGeoJSON(), false);
      
      const fileLayer = this._geojsonLayersService.findByLayer( this.selectedLayer );

      fileLayer.file.updateFeature(feature);

      await this._geojsonLayersService.rebuildAndUpdate(fileLayer);

      this.selectedLayer = null;

      this.clear();

      this._toastrService.success("Elemento editado.","Exito!");

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

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this._geojsonLayersService
        .getProjected()
        .forEach(fileLayer => fileLayer.layer.off("click", this.onLayerClickClosure));

    if( this.editableLayer )
    {
     this.editableLayer.remove();
     this.editableLayer = null;
    }

    if( this.selectedLayer )
    {
      this.layerHighlighter.remove( this.selectedLayer );
      this.selectedLayer = null;
    }

    this.map.doubleClickZoom.enable(); 

    this.layerHighlighter = null;

    DomUtil.removeClass(this.map.getContainer(), 'cursor-help');

    await super.hide();
  }

  public clear():void
  {
    this.editableLayer.remove();
    this.editableLayer = null;

    this.helpText = "";
     
    if( this.selectedLayer )
    {
      this.layerHighlighter.remove( this.selectedLayer );
      this.selectedLayer = null;
    }

    this._geojsonLayersService
        .getProjected()
        .forEach(fileLayer => fileLayer.layer.on("click", this.onLayerClickClosure));
  }
}
