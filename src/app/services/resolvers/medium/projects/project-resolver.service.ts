import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ProjectsService } from '../../../unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../unic/project.service';

@Injectable()
export class ProjectResolverService implements Resolve<Promise<any>>
{
  constructor(
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _toastrService:ToastrService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>
  {
    try
    {      
      const projectId = route.params["id"];
      
      const project = this._projectsService.get().find(project => project.id_proyecto == projectId);
      
      if( ! project )
        throw new Error("El proyecto no ha podido ser ubicado.");
      
        
      if( this.needToLoadProjectConfiguration( project.id_proyecto ) )
      {
        this._projectService.next( project );
        await this._projectService.loadInformationAndConfiguration();
      }

      return project;
    }
    catch(error)
    {
      this.router.navigateByUrl("/medium");
      this._toastrService.error(error.message, "Error");
    }
  }

  private needToLoadProjectConfiguration(id:number):boolean
  {
    return ( this._projectService.isStarted && this._projectService.project.id_proyecto !== id ) ||
            ! this._projectService.isStarted;

  }

}
