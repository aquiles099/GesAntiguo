import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
// import { ApiService } from '../../../../api.service';
import { ProjectService } from '../../../../unic/project.service';
import { PermissionManagementService } from '../../../../medium/administration/permission-management.service';

@Injectable()
export class PermissionManagementResolverService implements Resolve<Promise<any>>
{
  constructor(
    // private _apiService:ApiService,
    private _permissionManagementService:PermissionManagementService,
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>
  {
    let project = this._projectService.project;

    try
    {      
      // const permissionsData = (await this._apiService.postWithAuthentication({
      //   funcion: 'web_informacion_permisos_usuarios',
      //   id_proyecto: project.id_proyecto
      // }));
      
      const permissionsData = (await this._permissionManagementService.getDataForPermissionsManagement(project.id_proyecto));

     return {permissionsData, project};
    }
    catch(error)
    {
      await this.router.navigateByUrl(`/medium/home/proyectos/${project.id_proyecto}`);
      this._toastrService.error(error.message, "Error");
    }
  }
}
