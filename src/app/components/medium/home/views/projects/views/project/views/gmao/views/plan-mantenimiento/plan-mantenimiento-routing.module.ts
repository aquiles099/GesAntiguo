import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EstadisticasResolverService } from 'src/app/services/resolvers/medium/home/projects/gmao/estadisticas-resolver.service';
import { PlanMantenimientoComponent } from './plan-mantenimiento.component';
import { TablaComponent} from './views/tabla/tabla.component';
import { VerComponent} from './views/ver/ver.component';


const routes: Routes = [
  {
    path: "", 
    component: PlanMantenimientoComponent, 
    children: [
      {
        path: "",
        component: TablaComponent,
        resolve: {
          datos: EstadisticasResolverService
        }
      },
      {
        path:'ver',
        component:VerComponent,
        resolve: {
          datos: EstadisticasResolverService
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlanMantenimientoRoutingModule { }
