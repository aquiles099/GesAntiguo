import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-nuevo',
  templateUrl: './nuevo.component.html',
  styleUrls: ['./nuevo.component.css',
  '../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
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
  _parametros:any=0;
  _locations:any=0;
  gateway:any;
  locations:any;
  mensaje:any;
  alerta_parametro:any;
  isDisabled: boolean = false;
  data_disp_nuevo:any={
    datasource_id:'',
    name:'',
    local_id:'',
    description:''
  }
   constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    this.proyecto=datos.datos.proyecto;
   });
    this.get_datasources();
    this.get_locations();
  }
  get_datasources(){ /*concentradores*/
     this.gmao.get_virtual_datasources('').subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          let data=resultado.response;
          this.gateway=data;
          this._parametros=1;
          this.carga_datos=1;
        }else{

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
  get_locations(){
     let mensaje='Cargando';
     this.gmao.get_locations_dexma('').subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          let data=resultado.response;
          this.locations=data;
          this._locations=1;
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
  guardar(){
    if(this.data_disp_nuevo.datasource_id==''){
      this.alerta_parametro='0';
      this.mensaje='Seleccione un concentrador';
    }else if(this.data_disp_nuevo.name=='') {
      this.alerta_parametro='1';
      this.mensaje='Ingrese un nombre';
    }else if(this.data_disp_nuevo.local_id=='') {
      this.alerta_parametro='2';
      this.mensaje='Ingrese una clave';
    }else if(this.data_disp_nuevo.description=='') {
      this.alerta_parametro='3';
      this.mensaje='ingrese una descripción';
    }else{
      this.isDisabled=true;
       this.gmao.save_device(this.data_disp_nuevo).subscribe(
        gmao=>{
          let resultado=gmao;
          if (resultado.status==true){
            let data=resultado.response;
            this.gateway=data;
            this.carga_datos=1;
            Swal.fire({
            icon: 'success',
            title: 'Dispositivo guardado',
            showConfirmButton: false,
            timer: 1500
              // según el plugin que nos mande el backend, entraremos en una u otra plataforma
            });
           this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/dispositivos/`]);

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
  }
  cerrar_alert(){
    this.alerta_parametro=4;
    this.mensaje='';
  }
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/dispositivos/`]);
  }

}
