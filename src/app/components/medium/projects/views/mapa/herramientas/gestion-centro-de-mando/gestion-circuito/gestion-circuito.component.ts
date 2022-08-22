import { Component, Input, Output, EventEmitter} from '@angular/core';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { Circuito, ProteccionCircuito } from '../../../../../../../../interfaces/medium/centro-mando';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';
import { AttributeData } from '../gestion-centro-de-mando.component';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { isset, isNumeric } from '../../../../../../../../shared/helpers';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'gestion-circuito',
  templateUrl: './gestion-circuito.component.html',
  styleUrls: [
    './gestion-circuito.component.css',
    '../gestion-centro-de-mando.component.css'
  ]
})
export class GestionCircuitoComponent extends SeccionBaseComponent
{
  // atributos de circuito:
  // nombre.
  // tipo.
  // tipo_conductor.
  // seccion.
  // tipo_canalizacion.
  // manual_automatico.

  @Input()
  public commandCenterCircuits:Circuito[] = [];

  @Input()
  public template:Circuito;

  @Output()
  public onFinishCircuitManagement:EventEmitter<void> = new EventEmitter;

  /* VARIABLES PROTECCIONES */

  public protecctionAttributes:AttributeData[] = [];

  public amperageMeasurements = [
    "mA",
    "A"
  ];

  public protections:ProteccionCircuito[] = [];

  private protectionTypes:string[] = [];

  constructor(
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService
  )
  {
    super();
  }

  get inEdition():boolean
  {
    return isset(this.template['id_circuito']);
  }

  public async show():Promise<void>
  {
    try
    {
      await this.buildCircuitStructure();
      await this.buildProtectionsStructure();

      if( this.mode === "details" )
        setTimeout(() => this.disableForm(), 250);
    }
    catch (error)
    {
      throw error;   
    }
  }

  private async buildCircuitStructure():Promise<void>
  {
    try
    {
      const layerFilter = this.layer.filtro_capa.split("#");

      const data = (await this._projectsService.consultarApi({
          "funcion": "web_informacion_circuito",
          "proyecto": this._projectService.project.bd_proyecto,
          "modulo": layerFilter[0],
          "grupo": layerFilter[1],
          "circuito": this.template ? this.template.id_circuito : ""
      })).datos;

      this.template = data.valores;

      const attributes = data.atributos.filter(attributeData => attributeData.campo !== 'id_proteccion_circuito');
      
      this.attributes.push(...attributes);

      if( this.mode === "new" )
        this.addDefaultValuesInTemplate();
    }
    catch (error)
    {
      throw error;   
    }
  }

  private async buildProtectionsStructure():Promise<void>
  {
    try
    {
      const layerFilter = this.layer.filtro_capa.split("#");

      const data = (await this._projectsService.consultarApi({
          "funcion": "web_informacion_proteccion_circuito",
          "proyecto": this._projectService.project.bd_proyecto,
          "modulo": layerFilter[0],
          "grupo": layerFilter[1],
          "circuito": this.template.id_circuito ?? ""
      })).datos;

      // a;adir elementos a arreglo pasado desde componente padre.
      const attributes = data.atributos.filter(
        attributeData => attributeData.campo !== "tipo"
      );

      this.protecctionAttributes = attributes;
      this.protectionTypes = data.tipos;

      this.addExternalProtectionAttributes(data.opciones);
      
      this.buildDefaultProtectionTemplates(data.valores[0]);     
      
      if( this.mode !== "new" )
        this.addExistingProtections(data.valores);

      if( this.mode === "details" )
        // Mostrar solo protecciones con cantidad distinta de 0 en modo "Detalles".
        this.protections.splice(0, this.protections.length, ...this.protections.filter(protection => protection.cantidad > 0));
    }
    catch (error)
    {
      throw error;    
    }
  }

  private addExternalProtectionAttributes(values:{[key:string]:any[]}):void
  {
    // atributos que no se les puede asignar dominios de la forma convencional
    // desde el backend y se envian aparte en la llave "opciones".
    [
      "polaridad",
      "intensidad",
      "marca",
      "sensibilidad"
    ].forEach(field => {

      const attributeData = this.protecctionAttributes.find(attr => attr.campo === field);
      attributeData.dominio = true;
      attributeData.dominios = values[field];
   
    });
  }

