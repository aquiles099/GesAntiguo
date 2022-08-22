import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.css',
  '../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class TablaComponent implements OnInit {
  private routeDataSubscription:Subscription;
  modulo:any;
  carga_datos:any=0;
  proyecto:any;
  id_proyecto:any;
  valor_0=0;
  valor_0_1=1;
  valor_1=10;
  i:any=0;
  gateway:any;
  aqui:any
  valor_radio:any;
  isDisabled: boolean = false;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      this.proyecto=datos.datos.proyecto;
      console.log(this.proyecto);
      this.get_datasources();
   });
  }
  get_datasources(){
     let mensaje='Cargando';
     this.gmao.get_virtual_datasources('').subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let data=resultado.response;
          this.gateway=data;
          this.carga_datos=1;
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
  nuevo_concentrador(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gestion-energetica/concentradores/nuevo`]);
  }
  ver(item){
    localStorage.setItem('ver_concentrador',JSON.stringify(item));
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}gestion-energetica/concentradores/ver`]);
  }
  el_valor_radio(){
    if(this.valor_radio==undefined){
      Swal.fire({
            icon: 'warning',
            title: 'Seleccione un concentrador',
            showConfirmButton: false,
            timer: 1500
          });
    }else{
      Swal.fire({
            icon: 'warning',
            title: '¿Deseas eliminar el concentrador seleccionado?',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
          }).then((result) =>{
            if (result.value) {
              this.isDisabled=true;
              let datos={
                id:this.valor_radio
              }
               this.gmao.delete_virtual_datasources(datos).subscribe(
                gmao=>{
                  let resultado=gmao;
                  if (resultado.status==true){
                    let data=resultado.response;
                    Swal.fire({
                      icon: 'success',
                      title: 'Borrado',
                      showConfirmButton: false,
                      timer: 1500
                    });
                    this.gateway=null;
                    this.valor_radio=null;
                    this.isDisabled=false;
                    this.get_datasources();
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
            }else if (result.dismiss === Swal.DismissReason.cancel){
            }
          });
    }
  }
   resta_valor(item){
    let _valor_0=this.valor_0;
    let _valor_1=this.valor_1;
    if(_valor_0==0){
    }else{
      this.valor_0_1=this.valor_0_1-1;
      _valor_0=_valor_0-item;
      _valor_1=_valor_1-item;
      this.valor_0=_valor_0;
      this.valor_1=_valor_1;
    }
  }
  suma_valor(item){
    
    let _valor_0=this.valor_0;
    let _valor_1=this.valor_1;
    _valor_0=_valor_0+item;
    _valor_1=_valor_1+item;
    if(this.valor_1<this.i){
      this.valor_0_1=this.valor_0_1+1;
      this.valor_0=_valor_0;
      this.valor_1=_valor_1;
    }
  }

}
