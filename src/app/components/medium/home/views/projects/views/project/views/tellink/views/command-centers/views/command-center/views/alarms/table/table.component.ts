import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommandCenter } from '../../../../../../../../../../../../../../../../interfaces/medium/tellink/command-center';
import { DataTableDirective } from 'angular-datatables';
import { Subject, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TellinkApiService } from '../../../../../../../../../../../../../../../../services/medium/tellink-api.service';
import { ReceivedAlarm } from '../../../../../../../../../../../../../../../../interfaces/medium/tellink/received-alarm';
import { BsDaterangepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { monthDiff } from 'src/app/shared/helpers';

const TODAY = new Date();
TODAY.setHours(0);
TODAY.setMinutes(0);
TODAY.setSeconds(0);

@Component({
  templateUrl: './table.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './table.component.css'
  ]
})
export class TableComponent implements OnInit, OnDestroy
{
  public cm:CommandCenter = null;
  public alarms:ReceivedAlarm[] = [];

  public showSpinner:boolean = false;

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
    }
  ];

  public form:{date:Date[], startTime:Date, endTime:Date} = {
    date: [this.dateSevenDaysAgo, this.getTodayDate()],
    startTime: this.getTodayDate(), // hora 0
    endTime: new Date( this.getTodayDate().setHours(23, 45) ), // hora 23:45 (ultimo cuarto de hora del dia)
  };

  public loadingData:boolean = false;

  public bsDateRangePickerConfig:Partial<BsDaterangepickerConfig> = { 
    containerClass: 'theme-dark-blue', 
    isAnimated: true,
    maxDate: TODAY,
    ranges: this.dayRanges,
    customRangeButtonLabel: "Personalizado",
    minMode: "day"
  };

  @ViewChild(DataTableDirective, {static: false})
  public dtElement: DataTableDirective;

  public dtOptions: any = {}; 
  public dtTrigger: Subject<any> = new Subject(); 

  private routeDataSubscription:Subscription;

  constructor(
    private route:ActivatedRoute,
    private _toastrService:ToastrService,
    private _tellinkApiService:TellinkApiService,
    private _bsLocaleService:BsLocaleService
  )
  {
    this._bsLocaleService.use('es');
    this.setDefaultValueOnDatePicker();
  }

  public ngOnInit(): void 
  {
    this.buildDataTableOptions();
    this.routeDataSubscription = this.route.parent.data.subscribe(data => this.cm = data.cm);
  }

  public ngAfterViewInit(): void
  {
    this.dtTrigger.next();
    this.getDataAndReloadTable();
  }

  public buildDataTableOptions():void
  {
    this.dtOptions = {
      stripeClasses: [],
      pagingType: 'full_numbers',
      lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Todos"] ],
      pageLength: 10,
      scrollY: '57.5vh',
      scrollX: true,
      scrollCollapse: true,
      order: [[1,'asc']],
      columns: [
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true, type: "date" },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
      ],
      buttons: [],
      autoWidth: false,
      dom: 'Brtip',
      language: {
        processing: "Procesando...",
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ elementos",
        info: "Mostrando desde _START_ al _END_ de _TOTAL_ elementos",
        infoEmpty: "Mostrando ningún elemento.",
        infoFiltered: "(filtrado _MAX_ elementos total)",
        infoPostFix: "",
        loadingRecords: "Cargando registros...",
        zeroRecords: "No se encontraron registros",
        emptyTable: "No hay alarmas recibidas en el rango de fecha seleccionado",
        paginate: {
          first: "Primero",
          previous: "Anterior",
          next: "Siguiente",
          last: "Último"
        },
        aria: {
          sortAscending: ": Activar para ordenar la tabla en orden ascendente",
          sortDescending: ": Activar para ordenar la tabla en orden descendente"
        }
      }
    };
  }
 
  public filterTableElements(event):void
  {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.search(event.target.value.trim());
      dtInstance.draw();
    });
  }
   
  public async getDataAndReloadTable():Promise<void>
  { 
    try
    {
      this.showSpinner = true;

      let dateRange = this.getDatesInISOString();

      this.alarms = await this._tellinkApiService.getReceivedAlarmsPerCm(this.cm.id, dateRange);

      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.destroy();
        this.dtTrigger.next();
       });
   
    } 
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public getTodayDate():Date
  {
    return new Date( new Date().setTime(TODAY.getTime()) );
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

  private setDefaultValueOnDatePicker():void
  {
    this.form.date = [this.dateSevenDaysAgo, this.getTodayDate()];  
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

  private getDatesInISOString():any
  {
    try
    {
      if( this.form.startTime > this.form.endTime )
        throw new Error("La hora de inicio no puede ser mayor a la de fin.");
      
      if( this.form.date[0] > this.form.date[1] )
        throw new Error("La fecha de inicio no puede ser mayor a la de fin.");
      
      if( monthDiff( this.form.date[0], this.form.date[1]) > 12)
        throw new Error("El rango de fecha no puede ser mayor a un año.");

      let from = this.form.date[0].toISOString();
      let to = this.form.date[1].toISOString();
  
      let startHour = this.form.startTime.getHours(), 
          startMinutes = this.form.startTime.getMinutes(),
          endHour = this.form.endTime.getHours(),
          endMinutes = this.form.endTime.getMinutes();
  
      let timeSeparatorIndex = from.indexOf("T"); 
  
      from = from.substring(0, timeSeparatorIndex) + `T${startHour}:${startMinutes}:00z`;
      to = to.substring(0, timeSeparatorIndex) + `T${endHour}:${endMinutes}:00z`;
  
      return { from, to};
    }
    catch(error)
    {
      throw error;
    }
  }

  public ngOnDestroy():void
  {   
    this.dtTrigger.unsubscribe();
    this.routeDataSubscription.unsubscribe();
  }
}
