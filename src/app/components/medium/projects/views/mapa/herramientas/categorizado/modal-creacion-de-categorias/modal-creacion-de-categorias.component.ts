import { Component, ViewChild, EventEmitter, Output, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { SafeHtml } from '@angular/platform-browser';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { polyLineShapeOptions, pointShapeSvgIcons } from '../../../../../../../../interfaces/geojson/layer-style';
import { pointShapeOptions, AttributeStyleCategory } from '../../../../../../../../interfaces/medium/layer-styles';
import { TipoGeometriaWKT } from 'src/app/interfaces/medium/mapa/Modulo';
import { sortArray, isset } from '../../../../../../../../shared/helpers';

const DEFAULT_SHAPE_SIZE_IN_FORM = 5;
@Component({
  selector: 'modal-creacion-de-categorias',
  templateUrl: './modal-creacion-de-categorias.component.html',
  styleUrls: ['./modal-creacion-de-categorias.component.css']
})
export class ModalCreacionDeCategoriasComponent
{
  @ViewChild('modal')
  public modal:ModalDirective;
  
  @ViewChild(NgForm)
  public form:NgForm; 

  public layerGeometryType:TipoGeometriaWKT = null;

  public propertyValues:Array<string|number|boolean> = [];

  public formData:any = {};

  public minShapeSize:number =  12;
  public maxShapeSize:number =  36;

  @Output()
  public createCategory:EventEmitter<any> = new EventEmitter;

  private valueOfCategoryToEdit:string|number|boolean;

  @Output()
  public updateCategory:EventEmitter<any> = new EventEmitter;

  constructor()
  {
    this.formData = {
      value: null,
      shape: null,
      color: "#000000",
      size: this.minShapeSize + DEFAULT_SHAPE_SIZE_IN_FORM
    };
  }

  @Input()
  set setPropertyValues(values: Array<string|number|boolean>)
  {
    this.propertyValues = values;

    if( this.inEdition )
      this.propertyValues = sortArray([...this.propertyValues, this.valueOfCategoryToEdit]);
  }

  get shapeOptions():Array<any>
  {
    return this.layerGeometryType === "POINT" ? pointShapeOptions : polyLineShapeOptions;
  }

  get inEdition():boolean
  {
    return isset( this.valueOfCategoryToEdit );
  }
 
  public show(category?:AttributeStyleCategory):void
  {      
    if(category)
      this.setCategoryToEdit(category);
    else
      this.formData.size = this.layerGeometryType === "POINT" ? this.minShapeSize + DEFAULT_SHAPE_SIZE_IN_FORM : 3;
    
    this.modal.show();
  }

  public setCategoryToEdit(category:AttributeStyleCategory):void
  {
    this.valueOfCategoryToEdit = category.value;
    Object.assign(this.formData, category);
  }

  public formatSliderLabel(value:number):string
  {
    return value + "%";
  }

  public getShapeSvgIcon(name:string, customSize:boolean = false):SafeHtml
  {
    return pointShapeSvgIcons.find(shape => shape.name === name)?.getSvg(this.formData.color, customSize ? this.formData.size * 3 : null) || "";
  }

  public onSubmit():void
  {
    const data = ObjectUtility.simpleCloning(this.formData);

    this.inEdition ? 
    this.updateCategory.emit({
      valueToUpdate: this.valueOfCategoryToEdit,
      category: data
    }):
    this.createCategory.emit(data);

    this.modal.hide();
  }

  public onHiddenModal():void
  {
    this.resetForm();
    this.valueOfCategoryToEdit = null;
  }
 
  public resetForm():void
  {
    this.form.reset();
    this.formData.color = "#000000";
    this.formData.size = this.minShapeSize + DEFAULT_SHAPE_SIZE_IN_FORM;
  }

}

