import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { CommandCenter } from '../../../../../../../interfaces/medium/tellink/command-center';
import { ToastrService } from 'ngx-toastr';
import { TellinkApiService } from '../../../../../../medium/tellink-api.service';
import { ProjectService } from '../../../../../../unic/project.service';

@Injectable()
export class TableResolverService implements Resolve<Promise<CommandCenter[]>>
{
  constructor(
    private router:Router,
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private _tellinkApiService:TellinkApiService
  ) { }

  public async resolve(route:ActivatedRouteSnapshot):Promise<CommandCenter[]>
  {
    try
    {       
      return await this._tellinkApiService.getCmsByProvince( this._projectService.province );
    }
    catch(error)
    {
      this.router.navigateByUrl(`/medium/home/proyectos/${this._projectService.project.id_proyecto}/acciones`);
      this._toastrService.error(error.message, "Error");
    }
  }
}
