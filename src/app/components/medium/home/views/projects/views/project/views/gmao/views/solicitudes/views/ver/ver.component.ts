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

  constructor( public _location:Location, public router:Router, private event:EventsService, public gmao:GmaoService, public zone:NgZone,public httpClient: HttpClient,private _sanitizer: DomSanitizer,private modalService: NgbModal,private route:ActivatedRoute){
  }

  ngOnInit(): void {
    localStorage.removeItem('elemento_id');
    localStorage.removeItem('direccion_2');
    localStorage.removeItem('id_luminaria');
    localStorage.removeItem('localizacion');
    localStorage.removeItem('ordenes_trabajo_ver');
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
    this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/solicitudes`]);
  }
  
  ver(){
    let solicitud=JSON.parse(localStorage.getItem('solicitud_ver'));
    this.data_solicitud=solicitud;
    console.log(this.data_solicitud);
    let lat_long=solicitud.lat_long.split(',');
    this.get_imagen_id_solicitud();
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
  }
  abrir_imagen(item) {
    this.imagen_seleccionada=item;
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }
  get_imagen_id_solicitud(){
    let data={
      id_solicitud:this.data_solicitud.id_solicitud
    }
    this.gmao.get_imagen_id_solicitud(data).subscribe(
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
  fileEvent(fileInput:Event){
    let file=(<HTMLInputElement>fileInput.target).files[0];
    if(file.type=='image/jpeg' || file.type=='image/png'){
      
    }
  }
  
  onClickguardar(){
    if(this.data_solicitud.tipo_id==''){
      this.alert=1;
      this.mensaje='Seleccione un tipo de Incidencia';
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
              title: 'Incidencia guardada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/solicitudes`]);
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
  crear_orden(){ /*crea una nueva orden de la solicitud existente*/
    localStorage.setItem('viene_solicitud',JSON.stringify(1));
    this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/ordenes-de-trabajo/nuevo`]);
  }
  rechazar_solicitud(){
    let solicitud=JSON.parse(localStorage.getItem('solicitud_ver'));
    let data={
      id_solicitud:solicitud.id_solicitud,
      estado_id:6
    }
    this.isDisabled_rechazar=true;
    this.gmao.rechazar_solicitud(data).subscribe(
        gmao=>{
          let resultado=gmao;
         
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Solicitud  rechazada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/solicitudes`]);
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
  eliminar_solicitud(){
    let solicitud=JSON.parse(localStorage.getItem('solicitud_ver'));
    let data={
      id_solicitud:solicitud.id_solicitud,
      estado_id:6
    }
    this.isDisabled_aceptar=true;
    this.gmao.eliminar_solicitud(data).subscribe(
        gmao=>{
          let resultado=gmao;
         
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Incidencia  Eliminada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/solicitudes`]);
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
  aceptar_solicitud(){
    let solicitud=JSON.parse(localStorage.getItem('solicitud_ver'));
    let data={
      id_solicitud:solicitud.id_solicitud,
      estado_id:2
    }
    this.isDisabled_aceptar=true;
    this.gmao.rechazar_solicitud(data).subscribe(
        gmao=>{
          let resultado=gmao;
         
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Incidencia aceptada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/solicitudes`]);
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
  resuelta(item){
    this.culminado_no_culminado=item;
    this.resuelta_no_resuelta=1;
  }
  resuelta_2(){
    let solicitud=JSON.parse(localStorage.getItem('solicitud_ver'));
       let data={
          id_solicitud:'',
          estado_id:'',
          comentarios:''
       }
    if(this.comentarios_resuelto_no_resuelto==''){
      this.alert=10;
       this.mensaje='Ingrese un comentario';
    }else{
      if(this.culminado_no_culminado==1){ /*culminado*/
        data={
          id_solicitud:solicitud.id_solicitud,
          estado_id:'4',
          comentarios:this.comentarios_resuelto_no_resuelto
        }
      } 
      if(this.culminado_no_culminado==2){ /*rechazado*/
        data={
          id_solicitud:solicitud.id_solicitud,
          estado_id:'8',
          comentarios:this.comentarios_resuelto_no_resuelto
        }
      }
      this.gmao.resuelto_no_resuelto_solicitud(data).subscribe(
        gmao=>{
          let resultado=gmao;
         
          if(resultado.status==true){
            if(this.culminado_no_culminado==1){
            Swal.fire({
              icon: 'success',
              title: 'Incidencia culminada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            }else{
              Swal.fire({
              icon: 'success',
              title: 'Incidencia No resuelta',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            }
            this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/solicitudes`]);
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
