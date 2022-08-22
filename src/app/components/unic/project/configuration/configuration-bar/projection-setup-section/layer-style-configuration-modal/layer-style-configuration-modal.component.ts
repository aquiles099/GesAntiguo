import { Component, ViewChild, EventEmitter, Output, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { pointShapeOptions, polyLineShapeOptions, LayerStyle, pointShapeSvgIcons } from '../../../../../../../interfaces/geojson/layer-style';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'layer-style-configuration-modal',
  templateUrl: './layer-style-configuration-modal.component.html',
  styleUrls: ['./layer-style-configuration-modal.component.css']
})
export class LayerStyleConfigurationModalComponent
{
  @ViewChild('modal')
  public modal:ModalDirective;
  
  @ViewChild(NgForm)
  public form:NgForm; 

  @Input()
  public layerGeometryType:string;

  public shapeOptions:any[] = [];

  public styleToEdit:LayerStyle;
  public formData:LayerStyle;

  public minShapeSize:number =  3;
  public maxShapeSize:number =  20;

  @Output()
  public updateLayerStyle:EventEmitter<LayerStyle> = new EventEmitter;

  constructor()
  {
    this.formData = {
      shape: null,
      color: "#000000",
      size: this.minShapeSize
    };
  }
 
  public show(styleToEdit:LayerStyle):void
  { 
    this.shapeOptions = this.layerGeometryType === "Point" ? pointShapeOptions : polyLineShapeOptions;
    
    this.formData.shape = this.layerGeometryType === "Point" ? "circle" : "0";
    this.formData.size = this.layerGeometryType === "Point" ?  6 : 3;
    
    this.styleToEdit = {...styleToEdit};    

    Object.assign(this.formData, styleToEdit);

    this.modal.show();
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
    this.updateLayerStyle.emit({...this.formData});
    this.modal.hide();
  }

  public resetForm():void
  {
    this.form.reset();
    setTimeout(() => {
      Object.assign(this.formData, this.styleToEdit);
    });
  }

}

