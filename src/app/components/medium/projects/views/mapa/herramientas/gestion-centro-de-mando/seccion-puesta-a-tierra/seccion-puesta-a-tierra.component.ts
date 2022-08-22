import { Component } from '@angular/core';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';

@Component({
  selector: 'seccion-puesta-a-tierra',
  templateUrl: './seccion-puesta-a-tierra.component.html',
  styleUrls: [
    './seccion-puesta-a-tierra.component.css',
    '../gestion-centro-de-mando.component.css'
  ]
})
export class SeccionPuestaATierraComponent extends SeccionBaseComponent
{
  // atributos:
  // tipo.
  // seccion.
  // resistencia.

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
          "funcion": "web_informacion_puesta_tierra_centro_mando",
          "proyecto": this._projectService.project.bd_proyecto,
          "modulo": layerFilter[0],
          "grupo": layerFilter[1],
          "centro_mando": this.commandCenterId
      })).datos;

      // a;adir elementos a arreglo pasado desde componente padre.
      this.attributes.push(...data.atributos);

      // 
      data.valores["existe"] = true;

      // fusionar objeto pasado desde componente padre (plantilla).
      Object.assign(this.template, data.valores);

      this.handleForm();
    }
    catch (error)
    {
      throw error;   
    }
  } 
}
