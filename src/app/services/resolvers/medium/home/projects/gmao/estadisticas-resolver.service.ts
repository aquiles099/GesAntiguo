import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GmaoService } from 'src/app/services';
/**
 * Facilemente, cualquier resolutor puede mantener esta estructura.
 * Contiene un try/catch, en donde intenta cargar los datos de la vista 
 * para retornarlos en ella y si falla, generar una excepcion que atrapa el catch
 * y la muestra en mensaje de error en la vista mientras se redirige a otra vista niveles atras
 * (ejemplo si quieria ir de /usuarios a usuarios/nuevo y falla devolverlo nuevamente a /usuarios). 
 */
@Injectable()
export class EstadisticasResolverService implements Resolve<Promise<any>>
{
  constructor(
    private _toastrService:ToastrService,private router:Router,private gmao: GmaoService
  ) {
  }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>{
    // Aca una gran ventaja de los resolutores. Recordemos que "/gmao" en una vista hija de "/proyectos/:id",
    // y "/proyectos/:id" usaba un resolutor para cargar sus datos de vista, entonces podemos acceder a los datos
    // de esa ruta padre por medio de la instantanea de ruta activa (ActivatedRouteSnapshot) accediendo a la propiedad 
    // "parent" y en esta  la propiedad "data". Sucesivamente, se puede seguir escalando en el padre de una ruta padre
    // hasta llegar a la ruta raiz o base ('/medium'). 

    // En este caso se usa una simple funcion que revisa recursivamente el padre en una ruta hasta dar con uno que en 
    // su "data" tenga la llave "project" (que contiene un proyecto obviamente). 
    const findProjectInRoute = (_route:ActivatedRouteSnapshot) => _route.data["project"] || findProjectInRoute(_route.parent);

    let project = findProjectInRoute(route);
    try
    {
    
      return {
        proyecto: project,
        datos: 'datos'
      };
    }
    catch(error)
    {
      this.router.navigateByUrl(`/medium/home/proyectos/${project.id_proyecto}/gmao`); // en este caso redirigir a el tablero.
      this._toastrService.error(error.message, "Error");
    }
  }
}
