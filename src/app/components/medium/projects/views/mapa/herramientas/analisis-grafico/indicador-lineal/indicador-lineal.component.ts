import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { ToastrService } from 'ngx-toastr';
import { ChartConfiguration } from 'src/app/interfaces/analysis/analysis-chart-configuration';

const ANIMATION_DURATION = 250;

export interface ILinearIndicatorParameters
{
    title: string;
    units: string|number;
    buttons: boolean   
}

@Component({
  selector: 'indicador-lineal',
  templateUrl: './indicador-lineal.component.html',
  styleUrls: ['./indicador-lineal.component.css'],
  animations: [
    fadeInOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class IndicadorLinealComponent
{
  @ViewChild('chartRef')
  public chartRef:ElementRef<HTMLElement>;

  @Input()
  public configuration:ChartConfiguration;
  
  public parameters:ILinearIndicatorParameters;
  
  @Output()
  public hide:EventEmitter<void> = new EventEmitter();

  constructor(
    private _toastrService:ToastrService
  )
  {
    this.parameters = {
      title: "",
      units: "",
      buttons: true    
    };
  }

  public async build(parameters:any):Promise<void>
  {
    try {
      
      this.parameters.title = parameters.titulo;
      this.parameters.units = parameters.texto;
            
    } catch (error) {
      
      console.log(error);
      this._toastrService.error("Ha ocurrido un error al proyectar grafico.","Error");
    }
  }

  public updateSerie(units:any):void
  {      
      this.parameters.units = units;
  }

  public hideEvent(event:any):void
  {
    event.stopPropagation();
    this.hide.emit();
  }

}
