import { ChangeDetectorRef,Component,NgZone, OnInit,ViewChild,ElementRef,HostListener ,ComponentRef,AfterViewChecked,AfterViewInit,OnDestroy,Input,Output,EventEmitter } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { Location } from '@angular/common';
import { HttpClient, HttpParams, HttpRequest, HttpEvent,HttpHeaders } from '@angular/common/http';
import { Http,Headers,RequestOptions} from '@angular/http';
import {latLng, MapOptions, tileLayer} from 'leaflet';
import Swal from 'sweetalert2';
import {EventsService} from 'src/app/services';
import { GmaoService } from 'src/app/services';
import { FisotecService } from 'src/app/services';
import { GooglePlaceDirective } from "node_modules/ngx-google-places-autocomplete/ngx-google-places-autocomplete.directive";
import { ToastrService } from 'ngx-toastr';
import { Subscription, Observable, Observer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { isJsonString } from 'src/app/shared/helpers';
import 'rxjs/add/observable/of';
import { ProjectService } from 'src/app/services/unic/project.service';
import { ProjectsService } from 'src/app/services/unic/projects.service';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { MapaLeaftComponent } from '../mapa-leaft/mapa-leaft.component';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-ver',
  templateUrl: './ver.component.html',
  styleUrls: ['./ver.component.css']
})
export class VerComponent implements OnInit {

  @ViewChild('buscadorDeDirecciones')
  public buscadorDeDirecciones:ElementRef<HTMLElement>;
  @ViewChild(MapaLeaftComponent) mapaleaft: MapaLeaftComponent;
  public readonly faAngleLeft = faAngleLeft;
  private routeDataSubscription:Subscription;
  public datos:any;
  public direccionesSugerida$:Observable<string[]>=undefined;
  proyecto:any;
  mapOptions: MapOptions;
  proyectos:any;
  _proyecto:any;
  center = latLng(40.395347, -3.694041);
  
  auto_complete_optios={
    componentRestrictions: { 
      country: ['ES']
    }
  }
  data_solicitud:any;
  direccion:any;
  _tipo:any=0;
  equipment:any;
  fecha:any;
  alert:any=0;
  mensaje:any='';
  isDisabled:any=true;
  carga_datos:any=0;
  var_tipo:any[]=[];
  var_prioridad:any[]=[];
  var_elemento:any[]=[];
  i:any;
  placesService:any;
  isDisabled_rechazar:any=false;
  isDisabled_aceptar:any=false;
  resuelta_no_resuelta:any=0;
  culminado_no_culminado:any;
  comentarios_resuelto_no_resuelto:any;
  imagen:any[]=[];
  closeResult: string;
  imagen_seleccionada:any;
  _det_orden_trabajo:any;
  isDisabled_espera_resuelta:any=0;
  isDisabled_2:any=false;
  valor_0=0;
  valor_0_1=1;
  valor_1=5;
  constructor( public _location:Location, public router:Router, private event:EventsService, public gmao:GmaoService, public zone:NgZone,public httpClient: HttpClient,private _sanitizer: DomSanitizer,private modalService: NgbModal,private route:ActivatedRoute){
  }

