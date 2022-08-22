import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ShepherdService } from 'angular-shepherd';
import { AttributeStyleCategory } from '../../../../../../../../interfaces/medium/layer-styles';
import { SafeHtml } from '@angular/platform-browser';
import { pointShapeSvgIcons } from '../../../../../../../../interfaces/geojson/layer-style';
import { Capa } from '../../../../../../../../interfaces/medium/mapa/Modulo';
import { ApiService } from '../../../../../../../../services/api.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { SLDBuilder } from '../../../../../../../../models/medium/sld-builder';

interface Attribute
{
  id: number;
  nombre: string;
  nombre_formateado: string;
}

@Component({
  selector: 'seccion-estilos-personalizados',
  templateUrl: './seccion-estilos-personalizados.component.html',
  styleUrls: [
    './seccion-estilos-personalizados.component.css',
    '../../../../../../../../../themes/styles/map-tool-bar.scss'
  ]
})
export class SeccionEstilosPersonalizadosComponent implements OnInit
{
  public attribute:string = null;

  @Input()
  public selectedLayer:Capa;

  public loadingAttributes:boolean = false;
  public attributes:Attribute[] = [];
  public selectedAttributeNgModel:string = null;
  public selectedAttribute:Attribute;

  @Input()
  public layerAttributeCategories:{
    [layerName:string]: {[attributeName:string]: AttributeStyleCategory[]}
  };

  @Output()
  public showCategoryConfigurationModal:EventEmitter<{attributeName:string, category:AttributeStyleCategory}> = new EventEmitter();
  
  constructor(
    private _shepherdService:ShepherdService,
    private _apiService:ApiService,
    private _projectService:ProjectService,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService
  ) { }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  get attributeCategories():{[attributeName:string]: AttributeStyleCategory[]}
  {
    return this.layerAttributeCategories[this.selectedLayer.nombre_formateado]
  }

  public ngOnInit(): void
  {
    this.getLayerAttributes();  
  }

  public async getLayerAttributes():Promise<void>
  {
    try
    {
      this.loadingAttributes = true;

      this.attribute = null;

      const requestData = {
        modulo: this.selectedLayer.modulo,
        grupo: this.selectedLayer.grupo,
        capa: this.selectedLayer.nombre,
        funcion: "web_lista_atributo_listado",
        proyecto: this._projectService.project.nombre,
      };

      this.attributes = [
          ...( await this._apiService.postWithAuthentication( requestData ) ).datos.atributos
      ]; 
    }
    catch (error)
    {
      this.attributes = [];
      throw error;  
    }
    finally
    {
      this.loadingAttributes = false;
    }
  }

  public onChangeAttributeSelect(attribute:Attribute):void
  {
    this.selectedAttribute = attribute;

    if( ! this.attributeCategories.hasOwnProperty(attribute.nombre_formateado) )
      this.attributeCategories[attribute.nombre_formateado] = [];
      
    this.applyCategories( this.attributeCategories[attribute.nombre_formateado], {keepPreviousSLD: false} );
  }

  public getCategoriesOfSelectedAttribute():AttributeStyleCategory[]
  {
    return this.attributeCategories[this.selectedAttribute.nombre_formateado];
  }

  public getShapeSvgIcon(category:AttributeStyleCategory, size:number):SafeHtml
  {
    return pointShapeSvgIcons.find(shape => shape.name === category.shape)?.getSvg(category.color, size) || "";
  }

  public emitShowCategoryConfigurationModal(category?:AttributeStyleCategory):void
  {
    this.showCategoryConfigurationModal.emit({
      attributeName: this.selectedAttribute.nombre,
      category: category
    });
  }

  public async createCategory(category:AttributeStyleCategory):Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Creando categoria...");
      this._spinnerService.show();

      const attributeStyleCategory:AttributeStyleCategory = Object.assign(category, {
        property: this.selectedAttribute.nombre_formateado
      });

      this.attributeCategories[this.selectedAttribute.nombre_formateado].push(attributeStyleCategory);
      
      this.applyCategories([attributeStyleCategory]);
          			
    }
    catch (error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async updateCategory(data:{valueToUpdate:string|number; category:AttributeStyleCategory;}):Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando categoria...");
      this._spinnerService.show();

      const categoryPosition = this.attributeCategories[this.selectedAttribute.nombre_formateado].findIndex(
        _category => _category.value === data.valueToUpdate
      );

      this.attributeCategories[this.selectedAttribute.nombre_formateado][categoryPosition] = data.category;

     this.applyCategories(
        this.attributeCategories[this.selectedAttribute.nombre_formateado],
        {keepPreviousSLD: false}
      );

    }
    catch (error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async deleteCategory(category:AttributeStyleCategory):Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Eliminando categoria...");
      this._spinnerService.show();

      this.attributeCategories[this.selectedAttribute.nombre_formateado] = this.attributeCategories[this.selectedAttribute.nombre_formateado].filter(
        _category => _category !== category 
      );

     this.applyCategories(
        this.attributeCategories[this.selectedAttribute.nombre_formateado],
        {keepPreviousSLD: false}
      );

    }
    catch (error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public applyCategories(categories:AttributeStyleCategory[], options?:any):void
  {
    const sldBuilder = new SLDBuilder(this.selectedLayer, categories, options);
    
    this.selectedLayer.capaWms.setParams({
      styles: sldBuilder.userStyleName,
      SLD_BODY: sldBuilder.getSLD(),
      fake: Date.now()
    });
  }

}
