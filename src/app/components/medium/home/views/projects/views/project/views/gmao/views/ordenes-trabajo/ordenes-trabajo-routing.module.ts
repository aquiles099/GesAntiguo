import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrdenesTrabajoComponent } from './ordenes-trabajo.component';
import { NuevoComponent} from './views/nuevo/nuevo.component';
import { TablaComponent} from './views/tabla/tabla.component';
import { VerComponent} from './views/ver/ver.component';
import { EstadisticasResolverService } from 'src/app/services/resolvers/medium/home/projects/gmao/estadisticas-resolver.service';

const routes: Routes = [
  {
    path: "", 
    component: OrdenesTrabajoComponent, 
    children: [
      {
        path: "",
        component: TablaComponent,
        resolve: {
          datos: EstadisticasResolverService
        }
      },
      {
        path:'nuevo',
        component:NuevoComponent,
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
export class OrdenesTrabajoRoutingModule { }
