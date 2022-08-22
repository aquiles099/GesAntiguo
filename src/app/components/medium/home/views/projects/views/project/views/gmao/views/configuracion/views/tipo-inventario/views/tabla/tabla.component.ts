import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import {EventsService} from 'src/app/services';

@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.css',
  '../../../../../../../../../../../../../../../../themes/styles/default-view.scss']
})
export class TablaComponent implements OnInit {

  
  private routeDataSubscription:Subscription;
  proyecto:any;
  id_proyecto:any;
  valor_0=0;
  valor_0_1=1;
  valor_1=10;
  i:any=0;
  aqui:any;
  data:any[]=[];
  carga_datos:any=0;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router, public event:EventsService ){}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    console.log(datos);
    this.proyecto=datos.datos.proyecto;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    console.log(this.proyecto);
    this.get_tipo_incidencia();
   });
  }
  get_tipo_incidencia(){
    let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_tipo_inventario_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
       if(resultado.status==true){
         this.carga_datos=1;
         let i=0;
        for(let value of resultado.data){
          this.data.push({
            id:i,
            id_tarea:value.id,
            id_empresa:value.id_empresa,
            descripcion:value.description
          });
         i++;
         this.i++;
        }
        console.log(this.data);
      }else{
        this.carga_datos=2;
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
  nuevo(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/tipo-inventario/nuevo`]);
  }
  ver(item){
   localStorage.setItem('tipo_incidencias_ver',JSON.stringify(item));
   this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/tipo-inventario/ver`]);
  }
}
