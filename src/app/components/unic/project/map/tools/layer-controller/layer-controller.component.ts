import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { TileLayer } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { Subscription } from 'rxjs';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { GeoJSONLayer } from 'src/app/models/unic/geojson/geojson-layer';
import { MapService } from '../../../../../../services/unic/map.service';

@Component({
  selector: 'layer-controller',
  templateUrl: './layer-controller.component.html',
  styleUrls: ['./layer-controller.component.css']
})
export class LayerControllerComponent extends HideableSectionComponent implements OnInit, OnDestroy
{
  public baseLayers:any[] = [];

  @Input()
  public currentBaseLayer:string;
  
  public projectModules:Set<string> = new Set();
  public fileLayers:Array<GeoJSONLayer> = [];
  public projectLayerFilesSubscription:Subscription;

  public moduleListingIsCollapsed:boolean = false;
  
  public layersListingIsCollapsed:any = {};

  @Output()
  public changeBaseLayer:EventEmitter<TileLayer> = new EventEmitter;

  constructor(
    private _geojsonLayersService:GeojsonLayersService,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService,
    private _mapService:MapService
  )
  {
    super();
  } 

  public ngOnInit():void
  {
    this.getBaseLayers();

    this.projectLayerFilesSubscription = this._geojsonLayersService.enabledFileLayer$.subscribe(fileLayers => {
      
      this.fileLayers = fileLayers
          
      this.projectModules = new Set( this.fileLayers.map(fileLayer => fileLayer.file.module_name) );
      
      this.projectModules.forEach(moduleName => {
        this.layersListingIsCollapsed[moduleName] = ! this.theModuleHasProjectedLayers(moduleName)
      });

    });
  }

  public getBaseLayers():void
  {
    this.baseLayers = this._mapService.getBaseLayers().map(layer => {

      const layerClassNameInArray = layer.options.className.toLowerCase().split(" ");

      const imageUrl = layerClassNameInArray.length > 1 ?
         layerClassNameInArray[ layerClassNameInArray.length - 1 ] :
         layerClassNameInArray[ 0 ];

      return {
        layer:layer,
        imageName: imageUrl,
        className: layer.options.className
      };

    });
  }

  public toggleModuleListingVisibility():void
  {
    this.moduleListingIsCollapsed = ! this.moduleListingIsCollapsed;
  }

  public thereAreProjectedLayers():boolean
  {
    return Array.from(this.projectModules).some(moduleName => this.theModuleHasProjectedLayers(moduleName));
  }
  
  public theModuleHasProjectedLayers(name:string):boolean
  {
    return this.getLayersPerModule(name).some(layer => layer.isProjected);
  }

  public getLayersPerModule(moduleName):Array<GeoJSONLayer>
  {
    return this.fileLayers.filter(layer => layer.moduleName === moduleName);
  }

  public toggleLayersListingVisibility(moduleName:string):void
  {
    this.layersListingIsCollapsed[moduleName] = ! this.layersListingIsCollapsed[moduleName];
  }

  public async toggleLayersVisibility():Promise<void>
  {
    try
    {
      const thereAreProjectedLayers = this.thereAreProjectedLayers();

      this._spinnerService.updateText( thereAreProjectedLayers ? "Removiendo capas..." : "Proyectando capas...");
      this._spinnerService.show();

      thereAreProjectedLayers ?
      await this._geojsonLayersService.unprojectAll() :
      await this._geojsonLayersService.projectAll();
      
    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");  
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async toggleModuleVisibility(moduleName:string):Promise<void>
  {
    try
    {
      const action = this.theModuleHasProjectedLayers(moduleName) ? "unproject" : "project";

      this._spinnerService.updateText( action === "unproject" ? "Removiendo capas..." : "Proyectando capas...");
      this._spinnerService.show();

      await this._geojsonLayersService.toggleModuleVisibility(moduleName, action);
      
    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");  
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async toggleLayerVisibility(layer:GeoJSONLayer):Promise<void>
  {
    try
    {
      this._spinnerService.updateText( layer.isProjected ? "Removiendo capa..." : "Proyectando capa...");
      this._spinnerService.show();

      layer.isProjected ?
      await this._geojsonLayersService.unproject(layer) :
      await this._geojsonLayersService.project(layer) ;
      
    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");  
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }
  
  public changeBaseLayerEvent(layer:TileLayer):void
  {
    this.changeBaseLayer.emit(layer);
  }

  public ngOnDestroy():void
  {
    this.projectLayerFilesSubscription.unsubscribe();
  }
}
