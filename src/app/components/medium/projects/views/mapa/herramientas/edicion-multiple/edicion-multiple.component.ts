import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HideableSectionComponent } from 'src/app/components/shared/hideable-section/hideable-section.component';
import { DrawMap, featureGroup, FeatureGroup, Draw, drawLocal, DrawEvents, tileLayer} from 'leaflet';
import { FisotecService } from 'src/app/services';
import Swal from 'sweetalert2';
import { ProjectLayersService } from 'src/app/services/medium/project-layers.service';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../shared/helpers';
import { Capa } from '../../../../../../../interfaces/medium/mapa/Modulo';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { AuthenticatedUserService } from '../../../../../../../services/authenticated-user.service';

@Component({
  selector: 'herramienta-edicion-multiple',
  templateUrl: './edicion-multiple.component.html',
  styleUrls: ['./edicion-multiple.component.scss', '../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class EdicionMultipleComponent extends HideableSectionComponent {

  @Input()
  public map: DrawMap;

  @Input()
  public layers;

  @Output()
  onCerrar: EventEmitter<any> = new EventEmitter();

  @Output() onActualizarLayer: EventEmitter<any> = new EventEmitter();

  mapReady: boolean = true;

  primeraVentana: boolean = true;
  segundaVentana: boolean = false;
  terceraVentana: boolean = false;
  cuartaVentana: boolean = false;
  quintaVentana: boolean = false;

  public formData:any = {
    module:null,
    group:null,
    layer:null
  };

  public capaSeleccionada:Capa;

  activarSiguiente: boolean = false;
  activarSiguienteEle: boolean = false;
  activarSiguienteAtr: boolean = false;
  mostrarSiguienteCapaSeleccionada: boolean = true;
  mostrarSiguienteElementosSeleccionados: boolean = false;
  mostrarSiguienteAtributo: boolean = false;
  mostrarCancelar: boolean = true;
  mostrarRedibujar: boolean = false;
  mostrarGuardar: boolean = false;

  valores = [];
  checkTodos: boolean = true;
  atributos = [];
  checkTodosAtr: boolean = true;
  respuestaBackend: any;
  respuestaAtributos: any;
  atributosEditables = [];
  opcionesBooleano = [true, false]; //Opciones para el select, cuando se trate del tipo boolean

  @Input()
  capaDeElementosDibujados: FeatureGroup = featureGroup();
  
  poligono: Draw.Polygon;
  public drawOptions: any;

  constructor(
    private servicioFisotec: FisotecService,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
    private _projectLayersService: ProjectLayersService,
    private _spinnerService:SpinnerService,
    private _projectService:ProjectService,
    private _authenticatedUserService:AuthenticatedUserService,
    private _shepherdService:ShepherdService
    ) {
      super();
    drawLocal.draw.handlers.polygon.tooltip.start = "Click para empezar a dibujar.";
    drawLocal.draw.handlers.polygon.tooltip.cont = "Click para seguir.";
    drawLocal.draw.handlers.polygon.tooltip.end = "Click en el primer punto para terminar.";

    this.drawOptions = {
      draw: {
        marker: false,
        polyline: {
          shapeOptions: {
            color: '#218D8F'
          }
        },
        circle: false,
        polygon: {
          shapeOptions: {
            color: '#218D8F'
          }
        },
        circlemarker: false,
        rectangle: {
          shapeOptions: {
            color: '#218D8F'
          },
          showArea: false
        }
      },
      edit: {
        featureGroup: this.capaDeElementosDibujados
      }
    };

  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  get thereIsMoreThanOneModule():boolean
  {
    return this._projectLayersService.modulesNumber > 1;
  }

  public async show(): Promise<void>
  {
    // setTimeout se usa para crear tarea que genere renderizado en la web (menos costoso que usar changeDetectorRef).
    this.map.on('draw:created', (e) => setTimeout(() => this.onDrawCreated(e)));
    await super.show();
  }

  public onChangeModuleOrGroupSelector():void
  {
    this.capaSeleccionada = null;
    this.activarSiguiente = false;
  }

  public async onChangeLayerSelector(layer:Capa):Promise<void>
  {
    this.capaSeleccionada = layer;
    this.activarSiguiente = true;
  }

  //Función lanzada al hacer click en siguiente en el selector de capas
  public onClickSiguienteCapaSeleccionada():void
  {
    if (this.activarSiguiente && ! this.tourIsActive)
    {

      //Mostramos el siguiente div, y su correspondiente botón, ocultando los anteriores
      this.primeraVentana = false;
      this.segundaVentana = true;
      this.mostrarSiguienteCapaSeleccionada = false;
      this.mostrarSiguienteElementosSeleccionados = true;
      this.activarSiguiente = false;

      //Función para dibujar el polígono
      this.dibujarPoligono();
    }
  }

  //Función lanzada al hacer click en el botón de cancelar
  public onClickCancelar():void
  {
    if( this.tourIsActive )
      return;

    this.onCerrar.emit();
  }

  //Se lanza al cerrar la herramienta
  public async hide(): Promise<void> {

    //Borramos el contenido de todas las variables
    this.capaSeleccionada = null;
    this.mostrarCancelar = true;
    this.mostrarRedibujar = false;
    this.mostrarGuardar = false;
    this.activarSiguiente = false;
    this.activarSiguienteEle = false;
    this.activarSiguienteAtr = false;
    this.mostrarSiguienteCapaSeleccionada = true;
    this.mostrarSiguienteElementosSeleccionados = false;
    this.mostrarSiguienteAtributo = false;
    this.primeraVentana = true;
    this.segundaVentana = false;
    this.terceraVentana = false;
    this.cuartaVentana = false;
    this.quintaVentana = false;
    this.mapReady = true;
    this.valores = [];
    this.atributos = [];
    this.atributosEditables = [];

    //Volvemos a activar el doble click en el mapa, cancelamos el dibujo (si estuviera haciéndose) y borramos el polígono sobre el mapa (si lo hubiera)
    this.map.doubleClickZoom.enable();
    if (this.poligono) {
      this.poligono.disable();
    }
    this.capaDeElementosDibujados.clearLayers();

    //Limpiamos el layer de elementos seleccionados
    this.limpiarLayer();

    this.map.off('draw:created');

    // Remover tour de servicio global.
    this._shepherdService.tourObject = null;

    await super.hide();
  }

  //Empezamos a dibujar el polígono para seleccionar los elementos
  dibujarPoligono() {
    this.mostrarCancelar = false;
    this.mostrarRedibujar = true;

    //Desactivamos el doble click sobre el mapa
    this.map.doubleClickZoom.disable();

    //Activamos el dibujo
    this.poligono = new Draw.Polygon(this.map, this.drawOptions.draw.polygon);
    this.poligono.enable();

    //Borramos el layer de elementos resaltados
    this.limpiarLayer();
  }

  //Función lanzada al terminar de dibujar el polígono
  private async onDrawCreated(event: any):Promise<void>
  {
    try
    {
      this._spinnerService.show();

      //Persistimos el dibujo sobre el mapa y centramos la pantalla sobre el mismo
      this.capaDeElementosDibujados.addLayer((event as DrawEvents.Created).layer);
      
      this.map.flyToBounds(this.capaDeElementosDibujados.getBounds(), { maxZoom: this.map.getZoom(), duration: .50 });
  
      //Enviamos la geometría obtenida al backend
      await this.llamadaBackendDibujoTerminado(event.layer._latlngs);
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  //Función para llamar al backend al terminar el dibujo
  private async llamadaBackendDibujoTerminado(objetoCoordenadas: any):Promise<void>
  {
    //Mostramos el spinner de carga
    this.mapReady = false;

    //Preparamos la petición para el backend
    const peticion = JSON.stringify({
      funcion: "web_informacion_edicion_alfanumerica_edicio_multiple",
      usuario: sessionStorage.getItem('usuario'),
      tipo: "web",
      clave_sesion: sessionStorage.getItem('clave_sesion'),
      plugin: sessionStorage.getItem('plugin'),
      proyecto: this._projectService.project.bd_proyecto,
      proyeccion: this._projectService.project.proyeccion,
      modulo: this.capaSeleccionada.modulo,
      grupo: this.capaSeleccionada.grupo,
      capa: this.capaSeleccionada.nombre,
      filtro: this.obtenerFiltroDeLaCapa(),
      geometria: objetoCoordenadas
    });

    //Hacemos la petición al backend
    return this.servicioFisotec.conexionBackend(peticion).then((res) => {

      //Si la petición funciona correctamente
      if (!res.error) {

        if(res.datos.atributos.length > 0){
          //Quitamos el spinner de carga
        this.mapReady = true;

        let elementos = [];
        this.valores = [];

        //Recorremos los elementos recibidos en la respuesta
        for (let elemento of res.datos.elementos) {

          //Guardamos los elementos en el array que los resaltará en el mapa
          elementos.push(elemento.id);

          //Guardamos los elementos en el array de arrays para el checkbox, donde por defecto todos estarán a true
          this.valores.push([elemento.id, true]);
        }

        //Si hay 1 o más elementos, permitimos el click sobre el botón de siguiente
        if (elementos.length > 0) {
          this.activarSiguienteEle = true;
          this.checkTodos = true;
        }

        //Resaltamos los elementos recibidos del backend
        this.resaltarElementosSeleccionados(elementos);

        //Mostramos la vista con el checkbox
        this.segundaVentana = false;
        this.terceraVentana = true;

        this.changeDetector.detectChanges();

        this.llenarSeleccionAtributos(res.datos);

        this.respuestaBackend = [];
        this.respuestaBackend = res.datos;
        }
        else
        {
          Swal.fire({
            icon: "info",
            title: "Error",
            text: "Debe configurar algún atributo para esta herramienta.",
            confirmButtonText: "OK",
            heightAuto: false
          });
          this.onCerrar.emit();
          this.changeDetector.detectChanges();
        }
        //Si la petición devuelve error
      } else {

        //Mostramos un mensaje indicando el error
        Swal.fire({
          icon: "error",
          title: "ERROR",
          text: res.msg_error,
          confirmButtonText: "OK",
        }).then(() => {

          //Si el error es por sesión expirada, redirigimos al usuario al login
          if (res.msg_error.includes("expirada")) {
            this.router.navigate(["/login"]);

            //Si es otro tipo de error, cerramos la herramienta
          } else {
            this.onCerrar.emit();
          }
        });
      }
    });
  }

  //Función lanzada al hacer click en el botón de Borrar
  onClickRedibujar() {
    this.segundaVentana = true;
    this.terceraVentana = false;

    //Cancelamos el dibujo en curso (si lo hubiera) y borramos el dibujo (si estuviera terminado)
    this.poligono.disable();
    this.capaDeElementosDibujados.clearLayers();

    //Llamamos de nuevo a la función de dibujo
    this.dibujarPoligono();

  }

  //Función para obtener el filtro actual de la capa seleccionada (si lo hubiera)
  obtenerFiltroDeLaCapa() {
    let filtro = "";

    //Recorremos los layers actuales sobre el mapa
    this.layers.forEach(element => {

      //Buscamos el layer correspondiente a la capa elegida para la edición
      if (element.wmsParams.layers == this.capaSeleccionada.filtro_capa.replace(/#/g, '_')) {

        //Si tuviera algún filtro activo, se devuelve
        if (element.wmsParams.cql_filter) {
          filtro = element.wmsParams.cql_filter;
        }
      }
    });

    if(filtro === "(include)") {
      filtro = "";
    }

    //Devolvemos el filtro activo sobre la capa (si no lo hay, se devuelve vacío)
    return filtro;
  }

  //Función para resaltar los elementos seleccionados
  resaltarElementosSeleccionados(elementos: any) {
    let filtro = "";

    //Construimos el string para el fitro, con los elementos recibidos
    for (let elemento of elementos) {
      filtro = filtro + " OR id_" + this.capaSeleccionada.nombre_formateado + "='" + elemento + "'";
    }

    filtro = filtro.substring(4);

    const wmsOptions: any = {
      layers: this.capaSeleccionada.filtro_capa.replace(/#/g, '_'),
      styles: "buffer_linea",
      className: "informacion_seleccionado",
      format: 'image/png',
      crossOrigin: true,
      transparent: true,
      opacity: 1,
      maxNativeZoom: 22,
      maxZoom: 22,
      cql_filter: filtro,
      env: "buffer:30"
    };

    let urlBase = this._projectService.project.url_base.split('wms?')[0] + "wms?";

    //Hacemos una petición wms para obtener el layer que resaltará el elemento seleccionado
    const value = tileLayer.wms(urlBase, wmsOptions);

    //Añadimos el layer al grupo de layers mostrados en el mapa
    this.layers.push(value);

    //Forzamos la detección de cambios en este componente y emitimos un evento para actualizar el nuevo layer en el mapa
    this.changeDetector.detectChanges();
    this.onActualizarLayer.emit();

  }

  //Eliminamos el layer que resalta el elemento seleccionado
  limpiarLayer() {

    //Recorremos todos los layers mostrados en el mapa
    for (let l of this.layers) {

      //Si el className del layer coincide con el que queremos eliminar
      if (l.options.className === "informacion_seleccionado") {

        //Eliminamos el layer del array
        let index = this.layers.indexOf(l);
        this.layers.splice(index, 1);
        this.limpiarLayer();
      }
    }

  }

  //Evento que se lanza al seleccionar un valor de la check list
  eventoValorSeleccionado(e, val) {
    this.limpiarLayer();

    //Modificamos la lista de valores para el checklist, actualizando su estado (true o false)
    for (let valor of this.valores) {
      if (valor[0] == val) {
        valor[1] = e.checked;
      }
    }

    //Actualizamos los layers resaltados
    let nuevosElementos = [];

    //Recorermos la lista de valores del checklist
    for (let valor of this.valores) {

      //Si el elemento actual está seleccionado, lo metemos en el array
      if (valor[1] == true) {
        nuevosElementos.push(valor[0]);
      }
    }

    //Si hay 1 o más elementos seleccionados, activamos el botón de siguiente
    if (nuevosElementos.length > 0) {
      this.activarSiguienteEle = true;
    } else {
      this.activarSiguienteEle = false;
    }

    this.resaltarElementosSeleccionados(nuevosElementos);

  }

  //Al hacer click en el check de TODOS
  selectTodos(e) {
    this.checkTodos = !this.checkTodos;

    //Modificamos la lista de valores para el checklist, actualizando su estado (true o false)
    for (let valor of this.valores) {
      valor[1] = this.checkTodos;
    }

    this.limpiarLayer();

    //Si hemos activado el check de TODOS
    if (this.checkTodos) {

      let elementos = [];
      for (let valor of this.valores) {
        elementos.push(valor[0]);
      }
      this.resaltarElementosSeleccionados(elementos);

      this.activarSiguienteEle = true;

      //Si hemos desactivado el check de todos
    } else {
      this.activarSiguienteEle = false;
    }

    this.changeDetector.detectChanges();
    this.onActualizarLayer.emit();

  }

  //Función que se lanza al hacer click en siguiente, cuando están seleccionados los elementos a editar
  onClickSiguientElementosSeleccionados() {

    //Si el botón de siguiente está activo
    if (this.activarSiguienteEle) {

      //Mostramos la vista de selección de atributos
      this.terceraVentana = false;
      this.cuartaVentana = true;
      this.mostrarRedibujar = false;
      this.mostrarCancelar = true;
      this.mostrarSiguienteElementosSeleccionados = false;
      this.mostrarSiguienteAtributo = true;
      this.checkTodosAtr = true;

    }
  }

  llenarSeleccionAtributos(datos) {
    this.atributos = [];
    //Recorremos los elementos recibidos en la respuesta
    for (let atributo of datos.atributos) {

      //Guardamos los atributos en el array de arrays para el checkbox, donde por defecto todos estarán a true
      this.atributos.push([atributo.nombre, true]);
    }

    if (this.atributos.length > 0) {
      this.activarSiguienteAtr = true;
    } else {
      this.activarSiguienteAtr = false;
    }
  }

  //Al hacer click en el check de TODOS en la selección de atributos
  selectTodosAtributos(e) {

    this.checkTodosAtr = !this.checkTodosAtr;

    //Modificamos la lista de valores para el checklist, actualizando su estado (true o false)
    for (let atributo of this.atributos) {
      atributo[1] = this.checkTodosAtr;
    }

    //Si hemos activado el check de TODOS
    if (this.checkTodosAtr) {

      //Si hay 1 o más atributos seleccionados, activamos el botón de siguiente
      if (this.atributos.length > 0) {
        this.activarSiguienteAtr = true;
      } else {
        this.activarSiguienteEle = false;
      }

      //Si hemos desactivado el check de todos
    } else {
      this.activarSiguienteAtr = false;
    }

    this.changeDetector.detectChanges();
    this.onActualizarLayer.emit();

  }

  eventoAtributoSeleccionado(e, atr) {
    //Modificamos la lista de atributos para el checklist, actualizando su estado (true o false)
    for (let atributo of this.atributos) {
      if (atributo[0] == atr) {
        atributo[1] = e.checked;
      }
    }

    //Algunos atributos son dependientes de otros, por lo que irán los 2 juntos o no irá ninguno
    if(atr === "Centro mando") {
      for (let atributo of this.atributos) {
        if (atributo[0] == "Circuito") {
          atributo[1] = e.checked;
        }
      }
    }
    if(atr === "Circuito") {
      for (let atributo of this.atributos) {
        if (atributo[0] == "Centro mando") {
          atributo[1] = e.checked;
        }
      }
    }
    if(atr === "Marca soporte") {
      for (let atributo of this.atributos) {
        if (atributo[0] == "Modelo soporte") {
          atributo[1] = e.checked;
        }
      }
    }
    if(atr === "Modelo soporte") {
      for (let atributo of this.atributos) {
        if (atributo[0] == "Marca soporte") {
          atributo[1] = e.checked;
        }
      }
    }
    if(atr === "Marca luminaria") {
      for (let atributo of this.atributos) {
        if (atributo[0] == "Modelo luminaria") {
          atributo[1] = e.checked;
        }
      }
    }
    if(atr === "Modelo luminaria") {
      for (let atributo of this.atributos) {
        if (atributo[0] == "Marca luminaria") {
          atributo[1] = e.checked;
        }
      }
    }
    if(atr === "Marca lámpara") {
      for (let atributo of this.atributos) {
        if (atributo[0] == "Modelo lámpara") {
          atributo[1] = e.checked;
        }
      }
    }
    if(atr === "Modelo lámpara") {
      for (let atributo of this.atributos) {
        if (atributo[0] == "Marca lámpara") {
          atributo[1] = e.checked;
        }
      }
    }


    //Si hay 1 o más atributos seleccionados, activamos el botón de siguiente
    if (this.atributos.length > 0) {
      this.activarSiguienteAtr = true;
    } else {
      this.activarSiguienteAtr = false;
    }
  }

  //Una vez seleccionados los atributos a editar, al hacer click en sobre siguiente
  onClickSiguienteAtributo() {
    if (this.activarSiguienteAtr) {

      this.cuartaVentana = false;
      this.quintaVentana = true;
      this.mostrarSiguienteAtributo = false;

      //Mostramos el spinner de carga
      this.mapReady = false;

      let elemento = this.obtenerPrimerElemento();

      let lista_atributos = this.obtenerListaAtributos();

      //Preparamos la petición para el backend
      const peticion = JSON.stringify({
        funcion: "web_informacion_elemento_edicio_multiple",
        usuario: sessionStorage.getItem('usuario'),
        tipo: "web",
        clave_sesion: sessionStorage.getItem('clave_sesion'),
        plugin: sessionStorage.getItem('plugin'),
        proyecto: this._projectService.project.nombre,
        proyeccion: this._projectService.project.proyeccion,
        modulo: this.capaSeleccionada.modulo,
        grupo: this.capaSeleccionada.grupo,
        capa: this.capaSeleccionada.nombre,
        elemento: elemento,
        lista_atributos: lista_atributos
      });


      //Hacemos la petición al backend
      this.servicioFisotec.conexionBackend(peticion).then((res) => {

        //Si la petición funciona correctamente
        if (!res.error) {
          this.respuestaAtributos = res;
          this.llenarEdicionAtributos(res);

          this.mostrarGuardar = true;
          //Quitamos el spinner de carga
          this.mapReady = true;

          //Si la petición devuelve error
        } else {

          //Mostramos un mensaje indicando el error
          Swal.fire({
            icon: "error",
            title: "ERROR",
            text: res.msg_error,
            confirmButtonText: "OK",
          }).then(() => {

            //Si el error es por sesión expirada, redirigimos al usuario al login
            if (res.msg_error.includes("expirada")) {
              this.router.navigate(["/login"]);

              //Si es otro tipo de error, cerramos la herramienta
            } else {
              this.onCerrar.emit();
            }
          });
        }
      });

    }
  }

  //Función que devolverá el primer elemento de los seleccionados para editar
  obtenerPrimerElemento(){
    let devolver = "";
    for(let valor of this.valores) {
      if(valor[1] == true) {
        devolver = valor[0];
        break;
      }
    }

    return devolver;
  }

  //Función que devolverá un array con la lista de atributos seleccionados
  obtenerListaAtributos() {
    let devolver = [];

    for(let atributoSelec of this.atributos) {
      if (atributoSelec[1] == true) {
        for(let atributo of this.respuestaBackend.atributos) {

          if(atributo.nombre == atributoSelec[0]) {
            devolver.push(atributo);
          }
        }
      }
    }

    return devolver;
  }


  //Función que llenará el formulario de edición de atributos
  llenarEdicionAtributos(res) {
    this.atributosEditables =  [];

    //Recorremos la lista de atributos y la comparamos con los atributos seleccionados
    this.atributos.forEach((atributo)=>{

      //El atributo está seleccionado
      if(atributo[1]) {

        //Llenamos el tipo del elemento
        this.respuestaBackend.atributos.forEach((element) => {

          //Si el atributo actual coincide con el seleccionado
          if(atributo[0] === element.nombre) {

            //Si tiene dominio, guardamos su tipo como dominio
            if(element.dominio === true || element.campo === "marca_soporte" || element.campo === "modelo_soporte"
            || element.campo === "marca_luminaria" || element.campo === "modelo_luminaria" || element.campo === "marca_lampara"
            || element.campo === "modelo_lampara" || element.campo === "centro_mando" || element.campo === "circuito"){

              this.atributosEditables.push([atributo[0], "dominio", element.campo, this.traerDominio(element.campo, res.datos), null]);

            //Si no, guardamos su tipo
            }  else {

              this.atributosEditables.push([atributo[0], element.tipo, element.campo, null, null]);
            }
          }

        });

      }
    });

    //Llenamos el valor por defecto
    this.atributosEditables.forEach((atr) => {
      for (let [key, value] of Object.entries(res.datos.elemento)) {
        if(atr[2] === key) {
          atr[4] = value;
        }
      }
    });

  }

  //Función que devuelve una array con los dominios de un campo
  traerDominio(campo: string, datos: any){
    let dominio = [];

    //Dominio de centro de mando
    if(campo === "centro_mando") {
      for (let [key, value] of Object.entries(datos.centro_mando)) {
            dominio.push(key);
      }

    //Dominio de circuitos, dependiente del centro de mando
    } else if (campo === "circuito") {

      for (let [key, value] of Object.entries(datos.circuito)) {
        if(key === datos.elemento.centro_mando) {
          for(let [k, v] of Object.entries(value)) {
            dominio.push(v.nombre);
          }
        }
      }

    //Dominio de marcas de lámpara
    } else if (campo === "marca_lampara") {
      for (let [key, value] of Object.entries(datos.lamparas)) {
        dominio.push(key);
      }

    //Dominio de modelos de lámpara, dependiente de la marca
    } else if (campo === "modelo_lampara") {

      for (let [key, value] of Object.entries(datos.lamparas)) {
        if(key === datos.elemento.marca_lampara) {
          for(let [k, v] of Object.entries(value)) {
            dominio.push(v);
          }
        }
      }

    //Dominio de marcas de luminaria
    } else if (campo === "marca_luminaria") {
      for (let [key, value] of Object.entries(datos.luminarias)) {
        dominio.push(key);
      }

    //Dominio de modelos de luminaria, dependientes de la marca
    } else if (campo === "modelo_luminaria") {

      for (let [key, value] of Object.entries(datos.luminarias)) {
        if(key === datos.elemento.marca_luminaria) {
          for(let [k, v] of Object.entries(value)) {
            dominio.push(v);
          }
        }
      }

    //Dominio de marcas de soporte
    } else if (campo === "marca_soporte") {
      for (let [key, value] of Object.entries(datos.soportes)) {
        dominio.push(key);
      }

    //Dominio de modelos de soporte, dependiente de la marca
    } else if (campo === "modelo_soporte") {

      for (let [key, value] of Object.entries(datos.soportes)) {
        if(key === datos.elemento.marca_soporte) {
          for(let [k, v] of Object.entries(value)) {
            dominio.push(v);
          }
        }
      }

    //Dominios estandar
    } else {
      for (let [key, value] of Object.entries(datos.atributos)) {
        if(campo === key) {
          for(let [k, v] of Object.entries(value)) {
            dominio.push(v);
          }
        }
      }

    }

    //Devolvemos el dominio
    return dominio;

  }

  //Función lanzada cuando se edita un campo de atributo
  campoEditado(item, e) {

    //Guardamos el valor editado en la varible que contiene los atributos
    for(let atr of this.atributosEditables){
      if(atr === item){
        atr[4] = e;
      }
    }

    this.actualizarAtributosInterdependientes(item, e);

  }

  //Función que devuelve 0, necesaria en el ngfor para que no se ordene automáticamente
  returnZero() {
    return 0;
  }


  //Función lanzada al hacer click en sobre el botón guardar, para enviar los elementos editados al backend
  onClickGuardar() {

    let elementos = this.obtenerListaElementos();
    let atributosEditados = this.obtenerAtributosEditados();

    //Preparamos la petición para el backend
    const peticion = JSON.stringify({
      tipo: "web",
      usuario: sessionStorage.getItem('usuario'),
      clave_sesion: sessionStorage.getItem('clave_sesion'),
      plugin: sessionStorage.getItem('plugin'),
      funcion: "web_edicion_multiple",
      proyecto: this._projectService.project.nombre,
      proyeccion: this._projectService.project.proyeccion,
      modulo: this.capaSeleccionada.modulo,
      grupo: this.capaSeleccionada.grupo,
      capa: this.capaSeleccionada.nombre,
      id_elementos: elementos,
      atributos: atributosEditados
    });

    this.mapReady = false;
    //Hacemos la petición al backend
    this.servicioFisotec.conexionBackend(peticion).then((res) => {

      //Si la petición funciona correctamente
      if (!res.error) {

        this.onCerrar.emit();
          //Mostramos un mensaje por pantalla informando del éxito de la operación
          Swal.fire({
                    icon: "success",
                    title: "Editado",
                    text: "Los elementos seleccionados han sido editados con éxito.",
                    confirmButtonText: "OK",
                    heightAuto: false
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "ERROR",
                    text: res.msg_error,
                    confirmButtonText: "OK",
                    heightAuto: false
                }).then(() => {
                    if (res.msg_error.includes("expirada")) {
                        this.router.navigate(["/login"]);
                    }
                });
            }
    });

  }


  //Función que devolverá el primer elemento de los seleccionados para editar
  obtenerListaElementos(){
    let devolver = [];
    for(let valor of this.valores) {
      if(valor[1] == true) {
        devolver.push(valor[0]);
      }
    }

    return devolver;
  }

  obtenerAtributosEditados() {

    //Función que transformará un Map en un objeto que pueda ser transformado a JSON
    const mapToObj = m => {
      return Array.from(m).reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
      }, {});
  };

    let map = new Map<string, any>();

    //Recorremos los atributos para ir añadiéndolos al diccionario
    for(let atr of this.atributosEditables){

      //Comprobamos si el atributo a introducir es numérico, en cuyo caso lo parseamos a number
      if(atr[1] === "Número entero" || atr[1] === "Número real"){
        map.set(atr[2], +atr[4]);

      //Para el resto, los añadimos tal cual están
      } else {
        map.set(atr[2], atr[4]);
      }
    }

    return mapToObj(map);
  }

  //Actualizamos los selectores para los atributos que dependen de un atributo padre
  actualizarAtributosInterdependientes(item: any, valor: string) {

    //Centro de mando
    if(item[0] === "Centro mando"){
      let nuevoDominio = [];
      for (let atr of this.atributosEditables) {
        //Para el atributo centro de mando, se actualizará el selector de circuitos
        if(atr[0] === "Circuito") {
          for(let [key, value] of Object.entries(this.respuestaAtributos.datos.circuito)) {
            if(key === valor) {
              //Añadimos los nuevos circuitos al dominio
              for(let [k, v] of Object.entries(value)) {
                  nuevoDominio.push(v.nombre);
              }
            }
          }

          //Actualizamos la variable general de atributos
          atr[3] = nuevoDominio;
          atr[4] = nuevoDominio[0];
        }
      }
    }

    //Marca soporte
    if(item[0] === "Marca soporte"){
      let nuevoDominio = [];
      for (let atr of this.atributosEditables) {
        //Para el atributo marca soporte, se actualizará el selector de modelos
        if(atr[0] === "Modelo soporte") {
          for(let [key, value] of Object.entries(this.respuestaAtributos.datos.soportes)) {
            if(key === valor) {
              //Añadimos los nuevos modelos al dominio
              for(let [k, v] of Object.entries(value)) {
                  nuevoDominio.push(v);
              }
            }
          }

          //Actualizamos la variable general de atributos
          atr[3] = nuevoDominio;
          atr[4] = nuevoDominio[0];
        }
      }
    }

    //Marca luminaria
    if(item[0] === "Marca luminaria"){
      let nuevoDominio = [];
      for (let atr of this.atributosEditables) {
        //Para el atributo marca luminaria, se actualizará el selector de modelos
        if(atr[0] === "Modelo luminaria") {
          for(let [key, value] of Object.entries(this.respuestaAtributos.datos.luminarias)) {
            if(key === valor) {
              //Añadimos los nuevos modelos al dominio
              for(let [k, v] of Object.entries(value)) {
                  nuevoDominio.push(v);
              }
            }
          }

          //Actualizamos la variable general de atributos
          atr[3] = nuevoDominio;
          atr[4] = nuevoDominio[0];
        }
      }
    }

    //Marca lámpara
    if(item[0] === "Marca lámpara"){
      let nuevoDominio = [];
      for (let atr of this.atributosEditables) {
        //Para el atributo marca lámpara, se actualizará el selector de modelos
        if(atr[0] === "Modelo lámpara") {
          for(let [key, value] of Object.entries(this.respuestaAtributos.datos.lamparas)) {
            if(key === valor) {
              //Añadimos los nuevos modelos al dominio
              for(let [k, v] of Object.entries(value)) {
                  nuevoDominio.push(v);
              }
            }
          }

          //Actualizamos la variable general de atributos
          atr[3] = nuevoDominio;
          atr[4] = nuevoDominio[0];
        }
      }
    }

  }

    /* TOUR */

    public showTour():void
    {
      if( this.tourIsActive )
        return;
  
      this.buildTour();
  
      const removeMapRefDiv = () => {
        const mapRefDiv = document.getElementById("mapRefDiv");
        
        if( mapRefDiv )
          mapRefDiv.remove();
      }
  
      this._shepherdService.tourObject.on("cancel", removeMapRefDiv);
      this._shepherdService.tourObject.on("complete", removeMapRefDiv);
  
      this._shepherdService.start();
    }
  
    private buildTour():void
    {
      const that = this;    
    
      const steps = this.buildTourSteps();
  
      const buttons = [
        {
          classes: 'btn-info',
          text: 'Expandir recurso',
          action(){
            const mediaResources = document.querySelectorAll(".step-media");
            toggleFullscreen(mediaResources[mediaResources.length - 1]);
          }
        },
        {
          classes: 'btn-secondary',
          text: 'Atras',
          action(){
              that._shepherdService.back();
          }
        },
        {
          classes: 'btn-info',
          text: 'Siguiente',
          action(){
              that._shepherdService.next();
          }
        }
      ];
      
      const _steps = [];
  
      for( let i = 0, stepsLength = steps.length; i < stepsLength; i++ )
      {
        let _buttons = [...buttons]; 
        
        const step = steps[i];
  
        if( i === 0 )
        {
          _buttons = _buttons.slice(2);
        }
        else
        {
          if( ! step.hasMedia  )
            _buttons = _buttons.slice(1);  
        }
        
        if( i === (stepsLength - 1)  )
        {
          const lastBtnIndex = _buttons.length - 1;
          _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (mas a la derecha) siempre sera el de avanzar / finalizar.
          _buttons[lastBtnIndex].text = 'Finalizar';
          _buttons[lastBtnIndex].action = () => that._shepherdService.complete();
        }
        
        const _step = {
          id: step.element,
          attachTo: { 
            element: `${step.selectorPrefix ?? "#"}${step.element}`, 
            on: step.labelPosition
          },
          buttons: _buttons,
          title: `PASO ${i + 1}`,
          text: step.content,
          when: step.event ?? null,
          beforeShowPromise: step.beforeShowPromise ?? null
        };
  
        _steps.push(_step);
      }
  
      this._shepherdService.addSteps(_steps);
    }
  
    private buildTourSteps():any[]
    {
      const mapRefDiv = document.createElement("DIV");
  
      mapRefDiv.style.left = "2.5%";
      mapRefDiv.style.right = "32.5%";
      mapRefDiv.style.top = "0%";
      mapRefDiv.style.bottom = "0%";
      mapRefDiv.style.width = "40%";
      mapRefDiv.style.height = "50%";
      mapRefDiv.style.margin = "auto";
      mapRefDiv.style.border = "1px solid red";
      mapRefDiv.style.zIndex = "1200";
      mapRefDiv.style.position = "fixed";
      mapRefDiv.id = "mapRefDiv";
    
      const firstSteps = [
        {
          element: `layer-selector`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: 'Seleccionar <b>capa</b>.'
        },
        {
          element: `edit-multiple-elements-accept-btn`,
          labelPosition: "top",
          content: 'Para continuar con la selección de elementos hacer click en <span class="badge bg-info text-white">Siguiente</span>.',
          event: {
            "before-show": () => mapRefDiv.remove()
          }
        }
      ];

      if( this.thereIsMoreThanOneModule )
      {
        firstSteps.unshift(
          {
            element: `module-selector`,
            selectorPrefix: ".",
            labelPosition: "left",
            content: 'Seleccionar <b>modulo</b>.'
          },
          {
            element: `group-selector`,
            selectorPrefix: ".",
            labelPosition: "left",
            content: 'Seleccionar <b>grupo</b>.'
          },
  
        );
      }
  
      const secondSteps = [
        {
          element: `mapRefDiv`,
          labelPosition: "right-start",
          hasMedia: true,
          content: `
          <ol>
            <li class="mb-1"> Encerrar los elementos que se desean editar dentro de un polígono (<b>dibujarlo sobre el mapa</b>). </li>
            <li class="mb-1"> Una vez que estos sean ubicados serán resaltados y listados en la barra. </li>
            <li class="mb-1"> Podrá eliminar los elementos que no deseé editar destildando la casilla correspondiente. </li>
          </ol>
          Una vez que se hayan seleccionado los elementos, hacer click en <span class="badge bg-info text-white">Siguiente</span> para 
          seleccionar los atributos a editar.
          <br><br> 
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/edicion-de-multiples-elementos/1-dibujar-poligono.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video> 
          `,
          event: {
            "before-show": () => document.querySelector("body").appendChild(mapRefDiv)
          }
        },
        {
          element: `edit-multiple-elements-tool`,
          labelPosition: "left",
          hasMedia: true,
          content: `
          Los atributos serán listados en la barra en donde se podrá confirmar cuales editar o no, destildando la casilla correspondiente.
          Por defecto todos los atributos estarán seleccionados. <br>
          Una vez que se hayan seleccionado los atributos, hacer click en <span class="badge bg-info text-white">Siguiente</span> para editar.
          <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/edicion-de-multiples-elementos/2-seleccionar-atributos.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video>  
          `,
          event: {
            "before-show": () => mapRefDiv.remove()
          }
        },
        {
          element: `edit-multiple-elements-tool`,
          labelPosition: "left",
          hasMedia: true,
          content: `
          Los campos de atributos serán listados en la barra. Editar los valores y hacer click en <span class="badge bg-warning text-white">Guardar</span>
          para finalizar.
          <br><br>
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/edicion-de-multiples-elementos/3-editar-atributos.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video> 
          `,
          event: {
            "before-show": () => mapRefDiv.remove()
          }
        }
      ];

      
      return this.poligono ?
      secondSteps : // Si ya se esta dibujando el poligono mostrar solo los 2dos pasos.
      [...firstSteps, ...secondSteps]; // Si no hay ninguna accion realizada mostrar todos los pasos. 
    }
}
