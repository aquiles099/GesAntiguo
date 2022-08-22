import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GmaoComponent } from './gmao.component';
import { EstadisticasComponent } from './views/estadisticas/estadisticas.component';
// resolvers
import { EstadisticasResolverService } from '../../../../../../../../../services/resolvers/medium/home/projects/gmao/estadisticas-resolver.service';

const routes: Routes = [
  {
    // ruta vacia porque desde el ProjectsRoutingModule ya usamos la raiz "/gmao".
    path: "", 
    // componente que tiene la salida de enrutador para url "/gmao" la cual tendra los segmentos hijos.
    component: GmaoComponent, 
    // cualquier componente que se quiera mostrar en la url "proyectos/:id/gmao" debe agregar como ruta hija aqui.
    children: [
      {
        // recordemos que "/gmao" no tiene nada, salvo el enrutador.
        // Entonces agregamos alunga vistas para que se redireccione a ella.
        path: "",
        redirectTo: "estadisticas",
        pathMatch: "full"
      },
      {
        path: "estadisticas",
        // en este caso, para gmao es un tablero
        component: EstadisticasComponent,
        // el tablero carga datos de api, asi que carguemoslos por un resolutor.
        resolve: {
          // usamos el servicio resolutor creado para esta vista en especifico.
          // IMPORTANTE: estos servicios son especificos para el modulo de gmao
          // (decorador de servicio @Injectable no tiene definido el 'provideIn') por ende hay que 
          // declararlo como un provedor de este modulo ya sea en el GmaoModule o en este archivo
          // (ver decorador @NgModule mas abajo en llave "providers")
          datos: EstadisticasResolverService
        }
      },
      {
        path: "solicitudes",
        // "Solicitudes" es un recurso que tendra sus propias vistas hijas ("/nuevo", "/:id/editar", ... )
        // asi que conviene crearla como un MODULO DE CARGA PERESOZA que encapsule todas sus vistas y logica.
        loadChildren: () => import("./views/solicitudes/solicitudes.module").then(m => m.SolicitudesModule)
      },
      {
        path: "configuracion",
        loadChildren: () => import("./views/configuracion/configuracion.module").then(m => m.ConfiguracionModule)
      },
      {
        path: "ordenes-de-trabajo",
        loadChildren: () => import("./views/ordenes-trabajo/ordenes-trabajo.module").then(m => m.OrdenesTrabajoModule)
      },
      {
        path: "mantenimiento-preventivo",
        loadChildren: () => import("./views/mantenimiento-preventivo/mantenimiento-preventivo.module").then(m => m.MantenimientoPreventivoModule)
      },
      {
        path: "plan-mantenimiento",
        loadChildren: () => import("./views/plan-mantenimiento/plan-mantenimiento.module").then(m => m.PlanMantenimientoModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    EstadisticasResolverService
  ]
})
export class GmaoRoutingModule { }
