import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import {EventsService} from 'src/app/services';

@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.css',
   '../../../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
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
  inventario:any[]=[];
  carga_datos:any=0;
  var_buscar:any='';
  inventario_todo:any;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router, public event:EventsService ){}
  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    console.log(datos);
    this.proyecto=datos.datos.proyecto;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    console.log(this.proyecto);
    this.get_equipmentitems();
   });
  }
  get_equipmentitems(){
     let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_inventario_id_empresa(data).subscribe(
    gmao=>{
      let resultado=gmao;
      if(resultado.status==true){
        this.carga_datos=1;
        let i=0;
        for(let value of resultado.data){
          this.inventario.push({
            id:i,
            id_inventario:value.id,
            codigo:value.codigo,
            tipo_inventario:value.tipo_inventario.description,
            descripcion_inventario:value.description,
            fecha_compra_inventario:value.fecha_compra,
            nombre_marca:value.marca.description,
            almacen:value.taller.nombre,
            nombre_modelo:value.modelo.description,
            /*nombre_almacen:value.taller.description,*/
            stock:value.stock,
            cantidad_inventario:value.cantidad,
          });
          i++;
          this.i++;
        }
        this.inventario_todo=this.inventario;
        console.log(this.inventario_todo);
        
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
  crear_nuevo_inventario(){
     this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/inventarios/nuevo`]);
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
  inventario_agregar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/inventarios/nuevo`]);
  }
  inventario_ver(item){
   localStorage.setItem('ver_inventario',JSON.stringify(item));
   this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/inventarios/ver`]);
  }
  buscar(item){
    console.log(item);
      if(item==''){
        let i=0;
        this.inventario=[];
        for(let value of this.inventario_todo){
          this.inventario.push({
            id:i,
            id_inventario:value.id_inventario,
            codigo:value.codigo,
            tipo_inventario:value.tipo_inventario,
            descripcion_inventario:value.descripcion_inventario,
            fecha_compra_inventario:value.fecha_compra_inventario,
            nombre_marca:value.nombre_marca,
            almacen:value.almacen,
            nombre_modelo:value.nombre_modelo,
            stock:value.stock,
            cantidad_inventario:value.cantidad_inventario,
          });
          i++;
          this.i++;
        }
      }else{
        const result = this.inventario.filter(
             x=>x.almacen.toLowerCase().indexOf(item)> -1 
          || x.codigo.toLowerCase().indexOf(item)> -1 
          || x.tipo_inventario.toLowerCase().indexOf(item)> -1
          || x.descripcion_inventario.toLowerCase().indexOf(item)> -1
          || x.nombre_marca.toLowerCase().indexOf(item)> -1
          || x.nombre_modelo.toLowerCase().indexOf(item)> -1
          || x.nombre_modelo.toLowerCase().indexOf(item)> -1
          );
        if (result.length>0){
          this.inventario=result;
        console.log(result);
        }else{ 

        }
      }
  }
}
