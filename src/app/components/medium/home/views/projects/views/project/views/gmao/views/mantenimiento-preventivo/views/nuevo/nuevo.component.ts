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
import { MapaLeaftAmpliarComponent } from '../mapa-leaft-ampliar/mapa-leaft-ampliar.component';
import 'rxjs/add/observable/of';
import * as dayjs from 'dayjs';
import * as moment from 'moment';
@Component({
  selector: 'app-nuevo',
  templateUrl: './nuevo.component.html',
  styleUrls: ['./nuevo.component.css',
  '../../../../../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class NuevoComponent implements OnInit {
  @ViewChild('buscadorDeDirecciones')
  public buscadorDeDirecciones:ElementRef<HTMLElement>;
  @ViewChild(MapaLeaftAmpliarComponent) mapaleaft: MapaLeaftAmpliarComponent;
  public readonly faAngleLeft = faAngleLeft;
  private routeDataSubscription:Subscription;
  public datos:any;
  public direccionesSugerida$:Observable<string[]>=undefined;
 data_solicitud:any={
    id_mantenimiento_preventivo:'',
    id_empresa:'',
    id_usuario:'',
    nombre_usuario:'',
    id_ordenes_trabajo:'1',
    id_tipo:'',
    id_modulo:'1',
    id_estado:'1',
    id_periiodicidad:'',
    id_elemento:'',
    id_prioridad:'',
    localizacion:'',
    direccion_2:'', 
    bbox:'',
    geom_lng:'',
    geom_lat:'',
    lat_long:'',
    descripcion:'',
    comentarios:'',
    fecha:'',
    fecha_fin_mantenimiento:''
  }
  data_tareas:any={
    id_tarea:'',
    tarea:'',
    id_periodicidad:'',
    periodidicad:'',
    descripcion:'',
    id_usuario:'',
    usuario:''
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
  var_periodicidad:any[]=[];
  placesService:any;
  adjuntar_archivos:any=0;
  _ordenes:any[]=[];
  /*la fecha*/
  maxDateRange:any = dayjs().add(1, 'year');
  minDateRange:any = dayjs();
  selected_dates:any;
  local:any={
    format: 'DD-MM-YYYY', 
    displayFormat: 'DD-MM-YYYY', 
    monthNames: moment.monthsShort(),
    daysOfWeek: moment.weekdaysMin(),
    direction: 'ltr', 
    weekLabel: 'S',
    startDate:dayjs(1, 'days'),
    endDate:dayjs(1, 'days'),
    separator: ' al ', 
    cancelLabel: 'Cancelar', 
    applyLabel: 'OK', 
    clearLabel: 'Limpiar', 
    customRangeLabel: 'Custom range',
    firstDay: 1
  }
  ranges: any = {
    'Hoy': [dayjs(), dayjs()],
    'Ayer': [dayjs().subtract(1, 'days'), dayjs().subtract(1, 'days')],
    'Últimos 7 dias': [dayjs().subtract(6, 'days'), dayjs()],
    'Últimos 30 dias': [dayjs().subtract(29, 'days'), dayjs()],
    'Este mes': [dayjs().startOf('month'), dayjs().endOf('month')],
    'Mes pasado': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]
  }
  /**********/
  valor_elemento:any='';
  item_elemento:any=null;
  input_select_elemento:any=0;
  add_archivos:any[]=[];
  base64:any;
  datos_con_back:any;
  var_tareas:any[]=[];
  var_usuario:any[]=[];
  tareas_guardar:any[]=[];
  valor_0=0;
  valor_0_1=1;
  valor_1=5;
  i:any=0;
  aqui_variable:any; /*no utilizo OJO */
  proyecto:any;
  id_proyecto:any;
  zona_seleccionada:any=0;
  constructor( public _location:Location, public router:Router, private event:EventsService, public gmao:GmaoService, public zone:NgZone,public httpClient: HttpClient, public servicioFisotec:FisotecService,private http: HttpClient, public _projectService:ProjectService, private _projectsService:ProjectsService,private route:ActivatedRoute){
    var tzoffset = (new Date()).getTimezoneOffset() * 60000;
    let fecha_actual=(new Date(Date.now() - tzoffset)).toISOString().slice(0, -1) + 'Z';
    this.fecha=fecha_actual;
    let _fecha=fecha_actual.split('T')
    this.data_solicitud.fecha=_fecha['0'];
    this.event.subscribe('pulsacion_elemento', (item) =>{
      this.datos_solicitud_fisotect_pulsacion(item);
    });
     this.event.subscribe('pulsacion_elemento_2', (item) =>{
      this.datos_solicitud_elemento_seleccionado(item);
    });
    this.event.subscribe('direccion_seleccionada', (item) =>{
      this.direccion_seleccionada(item);
    });
    this.event.subscribe('mapa_nuevo', (item) =>{
      if (item==1){
      }else{
      }
    });
    this.event.subscribe('zona_marcada',(item) => {
      this.zona_seleccionada=2;
      debugger
    });
  }

  ngOnInit(): void{
    this.routeDataSubscription = this.route.data.subscribe(data => {
    let datos = data;
    this.id_proyecto=datos.datos.proyecto.id_proyecto;
    this.proyecto=datos.datos.proyecto;
    console.log(this.proyecto);
   });
    localStorage.removeItem('elemento_id');
    localStorage.removeItem('direccion_2');
    localStorage.removeItem('id_luminaria');
    localStorage.removeItem('localizacion');
    localStorage.removeItem('solicitud_ver');
    localStorage.removeItem('ordenes_trabajo_ver');
    localStorage.removeItem('valorbboxstr');
    localStorage.removeItem('valorbboxguardar');
    this.get_tipo_id_empresa();
    this.get_tareas_id_empresa();
  }
  agregar_tarea(){
    if(this.data_tareas.id_tarea==''){
      this.alert=9;
      this.mensaje='Seleccione';
    }else if(this.data_tareas.id_periodicidad==''){
      this.alert=10;
      this.mensaje='Seleccione';
    }else if(this.data_tareas.descripcion==''){
      this.alert=11;
      this.mensaje='Ingrese';
    }else if(this.data_tareas.id_usuario==''){
      this.alert=12;
      this.mensaje='Seleccione';
    }else{
      let datos_tareas:any={
        id_tarea:'',
        tarea:'',
        id_periodicidad:'',
        periodicidad:'',
        descripcion:this.data_tareas.descripcion,
        id_usuario:'',
        usuario:''
      }
      for(let value of this.var_tareas){
        if (value.id==this.data_tareas.id_tarea){
          datos_tareas.tarea=value.descripcion;
          datos_tareas.id_tarea=value.id;
        }
      }
      for(let value of this.var_periodicidad){
        if (value.id_prioridad==this.data_tareas.id_periodicidad){
          datos_tareas.periodicidad=value.description;
          datos_tareas.id_periodicidad=value.id_prioridad;
        }
      }
      for(let value of this.var_usuario){
        if (value.id_usuario==this.data_tareas.id_usuario){
          datos_tareas.id_usuario=value.id_usuario;
          datos_tareas.usuario=value.nombre+' '+value.apellidos;
        }
      }
      this.tareas_guardar.push(datos_tareas);
      this.data_tareas.descripcion='';
      this.data_tareas.id_tarea='';
      this.data_tareas.id_periodicidad='';
      this.data_tareas.id_usuario='';
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
  ngAfterViewInit(): void {
    this.buildAddressSearcherObserver();
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
  busca_direccion(){
    let item=this.data_solicitud.direccion_2;
    this.zona_seleccionada=1;
    setTimeout(()=>{
     this.event.publish('buscar_direcciontextarea', item);
     },500);
  }
  cambia_elemento(item){
    let valor=item;
    if(valor==0){
      this.input_select_elemento=1;
    }else if(valor==1){
      this.item_elemento=null;
      this.mapaleaft.onSelectLayer_quitarbuffer(valor);
      this.data_solicitud.id_elemento='No definido';
    }else if(valor==2){ /*seleccionar zona en el mapa*/
      this.data_solicitud.id_elemento='No definido';
      this.mapaleaft.onSelectLayer_quitarbuffer(valor);
    }else if(valor==3){ /*seleccionar elemento en el mapa*/
       this.data_solicitud.id_elemento='No definido';
       this.mapaleaft.onSelectLayer_quitarbuffer(valor);
    }else{
      this.input_select_elemento=0;
      this.valor_elemento='';
      console.log(this.data_solicitud.id_elemento);
      this.elemento_amarrillo(valor);
    }
    if(this.data_solicitud.id_elemento==''){
      this.input_select_elemento=0;
      this.valor_elemento='';
    }
  
  }
   elemento_amarrillo(item){
    for(let value of this.item_elemento){
      if (value.id_luminaria==this.data_solicitud.id_elemento){
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
         localStorage.setItem('id_luminaria',JSON.stringify(this.data_solicitud.id_elemento));
         localStorage.setItem('valorbbox',JSON.stringify(valorbbox));
         localStorage.setItem('valorbboxstr',JSON.stringify(bboxstr));
         localStorage.setItem('valorbboxguardar',JSON.stringify(bboxstrguardar));
         this.mapaleaft.onSelectLayer(valor);
      }
    }
  }
  elemento_amarrillo_2(item){
   
    for(let value of this.item_elemento){
      if (value.id_luminaria==this.data_solicitud.id_elemento){
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
         localStorage.setItem('id_luminaria',JSON.stringify(this.data_solicitud.id_elemento));
         localStorage.setItem('valorbbox',JSON.stringify(valorbbox));
         localStorage.setItem('valorbboxstr',JSON.stringify(bboxstr));
         localStorage.setItem('valorbboxguardar',JSON.stringify(bboxstrguardar));
         this.mapaleaft.onSelectLayer(valor);
         
      }
    }
  }
  direccion_seleccionada(item){
    this.data_solicitud.localizacion=item;
  }
  datos_solicitud_elemento_seleccionado(item){
    let data=item['latlng'];
    let lat_long=data['lat']+','+ data['lng'];
    let usuario=JSON.parse(localStorage.getItem('user'));
    const  datos=JSON.stringify({
    funcion: "web_gmao_informacion_pulsacion",
    usuario: usuario.usuario,
    tipo: "web",
    clave_sesion: usuario.clave_sesion,
    plugin: "Desarrollo",
    proyecto:  this.proyecto.nombre,
    modulo: "GIS-SMART ENERGY",
    grupo: "Gestlighting",
    capa: "Luminaria",
    proyeccion: this.proyecto.proyeccion,
    id_proyecto: this.proyecto.id_proyecto,
    coordenadas: lat_long,
    capas: [
        "gissmart_energy#gestlighting#luminaria",
        "gissmart_energy#gestlighting#centro_mando",
        "gissmart_energy#gestlighting#punto_luz"
        ]
    });
    this.servicioFisotec.conexionBackend(datos).then((res) =>{
      if (!res.error) {
        this.datos_con_back=res.datos;
        let datos_capas=res.datos.capas;
        let datos=res.datos.localizacion;
        this.data_solicitud.direccion_2=datos;
        this.data_solicitud.localizacion=datos;
        this.data_solicitud.id_elemento='';
        /* aqui va esto para quesuba*/
        localStorage.setItem('localizacion',JSON.stringify(datos));
        if (datos_capas.luminaria.length>0){
          this.item_elemento=datos_capas.luminaria;
          this.data_solicitud.direccion_2=datos;
          this.data_solicitud.id_elemento=datos_capas.luminaria[0].id_luminaria;
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
    proyeccion: this.proyecto.proyeccion,
    id_proyecto: this.proyecto.id_proyecto,
    coordenadas: lat_long,
    capas: [
        "gissmart_energy#gestlighting#luminaria",
        "gissmart_energy#gestlighting#centro_mando",
        "gissmart_energy#gestlighting#punto_luz"
        ]
    });
    this.servicioFisotec.conexionBackend(datos).then((res) => {
     
      if (!res.error){
        this.datos_con_back=res.datos;
        let datos_capas=res.datos.capas;
        let datos=res.datos.localizacion;
        localStorage.setItem('localizacion',JSON.stringify(datos));
        if (datos_capas.luminaria.length>0) {
          this.item_elemento=datos_capas.luminaria;
        }
        this.data_solicitud.direccion_2=datos;
        this.data_solicitud.localizacion=datos;
        
        this.mapaleaft.alBuscarDireccion2(datos); 
      }
    });
  }
  
  get_tipo_id_empresa(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
    this.gmao.get_tipo_mantenimiento_preventivo_id_empresa(data).subscribe(
      gmao=>{
        let resultado=gmao;
        if(resultado.status==true){
          let data=resultado.data;
          let i=0;
          for(let value of resultado.data){
            this.var_tipo.push({
              id:i,
              id_tipo:value.id,
              description:value.description
            });
            i++;
            this.i++;
          }
        }
      this.datos_solicitud_fisotect_crear_solicitud();
      },
      err =>{
          if(err.url==null){
          }else{
          }
        },
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
           /* this.var_usuario.push({
              id:i,
              id_usuario:value.login,   
              nombre:nombre_apellido['0'],
              apellidos:nombre_apellido['1']
            });*/
            i++;
          }
        }
        
      },
      err =>{
          if(err.url==null){
          }else{
          }
        },
     );
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
        /*for(let value of resultado.tipos){
          this.var_tipo.push({
            id:i,
            id_elemento:value.id_tipo_gmao,   
            description:value.nombre
          });
         i++;
         this.i++;
        }*/
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
  datesUpdated(range){ 
    if (range && range.start && range.end){
      let inicio = range.start.format().split('T');
      let fin = range.end.format().split('T');
      this.data_solicitud.inicio=inicio[0];
      this.data_solicitud.fecha_fin_mantenimiento=fin[0];
    
     }
  }
  apmplia(){
    let item={
      id:0
    }
    this.event.publish('mapa_ampliar',item);
  }
  reducir(){
    let item={
      id:0
    }
    this.event.publish('mapa_reducir',item);
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
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/mantenimiento-preventivo`]);
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
  borrar_tarea(item){
    this.tareas_guardar.splice(item, 1);
  }
  elimina_imagen(item){
    this.add_archivos.splice(item, 1);
  }
  handleFile(event){
   var binaryString = event.target.result;
    this.base64= btoa(binaryString);
   
  }
  get_tareas_id_empresa(){
    let datos={
      id_empresa:this.id_proyecto
    }
    this.gmao.get_tareas_id_empresa(datos).subscribe(
     gmao=>{
       let resultado=gmao;
       if(resultado.status==true){
         this.carga_datos=1;
         let i=0;
        for(let value of resultado.data){
          this.var_tareas.push({
            id:value.id,   
            descripcion:value.description,                     
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
     
        this.get_periodicidad();
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
  get_periodicidad(){
    this.gmao.get_periodicidad('').subscribe(
     gmao=>{
       let resultado=gmao;
     
       this.get_orden_trabajo();
       if(resultado.status==true){
         this.carga_datos=1;
         let i=0;
        for(let value of resultado.data){
          this.var_periodicidad.push({
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
  get_orden_trabajo(){
    this.gmao.get_ordenes('').subscribe(
     gmao=>{
       let resultado=gmao;
      
       if(resultado.status==true){
         this.carga_datos=1;
         let i=0;
        for(let value of resultado.data){
          this._ordenes.push({
            id:i,
            id_ordenes_trabajo:value.id_ordenes_trabajo,   
            descripcion:value.descripcion
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
    if(this.data_solicitud.id_tipo==''){
      this.alert=1;
      this.mensaje='Seleccione un tipo de mantenimiento';
    }else if(this.data_solicitud.id_prioridad==''){
      this.alert=3;
      this.mensaje='Ingrese una prioridad';
    }else if(this.data_solicitud.fecha==''){
      this.alert=5;
      this.mensaje='Ingrese una fecha de inicio';
    }else if(this.data_solicitud.fecha_fin_mantenimiento==''){
      this.alert=6;
      this.mensaje='Ingrese una fecha final';
    }else if(this.data_solicitud.descripcion==''){
      this.alert=7;
      this.mensaje='Ingrese una descripción';
    }else if(this.data_solicitud.localizacion==''){
      this.alert=8;
      this.mensaje='Ingrese una localización';
    }else{
      console.log(this.data_solicitud);
     if (this.data_solicitud.id_elemento==''){
        this.data_solicitud.id_elemento='No definido';
     }
      let usuario=JSON.parse(localStorage.getItem('user'));
      this.data_solicitud.nombre_usuario=usuario.nombre_usuario+' '+usuario.apellido ;
      this.data_solicitud.id_empresa=this.proyecto.id_proyecto;
      this.isDisabled=true;
      let bbox=JSON.parse(localStorage.getItem('valorbboxguardar'));
      let bbox_xploid=bbox.split(',');
      if (bbox){
        this.data_solicitud.lat_long=bbox_xploid[1]+','+bbox_xploid[0]+','+bbox_xploid[1]+','+bbox_xploid[0];
      }else{
        this.data_solicitud.bbox='';
      }
      this.data_solicitud.bbox=bbox_xploid[1]+','+bbox_xploid[0]+','+bbox_xploid[1]+','+bbox_xploid[0];
      this.data_solicitud.localizacion=this.data_solicitud.direccion_2;
      console.log(this.data_solicitud);
      let geo=this.data_solicitud.lat_long.split(',');
      this.data_solicitud.geom_lng=geo['1'];
      this.data_solicitud.geom_lat=geo['0'];
      console.log(this.data_solicitud);
      this.gmao.guardar_mantenimiento_preventivo(this.data_solicitud).subscribe(
        gmao=>{
          let resultado=gmao;
          if(resultado.status==true){
            this.data_solicitud.id_mantenimiento_preventivo=resultado.data;
          if (this.tareas_guardar.length>0){
            this.guardar_ordenes_con_solicitud_periodicidad();
          }
            Swal.fire({
              icon: 'success',
              title: 'mantenimiento preventivo guardado',
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
  crear_plan_de_mantenimiento(){
    let fecha_i=this.data_solicitud.fecha;
    let fecha_f=this.data_solicitud.fecha_fin_mantenimiento;
    let periodicidad=this.data_solicitud.id_periiodicidad;
    let datos={
      id_mantenimiento_preventivo:this.data_solicitud.id_mantenimiento_preventivo,
      id_empresa:this.data_solicitud.id_empresa,
      id_usuario:this.data_solicitud.id_usuario,
      id_ordenes_trabajo:this.data_solicitud.id_ordenes_trabajo,
      id_tipo:this.data_solicitud.id_tipo,
      id_modulo:1,
      id_estado:'1',
      periodicidad:this.data_solicitud.id_periiodicidad,
      id_elemento:this.data_solicitud.id_elemento,
      direccion_2:this.data_solicitud.direccion_2,
      id_prioridad:this.data_solicitud.id_prioridad,
      localizacion:this.data_solicitud.localizacion,
      lat_long:this.data_solicitud.lat_long,
      descripcion:this.data_solicitud.descripcion,
      comentarios:this.data_solicitud.comentarios,
      fecha:this.data_solicitud.fecha,
      fecha_fin_mantenimiento:this.data_solicitud.fecha_fin_mantenimiento    
    }
    console.log(datos);
    this.gmao.guardar_plan_mantenimiento_preventivo(datos).subscribe(
      gmao=>{
        let resultado=gmao;
        
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
  guardar_ordenes_con_solicitud_periodicidad(){
    let data_solicitud:any={
      id_empresa:this.data_solicitud.id_empresa,
      tipo_id:this.data_solicitud.id_tipo,
      elemento_id:this.data_solicitud.id_elemento,
      bbox:this.data_solicitud.bbox,
      prioridad_id:this.data_solicitud.id_prioridad,
      periodicidad:'',
      localizacion:this.data_solicitud.localizacion,
      lat_long:this.data_solicitud.lat_long,
      direccion_2:this.data_solicitud.direccion_2,
      comentarios:this.data_solicitud.comentarios,
      fecha:this.data_solicitud.fecha,
      fecha_fin:this.data_solicitud.fecha_fin_mantenimiento,
      modulo_id:'1',
      estado_id:2,
      id_usuario:'',
      nombre_usuario:'',
      descripcion:'',
    }
    /*hace un recorrido de las tareas y las guarda.*/
    for(let value of this.tareas_guardar){
      data_solicitud.nombre_usuario=value.usuario;
      data_solicitud.id_usuario=value.id_usuario;
      data_solicitud.descripcion=value.tarea;
      data_solicitud.periodicidad=value.id_periodicidad;
      console.log(data_solicitud);
      this.gmao.guardar_ordenes_con_solicitud_periodicidad(data_solicitud).subscribe(
       gmao=>{
        let resultado=gmao;
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
