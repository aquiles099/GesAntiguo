import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DrawMap, featureGroup, FeatureGroup, Draw, drawLocal, DrawEvents } from 'leaflet';
import { HideableSectionComponent } from 'src/app/components/shared/hideable-section/hideable-section.component';
import { ProjectLayersService } from 'src/app/services/medium/project-layers.service';
import { isset } from 'src/app/shared/helpers';
import Swal from 'sweetalert2';
import { ShepherdService } from 'angular-shepherd';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { toggleFullscreen } from '../../../../../../../shared/helpers';
import LeafletWms from 'leaflet.wms';
@Component({
  selector: 'app-control-obra-definir-instalador',
  templateUrl: './control-obra-definir-instalador.component.html',
  styleUrls: ['./control-obra-definir-instalador.component.css', '../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class ControlObraDefinirInstaladorComponent extends HideableSectionComponent implements OnInit
{
  
  public primeraVista: boolean = true;
  public segundaVista: boolean = false;
  public terceraVista: boolean = false;
  
  mostrarMensajeEmpezar: boolean = false;
  public dataSelectoresFiltro: any = [];
  listadoEmpresa: any[] = [];
  nombreEmpresaSeleccionada: string;
  filtroActual = new Map<string, string>();
  filtroCapa = new Map<string, string[]>();
  cqlFilter: string = "";
  cqlFilterBase: string = "";
  cqlDefecto: string = "";
  peticionCapa: string = 'luminaria';

  @Input()
  layers: any[];
  
  @Input()
  public map: DrawMap;

  public toggleSectionVisibility: EventEmitter<void> = new EventEmitter;
  peticionAtributo: string;
  poligono: Draw.Polygon;
  public drawOptions: any;
  
  @Input()
  capaDeElementosDibujados: FeatureGroup = featureGroup();

  @Output()
  onCerrar: EventEmitter<any> = new EventEmitter();

  checkTodosAtr: boolean = true;
  valores = [];
  atributos = [];
  activarSiguiente: boolean = false;
  activarSiguienteEle: boolean = false;
  activarSiguienteAtr: boolean = false;
  checkTodos: boolean = true;

  public showSpinner: boolean = false;
  private capaDeElementosResaltados:any;

  private alDibujarPoligono: (event: any) => void = event => 
  {
    this.mostrarMensajeEmpezar = false;

    this.capaDeElementosDibujados.addLayer((event as DrawEvents.Created).layer);
    this.map.flyToBounds(this.capaDeElementosDibujados.getBounds(), { maxZoom: this.map.getZoom(), duration: .50 });

    this.llamadaBackendDibujoTerminado(event.layer._latlngs);
  }

  constructor(
    private router: Router,
    private changeDetector: ChangeDetectorRef,
    private _projectLayersService: ProjectLayersService,
    private _projectService: ProjectService,
    private _projectsService: ProjectsService,
    private _shepherdService: ShepherdService,
    private _toastrService: ToastrService,
    private _spinnerService: SpinnerService
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

  get tourIsActive(): boolean {
    return this._shepherdService.isActive;
  }

  get project(): Project {
    return this._projectService.project;
  }

  public ngOnInit(): void
  {
    let urlBase = this.project.url_base.split('wms?')[0] + "wms?";

    this.capaDeElementosResaltados = LeafletWms.overlay(urlBase, {
      layers: 'gissmart_energy_gestlighting_luminaria',
      styles: "buffer_linea",
      className: "informacion_seleccionado",
      format: 'image/png',
      crossOrigin: true,
      transparent: true,
      opacity: 1,
      maxNativeZoom: 22,
      maxZoom: 22,
      cql_filter: null,
      env: "buffer:50",
    });
  }

  public async show(): Promise<void>
  {
    this.map.addLayer(this.capaDeElementosResaltados);

    this.capaDeElementosResaltados.bringToBack();

    this.map.on('draw:created', this.alDibujarPoligono);

    await super.show();

    this.filtrarLuminariasConInstalacionesFuturasDefinidas();
    this.obtenerAtributosParaFiltrarLuminarias();
  }

  private filtrarLuminariasConInstalacionesFuturasDefinidas(): void {
    //Guardamos el filtro que hay activo en ese momento para luminaria, para al salir dejarlo así
    this.cqlFilterBase = "";
    for (let [key, value] of Object.entries(this._projectLayersService.obtenerFiltrosDeCapas())) {
      if (key === "gissmart_energy#gestlighting#luminaria") {
        this.cqlFilterBase = value;
      }
    }

    this.cqlDefecto = "";
    //Si no había ningún filtro previo
    if (this.cqlFilterBase === "" || this.cqlFilterBase === "(include)") {
      this.cqlFilter = "estado_instalacion = 'DEFINIDO' OR estado_instalacion= 'ASIGNADO'";
      this.cqlDefecto = "estado_instalacion = 'DEFINIDO' OR estado_instalacion= 'ASIGNADO'";
    } else {
      this.cqlFilter = "(" + this.cqlFilterBase + ") AND (estado_instalacion = 'DEFINIDO' OR estado_instalacion= 'ASIGNADO')";
      this.cqlDefecto = "(" + this.cqlFilterBase + ") AND (estado_instalacion = 'DEFINIDO' OR estado_instalacion= 'ASIGNADO')";
    }

    for (let l of this.layers) {

      if (l.wmsParams.className === this.peticionCapa) {
        l.setParams({ cql_filter: "(" + this.cqlFilter + ")" });
      }
      if (l.wmsParams.className === "control_obra") {
        l.setParams({ cql_filter: "(" + this.cqlFilter + ")" });
      }
    }

  }

  public async obtenerAtributosParaFiltrarLuminarias(): Promise<void> {
    try
    {
      this.showSpinner = true;

      const response = await this._projectsService.consultarApi({
        funcion: 'web_luminaria_luminaria_filtros_futuro',
        id_proyecto: this.project.id_proyecto,
        proyecto: this.project.nombre
      });

      response.filtro_control_obra.forEach((selector) => {

        selector.valores.unshift("(Sin filtro)");

        this.dataSelectoresFiltro.push({
          nombre: selector.nombre,
          nombre_formateado: selector.nombre_formateado,
          valores: selector.valores.filter(valor => isset(valor))
        });

      });

    }
    catch (error) {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
    finally {
      this.showSpinner = false;
      this.changeDetector.detectChanges();
    }
  }

  filtroSeleccionado(valor, tipoFiltrado) {
    this.peticionAtributo = tipoFiltrado;
    this.filtroActual.set(tipoFiltrado, valor);
    this.actualizarLayer();
  }

  actualizarLayer() {
    let cqlfilter = "";

    for (let filtro of this.filtroActual) {
      if (filtro[1] !== "(Sin filtro)") {
        let fil = filtro[0] + "=" + "'" + filtro[1] + "' AND ";
        cqlfilter = cqlfilter + fil;
      }

    }

    if (cqlfilter === "") {
      this.cqlFilter = this.cqlDefecto;
      cqlfilter = "(" + this.cqlDefecto + ")";
    } else {
      this.cqlFilter = "(" + this.cqlDefecto + ") AND " + cqlfilter.slice(0, -5);
      cqlfilter = "(" + "(" + this.cqlDefecto + ") AND " + cqlfilter.slice(0, -5) + ")";
    }


    for (let l of this.layers) {

      if (l.wmsParams.className === this.peticionCapa) {
        l.setParams({ cql_filter: cqlfilter });
      }
      if (l.wmsParams.className === "control_obra") {
        l.setParams({ cql_filter: cqlfilter });
      }
    }
  }

  onClickSiguienteCapaSeleccionada() {
    this.mostrarMensajeEmpezar = true;
    this.primeraVista = false;
    this.segundaVista = true;
    this.dibujarPoligono();
  }


  private dibujarPoligono():void
  {
    this.map.doubleClickZoom.disable();
    this.poligono = new Draw.Polygon(this.map, this.drawOptions.draw.polygon);
    this.poligono.enable();
  }

  // //Función para llamar al backend al terminar el dibujo
  private async llamadaBackendDibujoTerminado(objetoCoordenadas: any):Promise<void>
  {
    try
    {
      this.showSpinner = true;
      this.changeDetector.detectChanges();

      const response = await this._projectsService.consultarApi({
        funcion: "web_luminaria_luminaria_seleccion_futuro",
        proyecto: this.project.bd_proyecto,
        proyeccion: this.project.proyeccion,
        geometria: objetoCoordenadas,
        filtro_activo: this.cqlFilter
      });

      let elementos = [];
      
      this.valores = [];
      
      for (let elemento of response.datos.luminarias)
      {
        elementos.push(elemento);
        this.valores.push([elemento, true]);
      }

      if (elementos.length > 0)
      {
          this.activarSiguienteEle = true;
          this.checkTodos = true;

          //Resaltamos los elementos recibidos del backend
          this.resaltarElementosSeleccionados(elementos);
      } 
      else
      {
        this.segundaVista = false;
        this.capaDeElementosDibujados.clearLayers();
        
        //Mostramos un mensaje indicando el error
        Swal.fire({
          icon: "error",
          title: "ERROR",
          text: "No se ha encontrado ningún elemento en el área seleccionada.",
          confirmButtonText: "OK",
          heightAuto: false
        });

        this.onClickSiguienteCapaSeleccionada();
      }
    }
    catch(error)
    {
      //Mostramos un mensaje indicando el error
      await Swal.fire({
        icon: "error",
        title: "ERROR",
        text: error.message,
        confirmButtonText: "OK",
        heightAuto: false
      });

      error.message.includes("expirada") ?
      this.router.navigate(["/login"]):
      this.onCerrar.emit();
    }
    finally
    {
      this.showSpinner = false;
      this.changeDetector.detectChanges();
    }
  }

  //Función para resaltar los elementos seleccionados
  resaltarElementosSeleccionados(elementos: any)
  {
    let filtro = "";

    //Construimos el string para el fitro, con los elementos recibidos
    for (let elemento of elementos)   
      filtro = filtro + " OR id_" + "luminaria" + "='" + elemento + "'";

    filtro = filtro.substring(4);
    
    this.capaDeElementosResaltados.wmsParams.cql_filter = filtro || "id_luminaria='????'";
    this.capaDeElementosResaltados.setParams(({fake: Date.now()} as any));
  }


  //Al pulsar el check de TODOS en la selección de atributos
  selectTodosAtributos(e) {

    this.checkTodosAtr = !this.checkTodosAtr;

    //Modificamos la lista de valores para el checklist, actualizando su estado (true o false)
    for (let atributo of this.atributos) {
      atributo[1] = this.checkTodosAtr;
    }

    //Si hemos activado el check de TODOS
    if (this.checkTodosAtr)
    {
      this.activarSiguienteAtr = this.atributos.length > 0;
    } 
    else
    {
      this.activarSiguienteAtr = false;
    }

    this.changeDetector.detectChanges();

  }
  //Evento que se lanza al seleccionar un valor de la check list
  eventoValorSeleccionado(e, val) {

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

    this.activarSiguienteEle = nuevosElementos.length > 0;

    this.checkTodos = this.valores.length === nuevosElementos.length;

    this.resaltarElementosSeleccionados(nuevosElementos);

    this.changeDetector.detectChanges();
  }

  private async obtenerEmpresas():Promise<void>
  {
    try
    {
      this.showSpinner = true;

      const response = await this._projectsService.consultarApi({
        funcion: 'web_lista_empresas'
      });

      this.listadoEmpresa = response.datos.empresas;

      this.changeDetector.detectChanges();
    }
    catch(error)
    {
      await Swal.fire({
        icon: "error",
        title: "ERROR",
        text: error.message,
        confirmButtonText: "OK",
      });

      error.message.includes("expirada") ?
      this.router.navigate(["/login"]) :
      this.onCerrar.emit();
      
    }
    finally
    {
      this.showSpinner = false;
      this.changeDetector.detectChanges();
    }
  }

  public async onGuardar():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Guardando información...");
      this._spinnerService.show();

      let elementosEnviar = [];
      
      this.valores.forEach((valor) => {
        
        if (valor[1]) 
          elementosEnviar.push(valor[0]);
        
      });

      const response = await this._projectsService.consultarApi({
        funcion: 'web_definir_empresa_luminaria',
        tipo: 'web',
        proyecto: this.project.nombre,
        luminarias: elementosEnviar,
        division: this.nombreEmpresaSeleccionada
      });

      Swal.fire({
        icon: "success",
        title: "Instalacion",
        text: response.datos.msg,
        confirmButtonText: "OK",
        heightAuto: false
      });

      this.onClickCancelar();
    }
    catch(error)
    {
      Swal.fire({
        icon: "error",
        title: "ERROR",
        text: error.message,
        confirmButtonText: "OK",
        heightAuto: false
      });

      //Si el error es por sesión expirada, redirigimos al usuario al login
      error.message.includes("expirada") ?
      this.router.navigate(["/login"]) :
      this.onCerrar.emit();
      
    }
    finally
    {
      this._spinnerService.cleanText();
      this._spinnerService.hide();
      this.changeDetector.detectChanges();
    }
  }

  //Al pulsar el check de TODOS
  selectTodos(e) {
    this.checkTodos = !this.checkTodos;

    //Modificamos la lista de valores para el checklist, actualizando su estado (true o false)
    for (let valor of this.valores) {
      valor[1] = this.checkTodos;
    }


    //Si hemos activado el check de TODOS
    let elementos = [];

    if (this.checkTodos) {

      for (let valor of this.valores) {
        elementos.push(valor[0]);
      }
      
      this.activarSiguienteEle = true;
      
      //Si hemos desactivado el check de todos
    } else {
      this.activarSiguienteEle = false;
    }

    this.resaltarElementosSeleccionados(elementos);

    this.changeDetector.detectChanges();

  }

  public async onSiguente():Promise<void>
  {
    if (this.activarSiguienteEle)
    {
      await this.obtenerEmpresas();
      this.segundaVista = false;
      this.terceraVista = true;
    }
  }

  onClickCancelar(): void {

    this.onCerrar.emit();

  }

  //Se lanza al cerrar la herramienta
  public async hide(): Promise<void>
  {
    this.filtroActual.clear();

    for (let l of this.layers) {
      if (l.wmsParams.className === this.peticionCapa || l.wmsParams.className === "control_obra") {

        if (this.cqlFilterBase === "") {
          delete l.wmsParams.cql_filter;
          l.setParams(({ fake: Date.now() } as any));
        } else {
          l.setParams({ cql_filter: this.cqlFilterBase });
        }
      }

    }

    this.cqlFilter = "";
    this.checkTodosAtr = true;
    this.activarSiguiente = false;
    this.activarSiguienteAtr = false;
    this.checkTodos = true;
    this.mostrarMensajeEmpezar = false;
    this.activarSiguienteEle = false;
    
    this.primeraVista = true;
    this.segundaVista = false;
    this.terceraVista = false;
    
    this.dataSelectoresFiltro = []; 
    this.valores = [];
    this.atributos = [];

    //Volvemos a activar el doble click en el mapa, cancelamos el dibujo (si estuviera haciéndose) y borramos el polígono sobre el mapa (si lo hubiera)
    this.map.doubleClickZoom.enable();

    if (this.poligono)
    {
      this.poligono.disable();
      this.poligono = null;
    }
    
    this.capaDeElementosDibujados.clearLayers();

    (this.capaDeElementosResaltados.wmsParams as any).cql_filter = null;
    this.map.removeLayer(this.capaDeElementosResaltados);

    this._shepherdService.tourObject = null;

    this.map.off('draw:created', this.alDibujarPoligono);

    await super.hide();
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
           text: 'Expandir recursos',
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
          step.hasMedia ?
          _buttons.splice(1,1) :
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
            element: `#${step.element}`, 
            on: step.labelPosition
          },
          buttons: _buttons,
          title: `PASO ${i + 1}`,
          text: step.content,
          when: step.event
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
  
      const steps = [];
  
      const firstSteps = [
        {
            element: `define-luminary-installer-tool`,
            labelPosition: "left",
            content: `
            Para definir un instalador de obra:
            <ol class="mt-2">
             <li class="mb-1">Ubicar luminarias en el mapa.</li>
             <li class="mb-1">Seleccionarlas dibujando un polígono que las encierre (<b>Ver paso 5 - seleccionar luminarias</b>).</li>
             <li class="mb-1">Definir empresa que realizará las instalaciones.</li>
            </ol> 
            Al abrir la herramienta solo se mostrarán en el mapa, las <b>luminarias con instalaciones futuras definidas</b>
            (ver botón <img class="d-inline small-icon" src="assets/icons/DEFINIRLUMINARIAFUTURA.svg">). 
            `
          },
          {
            element: `attributes-selector`,
            labelPosition: "left",
            content: `
             Para ubicar las luminarias con mayor facilidad, puede filtrar los elementos de la capa
             por valores  en sus atributos.
            `
          },
          {
            element: `attributes-selector`,
            hasMedia: true,
            labelPosition: "left-end",
            content: `
             Si no hay atributos de filtro habilitados, se pueden habilitar en la vista de 
             <b>gestión de atributos</b>.
             <br><br>
             <div style="display: none">Error al cargar video.</div>
             <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                   class="step-media" loop autoplay muted>
               <source src="assets/images/medium/tours/herramientas/definir-luminaria-futura/3-habilitar-atributos.mp4" type="video/mp4">
               Tu navegador no soporta videos.
             </video> 
            `
          },
          {
            element: `drawPolygonBtn`,
            labelPosition: "top",
            content: `
             Para continuar con la <b>seleccion de luminarias</b> 
             hacer click en <span class="badge bg-warning text-white">Continuar</span>.
            `
          }
      ];
     
       const secondSteps = [
          {
            element: `mapRefDiv`,
            hasMedia: true,
            labelPosition: "auto-start",
            content: `
            Para seleccionar las luminarias en el mapa, encerrarlas dentro de un polígono.
            <br><br>
            Para dibujar polígono, hacer click sobre el mapa para crear sus vértices y para terminarlo
            hacer click en el vértice inicial.
            <br><br>
            <div style="display: none">Error al cargar video.</div>
            <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                  class="step-media" loop autoplay muted>
              <source src="assets/images/medium/tours/herramientas/definir-instalador-luminaria/5-seleccionar-elementos.mp4" type="video/mp4">
              Tu navegador no soporta videos.
            </video> 
            `,
            event: {
              "before-show": () => document.querySelector("body").appendChild(mapRefDiv),
              "before-hide": () => mapRefDiv.remove()
              }
            },
            {
              element: `define-luminary-installer-tool`,
              hasMedia: true,
              labelPosition: "left",
              content: `
              <ul>
                <li class="mb-1">
                  Las luminarias resaltadas serán listadas en la barra.
                </li>
                <li class="mb-1">
                  Puede deseleccionar elementos destildando la casillas correspondientes.
                </li>
                <li class="mb-1">
                  Para continuar con la asignación de instalador, 
                  hacer click en <span class="badge bg-info text-white">Siguiente</span>.
                </li>
              </ul>
              <div style="display: none">Error al cargar video.</div>
              <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                    class="step-media" loop autoplay muted>
                <source src="assets/images/medium/tours/herramientas/definir-instalador-luminaria/6-confirmar-elementos.mp4" type="video/mp4">
                Tu navegador no soporta videos.
              </video> 
              `
            }
        ];
  
      const thirdSteps = [
        {
            element: `define-luminary-installer-tool`,
            labelPosition: "left-start",
            hasMedia: true,
            content: `
            <ol>
             <li class="mb-1">
               Se listarán las empresas registradas en la seccion de <b>administrar empresas</b> 
               (<b>ver botón en menu lateral del home</b>).
             </li>
             <li class="mb-1">
               Seleccionar la empresa y 
               hacer click en <span class="badge bg-info text-white">Guardar</span>. 
             </li>
             <li class="mb-1">
               Mientras el <b>control de obras</b> (botón <img class="d-inline small-icon" src="assets/icons/REVISIONLUMINARIA_BLACK.svg">)
               este activado, se resaltarán <b>dentro de un circulo gris</b>, las luminarias con instaladores asignados. 
             </li>
            </ol>
            <div style="display: none">Error al cargar video.</div>
            <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                  class="step-media" loop autoplay muted>
              <source src="assets/images/medium/tours/herramientas/definir-instalador-luminaria/7-asignar-empresa.mp4" type="video/mp4">
              Tu navegador no soporta videos.
            </video> 
            `
          }
      ];
  
      switch(true)
      {
        case this.primeraVista:
          steps.push(...firstSteps, ...secondSteps, ...thirdSteps);  
        break
        
        case this.segundaVista:
          steps.push(...secondSteps, ...thirdSteps);  
        break
  
        case this.terceraVista:
          steps.push(...thirdSteps);  
        break
      }
  
       return steps;
     }

}