  private buildDefaultProtectionTemplates(template:ProteccionCircuito):void
  {
    template = ObjectUtility.simpleCloning(template);

    ObjectUtility.overrideValues( template ); // solicitar api para solo devolver plantilla de circuito - PENDIENTE.

    for( let type of this.protectionTypes )
    {
      const _template = ObjectUtility.simpleCloning(template);

      _template.tipo = type;

      if( type === "DIFERENCIAL" )
      {
        _template["sensibilidad_personalizada_habilitada"] = false;
        _template["sensibilidad_personalizada"] = null;
        _template["medida_sensibilidad_personalizada"] = null;
      }

      // a;adir elementos a arreglo pasado desde componente padre (plantilla como arreglo).
      this.protections.push(_template);
    }

    this.addDefaultValuesInProtectionTemplates();
  }

  private addDefaultValuesInProtectionTemplates():void
  {
    for( let protectionTemplate of this.protections )
      this.addDefaultValuesInTemplate(protectionTemplate, this.protecctionAttributes);
  }

  private addExistingProtections(protections:ProteccionCircuito[]):void
  {
    // protecciones principales: protecciones que muestra interfaz de usuario por defecto.
    // protecciones adicionales: protecciones que el usuario a;ade de forma adicional (diferencial y conectores).

    // tipos:
    // MAGNETOTÉRMICO.
    // DIFERENCIAL.
    // CONECTORES.

    // Obtener protecciones principales de circuito.
    const thermalMagnet = protections.find(protection => protection.tipo === "MAGNETOTÉRMICO");
    const differential = protections.find(protection => protection.tipo === "DIFERENCIAL");
    const connectors = protections.find(protection => protection.tipo === "CONECTORES");

    // Asignar en plantillas por defecto valores de protecciones principales (en caso de que existan). 
    this.protections.forEach(protection => {

      switch( true )
      {
        case thermalMagnet && thermalMagnet.tipo === protection.tipo:
            Object.assign(protection, thermalMagnet);
          break;

        case differential && differential.tipo === protection.tipo:
          Object.assign(protection, differential);
          break;

        case connectors && connectors.tipo === protection.tipo:
          Object.assign(protection, connectors);
          break;
      }

    });

    const additionalProtections = protections.filter(protection => 
     protection.id_proteccion_circuito &&  protection !== thermalMagnet && protection !== differential && protection !== connectors
    );

    if( additionalProtections.length )
      this.protections.push(...additionalProtections);

      this.setCustomSensibilityInDifferentialProtections();

    // ordenar protecciones 
    this.protections = [
      ...this.protections.filter(protection => protection.tipo === "MAGNETOTÉRMICO"),
      ...this.protections.filter(protection => protection.tipo === "DIFERENCIAL"),
      ...this.protections.filter(protection => protection.tipo === "CONECTORES")
    ];
  }

