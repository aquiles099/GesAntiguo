import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Capa } from '../../../../../../../../interfaces/medium/mapa/Modulo';
import { AttributeData } from '../gestion-centro-de-mando.component';
import { ProteccionCentroMando, Circuito } from '../../../../../../../../interfaces/medium/centro-mando';
import { NgForm } from '@angular/forms';

@Component({
  template: ``,
  styleUrls: ['./seccion-base.component.css']
})
export abstract class SeccionBaseComponent 
{
  @ViewChild("form")
  public form:NgForm;

  @Input()
  public commandCenterId:string = "";

  @Input()
  public mode:"new"|"update"|"details";

  @Input()
  public loadedData:boolean;
  
  @Input()
  public layer:Capa;
  
  // Arreglo de objetos de datos de atributos para campos de seccion.
  @Input()
  public attributes:AttributeData[] = [];

  /*
  * Plantilla de seccion para creacion de centro de mando.
  * Forma parte de la plantilla base.
  * Puede ser un arreglo para protecciones, circuitos, un circuito o un objeto de seccion 
  * (seccion "puesta a tierra", por ejemplo). 
  */
  @Input()
  public template:
  ProteccionCentroMando[]|
  Circuito|
  Circuito[]|
  {[key:string]:string|number|boolean};

  @Output()
  public onError:EventEmitter<any> = new EventEmitter;

  @Output()
  public showLoading:EventEmitter<any> = new EventEmitter;

  @Output()
  public hideLoading:EventEmitter<any> = new EventEmitter;

  constructor(
  ) { }

  get hasAttributeData():boolean
  {
    return this.attributes.length > 0;
  }

  get inEdition():boolean
  {
    return this.mode === "update";
  }

  public handleForm():void
  {
    switch( this.mode )
    {
      case "new":
        this.addDefaultValuesInTemplate();
        break;

      case "details":
        setTimeout(() => this.disableForm()); // setTimeout para generar macrotask. 
        break;
    }
  }

  protected disableForm():void
  {
    Object.values(this.form.controls).forEach(control => control.disable() );
  }

  protected addDefaultValuesInTemplate(template?:any, attributes?:AttributeData[]):void
  {
    template = template ?? this.template;
    attributes = attributes ?? this.attributes;

    for( let attributeData of attributes )
    {
      if( template.hasOwnProperty( attributeData.campo )  )
        template[attributeData.campo] = attributeData.valor_defecto; 
    }
  }

  public getAttributeByField(field:string):AttributeData
  {
    return this.attributes.find(data => data.campo === field);
  }
}


