import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import{ ConfiguracionComponent } from './configuracion.component';
import { AlmacenesComponent} from './views/almacenes/almacenes.component';
import { EstadisticasResolverService } from 'src/app/services/resolvers/medium/home/projects/gmao/estadisticas-resolver.service';

const routes: Routes = [
  {
    path: "", 
    component: ConfiguracionComponent, 
    children: [
      {
        path: "almacenes",
        // "Solicitudes" es un recurso que tendra sus propias vistas hijas ("/nuevo", "/:id/editar", ... )
        // asi que conviene crearla como un MODULO DE CARGA PERESOZA que encapsule todas sus vistas y logica.
        loadChildren: () => import("./views/almacenes/almacenes.module").then(m => m.AlmacenesModule)
      },
      {
        path: "familias",
        loadChildren: () => import("./views/familia/familia.module").then(m => m.FamiliaModule)
      },
      {
        path: "sub-familias",
        loadChildren: () => import("./views/sub-familia/sub-familia.module").then(m => m.SubFamiliaModule)
      },
      {
        path: "marcas",
        loadChildren: () => import("./views/marca/marca.module").then(m => m.MarcaModule)
      },
      {
        path: "modelos",
        loadChildren: () => import("./views/modelos/modelos.module").then(m => m.ModelosModule)
      },
      {
        path: "tareas",
        loadChildren: () => import("./views/tareas/tareas.module").then(m => m.TareasModule)
      },
      {
        path: "inventarios",
        loadChildren: () => import("./views/inventarios/inventarios.module").then(m => m.InventariosModule)
      },
      {
        path: "tipos-incidencias-ordenes",
        loadChildren: () => import("./views/tipos-incidencias-ordenes/tipos-incidencias-ordenes.module").then(m => m.TiposIncidenciasOrdenesModule)
      },
      {
        path: "tipo-mantenimiento-preventivo",
        loadChildren: () => import("./views/tipo-mantenimiento-preventivo/tipo-mantenimiento-preventivo.module").then(m => m.TipoMantenimientoPreventivoModule)
      },
      {
        path: "tipo-inventario",
        loadChildren: () => import("./views/tipo-inventario/tipo-inventario.module").then(m => m.TipoInventarioModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfiguracionRoutingModule { }
