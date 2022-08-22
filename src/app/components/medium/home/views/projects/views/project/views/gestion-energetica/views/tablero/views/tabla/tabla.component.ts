import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import * as dayjs from 'dayjs';

@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.css',
   '../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class TablaComponent implements OnInit {
  private routeDataSubscription:Subscription;
  modulo:any;
  carga_datos:any=0;
  proyecto:any;
  id_proyecto:any;
  valor_0=0;
  valor_0_1=1;
  valor_1=10;
  i:any=0;
  aqui:any;
  dashboard:any[]=[];
  suma:any=0;
  longitud_dispositivos:any=0;
  longitud_dashboard:any=0;
  longitud_dashboard_2:any=0;
  longitud_dispositivos2:any=0;
  el_periodo:any;
  pase:any=0;
  dispositivo:any[]=[];
  dashboard_muestra:any;
  _longitud_dispositivos:any=0;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      this.proyecto=datos.datos.proyecto;
      console.log(this.proyecto);
      this.get_dashboard();
   });
  }
  get_dashboard(){
     this.gmao.get_dashboard('').subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          let data=resultado.data;
          let i=0;
          this.longitud_dashboard=data.length;
          for(let value of data){
           this.buscar_dispositivos(i,value.id,value.nombre,value.parametro,value.periodo,value.periodo);
            i++;
          }
        }else{
          this.carga_datos=1;
        }
      },
      err =>{
       this.carga_datos=2;
       if(err.url==null){
         let mensaje='No tienes conexion a internet';
       }else{
         let mensaje='Ocurrió un error intente nuevamente';
       }
      },
     );
  }
  buscar_dispositivos(i,id,nombre,parametro,periodo,frecuencia){
    let _id=id;
    let _i=i;
    let _nombre=nombre;
    let _parametro=parametro;
    let _periodo=periodo;
    let _frecuencia=frecuencia;
    let start;
    let end;
    let nuevo_periodo='';
    if(_periodo=='ult_24_horas'){
      start=dayjs(), dayjs();
      end=dayjs(), dayjs();
      this.el_periodo='Últimas 24 horas';
    }else if(_periodo=='ayer'){
       start=dayjs().subtract(1, 'days');
       end=dayjs().subtract(1, 'days');
      this.el_periodo='Ayer';
    }else if(_periodo=='semana_hoy'){
       start=dayjs().subtract(6, 'days');
       end=dayjs();
       this.el_periodo='Última semana';
    }else if(_periodo=='ult_7_dias'){
       start=dayjs().subtract(6, 'days');
       end=dayjs();
       this.el_periodo='Últimos 7 dias';
    }else if(_periodo=='ult_30_dias'){
      start=dayjs().subtract(29, 'days');
      end=dayjs();
      this.el_periodo='Últimos 30 dias';
    }else if(_periodo=='sem_pasada'){
      start=dayjs().subtract(6, 'days');
      end=dayjs();
      this.el_periodo='Semana pasada';
    }else if(_periodo=='mes_pasado'){
      start=dayjs().subtract(29, 'days');
      end=dayjs();
      this.el_periodo='Mes pasado';
    }else if(_periodo=='ult_12_meses'){
      start=dayjs().subtract(11, 'month');
      end=dayjs().endOf('month');
      this.el_periodo='Últimos 12 meses';
    }else if(_periodo=='anio_pasado'){
      start=dayjs().subtract(11, 'month');
      end=dayjs().endOf('month');
      this.el_periodo='Año pasao';
    }
    let inicio=start.format().split('T');
    let fin=end.format().split('T');
    let data={
      id:_id
    }
    let datas;
    this.gmao.get_dispositivos_id_dashboard(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          let data=resultado.data;
          /*this.longitud_dashboard_2++;*/
          /*this._longitud_dispositivos=0;*/
          for(let value of data){
            datas={
              parameter:_parametro,
              device:value.dispositivo,
              dashboard_dexma_id:value.dashboard_dexma_id,
              inicio:inicio[0],
              fin:fin[0]
              };
            this.gmao.cost_electricity(datas).subscribe(
              gmao=>{
                let resultado1=gmao;
                this.longitud_dispositivos=data.length;
                 if (resultado1.status==true){
                   let data1=resultado1.response;
                   let i=0;
                    let valores=data1['0'].values;
                    let longitud=valores.length;
                    let datos:any[]=[];
                    let suma=0;
                    for(let for_value of valores){
                      let tiempo_explota=for_value.ts.split('T');
                      let tiempo_explota2=for_value.ts.split('-');
                      i++;
                      suma=suma +parseFloat(for_value.c);
                    }
                    let j=1;
                    i++;
                    let suma2=0;
                    if (longitud==i-1){
                      this.suma=this.suma+suma;
                      this._longitud_dispositivos++;
                      if (this._longitud_dispositivos===data.length){
                        this.dispositivo.push({
                          id:_id,
                          nombre:_nombre,
                          parametro:_parametro,
                          periodo:_periodo,
                          frecuencia:_frecuencia,
                          valor:this.suma.toFixed(2)
                        });
                        this._longitud_dispositivos=0;
                        this.suma=0;
                        this.pase=0;
                        this.carga_datos=1;
                      }
                    }
                 }
                 
              },
              err =>{
                  
              },
             );
          }
        }
      },
      err =>{
       this.carga_datos=2;
       if(err.url==null){
         let mensaje='No tienes conexion a internet';
       }else{
         let mensaje='Ocurrió un error intente nuevamente';
       }
      },
     );
  }
  dashboard_nuevo(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/tablero/nuevo`]);
  }

}