  ngOnInit(): void {
    localStorage.removeItem('elemento_id');
    localStorage.removeItem('direccion_2');
    localStorage.removeItem('id_luminaria');
    localStorage.removeItem('localizacion');
    localStorage.removeItem('valorbboxstr');
    localStorage.removeItem('valorbboxguardar');
    localStorage.setItem('elemento_id',JSON.stringify(''));
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    console.log(datos);
    this.proyecto=datos.datos.proyecto;
    console.log(this.proyecto);
   });
    let item={
      id:0
    }
    this.ver();
  }
  home(){
    this.event.publish('proyectos_activos');
  }
  
  volver(){
    this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/ordenes-de-trabajo`]);
  }
  ver(){
    let solicitud=JSON.parse(localStorage.getItem('ordenes_trabajo_ver'));
    this.data_solicitud=solicitud;
    console.log(this.data_solicitud);
    this.det_orden_trabajo();
    let lat_long=solicitud.lat_long.split(',');
    this.get_imagen_id_orden();
    setTimeout(()=>{
     localStorage.setItem('id_luminaria',JSON.stringify(solicitud.elemento_id));
    /* this.mapaleaft.alBuscarDireccion3(this.data_solicitud.localizacion);*/
     if (this.data_solicitud.bbox){
       let bbox=this.data_solicitud.bbox.split(',');
        localStorage.setItem('elemento_id',JSON.stringify(solicitud.elemento_id));
       let valorbbox:any[]=[parseFloat(bbox[0]),parseFloat(bbox[1]),parseFloat(bbox[2]),parseFloat(bbox[3])];
       if (solicitud.elemento_id=='No definido'){
          localStorage.setItem('direccion_2',JSON.stringify(this.data_solicitud.direccion_2));
       }else{
         setTimeout(()=>{
          this.mapaleaft.onSelectLayer2(solicitud.elemento_id,valorbbox);
          },8000);
       }
     }else{
       setTimeout(()=>{
        this.mapaleaft.alBuscarDireccion3(this.data_solicitud.localizacion);
        },6000);
     }
     },1000);
    /*let solicitud=JSON.parse(localStorage.getItem('ordenes_trabajo_ver'));
    this.data_solicitud=solicitud;
    let lat_long=solicitud.lat_long.split(',');
    let item={
      id:1,
      lat:lat_long[0],
      long:lat_long[1]
    }
    this.get_imagen_id_orden();
    setTimeout(()=>{
     localStorage.setItem('id_luminaria',JSON.stringify(solicitud.elemento_id));
    
     if(this.data_solicitud.bbox){
       let bbox=this.data_solicitud.bbox.split(',');
       let valorbbox:any[]=[parseFloat(bbox[0]),parseFloat(bbox[1]),parseFloat(bbox[2]),parseFloat(bbox[3])];
       this.mapaleaft.onSelectLayer2(solicitud.elemento_id,valorbbox);
     }else{
       setTimeout(()=>{
        this.mapaleaft.alBuscarDireccion3(this.data_solicitud.localizacion);
        },2000);
     }
     },12000);*/
  }
  fileEvent(fileInput:Event){
    let file=(<HTMLInputElement>fileInput.target).files[0];
    if(file.type=='image/jpeg' || file.type=='image/png'){
    
    }
  }
  nuevo_mantenimiento_preventivo(){
    let solicitud=JSON.parse(localStorage.getItem('ordenes_trabajo_ver'));
    this.event.publish('ordenes_trabajo_nuevo_mantenimiento_preventivo');
  }
  det_orden_trabajo(){
    let data={
      id_orden:this.data_solicitud.id_orden
    }
    this.gmao.get_det_orden_trabajo(data).subscribe(
        gmao=>{
         let resultado=gmao;
         if (resultado.status==true){
           this._det_orden_trabajo=resultado.data;  
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
  
  onClickguardar(){
    if(this.data_solicitud.tipo_id==''){
      this.alert=1;
      this.mensaje='Seleccione un tipo de órden';
    }else if(this.data_solicitud.modulo_id==''){
      this.alert=2;
      this.mensaje='Seleccione un tipo';
    }else if(this.data_solicitud.elemento_id==''){
      this.alert=3;
      this.mensaje='Ingrese una descripción';
    }else if(this.data_solicitud.prioridad_id==''){
      this.alert=4;
      this.mensaje='Seleccione una prioridad';
    }else if(this.data_solicitud.localizacion==''){
      this.alert=5;
      this.mensaje='Ingrese una localización';
    }else if(this.data_solicitud.descripcion==''){
      this.alert=6;
      this.mensaje='Ingrese una descripción';
    }else{
      let usuario=JSON.parse(localStorage.getItem('user'));
      this.data_solicitud.id_usuario=usuario.usuario;
      this.data_solicitud.id_empresa=usuario.id_empresa;
     
      this.isDisabled=true;
      this.gmao.guardar_solicitud(this.data_solicitud).subscribe(
        gmao=>{
          let resultado=gmao;
         
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Solicitud  guardada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/ordenes-de-trabajo`]);
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
  cerrar_alert(item){
    this.alert=0;
  }
  get_imagen_id_orden(){
    let data={
      id_orden:this.data_solicitud.id_orden
    }
    this.gmao.get_imagen_id_orden(data).subscribe(
        gmao=>{
          let resultado=gmao;
         if(resultado.status==true){
          let data=resultado.data;
          for(let value of data){
            this.imagen.push({
              nombre:value.nombre,
              imagen:this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' 
                 + value.imagen)
            });
          }
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
  abrir_imagen(item) {
    this.imagen_seleccionada=item;
  }
  en_espera(){
    let data={
      id_orden:this.data_solicitud.id_orden,
      estado_id:3,
      comentarios:''
    }
    this.isDisabled_espera_resuelta=1;
    this.isDisabled_2=true;
    this.gmao.actualizar_orden(data).subscribe(
        gmao=>{
          let resultado=gmao;
         
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Órden de trabajo en espera',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/ordenes-de-trabajo`]);
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
  resuelta(){
    let data={
      id_orden:this.data_solicitud.id_orden,
      estado_id:4,
      comentarios:''
    }
    this.isDisabled_espera_resuelta=2;
    this.isDisabled_2=true;
    this.gmao.actualizar_orden(data).subscribe(
    gmao=>{
      let resultado=gmao;
    
      if(resultado.status==true){
        Swal.fire({
          icon: 'success',
          title: 'Órden de trabajo en culminado',
          showConfirmButton: false,
          timer: 1500
            // según el plugin que nos mande el backend, entraremos en una u otra plataforma
          });
        this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/ordenes-de-trabajo`]);
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
  no_resuelta(){
    let data={
      id_orden:this.data_solicitud.id_orden,
      estado_id:7,
      comentarios:' '
    }
    this.isDisabled_espera_resuelta=2;
    this.isDisabled_2=true;
    this.gmao.actualizar_orden(data).subscribe(
    gmao=>{
      let resultado=gmao;
    
      if(resultado.status==true){
        Swal.fire({
          icon: 'success',
          title: 'Órden de trabajo no culminada',
          showConfirmButton: false,
          timer: 1500
            // según el plugin que nos mande el backend, entraremos en una u otra plataforma
          });
        this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/ordenes-de-trabajo`]);
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
