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
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.css',
  '../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class TablaComponent implements OnInit {
  private routeDataSubscription:Subscription;
  @ViewChild('myChart') public myChart:ElementRef;
  @ViewChild('datepicker') datepicker: ElementRef;
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
  data_analisis:any={
    device:'',
    inicio:'',
    fin:'',
    frecuencia:''
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
    'Mes pasado': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]
  }
  btn_barras_lineas:any=1;
  selected:number [];
  alerta_inicio:any=0;
  alerta_device:any=0;
  mensaje:any='';
  el_boton:any=1;
  back_color:any[]=[];
  etiqueta:any[]=[];
  datos:any[]=[];
  el_chart:any=1;
  el_chart_barras:any=0;
  type:any='bar';
  /*hightcharts variables*/
  linechart:any;
  barchart :any;
  series:any[]=[];
  tipo:any=0;
  /***********************/
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      this.proyecto=datos.datos.proyecto;
      console.log(this.proyecto);
      
   });
    this.get_devices();
    this.des();
  }
  des(){
    let dates=<HTMLInputElement>document.getElementById('datepicker');
    /*dates.datepicker({ maxDate: 0});*/
  }
  getMinDate(): any { 
    return moment().subtract(1, 'years').add(1, 'days');
  }
  getMaxDate(): any { 
    return moment(); 
  }
  get_devices(){
     let mensaje='Cargando';
     this.gmao.get_devices('').subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          this.devices=resultado.response;
          this._tipo=1;
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
  datesUpdated(range){
    if (range && range.start && range.end){
      let inicio = range.start.format().split('T');
      let fin = range.end.format().split('T');
      this.data_analisis.inicio=inicio[0];
      this.data_analisis.fin=fin[0];
     }
  }
  get_buscar(){
  
    if(this.selected==undefined || this.selected.length==0){
      this.alerta_device=1;
      this.mensaje='Seleccione';
    }else if(this.data_analisis.inicio==''){
      this.alerta_inicio=1;
      this.mensaje='Seleccione fecha de inicio y fin';
    }else if(this.data_analisis.fin==''){
      this.alerta_inicio=1;
      this.mensaje='Seleccione fecha de inicio y fin';
    }else{
      if(this.el_boton==5){
        this.data_analisis.frecuencia='FM';
      }else if(this.el_boton==10){
        this.data_analisis.frecuencia='TM';
      }else if(this.el_boton==15){
        this.data_analisis.frecuencia='QH';
      }else if(this.el_boton==30){
        this.data_analisis.frecuencia='HH';
      }else if(this.el_boton==1){
        this.data_analisis.frecuencia='H';
      }else if(this.el_boton==2){
        this.data_analisis.frecuencia='D';
      }else if(this.el_boton==3){
        this.data_analisis.frecuencia='W';
      }else if(this.el_boton==4){
        this.data_analisis.frecuencia='M';
      }
      this.consulta_lineas();
    }
  }
  consulta_lineas(){
   this.el_chart=0;
   this.el_chart_barras=1;
   this.tipo=0;
   this.alerta_device=0;
   this.btn_barras_lineas=1;
   let dispositivo='';
   let longitud1=this.selected.length;
   let i=0;
   this.series=[];
   this.el_chart=0;
   for(let seleccione of this.selected){
     this.data_analisis.device=seleccione;
     for(let value2 of this.devices){
       if(seleccione==value2.id){
         this.gmao.analisis_delta_costo_consumo(this.data_analisis).subscribe(
          gmao=>{
            dispositivo=value2.name; 
            let resultado=gmao;
            if (resultado.status==true){
              let data=resultado.response;
              let valores=data['values'];
              let longitud=valores.length;
              let datos:any[]=[];
              this.etiqueta=[];
              let color="#"+ ((1<<24)*Math.random() | 0).toString(16);
                for(let for_value of valores){
                  let tiempo_explota=for_value.ts.split('T');
                  let hora_explota=tiempo_explota[1].split('+')
                  this.etiqueta.push(tiempo_explota[0]+' '+hora_explota[0]);
                  datos.push(for_value.v);
                }
                let j=1;
                this.series.push({
                  type: 'line',            
                  name: dispositivo,
                  data:datos
                });
                i++;
                if(longitud1==i){
                  this.el_chart=1;
                  this.el_chart_barras=2;
                  this.get_lineas_chart();
                }
            }
          },
          err =>{
            this.el_chart=1;
            Swal.fire({
                  icon: 'error',
                  title: 'No hay comunicación con el dispositivo',
                  showConfirmButton: false,
                  timer: 1500
                    // según el plugin que nos mande el backend, entraremos en una u otra plataforma
                  });
              if(err.url==null){
                let mensaje='No tienes conexion a internet';
              }else{
                let mensaje='Ocurrió un error intente nuevamente';
              }
            },
         );
       }
     }
   }
  }
  consulta_barras(){
   this.el_chart_barras=1;
   this.tipo=0;
   this.alerta_device=0;
   this.btn_barras_lineas=0;
   let nuevo=1;
   let dispositivo='';
   let longitud1=this.selected.length;
   let i=0;
   this.series=[];
   this.el_chart=0;
   for(let seleccione of this.selected){
     this.data_analisis.device=seleccione;
     for(let value2 of this.devices){
       if(seleccione==value2.id){
         this.gmao.analisis_delta_costo_consumo(this.data_analisis).subscribe(
          gmao=>{
            dispositivo=value2.name; 
            let resultado=gmao;
            if (resultado.status==true){
              let data=resultado.response;
              let valores=data['values'];
              let longitud=valores.length;
              let datos:any[]=[];
              this.etiqueta=[];
              let color="#"+ ((1<<24)*Math.random() | 0).toString(16);
              for(let for_value of valores){
                 let tiempo_explota=for_value.ts.split('T');
                let hora_explota=tiempo_explota[1].split('+')
                this.etiqueta.push(tiempo_explota[0]+' '+hora_explota[0]);
               datos.push(for_value.v);
              }
              let j=1;
              this.series.push({
                name: dispositivo,
                data:datos
              });
              i++;
              if(longitud1==i){
               this.el_chart=1;
               this.el_chart_barras=2;
               this.get_barras_chart();
              }
            }
          },
          err =>{
            this.el_chart=1;
            Swal.fire({
              icon: 'error',
              title: 'No hay comunicación con el dispositivo',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
              if(err.url==null){
                let mensaje='No tienes conexion a internet';
              }else{
                let mensaje='Ocurrió un error intente nuevamente';
              }
            },
         );
       }
     }
   }
  }
  
  boton(item){
    this.el_boton=item;
    
  }
  cerrar_alert(item){
    
    if(item==1){
      this.alerta_device='';
      this.mensaje='';
    }
    if(item==2){
      this.alerta_inicio='';
      this.mensaje='';
    }
  }
  
  
  /*lineas*/
  get_lineas_chart(){
    let series_p:any[]=this.series;
  
    this.tipo=1;
    let lineas: Options={
      chart: {
        zoomType: 'x'
      },
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
    title: {
        text: 'Analisis de dispositivos'
    },

    subtitle: {
        text: 'Fuente: Dexma'
    },

    yAxis: {
        title: {
            text: 'Valores'
        }
    },

    xAxis: {
      lineColor: '#fff',
      categories: this.etiqueta,
    },

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
    },

    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            }
        }
    },
    series: series_p,
    responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    }
    }
  
      this.linechart=new Chart(lineas);
      //let exportar=new Exporting()
      Exporting(this.linechart);
  }
  get_barras_chart(){
    let series_p:any[]=this.series;
  
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
          text: 'Analisis de dispositivos'
      },
      yAxis: {
        title: {
            text: 'kWh'
        }
      },
      xAxis: {
          categories: this.etiqueta
      },
      credits: {
          enabled: false
      },
      series: series_p
    }
      this.barchart=new Chart(barras);
      Exporting(this.barchart);
  }

}
