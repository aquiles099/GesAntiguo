import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { Options as SortableJsOptions } from 'sortablejs';
import { SpinnerService } from '../../../../../../../../../services/spinner.service';
import { Project } from '../../../../../../../../../interfaces/project';
import { ToastrService } from 'ngx-toastr';
import { ShepherdService } from 'angular-shepherd';
import { AttributeCreationModalComponent } from './attribute-creation-modal/attribute-creation-modal.component';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../../../../../../../../services/unic/project.service';
import { Modulo, Grupo, Capa } from '../../../../../../../../../interfaces/medium/mapa/Modulo';
import { ApiService } from '../../../../../../../../../services/api.service';

@Component({
  templateUrl: './attribute-settings.component.html',
  styleUrls: [
    './attribute-settings.component.css',
    '../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class AttributeSettingsComponent implements OnInit, OnDestroy
{  
  public showSpinner: boolean = false;

  public nombreModuloSelecionado: string = null;
  public nombreGrupoSelecionado: string = null;
  public nombreCapaSeleccionada: string = null;
  public tipoAccesoSeleccionado: string = null;
  public tipoAtributoSeleccionado: string = null;

  public modulos: Modulo[] = [];
  public grupos: Grupo[] = [];
  public capas: Capa[] = [];
  public tiposDeAcceso: any[] = [];
  public tiposDeAtributo: string[] = [
      "Todos",
      "Estructura fija",
      "Nuevos",
  ];
  
  public atributos = [];
  public atributosFiltrados: any[] = [];
  public ordenandoAtributos: boolean = false;

  public listaDeHerramientas: {[name:string]:any}[] = [];
  public busqueda: string = "";

  // INUTIL !
  editRow: number;
  dataModificar: any;

  public tableSortableOptions: SortableJsOptions;

  @ViewChild(AttributeCreationModalComponent)
  public AttributeCreationModal:AttributeCreationModalComponent;

  private routeDataSubscription:Subscription;

  constructor(
    private changeDetector: ChangeDetectorRef, 
    private _projectService:ProjectService,
    private _apiService:ApiService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _shepherdService:ShepherdService,
    private route:ActivatedRoute,
  )
  {
    this.tableSortableOptions = {
      disabled: true
    };
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }
  
  public async ngOnInit():Promise<void>
  {
    this.routeDataSubscription = this.route.data.subscribe(_data => {

      const {accessTypes, projectModules} = _data.data;

      this.tiposDeAcceso = accessTypes;

      this.modulos = projectModules;

      //Si solo viene un módulo, lo seleccionamos por defecto.
      if(this.modulos.length === 1)
      {
          this.nombreModuloSelecionado = (this.modulos[0].nombre as any);
          this.alCambiarSelectorDeModulos(this.modulos[0]);
      }
      
    });

    this.tipoAtributoSeleccionado = this.tiposDeAtributo[0];
  }

  public alCambiarSelectorDeModulos(modulo:Modulo): void
  {
    this.grupos = modulo.grupos;

    //Si solo viene un grupo, lo seleccionamos por defecto
    if(this.grupos.length === 1)
    {
      this.nombreGrupoSelecionado = this.grupos[0].nombre;
      this.alCambiarSelectorDeGrupos(this.grupos[0]);
    }

  }

  public alCambiarSelectorDeGrupos(grupo:Grupo): void
  {
    this.nombreCapaSeleccionada = null;
    this.capas = [...grupo.capas];
  }

  public async obtenerHerramientasYAtributosDeCapaPorTipoDeAcceso():Promise<void>
  {
    try
    {
      if (this.tipoAccesoSeleccionado)
      {

        this.showSpinner = true;
        
        const response = await this._apiService.postWithAuthentication({
          funcion: "web_informacion_configuracion_atributos",
          id_proyecto: this.project.id_proyecto,
          capa: this.nombreCapaSeleccionada,
          tipo_acceso: this.tipoAccesoSeleccionado
        });

        this.atributos = response.datos.atributos;  
        this.atributosFiltrados = response.datos.atributos;
        this.listaDeHerramientas = [];

        response.datos.lista_herramientas.forEach((herramienta) =>
        {
          
          this.listaDeHerramientas.push(({
            nombre: herramienta.nombre,
            nombre_formateado: herramienta.nombre_formateado,
            checkTodos: this.atributosFiltrados.every(attr => attr[herramienta.nombre_formateado])
          } as any));

        });
  
      }

    }
    catch(error)
    {
      
      this.atributos = [];  
      this.atributosFiltrados = [];
      this.listaDeHerramientas = [];

      Swal.fire({
        title: 'Error.',
        icon: 'error',
        text: error.message,
        confirmButtonText: "OK",
      });
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public alSeleccionarTipoDeAtributo(): void
  {
    switch( this.tipoAtributoSeleccionado )
    {
        case "Todos":
          this.atributosFiltrados = this.atributos;
          break;

        case "Estructura fija":
          this.atributosFiltrados = this.atributos.filter(atributofijo => ! atributofijo.atributo_proyecto);
          break;

        case "Nuevos":
          this.atributosFiltrados = this.atributos.filter(atributofijo => atributofijo.atributo_proyecto);
          break;
    }
  }

  public editarAtributo(rowIndex: number): void
  {
    this.editRow = rowIndex;
  }

  public actualizarAtributo(valorHerramienta):void
  {
    this.dataModificar = valorHerramienta;
    this.editRow = -1;
  }

  public ordenarAtributos():void
  {
    this.tableSortableOptions = {
      disabled: false
    }; 
    this.ordenandoAtributos = true;
  }

  public async guardarOrdenDeAtributos():Promise<void>
  {
    try
    {
      this._spinnerService.show();

      for (let index = 0, attributesLength = this.atributosFiltrados.length; index < attributesLength; index++) 
        this.atributosFiltrados[index].orden = index + 1

      await this._apiService.postWithAuthentication({
        funcion: "web_modificar_orden_atributo",
        proyecto: this.project.nombre,
        modulo: this.nombreModuloSelecionado,
        grupo: this.nombreGrupoSelecionado,
        capa: this.nombreCapaSeleccionada,
        lista_atributos: this.atributosFiltrados
      });

      this._toastrService.success("Orden guardado.","Exito!");

      this.ordenandoAtributos = false;
      this.tableSortableOptions = {
        disabled: true
      };
    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
    }

  }
  
  public deshacerOrden():void
  {
    this.obtenerHerramientasYAtributosDeCapaPorTipoDeAcceso();
    this.ordenandoAtributos = false;
    this.tableSortableOptions = {
      disabled: true
    };
  }

  public async eliminarAtributo(attr:any):Promise<void>
  {
    try
    {
      this.showSpinner = true;

      await this._apiService.postWithAuthentication({
        funcion: "web_eliminar_atributo_proyecto",
        proyecto: this.project.nombre,
        id_atributo_proyecto: attr.id_atributo_proyecto
      });

      this._toastrService.success("atributo eliminado.", "Exito!");

      this.atributosFiltrados = this.atributosFiltrados.filter(_attr => _attr !== attr);  

    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this.showSpinner = false;
    }
  }
  
  public async modificarVisibilidadDeAtributoEnHerramienta(valorHerramienta):Promise<void>
  {
    try
    {
      this.showSpinner = true;

      const mapToObj = m => 
      {
        return Array.from(m).reduce((obj:any, [key, value]:any) => {
            obj[key] = value;
            return obj;
        }, {});
      };
  
      let map = new Map<string, any>();
  
      for(let [key, value] of Object.entries(valorHerramienta))
      {
        if(key !== "atributo_proyecto"){
          map.set(key, value);
        }
      }  

      await this._apiService.postWithAuthentication({
        funcion: "web_modificar_configuracion_atributo",
        proyecto: this.project.nombre,
        atributo: mapToObj(map)
      });

       this.listaDeHerramientas.forEach((herramienta) => 
        herramienta.checkTodos = this.atributosFiltrados.every(attr => attr[herramienta.nombre_formateado])
      );

    }
    catch(error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public habilitarAtributoEnTodasLasHerramientas(herramienta, $event):void
  {
    this.atributosFiltrados.map(fila => Reflect.set(fila, herramienta.nombre_formateado, $event.target.checked));
    this.hacerPeticionParaHabilitarAtributoEnTodasLasHerramientas(this.atributosFiltrados);
    this.changeDetector.detectChanges();
  }

  private async hacerPeticionParaHabilitarAtributoEnTodasLasHerramientas(atributos:any):Promise<void>
  {
    try
    {
      this.showSpinner = true;

      await this._apiService.postWithAuthentication({
        funcion: "web_modificar_lista_atributo_proyecto",
        proyecto: this.project.nombre,
        modulo: this.nombreModuloSelecionado,
        grupo: this.nombreGrupoSelecionado,
        capa: this.nombreCapaSeleccionada,
        lista_atributos: atributos
      });

      this._toastrService.success("Atributos actualizados para la herramienta.","Exito!");
    }
    catch(error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this.showSpinner = false;
    }

  }
  
 /* TOUR */

 public showTour():void
 {
   if( this.tourIsActive )
     return;

   this.buildTour();

   if( ! this.atributosFiltrados.length && ! this.listaDeHerramientas.length )
    this.addFakeDataInTemplateForTour();

   this._shepherdService.start();
 }

 private addFakeDataInTemplateForTour():void
 {
  this.atributosFiltrados = [{
    nombre: "test",
    orden: 1,
    atributo_proyecto: true,
    edicion: false,
    copia_atributos: false,
    informacion: false,
    ficha: false,
    analisis: false,
    control_obra: false
   }];

   this.listaDeHerramientas = [
    {
      "nombre": "Edicion",
      "nombre_formateado": "edicion"
    },
    {
      "nombre": "Copia Atributos",
      "nombre_formateado": "copia_atributos"
    },
    {
      "nombre": "Informacion",
      "nombre_formateado": "informacion"
    },
    {
      "nombre": "Ficha",
      "nombre_formateado": "ficha"
    },
    {
      "nombre": "Analisis",
      "nombre_formateado": "analisis"
    },
    {
      "nombre": "Control Obra",
      "nombre_formateado": "control_obra"
    }
  ];

   const onCloseOrCompleteTourClosure = () => {

     this.atributosFiltrados = [];
     this.listaDeHerramientas = [];

   };

   this._shepherdService.tourObject.on("cancel", onCloseOrCompleteTourClosure);
   this._shepherdService.tourObject.on("complete", onCloseOrCompleteTourClosure);
 }

 private buildTour():void
 {
   const that = this;    
 
   const steps = this.buildTourSteps();

   const buttons = [
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
       _buttons = _buttons.slice(1);
    
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
       when: step.event,
       beforeShowPromise: step.beforeShowPromise 
     };

     _steps.push(_step);
   }

   this._shepherdService.addSteps(_steps);
 }

 private buildTourSteps():any[]
 {
   const steps = [
     {
       element: `module-selector`,
       labelPosition: "bottom",
       content: 'Seleccionar módulo. Si el proyecto tiene un solo módulo asociado, éste sera seleccionado automaticamente.'
     },
     {
       element: `group-selector`,
       labelPosition: "bottom",
       content: 'Seleccionar grupo.'
     },
     {
       element: `layer-selector`,
       labelPosition: "bottom",
       content: 'Seleccionar capa.'
     },
     {
       element: `access-type-selector`,
       labelPosition: "bottom",
       content: `
       Seleccionar el tipo de accesso: 
       <br><br>
       <ul>
        <li class="mb-1">
          Técnico: acceso a solo atributos nuevos.
        </li>
        <li class="mb-1">
          Mantenimiento: acceso a todos los atributos.
        </li>
      </ul>
       `
     },
     {
       element: `attribute-type-selector`,
       labelPosition: "bottom",
       content: `
       Seleccionar el tipo de atributo: 
       <br><br>
       <ul>
         <li class="mb-1">
           Estructura fija: atributos añadidos al crear la capa (al cargar el archivo en <b>configuración de proyecto</b>).
         </li>
         <li class="mb-1">
           Nuevos: atributos creados, una vez que la capa fue creada.
         </li>
       </ul>
       `
     },
     {
       element: `attributes-table`,
       labelPosition: "top",
       content: `
       Los atributos de la capa disponibles para el tipo de acceso seleccionado, seran listados aquí.
       `
     },
     {
       element: `attributes-table-header`,
       labelPosition: "top",
       content: `
       En la cabecera de la tabla se mostrarán <b>las herramientas de mapa donde los atributos pueden ser usados</b>.
       <br><br>
       Para habilitar / deshabilitar todos los atributos en una herramienta marque o desmarque la casilla correspondiente.
       `
     },
     {
       element: `attributes-table-body`,
       labelPosition: "top",
       content: `
       Para habilitar / deshabilitar un atributo en una herramienta marque o desmarque la casilla correspondiente.
       `
     },
     {
       element: `actions-buttons-columns`,
       selectorPrefix: ".",
       labelPosition: "left",
       content: `
       Los <b>atributos nuevos</b> pueden ser <b>editados y eliminados</b> desde los botones de acción 
        mostrados en las celdas de la columna más a la derecha.
       ( <img class="d-inline small-icon mx-1" src="assets/icons/EDITAR.svg"> 
          <img class="d-inline small-icon mx-1" src="assets/icons/PAPEPERA.svg">
          <img class="d-inline small-icon mx-1" src="assets/icons/GUARDAR.svg"> ).
       `
     },
     {
       element: `sort-attributes-btn`,
       labelPosition: "left",
       content: `
        Para ordernar el listado de atributos:
        <br>
        <ol>
          <li class="mb-1">
            Hacer click <span class="badge bg-warning text-white">Ordenar atributos</span>.
          </li>
          <li class="mb-1">
            Ordenar los atributos en la tabla, <b>arrátrandolos con el cursor</b> a la posición deseada.
          </li>
          <li class="mb-1">
            Hacer click <span class="badge bg-warning text-white">Guardar orden</span>
            y el nuevo orden será recordado.
          </li>
        </ol>
       `
     },
     {
       element: `attributes-finder`,
       labelPosition: "bottom",
       content: `
       Filtre los atributos de la tabla usando el buscador.
       `
     },
     {
       element: `new-attribute-btn`,
       labelPosition: "bottom",
       content: `
       Para registrar nuevos atributos, hacer click en <span class="badge bg-info text-white">Nuevo atributo</span> y se mostrará
       una ventana con el formulario de creación.
       `
     }
   ];

   return steps;
 }

  public ngOnDestroy(): void 
  {
    this.routeDataSubscription.unsubscribe();
    this._shepherdService.tourObject = null;
  }
}
