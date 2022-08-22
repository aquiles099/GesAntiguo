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
  _parametros:any=0;
  _parametros_2:any=0;
  _parametros_3:any=0;
  taller:any={
    id_empresa:'',
    nombre:'',
    description:''
  }
  empresa:any[]=[];
  carga_datos:any=0;
  alerta_parametro:any=0;
  mensaje:any='';
  isDisabled:any=false;
  familia:any[]=[];
  sub_familia:any[]=[];
  i=0;
  proyectos:any;
  _proyecto:any;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router ) { }

  ngOnInit( ): void {
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    console.log(datos);
    
    this.proyecto=datos.datos.proyecto;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    console.log(this.proyecto);
    this.get_familia();
   });
  }
  cancelar(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/almacenes`]); 
  }
   get_familia(){
    let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_familia_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
       
       if(resultado.status==true){
         this.carga_datos=1;
         this._parametros=1;
         this._parametros_2=1;
         this._parametros_3=2;
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
  get_sub_familia_id_familia(item){
    let data={
      id_familia:item
    }
    this.gmao.get_sub_familia_id_familia(data).subscribe(
     gmao=>{
       let resultado=gmao;
       
       if(resultado.status==true){
         this.carga_datos=1;
         this._parametros_3=1;
         let i=0;
         this.sub_familia=[];
        for(let value of resultado.data){
          this.sub_familia.push({
            id:i,
            id_sub_familia:value.id,
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
     if(this.taller.nombre==''){
      this.alerta_parametro=4;
      this.mensaje='Ingrese un nombre';
    }else if(this.taller.description==''){
      this.alerta_parametro=5;
      this.mensaje='Ingrese una descripción';
    }else{
     let mensaje='Cargando';
     this.isDisabled=true;
     this.proyectos=JSON.parse(localStorage.getItem('project'));
     this._proyecto=this.proyectos;
     this.taller.id_empresa=this._proyecto.id_proyecto;
     this.gmao.guardar_taller(this.taller).subscribe(
      gmao=>{
        let resultado=gmao;
        
        if(resultado.status==true){
          Swal.fire({
            icon: 'success',
            title: 'Almacén guardado',
            showConfirmButton: false,
            timer: 1500
              // según el plugin que nos mande el backend, entraremos en una u otra plataforma
            });
         this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/almacenes`]);
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