  private setCustomSensibilityInDifferentialProtections():void
  {
    // Obtener dominios de atributo "Sensibilidad" para evaluar si algun diferencial
    // tiene un valor personalizado por el usuario.
    const sensibilityValues = this.protecctionAttributes.find(attrData => attrData.campo === 'sensibilidad').dominios;

    this.protections.forEach(protection => {

      if( protection.tipo === "DIFERENCIAL" && protection.sensibilidad )
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

  public getProtectionAttributeByField(field:string):AttributeData
  {
    return this.protecctionAttributes.find(data => data.campo === field);
  }

  public protectionCanBeRepeat(protection:ProteccionCircuito):boolean
  {
    return protection.tipo.toLowerCase() === 'diferencial' || protection.tipo.toLowerCase() === 'conectores';
  }

  public getProtectionIndexByType(protection:ProteccionCircuito):number
  {
    return this.protections.filter(_protection => _protection.tipo === protection.tipo)
                          .findIndex(_protection => _protection === protection);
  }
  
  public duplicateProtection(protection:ProteccionCircuito, protectionIndex:number):void
  {
    const copy = ObjectUtility.simpleCloning(protection);
    copy["id_proteccion_circuito"] = null; // anular id en caso de que proteccion copiado exista en bd (id no se repita).
    this.protections = [...this.protections.slice(0, protectionIndex), copy, ...this.protections.slice(protectionIndex)];
  }
  
  public protectionsIsTheLastOneByType(protection:ProteccionCircuito):boolean
  {
    const filteredProtections = this.protections.filter(_protection => _protection.tipo === protection.tipo);
    return  filteredProtections[filteredProtections.length - 1] === protection;
  }
  
  public removeProtection(index:number):void
  {
    this.protections.splice(index, 1);
  }
  
  public onChangeSensibilitySelector(value:string, protection:ProteccionCircuito):void
  {
    protection["sensibilidad_personalizada_habilitada"] = value === "Otro";

    if( value )
    {
      protection["sensibilidad_personalizada"] = null;
      protection["medida_sensibilidad_personalizada"] = null;
    }
  }

  public async finishManagement():Promise<void>
  {
    try
    {
      this._spinnerService.updateText( 
        this.inEdition ? "Actualizando circuito..." : "Creando circuito..."
      );

      this._spinnerService.show();

      this.showLoading.emit();

      const circuitProtections = this.protections.map(
        protection => {

          if( protection.hasOwnProperty("sensibilidad_personalizada_habilitada") )
            delete protection["sensibilidad_personalizada_habilitada"];

          return protection;
        }
      );

      this.inEdition ?
      await this.updateCircuit(circuitProtections) :
      await this.createCircuit(circuitProtections)

      this._toastrService.success(
        this.inEdition ? "Circuito editado." : "Circuito creado.",
        "Exito!"
      );

    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
      this.hideLoading.emit();
    }
  }

  private async createCircuit(protections:ProteccionCircuito[]):Promise<void>
  {
    try
    {
      const newCircuitId = (await this._projectsService.consultarApi({
          "funcion": "web_crear_circuito",
          "proyecto": this._projectService.project.nombre,
          "modulo": this.layer.modulo,
          "grupo": this.layer.grupo,
          "circuito": this.template,
          "protecciones": protections
      })).datos.id_circuito;

      // agregar circuito creado en plantilla base de centro de mando.
      const newCircuit = ObjectUtility.simpleCloning( this.template );

      newCircuit["id_circuito"] = newCircuitId;
      
      this.commandCenterCircuits.push( newCircuit );

      this.resetForm();
    }
    catch (error)
    {
      throw error;
    }
  }

  private resetForm():void
  {
    ObjectUtility.overrideValues(this.template);

    const protectionTemplate = ObjectUtility.simpleCloning(this.protections[0]);

    ObjectUtility.overrideValues(protectionTemplate);

    this.protections = [];

    for( let type of this.protectionTypes )
    {
      const _template = ObjectUtility.simpleCloning( protectionTemplate );

      _template.tipo = type;

      if( type === "DIFERENCIAL" )
      {
        _template["sensibilidad_personalizada_habilitada"] = false;
        _template["sensibilidad_personalizada"] = null;
        _template["medida_sensibilidad_personalizada"] = null;
      }

      // a;adir elementos a arreglo pasado desde componente padre (plantilla como arreglo).
      this.protections.push(_template);
    }
  }

  private async updateCircuit(protections:ProteccionCircuito[]):Promise<void>
  {
    try
    {
      await this._projectsService.consultarApi({
          "funcion": "web_actualizar_circuito",
          "proyecto": this._projectService.project.nombre,
          "modulo": this.layer.modulo,
          "grupo": this.layer.grupo,
          "circuito": this.template,
          "protecciones": protections
      });

      // actualizar circuito editado en plantilla base de centro de mando.
      const updatedCircuit:Circuito = ObjectUtility.simpleCloning( this.template );
      
      this.commandCenterCircuits.forEach((circuit:Circuito) => {

        if( circuit.id_circuito === updatedCircuit.id_circuito )
          Object.assign(circuit, updatedCircuit);

      });

      this.onFinishCircuitManagement.emit();

    }
    catch (error)
    {
      throw error;
    }
  }

}
