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
  _parametros:any=0;
  proyecto:any;
  id_proyecto:any;
  sub_familia:any={
    familia_id:'',
    description:'',
    id_empresa:''
  }
  familia:any[]=[];
  carga_datos:any=0;
  alerta_parametro:any=0;
  mensaje:any='';
  isDisabled:any=false;
  i:any=0;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router ){}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    console.log(datos);
    this.proyecto=datos.datos.proyecto;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    console.log(this.proyecto);
    this.get_familia_id_empresa();
   });
  }
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/sub-familias`]); 
  }
  get_familia_id_empresa(){
    let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_familia_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
      
       if(resultado.status==true){
         this.carga_datos=1;
         this._parametros=1;
         let i=0;
        for(let value of resultado.data){
          this.familia.push({
            id:i,
            id_familia:value.id,   
            description:value.description
          });
         i++;
         this.i++;
        }
       
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
  guardar(){
    if(this.sub_familia.familia_id==''){
      this.alerta_parametro=1;
      this.mensaje='Seleccione una Familia';
    }else if(this.sub_familia.description==''){
      this.alerta_parametro=1;
      this.mensaje='Ingrese una descripción';
    }else{
       this.isDisabled=true;
       this.sub_familia.id_empresa=this.id_proyecto;
       this.gmao.guardar_sub_familia(this.sub_familia).subscribe(
        gmao=>{
          let resultado=gmao;
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Sub familia guardada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/sub-familias`]); 
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
