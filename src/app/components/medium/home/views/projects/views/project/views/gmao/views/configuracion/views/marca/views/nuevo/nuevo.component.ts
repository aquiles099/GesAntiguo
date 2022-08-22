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
  marca:any={
    description:'',
    id_empresa:''
  }
  mensaje:any='';
  alerta_parametro:any=0;
  isDisabled:any=false;
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
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/marcas`]); 
  }
  guardar(){
    if (this.marca.description==''){
      this.alerta_parametro=1;
      this.mensaje='Ingrese una marca';
    }else{
      this.isDisabled=true;
      this.marca.id_empresa=this.id_proyecto
      this.gmao.guardar_marca(this.marca).subscribe(
        gmao=>{
          let resultado=gmao;
        
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Marca guardada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/marcas`]); 
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
  }

}
