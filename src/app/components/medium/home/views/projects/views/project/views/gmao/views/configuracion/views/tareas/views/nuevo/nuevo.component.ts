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
  alerta_parametro:any=0;
  isDisabled:any=false;
   tarea:any={
    id_empresa:'',
    descripcion:'',
  }
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router ) {}
  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    console.log(datos);
    this.proyecto=datos.datos.proyecto;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    console.log(this.proyecto);
   });
  }
  guardar(){
    if (this.tarea.descripcion=='') {
      this.alerta_parametro=1;
      this.mensaje='Ingrese una descripción de tarea';
    }else{
      this.isDisabled=true;
      this.tarea.id_empresa=this.id_proyecto;
       this.gmao.guardar_tareas_id_empresa(this.tarea).subscribe(
        variable_instanciada=>{
          let resultado=variable_instanciada;
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Tarea guardada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/tareas`]);
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
    console.log('guardar');
  }
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/tareas`]);
 }

}
