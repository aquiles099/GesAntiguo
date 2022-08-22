import { Component, ViewChild, EventEmitter, Output, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { sortArray } from '../../../../../../../shared/helpers';
import { pointShapeOptions, polyLineShapeOptions, FeaturePropertyCategory, pointShapeSvgIcons } from '../../../../../../../interfaces/geojson/layer-style';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'category-configuration-modal',
  templateUrl: './category-configuration-modal.component.html',
  styleUrls: ['./category-configuration-modal.component.css']
})
export class CategoryConfigurationModalComponent
{
  @ViewChild('modal')
  public modal:ModalDirective;
  
  @ViewChild(NgForm)
  public form:NgForm; 

  public layerGeometryType:string = null;

  public propertyValues:Array<string|number|boolean> = [];

  public formData:any = {};

  public minShapeSize:number =  3;
  public maxShapeSize:number =  20;

  @Output()
  public createCategory:EventEmitter<any> = new EventEmitter;

  public categoryToEdit:string|number|boolean;

  @Output()
  public updateCategory:EventEmitter<any> = new EventEmitter;

  constructor()
  {
    this.formData = {
      value: null,
      shape: null,
      color: "#000000",
      size: 3
    };
  }

  @Input()
  set selectedPropertyValues(values: Array<string|number|boolean>)
  {
    this.propertyValues = values;

    if( this.inEdition )
      this.propertyValues = sortArray([...this.propertyValues, this.categoryToEdit]);
  }
 
  @Input()
  set setLayerGeometryType(type:string)
  {
    this.layerGeometryType = type;
  }

  get shapeOptions():Array<any>
  {
    return this.layerGeometryType === "Point" ? pointShapeOptions : polyLineShapeOptions;
  }

  get inEdition():boolean
  {
    return this.categoryToEdit !== undefined;
  }
 
  public show(category?:FeaturePropertyCategory):void
  {      
    if(category)
      this.setCategoryToEdit(category);
    else
      this.formData.size = this.layerGeometryType === "Point" ? 6 : 3;
    
    this.modal.show();
  }

  public setCategoryToEdit(category:FeaturePropertyCategory):void
  {
    this.categoryToEdit = category.value;
    Object.assign(this.formData, category);
  }

  public formatSliderLabel(value:number):string
  {
    return value + "%";
  }

  public getShapeSvgIcon(name:string, customSize:boolean = false):SafeHtml
  {
    return pointShapeSvgIcons.find(shape => shape.name === name)?.getSvg(this.formData.color, customSize ? this.formData.size * 5 : null) || "";
  }

  public onSubmit():void
  {
    const data = ObjectUtility.simpleCloning(this.formData);

    this.inEdition ? 
    this.updateCategory.emit({
      toUpdate: this.categoryToEdit,
      category: data
    }):
    this.createCategory.emit(data);

    this.modal.hide();
  }

  public resetForm():void
  {
    this.form.reset();
    this.formData.color = "#000000";
    this.formData.size = this.minShapeSize;
    
    if( this.categoryToEdit )
    {
      this.propertyValues = [...this.propertyValues.filter(value => value !== this.categoryToEdit)];
      this.categoryToEdit = undefined;
    }
  }

}

