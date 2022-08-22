import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-nuevo',
  templateUrl: './nuevo.component.html',
  styleUrls: ['./nuevo.component.css',
   '../../../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class NuevoComponent implements OnInit {
  private routeDataSubscription:Subscription;
  proyecto:any;
  id_proyecto:any;
  mensaje:any='';
  alerta_parametro:any='';
  isDisabled:any=false;
  _parametros:any=0;
  _parametros_2:any=0;
  _parametros_3:any=0;
  marca:any[]=[];
  carga_datos:any=0;
  modelo:any[]=[];
  almacen:any[]=[];
  stock:any=false;
  proyectos:any[];
  _proyecto:any;
  tipo_inventario:any;
  inventario:any={
    codigo:'',
    marca_id:'',
    modelo_id:'',
    id_taller:'',
    id_empresa:'',
    id_tipo_inventario:'',
    description:'',
    stock:'',
    cantidad:'',
    precio_compra:'',
    descuento:'',
    precio_venta_publico:''
  }
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router ){}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      console.log(datos);
      this.proyecto=datos.datos.proyecto;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      console.log(this.proyecto);
   });
    this.get_marca();
    this.get_almacen();
    this.get_tipo_inventario();
  }
  get_tipo_inventario(){
    let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_tipo_inventario_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
       if(resultado.status==true){
         this.carga_datos=1;
         this.tipo_inventario=resultado.data;
        console.log(this.tipo_inventario);
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
  get_marca(){
    let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_marca_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
     
       if(resultado.status==true){
         let i=0;
         /*this.get_familia()*/;
        for(let value of resultado.data){
          this.marca.push({
            id:i,
            id_marca:value.id,
            descripcion:value.description                     
          });
         i++;
        }
      }else{
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
  get_modelo_id_marca(item){
    let data={
      id_marca:item
    }
    this.modelo=[];
    this.gmao.get_modelo_id_marca(data).subscribe(
     gmao=>{
       let resultado=gmao;
       if(resultado.status==true){
         let i=0;
         /*this.get_familia()*/;
        for(let value of resultado.data){
          this.modelo.push({
            id:i,
            id_modelo:value.id,
            descripcion:value.description                     
          });
         i++;
        }
      }else{
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
  get_almacen(){
     let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_talleres_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
      
       if(resultado.status==true){
         let i=0;
         /*this.get_familia()*/;
        for(let value of resultado.data){
          this.almacen.push({
            id:i,
            id_almacen:value.id,
            descripcion:value.description                     
          });
         i++;
        }
      }else{
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
  cambia_stock(item){
    if (item==1){
      this.stock=true;
    }else{
      this.stock=false;
    }
  }

  guardar(){
    if (this.inventario.codigo=='') {
      this.alerta_parametro=1;
      this.mensaje='Ingrese un código';
    }else if(this.inventario.id_tipo_inventario==''){
      this.alerta_parametro=2;
      this.mensaje='Seleccione un tipo de inventario';
    }else if(this.inventario.marca_id==''){
      this.alerta_parametro=3;
      this.mensaje='Seleccione una marca';
    }else if(this.inventario.modelo_id==''){
      this.alerta_parametro=4;
      this.mensaje='Seleccione un modelo';
    }else if(this.inventario.id_taller==''){
      this.alerta_parametro=5;
      this.mensaje='Seleccione un almacén';
    }else if(this.inventario.description==''){
      this.alerta_parametro=6;
      this.mensaje='Ingrese una descripción';
    }else if(this.inventario.precio_compra==''){
      this.alerta_parametro=6;
      this.mensaje='Ingrese un precio de compra';
    }else if(this.inventario.descuento==''){
      this.alerta_parametro=7;
      this.mensaje='Ingrese descuento si no tiene, coloque un 0';
    }else if(this.inventario.precio_venta_publico==''){
      this.alerta_parametro=8;
      this.mensaje='Ingrese un precio de venta al público';
    }else{

      if(this.stock==true){
        this.inventario.stock='Si';
        if(this.inventario.cantidad==''){
          this.alerta_parametro=5;
          this.mensaje='Ingrese una cantidad';
        }else{
          this.guardar_inventario();
        }
      }else{
        this.inventario.stock='No';
        this.guardar_inventario();
      }
    }
  }
  guardar_inventario(){
    this.isDisabled=true;
    this.inventario.id_empresa=this.id_proyecto;
    this.gmao.guardar_inventario(this.inventario).subscribe(
      gmao=>{
        let resultado=gmao;
       
        if(resultado.status==true){
          Swal.fire({
            icon: 'success',
            title: 'Inventario guardado',
            showConfirmButton: false,
            timer: 1500
              // según el plugin que nos mande el backend, entraremos en una u otra plataforma
            });
          this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/inventarios`]);
       }else{
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
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/inventarios`]);
 }

}
