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
  familia:any={
    id_empresa:'',
    description:''
  }
  alerta_parametro:any=0;
  mensaje:any='';
  isDisabled:any=false;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router ) {}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    console.log(datos);
    this.proyecto=datos.datos.proyecto;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    console.log(this.proyecto);
   });
  }
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/familias`]); 
  }
  guardar(){
    console.log(this.familia);
    if(this.familia.description==''){
      this.alerta_parametro=1;
      this.mensaje='Ingrese una descripción';
    }else{
      this.familia.id_empresa=this.id_proyecto;
      this.isDisabled=true;
      this.gmao.guardar_familia(this.familia).subscribe(
        gmao=>{
         let resultado=gmao;
         if(resultado.status==true){
          Swal.fire({
            icon: 'success',
            title: 'Familia guardada',
            showConfirmButton: false,
            timer: 1500
            });
          this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/familias`]);
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

}
