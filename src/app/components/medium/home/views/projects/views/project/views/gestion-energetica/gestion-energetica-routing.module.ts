import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GestionEnergeticaComponent } from './gestion-energetica.component';
import { EstadisticasResolverService } from '../../../../../../../../../services/resolvers/medium/home/projects/gmao/estadisticas-resolver.service';
const routes: Routes = [
  {
    path: "", 
    component: GestionEnergeticaComponent, 
    children: [
      {
        path: "localizaciones",
        loadChildren: () => import("./views/localizaciones/localizaciones.module").then(m => m.LocalizacionesModule)
      },
      {
        path: "tablero",
        loadChildren: () => import("./views/tablero/tablero.module").then(m => m.TableroModule)
      },
      {
        path: "concentradores",
        loadChildren: () => import("./views/concentradores/concentradores.module").then(m => m.ConcentradoresModule)
      },
      {
        path: "dispositivos",
        loadChildren: () => import("./views/dispositivos/dispositivos.module").then(m => m.DispositivosModule)
      },
      {
        path: "analisis",
        loadChildren: () => import("./views/analisis/analisis.module").then(m => m.AnalisisModule)
      },
      {
        path: "consulta",
        loadChildren: () => import("./views/consulta/consulta.module").then(m => m.ConsultaModule)
      },
      {
        path: "alertas",
        loadChildren: () => import("./views/alertas/alertas.module").then(m => m.AlertasModule)
      },
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
export class GestionEnergeticaRoutingModule { }
