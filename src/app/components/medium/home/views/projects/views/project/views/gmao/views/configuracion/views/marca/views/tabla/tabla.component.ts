import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GmaoService } from 'src/app/services';
@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.css',
  '../../../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class TablaComponent implements OnInit {
  private routeDataSubscription:Subscription;
  proyecto:any;
  id_proyecto:any;
  valor_0=0;
  valor_0_1=1;
  valor_1=10;
  i:any=0;
  aqui:any;
  marca:any[]=[];
  carga_datos:any=0;
  var_buscar:any='';
  data_todo:any;
  constructor( private route:ActivatedRoute, private gmao:GmaoService, private router:Router ){}


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
  get_marca(){
    let data={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_marca_id_empresa(data).subscribe(
     gmao=>{
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
         this.i++;
        }
      this.data_todo=this.marca;
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
  marca_nueva(){
     this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/configuracion/marcas/nuevo`]);
  }
  buscar(item){
    console.log(item);
    if (item==''){
      let i=0;
      this.marca=[];
      for(let value of this.data_todo){
        this.marca.push({
          id:i,
          id_marca:value.id_marca,
          description:value.description
        });
        i++;
        this.i++;
      }
    }else{
      const result = this.marca.filter(x=>x.description.toLowerCase().indexOf(item)> -1 );
      if (result.length>0){
        this.marca=result;
      console.log(result);
      }else{ 

      }
    }
  }
  

}
