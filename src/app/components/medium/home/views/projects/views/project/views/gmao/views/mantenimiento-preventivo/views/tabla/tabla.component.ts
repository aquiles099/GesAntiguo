import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
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
  mantenimiento_preventivo:any[]=[];
  valor_0=0;
  valor_0_1=1;
  valor_1=10;
  i:any=0;
  aqui:any;
  suma_total:any=0;
  suma_diez_diez:any=10;
  ultimo_valor_diez_dies=0;
  data_todo:any;
  var_buscar:any;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      this.proyecto=datos.datos.proyecto;
      console.log(this.proyecto);
   });
    this.get_preventive_manteinance();
  }
  ver(item){
    localStorage.setItem('mantenimiento_preventivo_ver',JSON.stringify(item));
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/mantenimiento-preventivo/ver`]);
  }
  mantenimiento_preventivo_nuevo(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/mantenimiento-preventivo/nuevo`]);
  }
  get_preventive_manteinance(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
    this.gmao.get_mantenimiento_preventivo_id_empresa(data).subscribe(
     gmao=>{
      let resultado1=gmao;
      let i=0;
      let valor_explota;
      let iniciales;
      if(resultado1.status==true){
       this.carga_datos=1;
        for(let value of resultado1.data){
         this.suma_total++;
         let valor_explota;
         let iniciales;
          if(value.nombre_usuario!=null){
            valor_explota=value.nombre_usuario.split(' ');
            iniciales=valor_explota[0].substring(0, 1).toUpperCase()+valor_explota[1].substring(0, 1).toUpperCase();
          }else{
            iniciales='Hector Davila';
            valor_explota='Hector Davila'.split(' ');
            iniciales=valor_explota[0].substring(0, 1).toUpperCase()+valor_explota[1].substring(0, 1).toUpperCase();
          }
        this.mantenimiento_preventivo.push({
          id:i,
          mantenimiento_preventivo_id:value.id,
          usuario_id:value.usuario_id,
          id_ordenes_trabajo:value.id_ordenes_trabajo,
          id_tipo:value.id_tipo,
          id_modulo:value.modulo_id,
          id_estado:value.estado_id,
          id_elemento:value.elemento_id,
          id_prioridad:value.prioridad_id,
          mantenimiento_preventivo_localizacion:value.localizacion,
          direccion_2:value.direccion_2,
          mantenimiento_preventivo_lat_long:value.lat_long,
          mantenimiento_preventivo_descripcion:value.descripcion,
          mantenimiento_preventivo_comentarios:value.comentarios,
          mant_preventivo_fecha:value.fecha,
          mantenimiento_preventivo_fecha_fin_mantenimiento:value.fecha_fin_mantenimiento,
          iniciales:iniciales,
          bbox:value.bbox,
          nombre_usuario:value.nombre_usuario,
          descripcion_tipo:value.id_tipo,
          descripcion_modulo:value.modulo.description,
          descripcion_estado:value.estado.description,
          descripcion_orden_trabajo:value.descripcion_orden_trabajo,
          descripcion_priodidad:value.prioridad.description
        });
        i++;
        this.i++;
        }
        this.data_todo=this.mantenimiento_preventivo;
        if (this.suma_total<this.suma_diez_diez){
          this.suma_diez_diez=this.suma_total;
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
      this.suma_diez_diez=this.suma_diez_diez-10;
      if (this.ultimo_valor_diez_dies > this.i){
        this.suma_diez_diez=this.ultimo_valor_diez_dies-10;
        this.ultimo_valor_diez_dies=0;
      }
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
      this.suma_diez_diez=this.suma_diez_diez+10;
      if (this.suma_diez_diez > this.i){
        this.ultimo_valor_diez_dies=this.suma_diez_diez;
        this.suma_diez_diez=this.i;
      }
    }
  }
  buscar(item){
    console.log(item);
    if (item==''){
      let i=0;
      this.mantenimiento_preventivo=[];
      for(let value of this.data_todo){
        this.mantenimiento_preventivo.push({
          id:i,
          mantenimiento_preventivo_id:value.mantenimiento_preventivo_id,
          usuario_id:value.usuario_id,
          id_ordenes_trabajo:value.id_ordenes_trabajo,
          id_tipo:value.id_tipo,
          id_modulo:value.id_modulo,
          id_estado:value.id_estado,
          id_elemento:value.id_elemento,
          id_prioridad:value.id_prioridad,
          mantenimiento_preventivo_localizacion:value.mantenimiento_preventivo_localizacion,
          direccion_2:value.direccion_2,
          mantenimiento_preventivo_lat_long:value.mantenimiento_preventivo_lat_long,
          mantenimiento_preventivo_descripcion:value.mantenimiento_preventivo_descripcion,
          mantenimiento_preventivo_comentarios:value.mantenimiento_preventivo_comentarios,
          mant_preventivo_fecha:value.mant_preventivo_fecha,
          mantenimiento_preventivo_fecha_fin_mantenimiento:value.mantenimiento_preventivo_fecha_fin_mantenimiento,
          iniciales:value.iniciales,
          bbox:value.bbox,
          nombre_usuario:value.nombre_usuario,
          descripcion_tipo:value.descripcion_tipo,
          descripcion_modulo:value.descripcion_modulo,
          descripcion_estado:value.descripcion_estado,
          descripcion_orden_trabajo:value.descripcion_orden_trabajo,
          descripcion_priodidad:value.descripcion_priodidad
        });
        i++;
        this.i++;
      }
    }else{
      const result = this.mantenimiento_preventivo.filter(x=>x.descripcion_estado.toLowerCase().indexOf(item)> -1
        || x.id_elemento.toLowerCase().indexOf(item)> -1
        || x.mantenimiento_preventivo_localizacion.toLowerCase().indexOf(item)> -1
        || x.mantenimiento_preventivo_descripcion.toLowerCase().indexOf(item)> -1
        || x.iniciales.toLowerCase().indexOf(item)> -1
        || x.descripcion_priodidad.toLowerCase().indexOf(item)> -1
        || x.mantenimiento_preventivo_fecha_fin_mantenimiento.toLowerCase().indexOf(item)> -1
       );
      if (result.length>0){
        this.mantenimiento_preventivo=result;
      console.log(result);
      }else{ 

      }
    }
  }

}
