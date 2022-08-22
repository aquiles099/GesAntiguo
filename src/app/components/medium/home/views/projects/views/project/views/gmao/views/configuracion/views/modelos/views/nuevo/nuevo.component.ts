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
  modelo:any={
    marca_id:'',
    description:'',
    id_empresa:''
  }
  mensaje:any='';
  alerta_parametro:any=0;
  isDisabled:any=false;
  carga_datos:any=0;
  marca:any[]=[];
  _parametros:any=0;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router ) {}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    console.log(datos);
    this.proyecto=datos.datos.proyecto;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    console.log(this.proyecto);
    this.get_marca();
   });
  }
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/modelos`]); 
  }
  get_marca(){
    let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_marca_id_empresa(data).subscribe(
     gmao=>{
       this._parametros=1;
       let resultado=gmao;
      
       if(resultado.status==true){
         this.carga_datos=1;
         let i=0;
        for(let value of resultado.data){
          this.marca.push({
            id:i,
            id_marca:value.id,   
            description:value.description,                     
          });
         i++;
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
    if (this.modelo.marca_id=='') {
      this.alerta_parametro=1;
      this.mensaje='Seleccione una marca';
    }else if(this.modelo.description==''){
      this.alerta_parametro=2;
      this.mensaje='Ingrese un nombre';
    }else{
      this.isDisabled=true;
      this.modelo.id_empresa=this.id_proyecto;
      this.gmao.guardar_modelo(this.modelo).subscribe(
        gmao=>{
          let resultado=gmao;
        
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Modelo guardado',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
           this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/modelos`]); 
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
