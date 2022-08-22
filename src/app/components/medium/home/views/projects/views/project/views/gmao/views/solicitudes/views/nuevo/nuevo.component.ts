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
@Component({
  selector: 'app-nuevo',
  templateUrl: './nuevo.component.html',
  styleUrls: [
    './nuevo.component.css',
    '../../../../../../../../../../../../../../themes/styles/default-view.scss' 
    ]
})
export class NuevoComponent implements OnInit {
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
  data_solicitud:any={
    tipo_id:'',
    modulo_id:'1',
    id_empresa:'',
    id_usuario:'',
    id_procedencia:'',
    descripcion_procedencia:' ',
    nombre_usuario:'',
    estado_id:1,
    elemento_id:'',
    prioridad_id:'',
    localizacion:'una aqui',
    geom_lng:'',
    geom_lat:'',
    lat_long:'',
    direccion_2:'',
    descripcion:'',
    comentarios:'',
    fecha:'',
    imagenes:'',
    bbox:''
  }
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
  isDisabled:any=false;
  carga_datos:any=0;
  var_tipo:any[]=[];
  var_prioridad:any[]=[];
  var_elemento:any[]=[];
  i:any;
  placesService:any;
  ampliar:any;
  btn_ampliar:any=0;
  public direccionBuscada:string = null;
  add_archivos:any[]=[];
  input_select_elemento:any=0;
  valor_elemento:any='';
  item_elemento:any=null;
  base64:any;
  datos_con_back:any;
  ser_fiso:any=undefined;
  currentAdIndex = -1;
  ref:ComponentRef<any>;
  var_usuario:any[]=[];
  direccion_buscar:string='';
  procedencia:any;
  muestra_procedencia:any=0;
  zona_seleccionada:any=0;
  constructor( public _location:Location, public router:Router, private event:EventsService, public gmao:GmaoService, public zone:NgZone,public httpClient: HttpClient, public servicioFisotec:FisotecService,private http: HttpClient, public _projectService:ProjectService, private _projectsService:ProjectsService,private route:ActivatedRoute){
    var tzoffset = (new Date()).getTimezoneOffset() * 60000;
    let fecha_actual=(new Date(Date.now() - tzoffset)).toISOString().slice(0, -1) + 'Z';
    this.fecha=fecha_actual;
    this.event.subscribe('direccion_sugerida',(item) => {
      this.direccionesSugerida$=item;
    });
    this.event.subscribe('zona_marcada',(item) => {
      this.zona_seleccionada=2;
      debugger
    });
    let _fecha=fecha_actual.split('T')
    this.data_solicitud.fecha=_fecha['0'];
  }
  ngOnInit(): void{
    localStorage.removeItem('elemento_id');
    localStorage.removeItem('direccion_2');
    localStorage.removeItem('id_luminaria');
    localStorage.removeItem('localizacion');
    localStorage.removeItem('solicitud_ver');
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
    this.get_tipo_id_empresa();
    this.get_procedencia_id_empresa();
    let item={
      id:0
    }
    
  }
  ngAfterViewInit(): void {
    this.buildAddressSearcherObserver();
  }
     

