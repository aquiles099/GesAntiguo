import { ChangeDetectorRef,Component,NgZone, OnInit,ViewChild,ElementRef,HostListener ,ComponentRef,AfterViewChecked,AfterViewInit,OnDestroy,Input,Output,EventEmitter } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {latLng, MapOptions, tileLayer} from 'leaflet';
import Swal from 'sweetalert2';
import {EventsService} from 'src/app/services';
import { GmaoService } from 'src/app/services';
import { FisotecService } from 'src/app/services';
import { MapaLeaftAmpliarComponent } from '../mapa-leaft-ampliar/mapa-leaft-ampliar.component';
import { ProjectService } from 'src/app/services/unic/project.service';
import { ProjectsService } from 'src/app/services/unic/projects.service';
import { Subscription, Observable, Observer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { isJsonString } from 'src/app/shared/helpers';
import 'rxjs/add/observable/of';
import * as dayjs from 'dayjs';
import * as moment from 'moment';
@Component({
  selector: 'app-ver',
  templateUrl: './ver.component.html',
  styleUrls: ['./ver.component.css',
  '../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class VerComponent implements OnInit {
  private routeDataSubscription:Subscription;
  @ViewChild(MapaLeaftAmpliarComponent) mapaleaft: MapaLeaftAmpliarComponent;
  public readonly faAngleLeft = faAngleLeft;
  mapOptions: MapOptions;
  proyectos:any;
  id_proyecto:any;
  _proyecto:any;
  center = latLng(40.395347, -3.694041);
  public direccionesSugerida$:Observable<string[]>=undefined;
  data_solicitud:any;
  auto_complete_optios={
    componentRestrictions: { 
      country: ['ES']
    }
  }
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
  fecha_inicio_fin:any;
  proyecto:any;
  constructor( public _location:Location, public router:Router, private event:EventsService, public gmao:GmaoService, public zone:NgZone,public httpClient: HttpClient, public servicioFisotec:FisotecService,private http: HttpClient, public _projectService:ProjectService, private _projectsService:ProjectsService,private route:ActivatedRoute){ 
  }

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    this.proyecto=datos.datos.proyecto;
    console.log(this.proyecto);
   });
    this.ver();
  }
  ver(){
    let solicitud=JSON.parse(localStorage.getItem('mantenimiento_preventivo_ver'));
    this.data_solicitud=solicitud;
    this.fecha_inicio_fin=this.data_solicitud.mant_preventivo_fecha+' Al '+this.data_solicitud.mantenimiento_preventivo_fecha_fin_mantenimiento;
    setTimeout(()=>{
     localStorage.setItem('id_luminaria',JSON.stringify(solicitud.id_elemento));
    /* this.mapaleaft.alBuscarDireccion3(this.data_solicitud.localizacion);*/
     if (this.data_solicitud.bbox){
       let bbox=this.data_solicitud.mantenimiento_preventivo_lat_long.split(',');
       let valorbbox:any[]=[parseFloat(bbox[0]),parseFloat(bbox[1]),parseFloat(bbox[2]),parseFloat(bbox[3])];
       this.mapaleaft.onSelectLayer2(solicitud.id_elemento,valorbbox);
     }else{
       setTimeout(()=>{
        this.mapaleaft.alBuscarDireccion3(this.data_solicitud.mantenimiento_preventivo_localizacion);
        },2000);
     }
     },12000);
  }
  ver_plan_mantenimiento(item){
    let datos=item;
     localStorage.setItem('plan_mantenimiento_id_mantenimiento_preventivo',JSON.stringify(datos));
    /*********************/
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/plan-mantenimiento`]);
  }
  volver(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/mantenimiento-preventivo`]);
  }
  fileEvent(fileInput:Event){
    let file=(<HTMLInputElement>fileInput.target).files[0];
    if(file.type=='image/jpeg' || file.type=='image/png'){
    
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
            this.event.publish('solicitudes_lista');
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
  aceptar_mantenimiento_preventivo(){
    let data={
      id_mantenimiento:this.data_solicitud.mantenimiento_preventivo_id,
      estado_id:2
    }
    this.gmao.actualizar_status_mantenimiento_preventivo(data).subscribe(
        gmao=>{
          let resultado=gmao;
        
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Mantenimiento preventivo aceptado',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
          this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/mantenimiento-preventivo`]);
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
  culminar_mantenimiento_preventivo(){
    let data={
      id_mantenimiento:this.data_solicitud.mantenimiento_preventivo_id,
      estado_id:4
    }
    this.gmao.actualizar_status_mantenimiento_preventivo(data).subscribe(
        gmao=>{
          let resultado=gmao;
        
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Mantenimiento preventivo culminado',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
          this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/mantenimiento-preventivo`]);
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
