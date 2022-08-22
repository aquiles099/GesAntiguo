import { Component, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { isset, delayExecution } from 'src/app/shared/helpers';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { TileLayer, tileLayer } from 'leaflet';
import { MapService } from '../../../../../../../services/unic/map.service';
import { Capa } from '../../../../../../../interfaces/medium/mapa/Modulo';
import Swal from 'sweetalert2';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../shared/helpers';
import { ApiService } from '../../../../../../../services/api.service';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';

@Component({
  selector: 'herramienta-tabla-de-elementos',
  templateUrl: './tabla-de-elementos.component.html',
  styleUrls: ['./tabla-de-elementos.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class TablaDeElementosComponent  extends HideableSectionComponent implements OnDestroy
{  
  public formData:any = {
    module: null,
    grpup: null,
    layer: null
  };

  public capaSeleccionada:Capa = null;

  public busqueda:string = null;
  public atributos:any[] = [];
  public cargandoAtributos:boolean = false;

  public atributosSeleccionados:string[] = [];
  public atributosConValores:{[nombreAtributo:string]:string[]}[] = [];

  public mostrarSpinner:boolean = false;
  public mostrandoAtributosConValores:boolean = false;

  public valoresDeAtributosParaFiltro:{[nombreAtributo:string]:string} = {};

  public mostrarTablaDeDatos:boolean = false;
  
  @ViewChild(DataTableDirective)
  public dtElement: DataTableDirective;
  
  public dtOptions: any = {}; 
  public dtTrigger: Subject<any>; 
  
  private capaElementoResaltado:TileLayer;
  private filaResaltada:HTMLElement;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  constructor(
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private _projectLayersService:ProjectLayersService,
    private _mapService:MapService,
    private _shepherdService:ShepherdService,
    private _apiService:ApiService
  )
  {
    super();
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }
  
  get soloHayUnModulo():boolean
  {
    return this._projectLayersService.thereIsOnlyOneModule;
  }
 
  get hayMasDeUnModulo():boolean
  {
    return this._projectLayersService.thereIsMoreThanOneModule;
  }

  public alCambiarSelectorDeModuloOGrupo():void
  {
    this.capaSeleccionada = null;
    this.atributos = [];
  }

  public async alCambiarSelectorDeCapas(capa:Capa):Promise<void>
  {
    try
    {
      this.mostrarSpinner = true;
      this.cargandoAtributos = true;

      this.capaSeleccionada = capa;

      this.atributos = [];
      this.atributosSeleccionados = [];
      this.busqueda = null;

      this.atributos = (await this._apiService.postWithAuthentication({
          "funcion": "web_lista_atributo",
          "proyecto": this._projectService.project.nombre,
          "modulo": this.capaSeleccionada.modulo,
          "grupo": this.capaSeleccionada.grupo,
          "capa": this.capaSeleccionada.nombre
        }) ).datos.atributos; 

    }
    catch (error)
    {
      //this._toastrService.error(error.message);  
      Swal.fire({
        icon: "info",
        title: "Error",
        text: "Debe configurar algún atributo para esta herramienta.",
        confirmButtonText: "OK",
        heightAuto: false
      });
    }
    finally
    {
      this.cargandoAtributos = false;
      this.mostrarSpinner = false;
    }
  }

  public actualizarAtributosSeleccionados(nombreAtributo:string):void
  {
    this.atributoEstaSeleccionado(nombreAtributo) ?
    this.atributosSeleccionados = this.atributosSeleccionados.filter(_nombreAtributo => _nombreAtributo !== nombreAtributo) :
    this.atributosSeleccionados = [...this.atributosSeleccionados, nombreAtributo];
  }

  public atributoEstaSeleccionado(nombreAtributo):boolean
  {
    return this.atributosSeleccionados.includes(nombreAtributo);
  }

  public async mostrarSeccionValoresDeAtributos():Promise<void>
  {
    try
    {
      this.mostrarSpinner = true;

      this.atributosConValores = [...(await this._apiService.postWithAuthentication({
          "funcion": "web_lista_atributo_dominio",
          "proyecto": this._projectService.project.nombre,
          "modulo": this.capaSeleccionada.modulo,
          "grupo": this.capaSeleccionada.grupo,
          "capa": this.capaSeleccionada.nombre,
          "atributos": this.atributosSeleccionados
        }) ).datos];

        this.atributosConValores = this.atributosConValores.map(atributoConValores => {

          atributoConValores.valores = atributoConValores.valores.filter(valor => isset(valor));

          return atributoConValores;

        });

        this.mostrandoAtributosConValores = true;
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message);  
    }
    finally
    {
      this.mostrarSpinner = false;
    }
  }

  public atributosParaFiltrarTienenValoresSeleccionados():boolean
  {
    return Object.values(this.valoresDeAtributosParaFiltro).every(valor => isset(valor));
  }

  public async mostrarTablaDeElementosFiltrados():Promise<void>
  {
    try
    {
      this.mostrarSpinner = true;

      const elementos = (await this._apiService.postWithAuthentication({
          "funcion": "web_busqueda_atributos",
          "proyecto": this._projectService.project.nombre,
          "modulo": this.capaSeleccionada.modulo,
          "grupo": this.capaSeleccionada.grupo,
          "capa": this.capaSeleccionada.nombre,
          "busqueda": this.valoresDeAtributosParaFiltro
        }) ).datos.lista;

        if(!elementos.length)
          throw new Error("No hay elementos para los criterios seleccionados.");

        this.construirDataTable(elementos);

        this.mostrarTablaDeDatos = true;

        await delayExecution(250);
        
        this.dtTrigger.next();
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message);  
    }
    finally
    {
      this.mostrarSpinner = false;
    }
  }
  
  public construirDataTable(datos:Array<any>):void
  {
    this.dtTrigger = new Subject(); 

    const titulosDeColumnas = Object.keys(datos[0]);

    titulosDeColumnas.unshift("busqueda");

    const columnas = titulosDeColumnas.map((nombreAtributo, indice) => {
      return {
        data: nombreAtributo,
        name: nombreAtributo,
        responsivePriority: indice,
        title: nombreAtributo !== "busqueda" ? nombreAtributo.split('_').filter(palabra => palabra).map(palabra => palabra[0].toUpperCase() + palabra.slice(1)).join(" ") : "",
        searchable: nombreAtributo !== "busqueda" ? true : false,
        orderable: nombreAtributo !== "busqueda" ? true : false,
        type: nombreAtributo === "busqueda" ? "html" : "string"
      };
    });

    datos = datos.map((elemento, i) => {

      elemento["busqueda"] = elemento[`id_${this.capaSeleccionada.nombre_formateado}`] ?
      `<img src="assets/icons/SVG/LUPA.svg" data-id="${elemento[`id_${this.capaSeleccionada.nombre_formateado}`]}" 
      class="icon pointer ubicar-elemento magnifying-glass" alt="lupa" title="Ubicar elemento en el mapa.">` :
      `<i class="icon fas fa-ban" title="Id no proporcionado.">`;

      return elemento;

    });

    this.dtOptions = {
      stripeClasses: [],
      pagingType: 'full_numbers',
      pageLength: 10,
      scrollY: this.obtenerTamañoDeCuerpoDeTablaDeDatos(),
      scrollX: true,
      scrollCollapse: true,
      data: datos,
      order: [[1,'desc']],
      serverSide: false,
      processing: true,
      columns: columnas,
      buttons: [],
      autoWidth: false,
      dom: 'Brtip',
      language: {
        processing: "Procesando...",
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ elementos",
        info: "Mostrando desde _START_ al _END_ de _TOTAL_ elementos",
        infoEmpty: "Mostrando ningún elemento.",
        infoFiltered: "(filtrado _MAX_ elementos total)",
        infoPostFix: "",
        loadingRecords: "Cargando registros...",
        zeroRecords: "No se encontraron registros",
        emptyTable: "No hay datos disponibles en la tabla",
        paginate: {
          first: "Primero",
          previous: "Anterior",
          next: "Siguiente",
          last: "Último"
        },
        aria: {
          sortAscending: ": Activar para ordenar la tabla en orden ascendente",
          sortDescending: ": Activar para ordenar la tabla en orden descendente"
        }
      }
    };

  }

  private obtenerTamañoDeCuerpoDeTablaDeDatos():string
  {
    const screenWidth = (window as any).visualViewport ? (window as any).visualViewport.width : window.screen.width;
  
    let scrollY;

    switch(true)
    {
      case screenWidth > 1600:
        scrollY = "22.5vh";
        break;
      case screenWidth <= 1600 && screenWidth > 768:
        scrollY = "19vh";
        break;
      case screenWidth <= 768:
        scrollY = "17vh";
        break;
    }

    return scrollY; 
  }

  public obtenerEtiquetaDeFiltro():string
  {
    const atributos = Object.keys(this.valoresDeAtributosParaFiltro).map(nombreAtributo => `"${nombreAtributo}"`).join(', ');

    return `Filtrado por: "${this.capaSeleccionada.grupo}", "${this.capaSeleccionada.nombre}", "${atributos}`;
  }

  public filtrarElementosEnTablaDeDatos(evento):void
  {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.search(evento.target.value.trim());
      dtInstance.draw();
    });
  }

  public async alHacerClickEnTablaDeDatos(evento:any):Promise<void>
  {
    if( evento.target.classList.contains("ubicar-elemento")  && ! this.tourIsActive )
    {
      try
      {
        this.mostrarSpinner = true;

        const idLuminaria = evento.target.getAttribute('data-id');
  
        const bboxElemento = (await this._apiService.postWithAuthentication({
            "funcion": "web_busqueda_elemento_bbox",
            "proyecto": this._projectService.project.nombre,
            "modulo": this.capaSeleccionada.modulo,
            "grupo": this.capaSeleccionada.grupo,
            "capa": this.capaSeleccionada.nombre,
            "elemento": idLuminaria
          }) ).datos.bbox;

        if( this.filaResaltada )
          this.filaResaltada.classList.remove('table-active');

        this.filaResaltada = evento.target.parentElement.parentElement;

        this.filaResaltada.classList.add('table-active');

        this._mapService.map.flyToBounds(([
          (bboxElemento as number[]).slice(0,2).reverse(),
          (bboxElemento as number[]).slice(2,4).reverse()
        ] as any),{ maxZoom: 20, duration: .50});
  
        if( this.capaElementoResaltado )
          this._mapService.map.removeLayer(this.capaElementoResaltado);

        const wmsOptions = {
          layers:  this.capaSeleccionada.filtro_capa.split("#").join("_"),
          styles: "buffer_linea",
          className: "informacion_seleccionado",
          format: 'image/png',
          crossOrigin: true,
          transparent: true,
          opacity: 1,
          maxNativeZoom: 22,
          maxZoom: 22,
          cql_filter: `id_${this.capaSeleccionada.nombre_formateado}='${idLuminaria}'`,
          env: "buffer:30"
        };

        this.capaElementoResaltado = tileLayer.wms(this._projectService.baseUrl, wmsOptions);

        this._mapService.map.addLayer(this.capaElementoResaltado);

      }
      catch (error)
      {
        console.error(error);
        this._toastrService.error(error.message);  
      }
      finally
      {
        this.mostrarSpinner = false;
      }
    }
  };

  public mostrarSeccionInicial():void
  {
    this.busqueda = null;
    this.atributosSeleccionados = [];
    this.atributosConValores = [];
    this.valoresDeAtributosParaFiltro = {};
    this.mostrandoAtributosConValores = false;
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    if( this.capaElementoResaltado )
      this._mapService.map.removeLayer(this.capaElementoResaltado);

    this.capaSeleccionada = null;
    this.atributos = [];
    this.cargandoAtributos = false;
    this.mostrarTablaDeDatos = false;
    this.mostrarSeccionInicial();
    this.filaResaltada = null;

    //
    this._shepherdService.tourObject = null;

    await super.hide();
  }

  public ngOnDestroy():void
  {   
    if( this.dtTrigger )
      this.dtTrigger.unsubscribe();
  }

   /* TOUR */

   public showTour():void
   {
     if( this.tourIsActive )
       return;
 
     this.buildTour();
 
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
           element: `${ step.selectorPrefix ?? "#"}${step.element}`, 
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
     const steps = [];

      const tableTourSteps = [
        {
          element: `elements-table-filter-tag`,
          labelPosition: "top",
          content: 'Aquí se podrá ver el filtro aplicado sobre la capa (<b>grupo</b>, <b>capa</b>, <b>...atributos</b>).'
        },
        {
          element: `elements-table-container`,
          labelPosition: "top",
          content: 'Puede <b>desplazarse de forma vertical y horizontal</b> sobre la tabla para ver la información de los elementos.'
        },
        {
          element: `elements-table-head`,
          labelPosition: "top",
          content: `
          Para organizar los elementos de forma ascendente o descendente (de forma alfabética para textos y por valor en caso de números)
          en base a una columna <b>hacer click sobre el título de ésta</b>.
          `
        },
        {
          element: `magnifying-glass`,
          selectorPrefix:".",
          labelPosition: "right",
          content: 'Para ubicar el elemento sobre el mapa hacer click sobre la lupa de la fila.'
        },
        {
          element: `elements-table-filter`,
          labelPosition: "top",
          content: 'Filtre los elementos de la tabla colocando algún valor en el buscador.'
        },
        {
          element: `dataTables_info`,
          selectorPrefix: ".",
          labelPosition: "top",
          content: `Aquí se podrá ver el número de elementos por <b>página</b> y el <b>total</b>.`
        },
        {
          element: `dataTables_paginate`,
          selectorPrefix: ".",
          labelPosition: "top",
          content: `Muevase entre el contenido de la tabla desde las opciones de paginación.`
        }
      ];
  
        
      const toolFirstSteps = [
        {
          element: `layer-selector`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: 'Seleccionar <b>capa</b> y esperar a que se carguen sus atributos.'
        },
        {
          element: `elements-table-attributes-list`,
          labelPosition: "top",
          hasMedia: true,
          content: `
          Seleccionar los atributos que se usarán para filtrar los elementos de la capa 
          y hacer click en <span class="badge bg-warning text-white">Continuar</span> para 
          mostrar la sección donde asignará los valores de filtro.
          <br><br> 
          <div style="display: none">Error al cargar video.</div>
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/tabla-de-elementos/4-seleccionar-atributos.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video>
          `
        }
      ];

    if( this.hayMasDeUnModulo )
    {
      toolFirstSteps.unshift(
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
        }
      );
    }

    const toolSecondSteps = [
      {
        element: `elements-table-tool`,
        labelPosition: "left",
        hasMedia: true,
        content: `
        Una vez que se muestre la sección, asignar los valores para filtrar los elementos que irán en la tabla y
        hacer click en <span class="badge bg-info text-white">Buscar</span>
        para mostrar la mencionada.
        <br>
        Si no hay elementos con los valores especificados se mostrara un mensaje de error.
        <br><br> 
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/tabla-de-elementos/5-agregar-valores.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video> 
        `
      }
    ];

    if( this.mostrarTablaDeDatos )
    {
      steps.push(...tableTourSteps);
    }
    else
    {
      this.mostrandoAtributosConValores ?
      steps.push(...toolSecondSteps) :
      steps.push(...toolFirstSteps, ...toolSecondSteps);
    }
     
     return steps;
   }

}