  busca_direccion(){
    let item=this.data_solicitud.direccion_2;
    this.zona_seleccionada=1;
    setTimeout(()=>{
     this.event.publish('buscar_direcciontextarea', item);
     },500);
  }
  get_procedencia_id_empresa(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
     this.gmao.get_procedencia_id_empresa(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          this.procedencia=resultado.data;
          console.log(this.procedencia);
          
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
  cambio_procedencia(item){
    if (item==3 || item==8){
      this.muestra_procedencia=1;
    }else{
      this.muestra_procedencia=0;
    }
  }
  /* buscar direccion*/
  buildAddressSearcherObserver():void{
    try{
      this.direccionesSugerida$ = Observable.create((observer: Observer<string>)=>{
        observer.next(this.data_solicitud.direccion_2);
      })
      .pipe(
        switchMap( async (query: string) => {
          if (query){
            const response = await this._projectsService.consultarApi({
                "funcion": "localizacion_rellenar",
                "municipio": this._projectService.configuration.datos_municipio.nombre,
                "direccion": query
            });
            let direccion_sug=response.datos.direcciones || [];
            this.event.publish('direccion_sugerida',direccion_sug);
            return response.datos.direcciones || [];
          }else{
            let direccion_sug=[];
            this.event.publish('direccion_sugerida',direccion_sug);
            return [];
          }
        }),
        catchError(error => {
          console.log(error);
          if( isJsonString(error.message) )
          {
            console.error(error);
          }
          return [];
        })
      );
    }catch{   
    }
  }
  /******************/
  
    
  cambia_elemento(item){
    let valor=item;
    if(valor==0){
      this.input_select_elemento=1;
    }else if(valor==1){
      this.item_elemento=null;
      this.mapaleaft.onSelectLayer_quitarbuffer(valor);
      this.data_solicitud.elemento_id='No definido';
    }else if(valor==2){ /*seleccionar zona en el mapa*/
      debugger
      this.data_solicitud.elemento_id='No definido';
      this.mapaleaft.onSelectLayer_quitarbuffer_colocar_marker_zona(valor);
    }else if(valor==3){ /*seleccionar elemento en el mapa*/
       this.mapaleaft.onSelectLayer_quitarbuffer(valor);
    }else{
      this.input_select_elemento=0;
      this.valor_elemento='';
      this.elemento_amarrillo(valor);
    }
    if(this.data_solicitud.elemento_id==''){
      this.input_select_elemento=0;
      this.valor_elemento='';
    }
  }
  elemento_amarrillo(item){
    for(let value of this.item_elemento){
      if (value.id_luminaria==this.data_solicitud.elemento_id){
        let bbox=value.bbox.split(',');
        let espbbxo=bbox[0].split(' ');
        let parentbbxo=bbox[0].split('(');
        let despbbox=bbox[1].split(')');
        let bbox1=parentbbxo[1].split(' ');
        let bbox2=despbbox[0].split(' ');
        let valorbbox:any[]=[parseFloat(bbox1[0]),parseFloat(bbox1[1]),parseFloat(bbox2[0]),parseFloat(bbox2[1])];
        let bboxstr=bbox1[0]+','+bbox1[1]+','+bbox2[0]+','+bbox2[1];
        let bboxstrguardar=bbox1[1]+','+bbox1[0]+','+bbox2[1]+','+bbox2[0];
        let valor=JSON.parse(localStorage.getItem('valor_amarillo_res'));
         localStorage.setItem('id_luminaria',JSON.stringify(this.data_solicitud.elemento_id));
         localStorage.setItem('valorbbox',JSON.stringify(valorbbox));
         localStorage.setItem('valorbboxstr',JSON.stringify(bboxstr));
         localStorage.setItem('valorbboxguardar',JSON.stringify(bboxstrguardar));
         this.mapaleaft.onSelectLayer(valor);
      }
    }
  }
  elemento_amarrillo_2(item){
    for(let value of this.item_elemento){
      if (value.id_luminaria==this.data_solicitud.elemento_id){
        let bbox=value.bbox.split(',');
        let espbbxo=bbox[0].split(' ');
        let parentbbxo=bbox[0].split('(');
        let despbbox=bbox[1].split(')');
        let bbox1=parentbbxo[1].split(' ');
        let bbox2=despbbox[0].split(' ');
        let valorbbox:any[]=[parseFloat(bbox1[0]),parseFloat(bbox1[1]),parseFloat(bbox2[0]),parseFloat(bbox2[1])];
        let bboxstr=bbox1[0]+','+bbox1[1]+','+bbox2[0]+','+bbox2[1];
        let bboxstrguardar=bbox1[1]+','+bbox1[0]+','+bbox2[1]+','+bbox2[0];
        let valor=JSON.parse(localStorage.getItem('valor_amarillo_res'));
         localStorage.setItem('id_luminaria',JSON.stringify(this.data_solicitud.elemento_id));
         localStorage.setItem('valorbbox',JSON.stringify(valorbbox));
         localStorage.setItem('valorbboxstr',JSON.stringify(bboxstr));
         localStorage.setItem('valorbboxguardar',JSON.stringify(bboxstrguardar));
         this.mapaleaft.onSelectLayer(valor);
         
      }
    }
  }
  datos_solicitud_fisotect_crear_solicitud(){
    let usuario=JSON.parse(localStorage.getItem('user'));
    const  datos=JSON.stringify({
    tipo: "web",
    usuario: usuario.usuario,
    clave_sesion: usuario.clave_sesion,
    plugin: "Desarrollo",
    funcion: "web_informacion_crear_solicitud",
    proyecto: "Alcaudete desarrollo",
    id_proyecto: 86,
    proyeccion: "25830",
    });
    this.servicioFisotec.conexionBackend(datos).then((res) => {
      if (!res.error){
        let resultado=res.datos;
        let i=0;
        for(let value of resultado.usuarios){
          this.var_usuario.push({
            id:i,
            id_usuario:value.id_usuario,   
            nombre:value.nombre,
            apellidos:value.apellidos
          });
         i++;
         this.i++;
        }
        this.get_prioridad();
      }
    });
  }
  direccion_seleccionada(item){
    this.data_solicitud.localizacion=item;
  }
  datos_solicitud_elemento_seleccionado(item){ /* lo trae del ouptut de mapa-leaft*/
    let item_2=item;
    let data=item['latlng'];
    let lat_long=data['lat']+','+ data['lng'];
    let usuario=JSON.parse(localStorage.getItem('user'));
    const  datos=JSON.stringify({
    funcion: "web_gmao_informacion_pulsacion",
    usuario: usuario.usuario,
    tipo: "web",
    clave_sesion: usuario.clave_sesion,
    plugin: "Desarrollo",
    proyecto: this.proyecto.nombre,
    modulo: "GIS-SMART ENERGY",
    grupo: "Gestlighting",
    capa: "Luminaria",
    proyeccion: "25830",
    id_proyecto: this.proyecto.id_proyecto,
    coordenadas: lat_long,
    capas: [
        "gissmart_energy#gestlighting#luminaria",
        "gissmart_energy#gestlighting#centro_mando",
        "gissmart_energy#gestlighting#punto_luz"
        ]
    });
    this.servicioFisotec.conexionBackend(datos).then((res)=>{
      if (!res.error) {
        this.datos_con_back=res.datos;
        let datos_capas=res.datos.capas;
        let datos=res.datos.localizacion;
        this.data_solicitud.direccion_2=datos;
        this.data_solicitud.localizacion=datos;
        this.data_solicitud.elemento_id='';
        localStorage.setItem('localizacion',JSON.stringify(datos));
        if (datos_capas.luminaria.length>0){
          this.item_elemento=datos_capas.luminaria;
          this.data_solicitud.direccion_2=datos;
          this.data_solicitud.elemento_id=datos_capas.luminaria[0].id_luminaria;
          this.elemento_amarrillo_2(item); 
        }else{
          let item=this.data_solicitud.direccion_2;
          this.mapaleaft.direccionBuscada=this.data_solicitud.direccion_2;
          this.mapaleaft.alBuscarDireccion();
          /*this.mapaleaft.alBuscarDireccion2(datos);*/
        }
      }
    });
  }
  datos_solicitud_fisotect_pulsacion(item){
    let lat_long=item['lat']+','+ item['lng'];
    let usuario=JSON.parse(localStorage.getItem('user'));

    const  datos=JSON.stringify({
    funcion: "web_gmao_informacion_pulsacion",
    usuario: usuario.usuario,
    tipo: "web",
    clave_sesion: usuario.clave_sesion,
    plugin: "Desarrollo",
    proyecto: this.proyecto.nombre,
    modulo: "GIS-SMART ENERGY",
    grupo: "Gestlighting",
    capa: "Luminaria",
    proyeccion: "25830",
    id_proyecto: this.proyecto.id_proyecto,
    coordenadas: lat_long,
    capas: [
        "gissmart_energy#gestlighting#luminaria",
        "gissmart_energy#gestlighting#centro_mando",
        "gissmart_energy#gestlighting#punto_luz"
        ]
    });
    if (this.ser_fiso==undefined){
      this.servicioFisotec.conexionBackend(datos).then((res) => {
       
        if (!res.error){
            this.datos_con_back=res.datos;
            let datos_capas=res.datos.capas;
            let datos=res.datos.localizacion;
            this.data_solicitud.direccion_2=datos;
            this.data_solicitud.localizacion=datos;
            localStorage.setItem('localizacion',JSON.stringify(datos));
            if (datos_capas.luminaria.length>0) {
              this.item_elemento=datos_capas.luminaria;
            }
            this.mapaleaft.alBuscarDireccion2(datos); 
        }
      });
    }
  }
  get_tipo_id_empresa(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
    this.gmao.get_tipo_id_empresa(data).subscribe(
    gmao=>{
      let resultado=gmao;
      if(resultado.status==true){
        let data=resultado.data;
        let i=0;
        for(let value of resultado.data){
          this.var_tipo.push({
            id:i,
            id_elemento:value.id,   
            description:value.description
          });
          i++;
          this.i++;
        }
      }
    this.datos_solicitud_fisotect_crear_solicitud();
    /*  this.get_usuarios_id_empresa();*/
    },
    err =>{
        if(err.url==null){
        }else{
        }
      }
    );
  }
  get_usuarios_id_empresa(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
     this.gmao.get_usuarios_id_empresa(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let i=0;
          for(let value of resultado.data){
            let nombre_apellido=value.nombre.split(' ');
            this.var_usuario.push({
              id:i,
              id_usuario:value.login,   
              nombre:nombre_apellido['0'],
              apellidos:nombre_apellido['1']
            });
            i++;
            this.i++;
          }
        }
        this.get_prioridad();
      },
      err =>{
          if(err.url==null){
          }else{
          }
        },
     );
  }
  home(){
    this.event.publish('proyectos_activos');
  }
   handleAddressChange(address: any){
      this.direccion=address.formatted_address;
      let lat=address.geometry.location.lat();
      let long=address.geometry.location.lng();
    
      this.data_solicitud.localizacion=this.direccion;
      this.data_solicitud.lat_long=lat +','+ long;
    }
  volver(){
     this.router.navigate([`/medium/home/proyectos/${this.proyecto.id_proyecto}/gmao/solicitudes`]);
  }
  el_proyecto(){
    this.proyectos=JSON.parse(localStorage.getItem('project'));
    this.proyecto=this.proyectos;
  }
  
