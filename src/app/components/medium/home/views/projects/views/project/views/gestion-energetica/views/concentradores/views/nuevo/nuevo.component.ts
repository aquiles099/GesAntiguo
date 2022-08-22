import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-nuevo',
  templateUrl: './nuevo.component.html',
  styleUrls: ['./nuevo.component.css',
  '../../../../../../../../../../../../../../themes/styles/default-view.scss']
})
export class NuevoComponent implements OnInit {
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
  data_concentrador_nuevo:any={
    name:'',
    key:'',
    timezone:'Europe/Madrid',
    type:'VIRTUAL',
    status:''
  }
  mensaje:any;
  alerta_parametro:any;
  isDisabled: boolean = false;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

  ngOnInit(): void{
   this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    this.proyecto=datos.datos.proyecto;
   });
  }
  guardar(){
    if(this.data_concentrador_nuevo.name==''){
      this.alerta_parametro='1';
      this.mensaje='Ingrese un nombre';
    }else if(this.data_concentrador_nuevo.key==''){
      this.alerta_parametro='2';
      this.mensaje='Ingrese una clave';
    }else if(this.data_concentrador_nuevo.status==''){
      this.alerta_parametro='3';
      this.mensaje='Seleccione un estado';
    }else{
      this.isDisabled=true;
       this.gmao.save_virtual_datasources(this.data_concentrador_nuevo).subscribe(
        gmao=>{
          let resultado=gmao;
          if (resultado.status==true){
            let data=resultado.response;
            Swal.fire({
            icon: 'success',
            title: 'Concentrador guardado',
            showConfirmButton: false,
            timer: 1500
              // según el plugin que nos mande el backend, entraremos en una u otra plataforma
            });
          this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/concentradores/`]);
          }
        }, err =>{
         if(err.status){
           this.isDisabled=false;
           err.error.message;
           let mensaje='No tienes conexion a internet';
            Swal.fire({
            icon: 'error',
            title: err.error.message,
            showConfirmButton: false,
            timer: 2000
              // según el plugin que nos mande el backend, entraremos en una u otra plataforma
            });
         }else{
           let mensaje='Ocurrió un error intente nuevamente';
         }
        },
       );
    }
  }
  cancelar(){
     this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/concentradores/`]);
  }

}
