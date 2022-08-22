import { Component, OnInit,ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-ver',
  templateUrl: './ver.component.html',
  styleUrls: ['./ver.component.css',
  '../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class VerComponent implements OnInit {
  private routeDataSubscription:Subscription;
  proyecto:any;
  id_proyecto:any;
  mensaje:any='';
  alerta_parametro:any=0;
  inventario:any;
  data_disp:any={
    id:'',
    datasource_id:'',
    name:'',
    local_id:'',
    status:''
  }
  _parametros:any=0;
  gateway:any;
  carga_datos:any=0;
  isDisabled_accept:boolean=false;
  isDisabled:boolean=false;

  isDisabled_delete:boolean=false;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router ){}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      console.log(datos);
      this.proyecto=datos.datos.proyecto;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
     });
    this.ver_dispositivo();  
  }
  ver_dispositivo(){
    let data=JSON.parse(localStorage.getItem('ver_dispositivo'));
    this.data_disp.id=data.id;
    this.data_disp.datasource_id=data.datasource_id;
    this.data_disp.name=data.name;
    this.data_disp.local_id=data.local_id;
    this.data_disp.status=data.status;
    this.data_disp.description=data.description;
  }
  aceptar_dispositivo(){
    this.data_disp.status='ACCEPTED';
    this.isDisabled_accept=true;
    this.isDisabled=true;
     this.gmao.accept_reject_device(this.data_disp).subscribe(
        gmao=>{
          let resultado=gmao;
            let data=resultado;
            this.gateway=data;
            this.carga_datos=1;
            Swal.fire({
            icon: 'success',
            title: 'Dispositivo aceptado',
            showConfirmButton: false,
            timer: 1500
            });
          this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/dispositivos/`]);  
        },
        err =>{
          this.carga_datos=1;
          this.isDisabled_accept=false;
          this.isDisabled=false;
         Swal.fire({
          icon: 'error',
          title: 'Error al aceptar el dispositivo', // porque debe tener al menos un datapoint
          showConfirmButton: false,
          timer: 1500
          });
         if(err.url==null){
           let mensaje='No tienes conexion a internet';
         }else{
           let mensaje='Ocurrió un error intente nuevamente';
         }
        },
       );
  }
  rechazar_dispositivo(){
    this.data_disp.status='REJECTED';
     this.gmao.accept_reject_device(this.data_disp).subscribe(
        gmao=>{
          let resultado=gmao;
            let data=resultado;
            this.gateway=data;
            this.carga_datos=1;
            Swal.fire({
            icon: 'success',
            title: 'Dispositivo aceptado',
            showConfirmButton: false,
            timer: 1500
              // según el plugin que nos mande el backend, entraremos en una u otra plataforma
            });
        this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/dispositivos/`]);
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
  eliminar_dispositivo(){
    this.isDisabled_delete=true;
    this.isDisabled=true;
    this.gmao.delete_device(this.data_disp).subscribe(
        gmao=>{
          let resultado=gmao;
          
            let data=resultado;
            this.gateway=data;
            this.carga_datos=1;
            Swal.fire({
            icon: 'success',
            title: 'Dispositivo eliminado',
            showConfirmButton: false,
            timer: 1500
              // según el plugin que nos mande el backend, entraremos en una u otra plataforma
            });
       this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/dispositivos/`]);
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
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/dispositivos/`]);
  }

}
