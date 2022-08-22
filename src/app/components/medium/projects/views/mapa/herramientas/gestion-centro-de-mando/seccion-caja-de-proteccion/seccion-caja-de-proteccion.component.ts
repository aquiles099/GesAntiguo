import { Component } from '@angular/core';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';

@Component({
  selector: 'seccion-caja-de-proteccion',
  templateUrl: './seccion-caja-de-proteccion.component.html',
  styleUrls: ['./seccion-caja-de-proteccion.component.css', '../gestion-centro-de-mando.component.css']
})
export class SeccionCajaDeProteccionComponent extends SeccionBaseComponent
{
  // atributos:
  // material.
  // situacion.
  // grado_proteccion_ip.
  // grado_proteccion_ik.
  // alto.
  // ancho.
  // profundidad.

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
          "funcion": "web_informacion_caja_proteccion_centro_mando",
          "proyecto": this._projectService.project.bd_proyecto,
          "modulo": layerFilter[0],
          "grupo": layerFilter[1],
          "centro_mando": this.commandCenterId
      })).datos;

      // a;adir elementos a arreglo pasado desde componente padre.
      this.attributes.push(...data.atributos);

      // fusionar objeto pasado desde componente padre.
      Object.assign(this.template, data.valores);

      this.handleForm();
    }
    catch (error)
    {
      throw error;   
    }
  }
}
