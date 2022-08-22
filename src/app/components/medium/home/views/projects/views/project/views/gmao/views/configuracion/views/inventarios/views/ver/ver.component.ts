import { Component, OnInit,ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-ver',
  templateUrl: './ver.component.html',
  styleUrls: ['./ver.component.css',
  '../../../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class VerComponent implements OnInit {
  @ViewChild('closebutton') closebutton;
  @ViewChild('closebutton2') closebutton2;
  private routeDataSubscription:Subscription;
  proyecto:any;
  id_proyecto:any;
  mensaje:any='';
  alerta_parametro:any=0;
  inventario:any;
  isDisabled:any='';
  _det_inventario:any;
  i:any=0;
  data_det_inventario:any={
    tipo:'',
    num_orden_solicitud:'',
    cantidad:'',
    obervaciones:''
  }
  cantidad:any=0;
  carga_datos:any=0;
  data_orden:any;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router ){}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      console.log(datos);
      this.proyecto=datos.datos.proyecto;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
     });
    this.inventario=JSON.parse(localStorage.getItem('ver_inventario'));
    this.det_inventario();
    this.get_ordenes_id_empresa();
  }
  get_ordenes_id_empresa(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
     this.gmao.get_ordenes_id_empresa(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let data=resultado.data;
          this.data_orden=data;
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
  det_inventario(){
   let data={
     inventario_id:this.inventario.id_inventario
   }
   this.gmao.get_det_inventario_id_inventario(data).subscribe(
    gmao=>{
      let resultado=gmao;
      if(resultado.status==true){
        let i=0;
        this._det_inventario=[];
        for(let value of resultado.data){
          this._det_inventario.push({
            id:i,
            id_det_inventario:value.id,
            tipo:value.tipo,
            num_orden_solicitud:value.num_orden_solicitud,
            descripcion:value.descripcion,
            cantidad:value.cantidad,
            fecha:value.fecha
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
 volver(){
     this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/inventarios`]);
 }
 guardar_det_inventario(item){
   let tipo=item;
   this.carga_datos=0;
   if (tipo==1) {
     this.data_det_inventario.tipo='Entrada';
     this.isDisabled='entrada';
     let cantidad=parseFloat(this.inventario.cantidad_inventario) +parseFloat(this.data_det_inventario.cantidad);
     this.cantidad=cantidad;
     this.guardar_entrada_salida();
   }else if(tipo==2){
     this.data_det_inventario.tipo='Salida';
     this.isDisabled='salida';
     let cantidad=parseFloat(this.inventario.cantidad_inventario) - parseFloat(this.data_det_inventario.cantidad);
     this.cantidad=cantidad;
     if (cantidad<0){
       Swal.fire({
        icon: 'error',
        title: 'Inventario no puede estar en negativo',
        showConfirmButton: false,
        timer: 1500
          // según el plugin que nos mande el backend, entraremos en una u otra plataforma
        });
     this.isDisabled='';
     }else{
       this.guardar_entrada_salida();
     }
   }
 }
   guardar_entrada_salida(){
     var tzoffset = (new Date()).getTimezoneOffset() * 60000;
     let fecha_actual=(new Date(Date.now() - tzoffset)).toISOString().slice(0, -1) + 'Z';
     let fecha=fecha_actual.split('T');
     let data={
       tipo:this.data_det_inventario.tipo,
       inventario_id:this.inventario.id_inventario,
       cantidad:this.data_det_inventario.cantidad,
       num_orden_solicitud:this.data_det_inventario.num_orden_solicitud,
       descripcion:this.data_det_inventario.obervaciones,
       fecha:fecha['0']
     }
     this.gmao.guardar_entrada_salida(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          this.actualizar_inventario();
        }else{
        }
      },
      err =>{
        if(err.url==null){
          let mensaje='No tienes conexion a internet';
        }else{
          let mensaje='Ocurrió un error intente nuevamente';
        }
      }
     );
   }
   actualizar_inventario(){
     let data={
       id:this.inventario.id_inventario,
       cantidad:this.cantidad
     }
     console.log(data);
     this.gmao.actualizar_inventario(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          Swal.fire({
            icon: 'success',
            title: 'Guardado',
            showConfirmButton: false,
            timer: 1500
              // según el plugin que nos mande el backend, entraremos en una u otra plataforma
            });
          this.inventario.cantidad_inventario=this.cantidad;
          this.closebutton2.nativeElement.click();
          this.closebutton.nativeElement.click();
          this.isDisabled='';
          this.det_inventario();
        }else{
        }
      },
      err =>{
        if(err.url==null){
          let mensaje='No tienes conexion a internet';
        }else{
          let mensaje='Ocurrió un error intente nuevamente';
        }
      }
     );

   }

}
