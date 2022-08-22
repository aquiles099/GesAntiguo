import { Component, Input } from '@angular/core';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { ProteccionCentroMando } from '../../../../../../../../interfaces/medium/centro-mando';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';
import { isNumeric } from '../../../../../../../../shared/helpers';

@Component({
  selector: 'seccion-protecciones-maniobra',
  templateUrl: './seccion-protecciones-maniobra.component.html',
  styleUrls: [
    './seccion-protecciones-maniobra.component.css',
    '../gestion-centro-de-mando.component.css'
  ]
})
export class SeccionProteccionesManiobraComponent extends SeccionBaseComponent
{
  @Input()
  public template:ProteccionCentroMando[]; 

  public amperageMeasurements = [
    "mA",
    "A"
  ];

  constructor(
    private _projectsService:ProjectsService,
    private _projectService:ProjectService
  )
  {
    super();
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

      this.buildTemplates(data.valores[0], data.tipos["MANIOBRA"]);

      this.addDefaultValuesInTemplates();

      if( this.mode !== "new" )
        this.addExistingProtections(data.valores, data.tipos["MANIOBRA"]);

      if( this.mode === "details" )
      {
        setTimeout(() => this.disableForm(), 250); // peque;o retraso mientras se muestra formulario. 

        // Mostrar solo protecciones con cantidad distinta de 0 en modo "Detalles".
        this.template.splice(0, this.template.length, ...this.template.filter(protection => protection.cantidad > 0));
      }
      
    } catch (error)
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

      _template.tipo = "MANIOBRA";
      _template.subtipo = subtype;

      if( _template.subtipo === "DIFERENCIAL" )
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
    protections = protections.filter(protection => protection.tipo === "MANIOBRA");
    
    const mainProtections = subtypes.map(subtype => protections.find(protection => protection.subtipo === subtype))
                                    .filter(protection => protection);

    this.template.forEach(protection => {

      const existingProtection = mainProtections.find(_protection => _protection.subtipo === protection.subtipo);

      if(existingProtection)
        Object.assign(protection, existingProtection);

    });

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

  public onChangeSensibilitySelector(value:string, protection:ProteccionCentroMando):void
  {
    protection["sensibilidad_personalizada_habilitada"] = value === "Otro";

    if( value )
    {
      protection["sensibilidad_personalizada"] = null;
      protection["medida_sensibilidad_personalizada"] = null;
    }
  }
}
