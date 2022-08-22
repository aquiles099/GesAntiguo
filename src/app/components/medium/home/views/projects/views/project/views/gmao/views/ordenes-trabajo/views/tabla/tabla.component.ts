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
  _solicitudes:any[]=[];
  valor_0=0;
  valor_0_1=1;
  valor_1=10;
  i:any=0;
  aqui:any;
  id_proyecto:any;
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
    this.solicitudes();
   });
  }
  solicitudes(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
    this.gmao.get_ordenes_id_empresa(data).subscribe(
     gmao=>{
      let resultado1=gmao;
      let json=resultado1;
      if(resultado1.status==true){
        this.carga_datos=1;
        let i=0;
        let valor_explota;
        let iniciales;
        for(let value of resultado1.data){
          this.suma_total++;
          if(value.nombre_usuario!=null) {
            valor_explota=value.nombre_usuario.split(' ');
            iniciales=valor_explota[0].substring(0, 1).toUpperCase()+valor_explota[1].substring(0, 1).toUpperCase();
          }else{
            iniciales='Hector Davila';
            valor_explota='Hector Davila'.split(' ');
            iniciales=valor_explota[0].substring(0, 1).toUpperCase()+valor_explota[1].substring(0, 1).toUpperCase();
          }
          let valor_estado='';
          if (value.estado_id==7){
            valor_estado='No resuelto';
          }else{
            valor_estado=value.estado.description;
          }
          this._solicitudes.push({
            id:i,
            id_orden:value.id,   
            estado_id:value.estado_id,   
            localizacion:value.localizacion,   
            fecha:value.fecha, 
            iniciales:iniciales, 
            nombre_usuario:value.nombre_usuario, 
            lat_long:value.lat_long, 
            tipo_id:value.tipo_id, 
            bbox:value.bbox, 
            elemento_id:value.elemento_id, 
            comentarios:value.comentarios,              
            descripcion:value.descripcion,   
            direccion_2:value.direccion_2,   
            descripcion_tipo:value.tipo_id,
            descripcion_modulo:value.modulo.description,
            descripcion_estado:valor_estado,      
            descripcion_elemento:value.elemento_id,      
            descripcion_priodidad:value.prioridad.description                     
          });
         i++;
         this.i++;
        }
        this.data_todo=this._solicitudes;
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
  nueva_solicitud(){
    localStorage.removeItem('viene_solicitud');
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/ordenes-de-trabajo/nuevo`]);
  }
  ver(item){
    localStorage.setItem('ordenes_trabajo_ver',JSON.stringify(item));
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/ordenes-de-trabajo/ver`]);
  }
  buscar(item){
    console.log(item);
    if (item==''){
      let i=0;
      this._solicitudes=[];
      for(let value of this.data_todo){
        this._solicitudes.push({
          id:i,
          id_orden:value.id_orden,   
          estado_id:value.estado_id,   
          localizacion:value.localizacion,   
          fecha:value.fecha, 
          iniciales:value.iniciales, 
          nombre_usuario:value.nombre_usuario, 
          lat_long:value.lat_long, 
          tipo_id:value.tipo_id, 
          bbox:value.bbox, 
          elemento_id:value.elemento_id, 
          comentarios:value.comentarios,              
          descripcion:value.descripcion,   
          direccion_2:value.direccion_2,   
          descripcion_tipo:value.descripcion_tipo,
          descripcion_modulo:value.descripcion_modulo,
          descripcion_estado:value.descripcion_estado,      
          descripcion_elemento:value.descripcion_elemento,      
          descripcion_priodidad:value.descripcion_priodidad              
        });
        i++;
        this.i++;
      }
    }else{
      const result = this._solicitudes.filter(x=>x.descripcion.toLowerCase().indexOf(item)> -1
        || x.descripcion_estado.toLowerCase().indexOf(item)> -1
        || x.tipo_id.toLowerCase().indexOf(item)> -1
        || x.elemento_id.toLowerCase().indexOf(item)> -1
        || x.iniciales.toLowerCase().indexOf(item)> -1
        || x.descripcion_priodidad.toLowerCase().indexOf(item)> -1
        || x.localizacion.toLowerCase().indexOf(item)> -1
        || x.fecha.toLowerCase().indexOf(item)> -1
       );
      if (result.length>0){
        this._solicitudes=result;
        console.log(result);
      }else{ 

      }
    }
  }

}
