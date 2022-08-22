import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import Swal from 'sweetalert2';
import * as dayjs from 'dayjs';

@Component({
  selector: 'app-nuevo',
  templateUrl: './nuevo.component.html',
  styleUrls: ['./nuevo.component.css']
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
  data_dashboard:any={
    nombre:'',
    parametro:'',
    dispositivo:'',
    frecuencia:'',
    periodo:'',
  }
  frecuencia:any[]=[];
  valor_frecuencia:any=0;
  devices:any;
  selected:number [];
  _dispositivos:any=0;
  parameters:any;
  _parametros:any=0;
  alerta_parametro:any;
  isDisabled:any=false;
  alerta_device:any=0;
  mensaje:any='';
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      this.proyecto=datos.datos.proyecto;
   });
    this.get_devices();
    this.get_parameters();
  }
  cambiar(item){
    let valor=item;
    if(valor=='Hora'){
      this.valor_frecuencia=1;
    }else if(valor=='Diaria'){
      this.valor_frecuencia=2;
    }else if(valor=='Mensual'){
      this.valor_frecuencia=3;
    }
  }
  get_devices(){
     let mensaje='Cargando';
     this.gmao.get_devices('').subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          let data=resultado.response;
          this.devices=data;
          this._dispositivos=1;
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
  get_parameters(){
     let mensaje='Cargando';
     this.gmao.get_parameters('').subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          let data=resultado.response;
          this.parameters=data;
          this._parametros=1;
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
    if(this.selected==undefined || this.selected==null){
      this.alerta_device=1;
      this.mensaje='Seleccione al menos un dispositivo';
    }else if(this.data_dashboard.nombre==''){
      this.alerta_parametro=2;
      this.mensaje='Ingrese un nombre';
    }else if(this.data_dashboard.parametro==''){
       this.alerta_parametro=1;
       this.mensaje='Seleccione un parámetro';
    }else if(this.data_dashboard.frecuencia==''){
      this.alerta_parametro=3;
       this.mensaje='Seleccione una frecuencia';
    }else if(this.data_dashboard.periodo==''){
      this.alerta_parametro=4;
       this.mensaje='Seleccione un periodo';
    }else{
      this.data_dashboard.dispositivo=this.selected.length;
      this.gmao.dashboard_guardar(this.data_dashboard).subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          let id=resultado.data;
          this.guardar_dispositivo(id);
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
  }
  guardar_dispositivo(item){
    let id=item;
    let longi=this.selected.length;
    for (var i = 0; i < longi; ++i) {
      let data={
        id:id,
        dispositivo:this.selected[i]
      }
      this.gmao.guardar_dispositivo(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if (resultado.status==true){
          let id=resultado.data;
        }
        if(i==longi){
          Swal.fire({
            icon: 'success',
            title: 'Guardado',
            showConfirmButton: false,
            timer: 1500
          });
         this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/tablero/`]);
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
  }
  cancelar(){
  this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/tablero/`]);
  }

}
