import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.css']
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
  _dispositivo:any=0;
  devices:any;
  data_alerta:any={
    device:''
  }
  aqui:any;
  constructor(private route:ActivatedRoute, private gmao:GmaoService, private router:Router){}

   ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
      let datos = data;
      this.id_proyecto=datos.datos.proyecto.id_proyecto;
      this.proyecto=datos.datos.proyecto;
      console.log(this.proyecto);
      this.get_devices();
   });
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
  get_devices(){
   this.gmao.get_devices('').subscribe(
    gmao=>{
      let resultado=gmao;
      if (resultado.status==true){
        let data=resultado.response;
        this.devices=data;
        this._dispositivo=1;
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
