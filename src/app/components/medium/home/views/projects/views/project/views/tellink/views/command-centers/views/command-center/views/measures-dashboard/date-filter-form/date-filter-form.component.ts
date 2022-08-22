import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { BsDatepickerConfig, BsDaterangepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { ToastrService } from 'ngx-toastr';
import { esLocale}  from 'ngx-bootstrap/locale';
import { defineLocale } from 'ngx-bootstrap/chronos';
defineLocale('es', esLocale);

export type MeasureFrecuency = "minute" | "day" | "month";

const TODAY = new Date();
TODAY.setHours(0);
TODAY.setMinutes(0);
TODAY.setSeconds(0);

@Component({
  selector: 'date-filter-form',
  templateUrl: './date-filter-form.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './date-filter-form.component.css',
  ],
  animations: [
    fadeInOnEnterAnimation({duration: 250}),
    fadeOutOnLeaveAnimation({duration: 250})
  ]
})
export class DateFilterFormComponent implements AfterViewInit
{
  public form:{frecuency:MeasureFrecuency, date:Date|Date[], startTime:Date, endTime:Date} = {
    frecuency: "minute",
    date: this.getTodayDate(),
    startTime: this.getTodayDate(), // hora 0
    endTime: new Date( this.getTodayDate().setHours(23, 45) ), // hora 23:45 (ultimo cuarto de hora del dia)
  };

  @Input()
  public sendingForm:boolean = false;

  @Output()
  public onSubmit:EventEmitter<{frecuency:MeasureFrecuency, date:Date|Date[], startTime:Date, endTime:Date}> = new EventEmitter();

  public frequencies:{key:string, value:string}[] = [
    {key: "Cuarto horaria", value: "minute"},
    {key: "Diaria", value: "day"},
    {key: "Mensual", value: "month"}
  ];

  private dateSevenDaysAgo:Date = new Date(new Date().setDate(TODAY.getDate() - 7));
  private yesterday:Date = new Date(new Date().setDate(TODAY.getDate() - 1));
  private dateOneMonthAgo = new Date(new Date().setMonth(TODAY.getMonth() - 1));
  private dateTwoMonthsAgo = new Date(new Date().setMonth(TODAY.getMonth() - 2));

  public dayRanges:{value:Date[], label:string}[] = [
    {
      value: [this.getTodayDate(), this.getTodayDate()],
      label: 'Hoy'
    },
    {
      value: [this.yesterday, this.yesterday],
      label: 'Ayer'
    },
    {
      value: [this.dateSevenDaysAgo, this.getTodayDate()],
      label: 'Semana pasada'
    },
  ];

  public monthRanges:{value:Date[], label:string}[] = [
    {
      value: [  new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), this.getTodayDate()], // solo importa el mes
      label: 'Mes actual'
    },
    {
      value: [new Date( this.dateOneMonthAgo.setDate(1) ), new Date( this.dateOneMonthAgo.getFullYear(), this.dateOneMonthAgo.getMonth() + 1, 0 )],
      label: 'Mes pasado'
    },
    {
      value: [new Date( this.dateTwoMonthsAgo.setDate(1) ), this.getTodayDate()],
      label: 'Ultimos 3 meses'
    },
  ];

  public bsDateRangePickerConfig:Partial<BsDaterangepickerConfig> = { 
    containerClass: 'theme-dark-blue', 
    isAnimated: true,
    maxDate: TODAY,
    ranges: this.dayRanges,
    customRangeButtonLabel: "Personalizado",
    minMode: "day"
  };

  public bsDatePickerConfig:Partial<BsDatepickerConfig> = { 
    containerClass: 'theme-dark-blue', 
    isAnimated: true,
    maxDate: TODAY,
    minMode: "day"
  };

  constructor(
    private _bsLocaleService:BsLocaleService,
    private _toastrService:ToastrService
  ) {
    this._bsLocaleService.use('es');
  }

  public ngAfterViewInit(): void {

    this.onSubmitEvent();
  }
  
  public getTodayDate():Date
  {
    return new Date( new Date().setTime(TODAY.getTime()) );
  }

  public onChangeFrecuencySelector():void
  {
    switch( this.form.frecuency )
    {
      case "minute":
        this.form.startTime = this.getTodayDate();
        this.form.endTime = this.getTodayDate();
        this.form.endTime.setHours(23);
        break;

      case "day":
        this.bsDateRangePickerConfig.minMode =  "day";
        this.bsDateRangePickerConfig.ranges = this.dayRanges;  
        break;

      case "month":
        this.bsDateRangePickerConfig.minMode = "month";
        this.bsDateRangePickerConfig.ranges = this.monthRanges;  
        break;
    }

    this.setDefaultValueOnDatePicker();
  }
 
  private setDefaultValueOnDatePicker():void
  {
    this.form.date = this.form.frecuency === "minute" ?
    this.getTodayDate() :
    [
      this.getTodayDate(),
      this.getTodayDate()
    ];  
  }
   
  public onDaterangePickerValueChange(dates: Date[]): void 
  {
    if( ! dates )
      return;

    dates[1].setHours(0);
    dates[1].setMinutes(0);
    dates[1].setSeconds(0);

    if( dates[1] > TODAY )
      this.setDefaultValueOnDatePicker()
  }

  public onTimePickerValueChange(field:string):void
  {
    if( ! this.form[field] )
    {
      this._toastrService.error("Por favor, coloque una hora / minutos valida.");

      this.form[field] = field === "startTime" ?
      this.getTodayDate() : new Date( this.getTodayDate().setHours(23, 45) );
    }
  }

  public onSubmitEvent():void
  {
    try
    {
      if( this.form.frecuency === "minute" )
      {
        if( this.form.startTime > this.form.endTime )
          throw new Error("La hora de inicio no puede ser mayor a la de fin.");
      }
      else
      {
        if( this.form.date[0] > this.form.date[1] )
          throw new Error("La fecha de inicio no puede ser mayor a la de fin.");
      }

      const data = Object.assign({}, this.form, this.getDatesInISOString());

      this.onSubmit.emit(data);
    }
    catch(error)
    {
      this._toastrService.error(error.message, "Error");
    }
  }

  private getDatesInISOString():any
  {
    const from = Array.isArray(this.form.date) ? this.form.date[0] : this.form.date;
    const to = Array.isArray(this.form.date) ? this.form.date[1] : new Date( this.form.date.toDateString() );

    let fromInISOString = from.toISOString(),
        toInISOString = to.toISOString();

    let startHour = 0, startMinutes = 0,
        endHour = 23, endMinutes = 59;

    let timeSeparatorIndex = fromInISOString.indexOf("T"); 

    if( this.form.frecuency === "minute" )
    {    
      startHour = this.form.startTime.getHours();
      startMinutes = this.form.startTime.getMinutes();
      endHour = this.form.endTime.getHours();
      endMinutes = this.form.endTime.getMinutes();
    }

    fromInISOString = fromInISOString.substring(0, timeSeparatorIndex) + `T${startHour}:${startMinutes}:00z`;
    toInISOString = toInISOString.substring(0, timeSeparatorIndex) + `T${endHour}:${endMinutes}:00z`;

    return {
      from: fromInISOString,
      to: toInISOString
    };
  }
}
