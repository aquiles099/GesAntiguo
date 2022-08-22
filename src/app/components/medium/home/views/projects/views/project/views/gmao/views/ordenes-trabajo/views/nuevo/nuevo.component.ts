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
  styleUrls: ['./nuevo.component.css',
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
  id_proyecto:any;
  center = latLng(40.395347, -3.694041);
  data_solicitud:any={
    tipo_id:'',
    modulo_id:'1',
    id_usuario:'',
    imagenes:'',
    id_procedencia:'',
    det_orden:'',
    estado_id:2,
    elemento_id:'',
    bbox:'',
    geom_lng:'',
    geom_lat:'',
    prioridad_id:'',
    localizacion:'una aqui',
    lat_long:'',
    nombre_usuario:'',
    descripcion:'',
    direccion_2:'',
    comentarios:'',
    id_empresa:'',
    fecha:''
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
  var_usuario:any[]=[];
  var_prioridad:any[]=[];
  var_elemento:any[]=[];
  i:any;
  placesService:any;
  add_archivos:any[]=[];
  input_select_elemento:any=0;
  item_elemento:any=null;
  valor_elemento:any='';
  base64:any;
  datos_con_back:any;
  inventario:any[]=[];
  valor_0=0;
  valor_0_1=1;
  valor_1=5;
  data_inventario:any={
    id_inventario:'',
    nombre:'',
    cantidad:''
  }
  alert_inventario:any=0;
  inventario_guardar:any[]=[];
  procedencia:any;
  muestra_procedencia:any=0;
  titulo_elemento:any='Elemento*';
  viene_solicitud:any=0;
  almacen:any;
  tipo_inventario:any;
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
    localStorage.removeItem('ordenes_trabajo_ver');
    localStorage.removeItem('valorbboxstr');
    localStorage.removeItem('valorbboxguardar');
    this.get_tipo_id_empresa();
    this.get_almacences_id_empresa();
    this.get_tipo_inventario_id_empresa();
    this.datos_solicitud_fisotect_crear_solicitud();
    this.get_procedencia_id_empresa();
    let _viene_solicitud=JSON.parse(localStorage.getItem('viene_solicitud'));
    if (_viene_solicitud==1){
        this.viene_solicitud=1;
        let solicitud=JSON.parse(localStorage.getItem('solicitud_ver'));
        console.log(solicitud);
        if (solicitud.bbox){
           let bbox=solicitud.bbox.split(',');
            localStorage.setItem('elemento_id',JSON.stringify(solicitud.elemento_id));
           let valorbbox:any[]=[parseFloat(bbox[0]),parseFloat(bbox[1]),parseFloat(bbox[2]),parseFloat(bbox[3])];
           this.data_solicitud.direccion_2=solicitud.direccion_2;
           this.data_solicitud.elemento_id=solicitud.elemento_id;
           this.titulo_elemento='Elemento de la incidencia '+ solicitud.elemento_id;
           /*this.item_elemento.push({id_luminaria:solicitud.elemento_id});*/
           if (solicitud.elemento_id=='No definido'){
              localStorage.setItem('direccion_2',JSON.stringify(solicitud.direccion_2));
           }else{
             setTimeout(()=>{
              this.mapaleaft.onSelectLayer2(solicitud.elemento_id,valorbbox);
              },8000);
           }
        }else{
           setTimeout(()=>{
            this.mapaleaft.alBuscarDireccion3(solicitud.localizacion);
            },6000);
        }
    }
  }
   cambio_procedencia(item){
    if (item==3){
      this.muestra_procedencia=1;
    }else{
      this.muestra_procedencia=0;
    }
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
       /* this.get_usuarios_id_empresa();*/
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
  get_almacences_id_empresa(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
    this.gmao.get_talleres_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
       if(resultado.status==true){
        this.carga_datos=1;
        this.almacen=resultado.data;
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
  get_tipo_inventario_id_empresa(){
    let data={
      id_empresa:this.proyecto.id_proyecto
    }
    this.gmao.get_tipo_inventario_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
       if(resultado.status==true){
        this.tipo_inventario=resultado.data;
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
  get_inventario_id_tipo_inventario_id_empresa(item){
    console.log(item);
    let data={
      id_empresa:this.proyecto.id_proyecto,
      tipo_inventario_id:item
    }
    this.gmao.get_inventario_id_tipo_inventario_id_empresa(data).subscribe(
     gmao=>{
       let resultado=gmao;
       this.inventario=[];
       if(resultado.status==true){
         let i=0;
        for(let value of resultado.data){
          this.inventario.push({
            id:i,
            id_inventario:value.id,
            descripcion_inventario:value.description,
            precio_inventario:value.precio,
            fecha_compra_inventario:value.fecha_compra,
            nombre_marca:value.marca.description,
            nombre_modelo:value.modelo.description,
            stock:value.stock,
            cantidad_inventario:value.cantidad,            
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
  borrar_inventario(item){
    this.inventario_guardar.splice(item, 1);
  }
  agregar_inventario(){
    if (this.data_inventario.id_almacen=='') {
      this.alert_inventario=1;
      this.mensaje='Seleccione';
    }else if(this.data_inventario.id_tipo_inventario==''){
      this.alert_inventario=2;
      this.mensaje='Ingrese';
    }else if(this.data_inventario.id_inventario==''){
      this.alert_inventario=3;
      this.mensaje='Ingrese';
    }else{
      let i=0;
      let longitud=this.inventario.length;
      let datos={
        nombre_almacen:this.data_inventario.nombre_almacen,
        nombre_tipo_inventario:'',
        id_inventario:this.data_inventario.id_inventario,
        nombre:'',
        cantidad:this.data_inventario.cantidad
      }
      for(let value of this.tipo_inventario){
        if (this.data_inventario.id_tipo_inventario==value.id){
          datos.nombre_tipo_inventario=value.description;
        }    
      }
      for(let value of this.inventario){
        if (this.data_inventario.id_inventario==value.id_inventario){
          this.data_inventario.nombre=value.descripcion_inventario;
          datos.nombre=this.data_inventario.nombre;
          let cantidad=value.cantidad_inventario-this.data_inventario.cantidad;
          console.log(this.inventario[i].cantidad_inventario);
          this.inventario[i].cantidad_inventario=cantidad;
          console.log(this.inventario[i].cantidad_inventario);
        }
        i++;
      }
      this.inventario_guardar.push(datos);
      this.data_inventario.id_inventario='';
      this.data_inventario.nombre='';
      this.data_inventario.cantidad='';
      console.log(this.inventario_guardar);
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
      this.data_solicitud.elemento_id='No definido';
    }else if(valor==2){ /*seleccionar zona en el mapa*/
      this.data_solicitud.elemento_id='No definido';
      this.mapaleaft.onSelectLayer_quitarbuffer(valor);
    }else if(valor==3){ /*seleccionar elemento en el mapa*/
       this.data_solicitud.elemento_id='No definido';
       this.mapaleaft.onSelectLayer_quitarbuffer(valor);
    }else{
      this.input_select_elemento=0;
      this.valor_elemento='';
      console.log(this.data_solicitud.elemento_id);
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
  
  direccion_seleccionada(item){
    this.data_solicitud.localizacion=item;
  }
   handleAddressChange(address: any){
      this.direccion=address.formatted_address;
      let lat=address.geometry.location.lat();
      let long=address.geometry.location.lng();
    
      this.data_solicitud.localizacion=this.direccion;
      this.data_solicitud.lat_long=lat +','+ long;
    }
  volver(){
    this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/ordenes-de-trabajo`]);
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
  _proyecto(){
    this.proyectos=JSON.parse(localStorage.getItem('project'));
    this.proyecto=this.proyectos;
    
    
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
  datos_solicitud_fisotect_crear_solicitud(){
    let usuario=JSON.parse(localStorage.getItem('user'));
    const  datos=JSON.stringify({
    tipo: "web",
    usuario: usuario.usuario,
    clave_sesion: usuario.clave_sesion,
    plugin: "Desarrollo",
    funcion: "web_informacion_crear_solicitud",
    proyecto: this.proyecto.nombre,
    id_proyecto: this.proyecto.id_proyecto,
    proyeccion: this.proyecto.proyeccion,
    });
    this.servicioFisotec.conexionBackend(datos).then((res) => {
      if (!res.error) {
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
  handleFile(event){
   var binaryString = event.target.result;
    this.base64= btoa(binaryString);
   
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
guardar_orden_solicitud(){
    /*if(this.data_solicitud.id_procedencia==''){
      this.alert=1;
      this.mensaje='Seleccione una procedencia';
    }else if(this.data_solicitud.tipo_id==''){
      this.alert=2;
      this.mensaje='Seleccione un tipo de órden';
    }else if(this.data_solicitud.prioridad_id==''){
      this.alert=4;
      this.mensaje='Seleccione una prioridad';
    }else if(this.data_solicitud.direccion_2==''){
      this.alert=3;
      this.mensaje='Ingrese una dirección manualmente';
    }else if(this.data_solicitud.descripcion==''){
      this.alert=6;
      this.mensaje='Ingrese una descripción';
    }else if(this.data_solicitud.id_usuario==''){
      this.alert=8;
      this.mensaje='Seleccione un usuario';
    }else if(this.data_solicitud.localizacion==''){
      this.alert=7;
      this.mensaje='Ingrese una localización';
    }else{*/
      /*if (this.data_solicitud.elemento_id==''){
        this.data_solicitud.elemento_id='No definido';
      }
      if (this.data_solicitud.elemento_id==''){
        this.data_solicitud.elemento_id='No definido';
      }
      if (this.data_solicitud.id_procedencia=='3'){
        if (this.data_solicitud.descripcion_procedencia=='') {
           this.alert=5;
           this.mensaje='Ingrese una procedencia';
        }else{
          this.data_solicitud.descripcion_procedencia==' ';
        }
      }*/
      /*let usuario=JSON.parse(localStorage.getItem('user'));
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
      if(this.inventario_guardar.length>0){
        this.data_solicitud.det_orden=this.inventario_guardar;
      }
      let bbox=JSON.parse(localStorage.getItem('valorbboxstr'));
      let bbox_xploid=bbox.split(',');
      if (bbox){
        this.data_solicitud.lat_long=bbox_xploid[1]+','+bbox_xploid[0]+','+bbox_xploid[1]+','+bbox_xploid[0];
      }else{
        this.data_solicitud.bbox='';
      }
      this.data_solicitud.bbox=bbox_xploid[1]+','+bbox_xploid[0]+','+bbox_xploid[1]+','+bbox_xploid[0];
      this.data_solicitud.localizacion=this.data_solicitud.direccion_2;
      let geo=this.data_solicitud.lat_long.split(',');
      this.data_solicitud.geom_lng=geo['1'];
      this.data_solicitud.geom_lat=geo['0'];*/
      let solicitud=JSON.parse(localStorage.getItem('solicitud_ver'));
      let geo=solicitud.lat_long.split(',');
      let data={
        bbox: solicitud.bbox,
        comentarios: solicitud.comentarios,
        descripcion: solicitud.descripcion,
        descripcion_estado: solicitud.descripcion_estado,
        descripcion_modulo: solicitud.descripcion_modulo,
        descripcion_priodidad: solicitud.descripcion_priodidad,
        direccion_2: solicitud.direccion_2,
        elemento_id: solicitud.elemento_id,
        estado_id: solicitud.estado_id,
        fecha: solicitud.fecha,
        lat_long: solicitud.lat_long,
        geom_lng:geo['1'],
        geom_lat:geo['0'],
        localizacion: solicitud.localizacion,
        modulo_id: solicitud.modulo_id,
        nombre_usuario: solicitud.nombre_usuario,
        prioridad_id:solicitud.prioridad_id,
        id_empresa:this.id_proyecto,
        tipo_id: solicitud.tipo_id
      }
      this.gmao.guardar_orden_trabajo(data).subscribe(
        gmao=>{
          let resultado=gmao;
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Orden de trabajo guardada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });

           this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/ordenes-de-trabajo`]);
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
    /*}*/
  }
  onClickguardar(){
    if(this.data_solicitud.id_procedencia==''){
      this.alert=1;
      this.mensaje='Seleccione una procedencia';
    }else if(this.data_solicitud.tipo_id==''){
      this.alert=2;
      this.mensaje='Seleccione un tipo de órden';
    }else if(this.data_solicitud.prioridad_id==''){
      this.alert=4;
      this.mensaje='Seleccione una prioridad';
    }else if(this.data_solicitud.direccion_2==''){
      this.alert=3;
      this.mensaje='Ingrese una dirección manualmente';
    }else if(this.data_solicitud.descripcion==''){
      this.alert=6;
      this.mensaje='Ingrese una descripción';
    }else if(this.data_solicitud.id_usuario==''){
      this.alert=8;
      this.mensaje='Seleccione un usuario';
    }else if(this.data_solicitud.localizacion==''){
      this.alert=7;
      this.mensaje='Ingrese una localización';
    }else{
      if (this.data_solicitud.elemento_id==''){
        this.data_solicitud.elemento_id='No definido';
      }
      if (this.data_solicitud.elemento_id==''){
        this.data_solicitud.elemento_id='No definido';
      }
      if (this.data_solicitud.id_procedencia=='3'){
        if (this.data_solicitud.descripcion_procedencia=='') {
           this.alert=5;
           this.mensaje='Ingrese una procedencia';
        }else{
          this.data_solicitud.descripcion_procedencia==' ';
        }
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
      if(this.inventario_guardar.length>0){
        this.data_solicitud.det_orden=this.inventario_guardar;
      }
      let bbox=JSON.parse(localStorage.getItem('valorbboxguardar'));
      let bbox_xploid=bbox.split(',');
      if (bbox){
        this.data_solicitud.lat_long=bbox_xploid[1]+','+bbox_xploid[0]+','+bbox_xploid[1]+','+bbox_xploid[0];
      }else{
        this.data_solicitud.bbox='';
      }
      this.data_solicitud.bbox=bbox_xploid[1]+','+bbox_xploid[0]+','+bbox_xploid[1]+','+bbox_xploid[0];
      this.data_solicitud.localizacion=this.data_solicitud.direccion_2;
      let geo=this.data_solicitud.lat_long.split(',');
      this.data_solicitud.geom_lng=geo['1'];
      this.data_solicitud.geom_lat=geo['0'];
      console.log(this.data_solicitud);
      debugger
      this.gmao.guardar_orden_trabajo(this.data_solicitud).subscribe(
        gmao=>{
          let resultado=gmao;
          if(resultado.status==true){
            Swal.fire({
              icon: 'success',
              title: 'Orden de trabajo guardada',
              showConfirmButton: false,
              timer: 1500
                // según el plugin que nos mande el backend, entraremos en una u otra plataforma
              });

           this.router.navigate([`/medium/home/proyectos/${this.id_proyecto}/gmao/ordenes-de-trabajo`]);
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

}
