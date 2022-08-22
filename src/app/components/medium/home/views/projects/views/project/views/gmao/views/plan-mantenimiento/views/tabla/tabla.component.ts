import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.css',
  '../../../../../../../../../../../../../../themes/styles/default-view.scss']
})
export class TablaComponent implements OnInit {
  private routeDataSubscription:Subscription;
  id_proyecto:any;
  proyecto:any;
  mantenimiento_preventivo:any[]=[];
   valor_0=0;
   valor_0_1=1;
   valor_1=10;
   i:any=0;
   aqui:any;
   carga_datos:any;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router) { }

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      this.proyecto=datos.datos.proyecto;
      console.log(this.proyecto);
   });
    let dato=JSON.parse(localStorage.getItem('plan_mantenimiento_id_mantenimiento_preventivo'));;
     let dato2={
       id_mantenimiento_preventivo:dato['mantenimiento_preventivo_id']
     }
     this.get_plan_mantenimiento(dato2);   
  }
  get_plan_mantenimiento(item){
    this.gmao.get_plan_mantenimiento_id_mantenimiento_preventivo(item).subscribe(
     gmao=>{
      let resultado1=gmao;
      let i=0;
      let valor_explota;
      let iniciales;
      if(resultado1.status==true){
       this.carga_datos=1;
       
        for(let value of resultado1.data){
         let valor_explota;
         let iniciales;
          if(value.nombre_usuario!=null) {
            valor_explota=value.nombre_usuario.split(' ');
            iniciales=valor_explota[0].substring(0, 1).toUpperCase()+valor_explota[1].substring(0, 1).toUpperCase();
          }else{
            iniciales='Hector Davila';
            valor_explota='Hector Davila'.split(' ');
            iniciales=valor_explota[0].substring(0, 1).toUpperCase()+valor_explota[1].substring(0, 1).toUpperCase();
          }
        this.mantenimiento_preventivo.push({
          id:i,
          descripcion_modulo:value.descripcion_modulo,
          elemento_descripcion:value.elemento_descripcion,
          empresa_nombre:value.empresa_nombre,
          iniciales:iniciales,
          estado_descripcion:value.estado_descripcion,
          plan_mantenimiento_comentarios:value.plan_mantenimiento_comentarios,
          plan_mantenimiento_descripcion:value.plan_mantenimiento_descripcion,
          plan_mantenimiento_ejecutado:value.plan_mantenimiento_ejecutado,
          plan_mantenimiento_elemento_id:value.plan_mantenimiento_elemento_id,
          plan_mantenimiento_estado_id:value.plan_mantenimiento_estado_id,
          plan_mantenimiento_fecha:value.plan_mantenimiento_fecha,
          plan_mantenimiento_id:value.plan_mantenimiento_id,
          plan_mantenimiento_id_empresa:value.plan_mantenimiento_id_empresa,
          plan_mantenimiento_id_usuario:value.plan_mantenimiento_id_usuario,
          plan_mantenimiento_modulo_id:value.plan_mantenimiento_modulo_id,
          plan_mantenimiento_prioridad_id:value.plan_mantenimiento_prioridad_id,
          plan_mantenimiento_tipo_id:value.plan_mantenimiento_tipo_id,
          prioridad_descripcion:value.prioridad_descripcion,
          tipo_descripcion:value.tipo_descripcion,
          usuario_nombre:value.usuario_nombre
        });
        i++;
        this.i++;
        }
      }else{
        this.carga_datos=2;
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
  resta_valor(item){
    let _valor_0=this.valor_0;
    let _valor_1=this.valor_1;
    if(_valor_0==0){
    }else{
      this.valor_0_1=this.valor_0_1-1;
      _valor_0=_valor_0-item;
      _valor_1=_valor_1-item;
      this.valor_0=_valor_0;
      this.valor_1=_valor_1;
    }
  }
  suma_valor(item){
    let _valor_0=this.valor_0;
    let _valor_1=this.valor_1;
    _valor_0=_valor_0+item;
    _valor_1=_valor_1+item;
    if(this.valor_1<this.i){
      this.valor_0_1=this.valor_0_1+1;
      this.valor_0=_valor_0;
      this.valor_1=_valor_1;
    }
  }
  ver(item){
    localStorage.setItem('plan_mantenimiento_ver',JSON.stringify(item));
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/plan-mantenimiento/ver`]);
    
  }

}
