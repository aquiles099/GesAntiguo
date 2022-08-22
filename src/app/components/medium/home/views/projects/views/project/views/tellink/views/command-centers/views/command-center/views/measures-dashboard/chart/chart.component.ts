import { Component, AfterViewInit, Input } from '@angular/core';
import { HighchartsBase } from '../../../../../../../../../../../../../../../../models/highcharts-base';
import * as  Highcharts from 'highcharts';
import { DatePipe } from '@angular/common';
import { DailyMonthlyMeasure, QuarterHourMeasure } from 'src/app/interfaces/medium/tellink/measures';

interface Form
{
  frecuency:string;
  frecuencyLabel:string;
  date:Date|Date[]; 
  startTime:Date; 
  endTime:Date;
  measures:(QuarterHourMeasure|DailyMonthlyMeasure)[]
}

@Component({
  selector: 'measures-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent extends HighchartsBase implements AfterViewInit
{
  public loading:boolean = false;

  public types:{key:string, value:string}[] = [
    {key:"Linea", value: "line"},
    {key:"Area", value: "area"},
    {key:"Barra", value: "bar"},
    {key:"Columna", value: "column"},
    {key:"Barra apilada", value: "stackedBar"},
    {key:"Columna apilada", value: "stackedColumn"}
  ];

  private quarterHourMeasureKeys:{[key:string]:{name:string, unit:string}} = {
    absolute_active_energy: {name:"Energía activa consumida", unit: "kWh"},
    absolute_reactive_energy: {name:"Energía reactiva consumida", unit: "kVArh"},
    active_energy: {name:"Energía activa consumida", unit: "kWh"},
    active_power: {name:"Potencia activa", unit: "KW"},
    apparent_power: {name:"Potencia aparente", unit: "kVA"},
    current1: {name:"Corriente fase 1", unit: "A"},
    current2: {name:"Corriente fase 2", unit: "A"},
    current3: {name:"Corriente fase 3", unit: "A"},
    power_factor: {name:"Factor de potencia", unit: ""},
    reactive_energy: {name:"Energía reactiva consumida", unit: "KVArh"},
    reactive_power: {name:"Potencia reactiva", unit: "kVAr"},
    voltage1: {name:"Tension fase 1", unit: "V"},
    voltage2: {name:"Tension fase 2", unit: "V"},
    voltage3: {name:"Tension fase 3", unit: "V"},
  };
  
  private dailyMeasureKeys:{[key:string]:{name:string, unit:string}} = {
    active_energy: {name:"Energía activa consumida", unit: "kWh"},
    reactive_energy: {name:"Energía reactiva consumida", unit: "KVArh"}
  };

  private initialOptions:Highcharts.Options|any = {
    title: {
      text: ""
    },
    subtitle: {
      text: ""
    },
    yAxis: {
      title: {
        text: 'Consumo'
      }
    },
    xAxis: {
      title: {
        text: "Fechas"
      },
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
    series: [{
      name: 'Sin datos',
      data: [0]
    }]
  };


  @Input()
  public container:HTMLElement;

  public chartType:string = "line";

  constructor(
    private _datePipe:DatePipe
  ) {
    super();

    Object.assign(this.options, this.initialOptions);
  }

  public ngAfterViewInit(): void
  {
    this.chartRef.setSize(
      this.container.offsetWidth,
      this.container.offsetHeight
    );

    this.options.chart["zoomType"] = "x";
  }

  public update(data:Form):void
  {
    this.chartRef.zoomOut();

    this.options.title.text = `Medidas por frecuencia ${data.frecuencyLabel}`;

    this.updateSubtitle(data);

    this.updateXAxisOptions(data); 

    this.updateSeries(data);

    this.updateAndRedraw();
  }

  private updateSubtitle(data:Form):void
  {
    let startDate = Array.isArray( data.date ) ? data.date[0].toISOString() : data.date.toISOString(), 
        endDate = Array.isArray( data.date ) ? data.date[1].toISOString() : data.date.toISOString(),
        subtitle = "";

    switch( data.frecuency )
    {
      case "minute":
        subtitle += `${this._datePipe.transform(startDate,"dd/MM")} de ${this._datePipe.transform(data.startTime.toISOString(),"H:mm")} a ${this._datePipe.transform(data.endTime.toISOString(),"H:mm")}`;
      break;
      case "day":
        subtitle += `Del ${this._datePipe.transform(startDate,"dd/MM/yyyy", "UTC")} al ${this._datePipe.transform(endDate,"dd/MM/yyyy", "UTC")}`;
      break;
      case "month":
        subtitle += `Del ${this._datePipe.transform(startDate,"MM/yyyy", "UTC")} al ${this._datePipe.transform(endDate,"MM/yyyy", "UTC")}`;
      break;
    }

    this.options.subtitle.text = subtitle;
  }

  private updateXAxisOptions(data:Form):void
  {
    let title, categories;

    switch( data.frecuency )
    {
      case "minute":
        title = "Hora";
        categories = data.measures.map(measure => this._datePipe.transform(measure.date,"H:mm"));
      break;

      case "day":
        title = "Fecha";
        categories = data.measures.map(measure => this._datePipe.transform(measure.date,"dd/MM/yyyy"));
      break;

      case "month":
        title = "Mes";
        categories = data.measures.map(measure => this._datePipe.transform(measure.date,"MM/yyyy"));
      break;
    }

    (this.options.xAxis as Highcharts.XAxisOptions ).title.text = title;
    (this.options.xAxis as Highcharts.XAxisOptions)["categories"] = categories;
  }

  public updateSeries(data:Form):void
  {      
    const series = {};

    let measureStructure;

    switch( data.frecuency )
    {
      case "minute":
        measureStructure = this.quarterHourMeasureKeys;
      break;

      case "day":
      case "month":
        measureStructure = this.dailyMeasureKeys;
      break;
    }

    for( let [key, obj] of Object.entries( measureStructure ) )
    {
      series[key] = {
        name: (obj as any).name,
        tooltip: {
          valueSuffix: " " + ( (obj as any).unit ?? '')
        },    
        data: [],
      };
    }

    data.measures.forEach(measure => {

      for( let [key, value] of Object.entries( measure ) )
      {
        if(series[key])
          series[key].data.push(value)
      }
      
    });

    this.options.series = Object.values(series);
  }

}
