import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { ProjectsService } from '../unic/projects.service';
import { SpinnerService } from '../spinner.service';
import { AuthenticationService } from '../authentication.service';
import Swal from 'sweetalert2';
import { GeojsonFilesService } from '../unic/geojson-files.service';
import { GeojsonLayerImagesService } from '../unic/geojson-layer-images.service';
import { GeojsonFilesAnalysisChartsConfigurationsService } from '../unic/geojson-files-analysis-charts-configurations.service';

@Injectable({
  providedIn: "root"
})
export class UserProjectsResolverService implements Resolve<Promise<void>>
{
  constructor(
    private _projectsService:ProjectsService,
    private _spinnerService:SpinnerService,
    private _geojsonFilesService:GeojsonFilesService,
    private _geojsonLayerImagesService:GeojsonLayerImagesService,
    private _geojsonFilesAnalysisChartsConfigurationsService:GeojsonFilesAnalysisChartsConfigurationsService,
    private _authenticationService:AuthenticationService
  ) { }

  public async resolve(route: ActivatedRouteSnapshot): Promise<void>
  { 
    try
    {      
      if( ! this._projectsService.isStarted )
      {
        this._spinnerService.updateText("Cargando proyectos...");
    
        await this._projectsService.loadProjects();
        
        if( route.url[0].path === "unic" ) 
          await this.startConnectionToLocalDatabasesForUNIC();
      }
    }
    catch(error)
    {
      this._authenticationService.logout();

      Swal.fire({
        icon: 'error',
        title: `Sus proyectos no han podido ser cargados. <br> Intente ingresando nuevamente o pongase en contacto con el administrador.`,
        confirmButtonText: "OK",
        heightAuto: false
      });
    }
    finally
    {    
      this._spinnerService.cleanText();
    }
  }

  /**
   * Iniciar conexion con bases de datos locales (IndexedDB) al iniciar en UNIC.
   * La conexion exitosa en todas las bases de datos es requerida para el correcto funcionamiento.
   */
  private async startConnectionToLocalDatabasesForUNIC():Promise<void>
  {
    await Promise.all([
      this._geojsonFilesService.openIDBConnection(),
      this._geojsonLayerImagesService.openIDBConnection(),
      this._geojsonFilesAnalysisChartsConfigurationsService.openIDBConnection()
    ]);
  }
}
