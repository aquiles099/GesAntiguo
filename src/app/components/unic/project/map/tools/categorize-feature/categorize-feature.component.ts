import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Map } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { GeoJSONFile } from '../../../../../../models/unic/geojson/geojson-file';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { delayExecution } from 'src/app/shared/helpers';
import { GeoJSONLayer } from '../../../../../../models/unic/geojson/geojson-layer';
import { Subscription } from 'rxjs';
import { FeaturePropertyCategory, pointShapeSvgIcons } from '../../../../../../interfaces/geojson/layer-style';
import { CategoryConfigurationModalComponent } from './category-configuration-modal/category-configuration-modal.component';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'categorize-feature-section',
  templateUrl: './categorize-feature.component.html',
  styleUrls: ['./categorize-feature.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class CategorizeFeatureComponent extends HideableSectionComponent implements OnInit, OnDestroy {

  @Input()
  public map:Map;
  
  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  @ViewChild(CategoryConfigurationModalComponent)
  public  categoryConfigurationModal:CategoryConfigurationModalComponent;

  public modules:string[] = [];
  public selectedModuleName:string = null;
  
  public fileLayers:GeoJSONLayer[];
  public fileLayersSubscription:Subscription;

  public selectedFile:GeoJSONFile;
  public selectedFileLayerName:string = null;

  public selectedProperty:string = null;
  public featurePropertiesOfSelectedFile:string[];
  public loadedCategorization:string = null;
  
  public isThereAnyLayerWithCategorization:boolean;

  constructor(
    private _geojsonLayersService:GeojsonLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService
  )
  {
    super();
  }

  get selectedPropertyValues():Array<string|number|boolean>
  {
    return this.selectedFile && this.selectedProperty ? 
            this.selectedFile
                .getValuesByFeatureProperty( this.selectedProperty )
                .filter( value => ! this.selectedFile.hasCategoryInValue(this.selectedProperty, value) ) 
            : [];
  }

  get layerGeometryType():string
  {
    return this.selectedFile ? this.selectedFile.geometryType : "";
  }

  public ngOnInit():void
  {
    this.fileLayersSubscription = this._geojsonLayersService.enabledFileLayer$.subscribe(
      fileLayers => this.isThereAnyLayerWithCategorization = fileLayers.some(fileLayer => fileLayer.isProjected && fileLayer.file.hasCategorization)
    );
  }

  public async show():Promise<void>
  {
    this.modules = this._geojsonLayersService.getModuleNames("projected");

    await super.show();
  }

  public onChangeModuleSelector():void
  {
    this.selectedFileLayerName = null;
    this.selectedFile = null;
    this.featurePropertiesOfSelectedFile = [];
    this.loadedCategorization = this.selectedProperty = null
    this.fileLayers = this._geojsonLayersService.getPerModule(this.selectedModuleName, "projected");
  }

  public onChangeFileLayerSelect(fileLayer:GeoJSONLayer):void
  {
    this.selectedFile = fileLayer.file;
    this.featurePropertiesOfSelectedFile = [...fileLayer.file.enabledFeatureProperties];
    this.loadedCategorization = this.selectedProperty = fileLayer.file.categorizationProperty;
  }

  public getShapeSvgIcon(category:FeaturePropertyCategory, size:number):SafeHtml
  {
    return pointShapeSvgIcons.find(shape => shape.name === category.shape)?.getSvg(category.color, size) || "";
  }

  public async createCategory(data:FeaturePropertyCategory):Promise<void>
  {
    try {
      
      this.selectedFile.addPropertyCategory(this.selectedProperty, data);

      this._toastrService.success("Categoria registrada.","Exito!");

      this.updateLayerFile();
      
    } catch (error) {
      
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
  }
 
  public async updateCategory(data:any):Promise<void>
  {
    try {
      
      this.selectedFile.updatePropertyCategory(this.selectedProperty, data.toUpdate, data.category);

      this._toastrService.success("Categoria actualizada.","Exito!");

      this.updateLayerFile();
            
    } catch (error) {
      
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
  }

  public async deleteCategory(value:any):Promise<void>
  {
    this.selectedFile.deletePropertyCategory(this.selectedProperty, value);

    this._toastrService.success("Categoria eliminada.","Exito!");

    if( ! this.selectedFile.hasCategoriesInProperty(this.selectedProperty) && this.selectedFile.hasCategorization )
    {
      this._spinnerService.updateText("Removiendo categorización...");
      this._spinnerService.show();
      
      await delayExecution(250);
      
      this.selectedFile.setCategorization = this.loadedCategorization = null;
      
      await this._geojsonLayersService.rebuildAndUpdate(this.selectedFile.name);
      
      this._spinnerService.hide();

    }
    else
    {
      this.updateLayerFile();
    }
  }

  private async updateLayerFile():Promise<void>
  {
    try {
      
      if( this.selectedFile.categorizationProperty === this.selectedProperty )
      {  
        this._spinnerService.updateText("Actualizando categorización...");
        this._spinnerService.show();
    
        await delayExecution(250);
                  
        await this._geojsonLayersService.rebuildAndUpdate(this.selectedFile.name);
  
        this._spinnerService.hide();
      }
      else
      {
        await this._geojsonLayersService.geojsonFilesService.update( this.selectedFile );
      }

    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async toggleCategorization():Promise<void>
  {
    try {
      
      if( ! this.selectedFile.hasCategoriesInProperty(this.selectedProperty) )
        throw new Error("La propiedad seleccionada no tiene categorias asignadas.");

      let categorization = this.selectedProperty;
  
      this._spinnerService.updateText("Aplicando categorización...");

      if( this.selectedFile.categorizationProperty === this.selectedProperty )
      {
        categorization = null;
        this._spinnerService.updateText("Removiendo categorizacion...");
      }

      this._spinnerService.show();
  
      await delayExecution(250);

      this.selectedFile.setCategorization = categorization;
        
      await this._geojsonLayersService.rebuildAndUpdate(this.selectedFile.name);
        
      this.loadedCategorization = categorization;
        
    } catch (error)
    {
      console.error(error); 
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    } 
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.selectedModuleName = null;
    this.selectedFile = null;
    this.selectedFileLayerName = null;
    this.selectedProperty = null;
    this.featurePropertiesOfSelectedFile = [];
    await super.hide();
  }

  public ngOnDestroy():void
  {
    this.fileLayersSubscription.unsubscribe();
  }
}
