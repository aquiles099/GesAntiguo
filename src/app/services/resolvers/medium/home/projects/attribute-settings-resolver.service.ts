import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ProjectsService } from '../../../../unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../unic/project.service';
import { ProjectLayersService } from '../../../../medium/project-layers.service';
import { ApiService } from '../../../../api.service';

@Injectable()
export class AttributeSettingsResolverService implements Resolve<Promise<any>>
{
  constructor(
    private _apiService:ApiService,
    private _projectLayersService:ProjectLayersService,
    private _projectService:ProjectService,
    private _toastrService:ToastrService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>
  {
    let project = this._projectService.project;

    try
    {
      const accessTypes = (await this._apiService.postWithAuthentication({
        funcion: 'web_informacion_permisos_usuarios',
        id_proyecto: project.id_proyecto
      })).datos.tipo_accesos;
      
      const projectModules = await this._projectLayersService.obtenerModulosDeAPI(project);
      
      return {accessTypes, projectModules};
    }
    catch(error)
    {
      await this.router.navigateByUrl(`/medium/home/proyectos/${project.id_proyecto}`);
      this._toastrService.error(error.message, "Error");
    }
  }
}