  get_prioridad(){
    this.gmao.get_prioridad('').subscribe(
     gmao=>{
       let resultado=gmao;
      
       if(resultado.status==true){
         this.carga_datos=1;
         let i=0;
        for(let value of resultado.data){
          this.var_prioridad.push({
            id:i,
            id_prioridad:value.id,   
            description:value.description,                     
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
  onClickguardar(){
    if(this.data_solicitud.id_procedencia==''){
      this.alert=1;
      this.mensaje='Seleccione una procedencia';
    }else if(this.data_solicitud.id_procedencia=='3' && this.data_solicitud.descripcion_procedencia==''){
     this.alert=2;
     this.mensaje='Ingrese una procedencia';
    }else if(this.data_solicitud.tipo_id==''){
      this.alert=3;
      this.mensaje='Seleccione un tipo de incidencia';
    }else if(this.data_solicitud.prioridad_id==''){
      this.alert=4;
      this.mensaje='Seleccione una prioridad';
    }else if(this.data_solicitud.direccion_2==''){
      this.alert=5;
      this.mensaje='Ingrese una dirección manualmente';
    }else if(this.data_solicitud.descripcion==''){
      this.alert=6;
      this.mensaje='Ingrese una descripción';
    }else if(this.data_solicitud.id_usuario==''){
      this.alert=7;
      this.mensaje='Seleccione un usuario';
    }else{
      if (this.data_solicitud.elemento_id==''){
        this.data_solicitud.elemento_id='No definido';
      }
      let usuario=JSON.parse(localStorage.getItem('user'));
      for(let value of this.var_usuario){
        if (this.data_solicitud.id_usuario==value.id_usuario){
          this.data_solicitud.nombre_usuario=value.nombre+' '+value.apellidos;
        }    
      }  
      this.data_solicitud.id_empresa=this.proyecto.id_proyecto;
      this.data_solicitud.imagenes=this.add_archivos;
      if (this.add_archivos.length>0){
        this.data_solicitud.imagenes=this.add_archivos;
      }
      let bbox=JSON.parse(localStorage.getItem('valorbboxguardar'));
      if (bbox){
        this.data_solicitud.bbox=JSON.parse(localStorage.getItem('valorbboxguardar'));
        this.data_solicitud.lat_long=bbox;
      }else{
        this.data_solicitud.bbox='';
      }
      this.data_solicitud.localizacion=this.data_solicitud.direccion_2;
      console.log(this.data_solicitud);
      debugger
      let geo=this.data_solicitud.lat_long.split(',');
      this.data_solicitud.geom_lng=geo['1'];
      this.data_solicitud.geom_lat=geo['0'];
      this.isDisabled=true;
      this.gmao.guardar_solicitud(this.data_solicitud).subscribe(
        gmao=>{
          let resultado=gmao;
         
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Incidencia  guardada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });
            localStorage.removeItem('valorbbox');
            localStorage.removeItem('valorbboxstr');
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
  tipo(item){
  
    if(item=='Equipamiento') {
       this._tipo='1_1';
    }else if(item=='Localizacion'){
      this._tipo='2_1';
    }else if(item=='Herramienta'){
      this._tipo='3_1';
    }else if(item=='Ruta'){
      this._tipo=4;
    }
  }
  
  fileEvent(fileInput:Event){
    let file=(<HTMLInputElement>fileInput.target).files[0];
    
    var files = file[0];
    if(file.type=='image/jpeg' || file.type=='image/png'){
      var reader = new FileReader();
        reader.onload =this.handleFile.bind(this);
        reader.readAsBinaryString(file);
      setTimeout(()=>{
         this.add_archivos.push({
          name:file.name,
          type:file.type,
          base64:this.base64
        });
       },1000);
    }
  }
  elimina_imagen(item){
    this.add_archivos.splice(item, 1);
  }
  handleFile(event) {
   var binaryString = event.target.result;
    this.base64= btoa(binaryString);
  }
}
