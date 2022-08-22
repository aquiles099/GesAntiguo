import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { CommandCenter } from '../../../../../../../interfaces/medium/tellink/command-center';
import { TellinkApiService } from '../../../../../../medium/tellink-api.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from 'src/app/services/unic/project.service';

@Injectable()
export class DetailsResolverService implements Resolve<Promise<CommandCenter>>
{
  constructor(
    private _tellinkApiService:TellinkApiService,
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private router:Router
  ) { }

  public async resolve(route:ActivatedRouteSnapshot):Promise<any>
  {
    try
    {
      const cmId = route.params["cmId"];
      return await this._tellinkApiService.findCm(cmId);
    }
    catch(error)
    {
      await this.router.navigateByUrl(`/medium/home/error-interno`);
      await  this.router.navigateByUrl(`/medium/home/proyectos/${this._projectService.project.id_proyecto}/tellink/centros-de-mando`);
      this._toastrService.error(error.message, "Error");
    }
  }
}
