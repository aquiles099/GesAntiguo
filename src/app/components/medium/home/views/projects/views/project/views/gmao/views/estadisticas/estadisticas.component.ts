import { Component, OnInit,ElementRef,ViewChild  } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import { Chart } from 'angular-highcharts';
import { Options } from 'highcharts';
import * as  Highcharts from 'highcharts';
import Exporting from 'highcharts/modules/exporting';
Exporting(Highcharts);
import Data from 'highcharts/modules/data';
Data(Highcharts);
import ExportData from 'highcharts/modules/export-data';
ExportData(Highcharts);
import * as dayjs from 'dayjs';
import * as moment from 'moment';
moment.locale('es');
import Swal from 'sweetalert2';
@Component({
  // lo mismo, no necesitamos selector
  templateUrl: './estadisticas.component.html',
  styleUrls: [
    './estadisticas.component.css',
    '../../../../../../../../../../../../themes/styles/default-view.scss' 
  ]
})
export class EstadisticasComponent implements OnInit{
  @ViewChild('myChart') public myChart:ElementRef;
  @ViewChild('datepicker') datepicker: ElementRef;
  private routeDataSubscription:Subscription;
  modulo:any;
  carga_datos:any=0;
  _parametros:any=0;
  _dispositivos:any=0;
  proyecto:any;
  id_proyecto:any;
  valor_0=0;
  valor_0_1=1;
  valor_1=10;
  i:any=0;
  _tipo:any=0;
  devices:any;
   data={
    fecha_i:'',
    fecha_f:'',
    id_proyecto:'',
    radio:'',
  }
  maxDateRange:any = dayjs();
  minDateRange:any = dayjs().subtract(1, 'year');
  selected_dates:any;
  local:any={
    format: 'DD-MM-YYYY', 
    displayFormat: 'DD-MM-YYYY', 
    monthNames: moment.monthsShort(),
    daysOfWeek: moment.weekdaysMin(),
    direction: 'ltr', 
    weekLabel: 'S',
    startDate:dayjs().subtract(30, 'days'),
    endDate:dayjs(1, 'days'),
    separator: ' - ', 
    cancelLabel: 'Cancelar', 
    applyLabel: 'OK', 
    clearLabel: 'Limpiar', 
    customRangeLabel: 'Custom range',
    firstDay: 1
  }
  ranges: any = {
    'Hoy': [dayjs(), dayjs()],
    'Ayer': [dayjs().subtract(1, 'days'), dayjs().subtract(1, 'days')],
    'Últimos 7 dias': [dayjs().subtract(6, 'days'), dayjs()],
    'Últimos 30 dias': [dayjs().subtract(29, 'days'), dayjs()],
    'Este mes': [dayjs().startOf('month'), dayjs().endOf('month')],
    'Mes pasado': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
    'Año pasado': [dayjs().subtract(1, 'year').startOf('year'), dayjs().subtract(1, 'year').endOf('year')]
  }
  series:any[]=[];
  series_mes:any[]=[];
  series_pasado:any[]=[];
  tipo:any=0;
  etiqueta:any[]=[];
  barchart :any;
  options:any;
  class_solicitudes:boolean=true;
  class_ordenes:boolean=false;
  class_mant_preventivo:boolean=false;
  el_chart:any=1;
  seleccione_periodo:any;
  alerta_inicio:any;
  checked:boolean=true;
  public types:{key:string, value:string}[] = [
    {key:"Columna", value: "column"},
    {key:"Columna apilada", value: "stackedColumn"},
    {key:"Barra", value: "bar"},
    {key:"Barra apilada", value: "stackedBar"}
  ];
  chartType:any;
  loading:any;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      this.proyecto=datos.datos.proyecto;
      console.log(this.proyecto);
   });
  }
  changeType(type:string){
    if (type=='bar'){
      this.get_barra_lateral_sola_solicitudes_chart();
    }else if (type=='stackedBar'){
      this.get_barra_lateral_aplilada_solicitudes_chart();
    }else if (type=='column'){
      this.get_columna_solicitudes_chart();
    }else if (type=='stackedColumn'){
      this.get_columna_aplilada_solicitudes_chart();
    }
  }
  seleccion_cinta(item){
    if (item==0){
      this.class_solicitudes=true;
      this.class_ordenes=false;
      this.class_mant_preventivo==false;
      this.seleccione_periodo=null;
    }else if(item==1){
      this.class_solicitudes=false;
      this.class_ordenes=true;
      this.class_mant_preventivo=false;
      this.seleccione_periodo=null;
    }else if(item==2){
      this.class_solicitudes=false;
      this.class_ordenes=false;
      this.class_mant_preventivo=true;
      this.seleccione_periodo=null;
    }
  }
  seleccion_periodo(item){
    this.seleccione_periodo=item;
    if (this.class_solicitudes==true) {
      if (item==0){
        this.series_mes=[];
        this.series_pasado=[];
        this.get_solicitudes_ultimo_mes();
      }else if(item==2){
        this.series_mes=[];
        this.series_pasado=[];
        this.get_solicitudes_ultimo_mes();
      }else if(item==1){
        this.series_mes=[];
        this.series_pasado=[];
      }
    }else if(this.class_ordenes==true){
      if (item==0){
        this.series_mes=[];
        this.series_pasado=[];
        this.get_ordenes_ultimo_mes();
      }else if(item==2){
        this.series_mes=[];
        this.series_pasado=[];
        this.get_ordenes_ultimo_mes();
      }else if(item==1){
        this.series_mes=[];
        this.series_pasado=[];
      }
    }else if(this.class_mant_preventivo==true){
      if (item==0){
        this.series_mes=[];
        this.series_pasado=[];
        this.get_mantenimiento_preventivo_ultimo_mes();
      }else if(item==2){
        this.series_mes=[];
        this.series_pasado=[];
        this.get_mantenimiento_preventivo_ultimo_mes();
      }else if(item==1){
        this.series_mes=[];
        this.series_pasado=[];
      }
    }
  }
  ver(){
    if (this.class_solicitudes==true) {
      this.get_solicitudes_todas_fecha();
    }else if(this.class_ordenes==true){
      this.get_ordenes_todas_fecha();
    }else if(this.class_mant_preventivo==true){
      this.get_mantenimiento_preventivo_todos_fecha();
    }
  }

 datesUpdated(range){
    if (range && range.start && range.end){
      let inicio = range.start.format().split('T');
      let fin = range.end.format().split('T');
      this.data.fecha_i=inicio[0];
      this.data.fecha_f=fin[0];
    }
  }
  get_solicitudes_ultimo_mes(){
     var tzoffset = (new Date()).getTimezoneOffset() * 60000;
     let fecha_actual=(new Date(Date.now() - tzoffset)).toISOString().slice(0, -1) + 'Z';
     let explota=fecha_actual.split('T');
     let explota2=fecha_actual.split('-');
     let data={
       fecha_i:explota[0],
       id_proyecto:parseFloat(this.id_proyecto)
     }
     this.class_solicitudes=true;
     this.class_ordenes=false;
     this.class_mant_preventivo=false;
     this.series=[];
     this.series_mes=[];
     this.etiqueta=[];
     this.el_chart=0;
     this.gmao.get_solicitudes_todas(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let data=resultado.consulta;
          let data_mes_pasado=resultado.consulta_mes_pasado;
          if (data_mes_pasado[1]==0){
           this.series.push({
              name:'Pendiente',
              data:[data[1]]
            });
           this.series_mes.push({
              name:'Pendiente',
              data:[data[1]]
            });
           this.series_pasado.push({
              name:'Pendiente',
              data:[0]
            });
           this.etiqueta.push('Pendiente');
          }else{
           this.series.push({
              name:'Pendiente',
              data:[data[1], data_mes_pasado[1]]
           });
           this.series_mes.push({
              name:'Pendiente',
              data:[data[1]]
           });
           this.series_pasado.push({
              name:'Pendiente',
              data:[data_mes_pasado[1]]
           });
           this.etiqueta.push('Pendiente');
          }
          if (data_mes_pasado[2]==0){
           this.series.push({
              name:'Aceptado',
              data:[data[2], 0]
            }); 
           this.series_mes.push({
              name:'Aceptado',
              data:[data[2]]
            }); 
           this.series_pasado.push({
              name:'Aceptado',
              data:[0]
            });
           this.etiqueta.push('Aceptado');
          }else{
           this.series.push({
              name:'Aceptado',
              data:[data[2], data_mes_pasado[2]]
            });
           this.series_mes.push({
              name:'Aceptado',
              data:[data[2]]
            });
           this.series_pasado.push({
              name:'Aceptado',
              data:[data_mes_pasado[2]]
            });
           this.etiqueta.push('Aceptado');
          }
          if (data_mes_pasado[3]==0) {
            this.series.push({
              name:'En espera',
              data:[data[3], 0]
            });
            this.series_pasado.push({
              name:'En espera',
              data:[0]
            });
             this.series_mes.push({
              name:'En espera',
              data:[data[3]]
            });
             this.etiqueta.push('En espera');
          }else{
            this.series.push({
              name:'En espera',
              data:[data[3], data_mes_pasado[3]]
            });
            this.series_mes.push({
              name:'En espera',
              data:[data[3]]
            });
            this.series_pasado.push({
              name:'En espera',
              data:[data_mes_pasado[3]]
            });
            this.etiqueta.push('En espera');
          } 
          if (data_mes_pasado[4]==0) {
            this.series.push({
              name:'Culminado',
              data:[data[4], 0]
            });
            this.series_pasado.push({
              name:'Culminado',
              data:[0]
            });
             this.series_mes.push({
              name:'Culminado',
              data:[data[4]]
            });
             this.etiqueta.push('Culminado');
          }else{
            this.series.push({
              name:'Culminado',
              data:[data[4], data_mes_pasado[4]]
            });
            this.series_mes.push({
              name:'Culminado',
              data:[data[4]]
            });
            this.series_pasado.push({
              name:'Culminado',
              data:[data_mes_pasado[4]]
            });
            this.etiqueta.push('Culminado');
          } 
          if (data_mes_pasado[5]==0) {
            this.series.push({
              name:'Cancelado',
              data:[data[5], 0]
            });
            this.series_pasado.push({
              name:'Cancelado',
              data:[0]
            });
             this.series_mes.push({
              name:'Cancelado',
              data:[data[5]]
            });
             this.etiqueta.push('Cancelado');
          }else{
            this.series.push({
              name:'Cancelado',
              data:[data[5], data_mes_pasado[5]]
            });
            this.series_mes.push({
              name:'Cancelado',
              data:[data[5]]
            });
            this.series_pasado.push({
              name:'Cancelado',
              data:[data_mes_pasado[5]]
            });
            this.etiqueta.push('Cancelado');
          } 
          if (data_mes_pasado[6]==0) {
            this.series.push({
              name:'Rechazado',
              data:[data[6], 0]
            });
            this.series_pasado.push({
              name:'Rechazado',
              data:[0]
            });
             this.series_mes.push({
              name:'Rechazado',
              data:[data[6]]
            });
             this.etiqueta.push('Rechazado');
          }else{
            this.series.push({
              name:'Rechazado',
              data:[data[6], data_mes_pasado[6]]
            });
            this.series_mes.push({
              name:'Rechazado',
              data:[data[6]]
            });
            this.series_pasado.push({
              name:'Rechazado',
              data:[data_mes_pasado[6]]
            });
            this.etiqueta.push('Rechazado');
          } 
          if (data_mes_pasado[7]==0) {
            this.series.push({
              name:'No resuelto',
              data:[data[7], 0]
            });
            this.series_pasado.push({
              name:'No resuelto',
              data:[0]
            });
             this.series_mes.push({
              name:'No resuelto',
              data:[data[7]]
            });
             this.etiqueta.push('No resuelto');
          }else{
            this.series.push({
              name:'No resuelto',
              data:[data[7], data_mes_pasado[7]]
            });
            this.series_mes.push({
              name:'No resuelto',
              data:[data[7]]
            });
            this.series_pasado.push({
              name:'No resuelto',
              data:[data_mes_pasado[7]]
            });
            this.etiqueta.push('No resuelto');
          }
          
          console.log(this.series);
          console.log(this.etiqueta);
          setTimeout(()=>{
           this.get_columna_solicitudes_chart();
           },2000);
        }
      },
      err =>{
         if(err.url==null){
            let mensaje='No tienes conexion a internet';
          }else{
            let mensaje='Ocurrió un error intente nuevamente';
          }
        },
     );
  }
  get_ordenes_ultimo_mes(){
     var tzoffset = (new Date()).getTimezoneOffset() * 60000;
     let fecha_actual=(new Date(Date.now() - tzoffset)).toISOString().slice(0, -1) + 'Z';
     let explota=fecha_actual.split('T');
     let data={
       fecha_i:explota[0],
       id_proyecto:this.id_proyecto
     }
     this.class_solicitudes=false;
     this.class_ordenes=true;
     this.class_mant_preventivo=false;
     this.series=[];
     this.etiqueta=[];
     this.el_chart=0;
     this.gmao.get_ordenes_todas(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let data=resultado.consulta;
          let data_mes_pasado=resultado.consulta_mes_pasado;
          if (data_mes_pasado[1]==0){
           this.series.push({
              name:'Pendiente',
              data:[data[1], 0]
            });
           this.series_mes.push({
              name:'Pendiente',
              data:[data[1]]
            });
           this.series_pasado.push({
              name:'Pendiente',
              data:[0]
            });
           this.etiqueta.push('Pendiente');
          }else {
           this.series.push({
              name:'Pendiente',
              data:[data[1], data_mes_pasado[1]]
           });
           this.series_mes.push({
              name:'Pendiente',
              data:[data[1]]
           });
           this.series_pasado.push({
              name:'Pendiente',
              data:[data_mes_pasado[1]]
           });
           this.etiqueta.push('Pendiente');
          }
          if (data_mes_pasado[2]==0){
           this.series.push({
              name:'Aceptado',
              data:[data[2], 0]
            }); 
           this.series_mes.push({
              name:'Aceptado',
              data:[data[2]]
            }); 
           this.series_pasado.push({
              name:'Aceptado',
              data:[0]
            }); 
            this.etiqueta.push('Aceptado');
          }else{
           this.series.push({
              name:'Aceptado',
              data:[data[2], data_mes_pasado[2]]
            });
           this.series_mes.push({
              name:'Aceptado',
              data:[data[2]]
            });
           this.series_pasado.push({
              name:'Aceptado',
              data:[data_mes_pasado[2]]
            });
            this.etiqueta.push('Aceptado');
          }
          if (data_mes_pasado[3]==0) {
            this.series.push({
              name:'En espera',
              data:[data[3], 0]
            });
            this.series_pasado.push({
              name:'En espera',
              data:[0]
            });
             this.series_mes.push({
              name:'En espera',
              data:[data[3]]
            });
            this.etiqueta.push('En espera');
          }else{
            this.series.push({
              name:'En espera',
              data:[data[3], data_mes_pasado[3]]
            });
            this.series_mes.push({
              name:'En espera',
              data:[data[3]]
            });
            this.series_pasado.push({
              name:'En espera',
              data:[data_mes_pasado[3]]
            });
            this.etiqueta.push('En espera');
          } 
          if (data_mes_pasado[4]==0) {
            this.series.push({
              name:'Culminado',
              data:[data[4], 0]
            });
            this.series_pasado.push({
              name:'Culminado',
              data:[0]
            });
             this.series_mes.push({
              name:'Culminado',
              data:[data[4]]
            });
            this.etiqueta.push('Culminado');
          }else{
            this.series.push({
              name:'Culminado',
              data:[data[4], data_mes_pasado[4]]
            });
            this.series_mes.push({
              name:'Culminado',
              data:[data[4]]
            });
            this.series_pasado.push({
              name:'Culminado',
              data:[data_mes_pasado[4]]
            });
            this.etiqueta.push('Culminado');
          }
          if (data_mes_pasado[5]==0) {
            this.series.push({
              name:'Cancelado',
              data:[data[5], 0]
            });
            this.series_pasado.push({
              name:'Cancelado',
              data:[0]
            });
             this.series_mes.push({
              name:'Cancelado',
              data:[data[5]]
            });
            this.etiqueta.push('Cancelado');
          }else{
            this.series.push({
              name:'Cancelado',
              data:[data[5], data_mes_pasado[5]]
            });
            this.series_mes.push({
              name:'Cancelado',
              data:[data[5]]
            });
            this.series_pasado.push({
              name:'Cancelado',
              data:[data_mes_pasado[5]]
            });
            this.etiqueta.push('Cancelado');
          } 
          if (data_mes_pasado[6]==0) {
            this.series.push({
              name:'Rechazado',
              data:[data[6], 0]
            });
            this.series_pasado.push({
              name:'Rechazado',
              data:[0]
            });
             this.series_mes.push({
              name:'Rechazado',
              data:[data[6]]
            });
            this.etiqueta.push('Rechazado');
          }else{
            this.series.push({
              name:'Rechazado',
              data:[data[6], data_mes_pasado[6]]
            });
            this.series_mes.push({
              name:'Rechazado',
              data:[data[6]]
            });
            this.series_pasado.push({
              name:'Rechazado',
              data:[data_mes_pasado[6]]
            });
            this.etiqueta.push('Rechazado');
          } 
          if (data_mes_pasado[7]==0) {
            this.series.push({
              name:'No resuelto',
              data:[data[7], 0]
            });
            this.series_pasado.push({
              name:'No resuelto',
              data:[0]
            });
             this.series_mes.push({
              name:'No resuelto',
              data:[data[7]]
            });
            this.etiqueta.push('No resuelto');
          }else{
            this.series.push({
              name:'No resuelto',
              data:[data[7], data_mes_pasado[7]]
            });
            this.series_mes.push({
              name:'No resuelto',
              data:[data[7]]
            });
            this.series_pasado.push({
              name:'No resuelto',
              data:[data_mes_pasado[7]]
            });
            this.etiqueta.push('No resuelto');
          } 
          console.log(this.series);
          console.log(this.etiqueta);
          setTimeout(()=>{
           this.get_columna_sola_ordenes_chart();
           },2000);
        }
      },
      err =>{
         if(err.url==null){
            let mensaje='No tienes conexion a internet';
          }else{
            let mensaje='Ocurrió un error intente nuevamente';
          }
        },
     );
  }
  get_mantenimiento_preventivo_ultimo_mes(){
     var tzoffset = (new Date()).getTimezoneOffset() * 60000;
     let fecha_actual=(new Date(Date.now() - tzoffset)).toISOString().slice(0, -1) + 'Z';
     let explota=fecha_actual.split('T');
     let data={
       fecha_i:explota[0],
       id_proyecto:this.id_proyecto
     }
     this.class_solicitudes=false;
     this.class_ordenes=false;
     this.class_mant_preventivo=true;
     this.series=[];
     this.etiqueta=[];
     this.el_chart=0;
     this.gmao.get_mantenimiento_preventivo_todos(data).subscribe(
      gmao=>{
        let resultado=gmao;
        this.el_chart=1;
        if(resultado.status==true){
          let data=resultado.consulta;
          let data_mes_pasado=resultado.consulta_mes_pasado;
          if (data_mes_pasado[1]==0){
           this.series.push({
              name:'Pendiente',
              data:[data[1], 0]
            });
           this.series_mes.push({
              name:'Pendiente',
              data:[data[1]]
            });
           this.series_pasado.push({
              name:'Pendiente',
              data:[0]
            });
           this.etiqueta.push('Pendiente');
          }else {
           this.series.push({
              name:'Pendiente',
              data:[data[1], data_mes_pasado[1]]
           });
           this.series_mes.push({
              name:'Pendiente',
              data:[data[1]]
           });
           this.series_pasado.push({
              name:'Pendiente',
              data:[data_mes_pasado[1]]
           });
           this.etiqueta.push('Pendiente');
          }
          if (data_mes_pasado[2]==0){
           this.series.push({
              name:'Aceptado',
              data:[data[2], 0]
            }); 
           this.series_mes.push({
              name:'Aceptado',
              data:[data[2]]
            }); 
           this.series_pasado.push({
              name:'Aceptado',
              data:[0]
            }); 
            this.etiqueta.push('Aceptado');
          }else{
           this.series.push({
              name:'Aceptado',
              data:[data[2], data_mes_pasado[2]]
            });
           this.series_mes.push({
              name:'Aceptado',
              data:[data[2]]
            });
           this.series_pasado.push({
              name:'Aceptado',
              data:[data_mes_pasado[2]]
            });
            this.etiqueta.push('Aceptado');
          }
          if (data_mes_pasado[3]==0) {
            this.series.push({
              name:'En espera',
              data:[data[3], 0]
            });
            this.series_pasado.push({
              name:'En espera',
              data:[0]
            });
             this.series_mes.push({
              name:'En espera',
              data:[data[3]]
            });
            this.etiqueta.push('En espera');
          }else{
            this.series.push({
              name:'En espera',
              data:[data[3], data_mes_pasado[3]]
            });
            this.series_mes.push({
              name:'En espera',
              data:[data[3]]
            });
            this.series_pasado.push({
              name:'En espera',
              data:[data_mes_pasado[3]]
            });
            this.etiqueta.push('En espera');
          } 
          if (data_mes_pasado[4]==0) {
            this.series.push({
              name:'Culminado',
              data:[data[4], 0]
            });
            this.series_pasado.push({
              name:'Culminado',
              data:[0]
            });
             this.series_mes.push({
              name:'Culminado',
              data:[data[4]]
            });
            this.etiqueta.push('Culminado');
          }else{
            this.series.push({
              name:'Culminado',
              data:[data[4], data_mes_pasado[4]]
            });
            this.series_mes.push({
              name:'Culminado',
              data:[data[4]]
            });
            this.series_pasado.push({
              name:'Culminado',
              data:[data_mes_pasado[4]]
            });
            this.etiqueta.push('Culminado');
          }
          if (data_mes_pasado[5]==0) {
            this.series.push({
              name:'Cancelado',
              data:[data[5], 0]
            });
            this.series_pasado.push({
              name:'Cancelado',
              data:[0]
            });
             this.series_mes.push({
              name:'Cancelado',
              data:[data[5]]
            });
            this.etiqueta.push('Cancelado');
          }else{
            this.series.push({
              name:'Cancelado',
              data:[data[5], data_mes_pasado[5]]
            });
            this.series_mes.push({
              name:'Cancelado',
              data:[data[5]]
            });
            this.series_pasado.push({
              name:'Cancelado',
              data:[data_mes_pasado[5]]
            });
            this.etiqueta.push('Cancelado');
          } 
          if (data_mes_pasado[6]==0) {
            this.series.push({
              name:'Rechazado',
              data:[data[6], 0]
            });
            this.series_pasado.push({
              name:'Rechazado',
              data:[0]
            });
             this.series_mes.push({
              name:'Rechazado',
              data:[data[6]]
            });
            this.etiqueta.push('Rechazado');
          }else{
            this.series.push({
              name:'Rechazado',
              data:[data[6], data_mes_pasado[6]]
            });
            this.series_mes.push({
              name:'Rechazado',
              data:[data[6]]
            });
            this.series_pasado.push({
              name:'Rechazado',
              data:[data_mes_pasado[6]]
            });
            this.etiqueta.push('Rechazado');
          } 
          if (data_mes_pasado[7]==0) {
            this.series.push({
              name:'No resuelto',
              data:[data[7], 0]
            });
            this.series_pasado.push({
              name:'No resuelto',
              data:[0]
            });
             this.series_mes.push({
              name:'No resuelto',
              data:[data[7]]
            });
            this.etiqueta.push('No resuelto');
          }else{
            this.series.push({
              name:'No resuelto',
              data:[data[7], data_mes_pasado[7]]
            });
            this.series_mes.push({
              name:'No resuelto',
              data:[data[7]]
            });
            this.series_pasado.push({
              name:'No resuelto',
              data:[data_mes_pasado[7]]
            });
            this.etiqueta.push('No resuelto');
          } 
          console.log(this.series);
          console.log(this.etiqueta);
          setTimeout(()=>{
           this.get_columna_sola_mant_preventivo_chart();
           },2000);
        }
      },
      err =>{
         if(err.url==null){
            let mensaje='No tienes conexion a internet';
          }else{
            let mensaje='Ocurrió un error intente nuevamente';
          }
        },
     );
  }
  get_solicitudes_todas_fecha(){
     this.data.id_proyecto=this.id_proyecto
     this.series=[];
     this.etiqueta=[];
     this.el_chart=0;
     this.gmao.get_solicitudes_todas_fecha(this.data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let data=resultado.consulta;
          console.log(data);
          console.log(data[1]); 
            this.series.push({
              name:'Pendiente',
              data:[data[1]]
            })
            this.series.push({
              name:'Aceptado',
              data:[data[2]]
            })
            this.series.push({
              name:'En espera',
              data:[data[3]]
            })
            this.series.push({
              name:'Culminado',
              data:[data[4]]
            })
            this.series.push({
              name:'Cancelado',
              data:[data[5]]
            })
            this.series.push({
              name:'Rechazado',
              data:[data[6]]
            })
            this.series.push({
              name:'No resuelto',
              data:[data[7]]
            })
          this.etiqueta.push('Pendiente');
          this.etiqueta.push('Aceptado');
          this.etiqueta.push('En espera');
          this.etiqueta.push('Culminado');
          this.etiqueta.push('Cancelado');
          this.etiqueta.push('Rechazado');
          this.etiqueta.push('No resuelto');
          setTimeout(()=>{
           this.get_columna_solicitudes_chart();
           },2000);
        }
      },
      err =>{
       if(err.url==null){
          let mensaje='No tienes conexion a internet';
        }else{
          let mensaje='Ocurrió un error intente nuevamente';
        }
      },
     );
  }
  get_ordenes_todas_fecha(){
    this.data.id_proyecto=this.id_proyecto;
     this.series=[];
     this.etiqueta=[];
     this.el_chart=0;
     this.gmao.get_ordenes_todas_fecha(this.data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let data=resultado.consulta;
          console.log(data);
          console.log(data[1]); 
            this.series.push({
              name:'Pendiente',
              data:[data[1]]
            })
            this.series.push({
              name:'Aceptado',
              data:[data[2]]
            })
            this.series.push({
              name:'En espera',
              data:[data[3]]
            })
            this.series.push({
              name:'Culminado',
              data:[data[4]]
            })
            this.series.push({
              name:'Cancelado',
              data:[data[5]]
            })
            this.series.push({
              name:'Rechazado',
              data:[data[6]]
            })
            this.series.push({
              name:'No resuelto',
              data:[data[7]]
            })
          this.etiqueta.push('Pendiente');
          this.etiqueta.push('Aceptado');
          this.etiqueta.push('En espera');
          this.etiqueta.push('Culminado');
          this.etiqueta.push('Cancelado');
          this.etiqueta.push('Rechazado');
          this.etiqueta.push('No resuelto');
          setTimeout(()=>{
           this.get_columna_sola_ordenes_chart();
           },2000);
        }
      },
      err =>{
         if(err.url==null){
            let mensaje='No tienes conexion a internet';
          }else{
            let mensaje='Ocurrió un error intente nuevamente';
          }
        },
     );
  }
  get_mantenimiento_preventivo_todos_fecha(){
    this.data.id_proyecto=this.id_proyecto;
    this.series=[];
    this.etiqueta=[];
    this.el_chart=0;
    this.gmao.get_mantenimiento_preventivo_todos_fecha(this.data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let data=resultado.consulta;
          console.log(data);
          console.log(data[1]); 
            this.series.push({
              name:'Pendiente',
              data:[data[1]]
            })
            this.series.push({
              name:'Aceptado',
              data:[data[2]]
            })
            this.series.push({
              name:'En espera',
              data:[data[3]]
            })
            this.series.push({
              name:'Culminado',
              data:[data[4]]
            })
            this.series.push({
              name:'Cancelado',
              data:[data[5]]
            })
            this.series.push({
              name:'Rechazado',
              data:[data[6]]
            })
            this.series.push({
              name:'No resuelto',
              data:[data[7]]
            })
          this.etiqueta.push('Pendiente');
          this.etiqueta.push('Aceptado');
          this.etiqueta.push('En espera');
          this.etiqueta.push('Culminado');
          this.etiqueta.push('Cancelado');
          this.etiqueta.push('Rechazado');
          this.etiqueta.push('No resuelto');
          setTimeout(()=>{
           this.get_columna_sola_mant_preventivo_chart();
           },2000);
        }
      },
      err =>{
         if(err.url==null){
            let mensaje='No tienes conexion a internet';
          }else{
            let mensaje='Ocurrió un error intente nuevamente';
          }
        },
     );
  }
  get_columna_solicitudes_chart(){
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    this.el_chart=1;
    this.tipo=2;
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'column',
        zoomType: 'x'
      },
      title: {
          text: 'Solicitudes'
      },
      yAxis: {
        title: {
            text: ''
        }
      },
      xAxis: {
          /*categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
    this.barchart=new Chart(barras);
  
    Exporting(this.barchart);
  }
  get_columna_sola_ordenes_chart(){
    this.el_chart=1;
    this.tipo=2;
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'column',
        zoomType: 'x'
      },
      title: {
          text: 'Ordenes de trabajo'
      },
      yAxis: {
        title: {
            text: 'Cantidad'
        }
      },
      xAxis: {
          /*categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }
  get_columna_sola_mant_preventivo_chart(){
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    this.el_chart=1;
    this.tipo=2;
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'column',
        zoomType: 'x'
      },
      title: {
          text: 'Mantenimiento preventivo'
      },
      yAxis: {
        title: {
            text: 'Cantidad'
        }
      },
      xAxis: {
         /* categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }
  /* barra lateral sola*/
  get_barra_lateral_sola_solicitudes_chart(){
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    this.el_chart=1;
    this.tipo=2;
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'bar'
      },
      title: {
        text: 'Solicitudes'
      },
      yAxis: {
        title: {
            text: ''
        }
      },
      xAxis: {
          /*categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
    this.barchart=new Chart(barras);
  
    Exporting(this.barchart);
  }
  get_barra_lateral_sola_ordenes_chart(){
    this.el_chart=1;
    this.tipo=2;
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'area'
      },
      title: {
          text: 'Ordenes de trabajo'
      },
      yAxis: {
        title: {
            text: 'Cantidad'
        }
      },
      xAxis: {
          /*categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }
  get_barra_lateral_sola_mant_preventivo_chart(){
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    this.el_chart=1;
    this.tipo=2;
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'area'
      },
      title: {
          text: 'Mantenimiento preventivo'
      },
      yAxis: {
        title: {
            text: 'Cantidad'
        }
      },
      xAxis: {
         /* categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }
  /***********/
  /* barra lateral aplilada*/
  get_barra_lateral_aplilada_solicitudes_chart(){
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    this.el_chart=1;
    this.tipo=2;
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'bar'
      },
      title: {
        text: 'Solicitudes'
      },
      yAxis: {
        title: {
            text: ''
        }
      },
      xAxis: {
          /*categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      plotOptions: {
        series: {
            stacking: 'normal'
        }
      },
      series: series_p
    }
    this.barchart=new Chart(barras);
  
    Exporting(this.barchart);
  }
  get_barra_lateral_aplilada_ordenes_chart(){
    this.el_chart=1;
    this.tipo=2;
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'area'
      },
      title: {
          text: 'Ordenes de trabajo'
      },
      yAxis: {
        title: {
            text: 'Cantidad'
        }
      },
      xAxis: {
          /*categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }
  get_barra_lateral_aplilada_mant_preventivo_chart(){
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    this.el_chart=1;
    this.tipo=2;
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'area'
      },
      title: {
          text: 'Mantenimiento preventivo'
      },
      yAxis: {
        title: {
            text: 'Cantidad'
        }
      },
      xAxis: {
         /* categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }
  /***********/
  /* columna aplilada*/
  get_columna_aplilada_solicitudes_chart(){
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    this.el_chart=1;
    this.tipo=2;
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'column'
      },
      plotOptions:{
       column: {
        stacking: 'normal',
        dataLabels: {
            enabled: true
        }
       }
      },
      title: {
        text: 'Solicitudes'
      },
      yAxis: {
        title: {
            text: ''
        }
      },
      xAxis: {
          /*categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
    this.barchart=new Chart(barras);
  
    Exporting(this.barchart);
  }
  get_columna_aplilada_ordenes_chart(){
    this.el_chart=1;
    this.tipo=2;
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'column'
      },
      plotOptions:{
       column: {
        stacking: 'normal',
        dataLabels: {
            enabled: true
        }
       }
      },
      title: {
          text: 'Ordenes de trabajo'
      },
      yAxis: {
        title: {
            text: 'Cantidad'
        }
      },
      xAxis: {
          /*categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }
  get_columna_aplilada_mant_preventivo_chart(){
    let series_p:any[];
    if (this.seleccione_periodo==0){
      series_p=[];
      series_p=this.series_mes;
    }else if(this.seleccione_periodo==2){
      series_p=[];
      series_p=this.series_pasado;
    }else if(this.seleccione_periodo==1){
      series_p=[];
      series_p=this.series;
    }
    this.el_chart=1;
    this.tipo=2;
    let barras: Options={
      lang: {
            viewFullscreen:'Ver en pantalla completa',
            printChart: 'Imprimir',
            downloadPNG: 'Descargar como PNG',
            downloadJPEG: 'Descargar como JPEG',
            downloadPDF: 'Descargar como PDF',
            downloadSVG: 'Descargar como SVG',
            downloadCSV: 'Descargar como CSV',
            downloadXLS: 'Descargar como XLS'
        },
        exporting: {
          buttons: {
              contextButton: {
                  menuItems: ['viewFullscreen','printChart','downloadPNG','downloadJPEG','downloadPDF', 'downloadSVG','downloadCSV', 'downloadXLS']
              }
          }
      },
      chart: {
        type: 'column'
      },
      plotOptions:{
       column: {
        stacking: 'normal',
        dataLabels: {
            enabled: true
        }
       }
      },
      title: {
          text: 'Mantenimiento preventivo'
      },
      yAxis: {
        title: {
            text: 'Cantidad'
        }
      },
      xAxis: {
         /* categories: this.etiqueta*/
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }
  /***********/
}
