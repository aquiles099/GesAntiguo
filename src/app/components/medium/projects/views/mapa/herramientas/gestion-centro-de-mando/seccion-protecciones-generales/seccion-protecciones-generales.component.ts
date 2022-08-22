import { Component, Input, NgZone } from '@angular/core';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { ProteccionCentroMando } from '../../../../../../../../interfaces/medium/centro-mando';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';
import { isNumeric, toggleFullscreen } from '../../../../../../../../shared/helpers';
import { ShepherdService } from 'angular-shepherd';
@Component({
  selector: 'seccion-protecciones-generales',
  templateUrl: './seccion-protecciones-generales.component.html',
  styleUrls: [
    './seccion-protecciones-generales.component.css',
    '../gestion-centro-de-mando.component.css'
  ]
})
export class SeccionProteccionesGeneralesComponent extends SeccionBaseComponent
{
  @Input()
  public template:ProteccionCentroMando[]; 

  public amperageMeasurements = [
    "mA",
    "A"
  ];

  constructor(
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async loadData():Promise<void>
  {
    try
    {
      const layerFilter = this.layer.filtro_capa.split("#");

      const data = (await this._projectsService.consultarApi({
          "funcion": "web_informacion_protecciones_centro_mando",
          "proyecto": this._projectService.project.bd_proyecto,
          "modulo": layerFilter[0],
          "grupo": layerFilter[1],
          "centro_mando": this.commandCenterId
      })).datos;

      // a;adir elementos a arreglo pasado desde componente padre.
      const attributes = data.atributos.filter(attributeData => attributeData.campo !== "tipo" && attributeData.campo !== "subtipo");
      this.attributes.push(...attributes);

      this.addExternalAttributes(data.opciones);

      this.buildTemplates(data.valores[0], data.tipos["GENERAL"]);

      this.addDefaultValuesInTemplates();

      if( this.mode !== "new" )
        this.addExistingProtections(data.valores, data.tipos["GENERAL"]);

      // * si el modo vista es "Detalles" campos de formulario se deshabilitan de por enlace de atributo "disabled".
      // Deshabilitado usando NgForm causa comportamiento exta;o (al duplicar protecciones la plantilla toma valores indeseados). 
        
      // Mostrar solo protecciones con cantidad distinta de 0 en modo "Detalles".
      if( this.mode === "details" )
        this.template.splice(0, this.template.length, ...this.template.filter(protection => protection.cantidad > 0));
    }
    catch (error)
    {
      console.error(error);
      this.onError.emit();
      throw error;   
    }
  }

  private addExternalAttributes(values:{[key:string]:any[]}):void
  {
    // atributos que no se les puede asignar dominios de la forma convencional
    // desde el backend y se envian aparte en la llave "opciones".
    [
      "polaridad",
      "intensidad",
      "marca",
      "sensibilidad"
    ].forEach(field => {

      const attributeData = this.attributes.find(attr => attr.campo === field);
      attributeData.dominio = true;
      attributeData.dominios = values[field];
   
    });
  }

  private buildTemplates(template:ProteccionCentroMando, subtypes:string[]):void
  {
    template = ObjectUtility.simpleCloning(template);

    ObjectUtility.overrideValues( template ); // solicitar api para solo devolver plantilla de circuito - PENDIENTE.

    for( let subtype of subtypes )
    {
      const _template = ObjectUtility.simpleCloning(template);

      _template.tipo = "GENERAL";
      _template.subtipo = subtype;

      if( subtype === "DIFERENCIAL" )
      {
        _template["sensibilidad_personalizada_habilitada"] = false;
        _template["sensibilidad_personalizada"] = null;
        _template["medida_sensibilidad_personalizada"] = null;
      }

      // a;adir elementos a arreglo pasado desde componente padre (plantilla como arreglo).
      this.template.push(_template);
    }
  }

  private addDefaultValuesInTemplates():void
  {
    for( let circuitTemplate of this.template )
      this.addDefaultValuesInTemplate(circuitTemplate);
  }

  private addExistingProtections(protections:ProteccionCentroMando[], subtypes:string[]):void
  {
    protections = protections.filter(protection => protection.tipo === "GENERAL");
    
    // protecciones principales: protecciones que muestra interfaz de usuario por defecto.
    // protecciones adicionales: protecciones que el usuario a;ade de forma adicional (diferencial y contactor).

    // Obtener protecciones principales.
    const mainProtections = subtypes.map(subtype => protections.find(protection => protection.subtipo === subtype))
                                    .filter(protection => protection);

    // Asignar en plantillas por defecto valores de protecciones principales (en caso de que existan). 
    this.template.forEach(protection => {

      const existingProtection = mainProtections.find(_protection => _protection.subtipo === protection.subtipo);

      if(existingProtection)
        Object.assign(protection, existingProtection);

    });

    const additionalProtections = protections.filter(protection => ! mainProtections.includes( protection ));

    if( additionalProtections.length )
      this.template.push(...additionalProtections);

    this.setCustomSensibilityInDifferentialProtections();

    // ordenar protecciones por subtipo.
    const allProtections = this.template.splice(0);

    subtypes.forEach(subtype => 
      this.template.push( ...allProtections.filter(protection => protection.subtipo === subtype) )
    );
  }

  private setCustomSensibilityInDifferentialProtections():void
  {
    // Obtener dominios de atributo "Sensibilidad" para evaluar si algun diferencial
    // tiene un valor personalizado por el usuario.
    const sensibilityValues = this.attributes.find(attrData => attrData.campo === 'sensibilidad').dominios;

    this.template.forEach(protection => {

      if( protection.subtipo === "DIFERENCIAL" && protection.sensibilidad )
      {
        // Evaluar si algun diferencial tiene valor personalizado por el usuario para formatearlo.
        const sensibility = protection.sensibilidad;
        const hasCustomSensibility = ! sensibilityValues.includes( sensibility );
    
        if( hasCustomSensibility )
        {
          const sensibilityMeasure = isNumeric( sensibility.substr(-2,1) ) ?
          sensibility.charAt( sensibility.length - 1 ) :
          sensibility.substr(-2, 2);
    
          protection["sensibilidad"] = "Otro";
          protection["sensibilidad_personalizada_habilitada"] = true;
          protection["medida_sensibilidad_personalizada"] = sensibilityMeasure;
          protection["sensibilidad_personalizada"] = sensibility.substring( 0, sensibility.indexOf(sensibilityMeasure));
        }
      }

    });
  }

  public protectionCanBeRepeat(protection:ProteccionCentroMando):boolean
  {
    return protection.subtipo.toLowerCase() === 'diferencial' || protection.subtipo.toLowerCase() === 'contactor';
  }

  public getProtectionIndexBySubType(protection:ProteccionCentroMando):number
  {
    return this.template.filter(_protection => _protection.subtipo === protection.subtipo)
                        .findIndex(_protection => _protection === protection);
  }

  public getSubTypeLabel(subtype:string):string
  {
    const labels = {
      "INTERRUPTOR GENERAL":  "Interruptor general",
      "MAGNETOTÉRMICO":       "Magnetotérmico",
      "CONTACTOR":            "Contactor",
      "DIFERENCIAL":          "Diferencial",
      "SOBRETENSIÓN":         "Protección sobre tensiones permanentes y transitorias"
    }; 

    return labels[subtype] ?? "Desconocido";
  }

  public duplicateProtection(protection:ProteccionCentroMando, protectionIndex:number):void
  {
    const copy = ObjectUtility.simpleCloning(protection);
    
    copy.id_proteccion_centro_mando = null // anular id de proteccion en caso que exista en db (evitar que se repita).

    // limpiar y agregar elementos sin perder la referencia al arreglo 
    // del objeto recibido desde componente padre.
    const items = [...this.template.slice(0, protectionIndex), copy, ...this.template.slice(protectionIndex)];
    this.template.splice(0, this.template.length, ...items);
    // this.template.push(...items);
    console.log(this.template);
  }
  
  public protectionsIsTheLastOneBySubType(protection:ProteccionCentroMando):boolean
  {
    const filteredProtections = this.template.filter(_protection => _protection.subtipo === protection.subtipo);
    return  filteredProtections[filteredProtections.length - 1] === protection;
  }
  
  public removeProtection(index:number):void
  {
    this.template.splice(index, 1);
  }

  public onChangeSensibilitySelector(value:string, protection:ProteccionCentroMando):void
  {
    protection["sensibilidad_personalizada_habilitada"] = value === "Otro";

    if( value )
    {
      protection["sensibilidad_personalizada"] = null;
      protection["medida_sensibilidad_personalizada"] = null;
    }
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
        _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (más a la derecha) siempre sera el de avanzar / finalizar.
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
        text: step.content
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps():any[]
  {     
    // remover tour de servicio global al cancelar / terminar tour.
    const onCancelOrCompleteTourClosure = () => this._shepherdService.tourObject = null;

    const steps = [
      {
        element: `general-protections-section`,
        labelPosition: "left",
        content: `
        <ul>
          <li class="mb-1">
          Por defecto, un centro de mando tiene 5 protecciones generales .
          </li>
          <li class="mb-1">
            Se pueden añadir tantos <b>diferenciales</b> y <b>contactores</b> como sea necesario.
          </li>
        </ul>
        `,
        event: {
          "before-show": () => {
            this._shepherdService.tourObject.once("cancel", onCancelOrCompleteTourClosure);
            this._shepherdService.tourObject.once("complete", onCancelOrCompleteTourClosure);
          }
        }
      },
      {
        element: `duplicate-protection-btn`,
        selectorPrefix: `.`,
        labelPosition: "left",
        content: `
        Para duplicar un <b>diferencial o contactor</b>
        hacer click en <span class="badge bg-warning text-white"><i class="fas fa-plus"></i></span> y 
        para remover un <b>duplicado</b> hacer click en <span class="badge bg-danger text-white"><i class="fas fa-trash"></i></span>.
        `
      },
      {
        element: `protection-sensibility`,
        hasMedia: true,
        selectorPrefix: ".",
        labelPosition: "left",
        content: `
        Para agregar <b>sensibilidad personalizada</b> en las protecciones diferenciales:
        <ol>
          <li class="mb-1">
            Seleccionar opción <b>"Otro"</b> y se habilitará el campo numérico a la derecha del listado.
          </li>
          <li class="mb-1">
            Añadir la cifra de sensibilidad en el campo habilitado.
          </li>
          <li class="mb-1">
            Seleccionar una medida (<b>mA, A</b>) en el listado del lado derecho del campo. 
          </li>
        </ol>
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/gestion-de-centro-mando/protecciones-generales/4-sensibilidad-personalizada.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video>
        `
      },
    ];

    return steps;
  }
}
