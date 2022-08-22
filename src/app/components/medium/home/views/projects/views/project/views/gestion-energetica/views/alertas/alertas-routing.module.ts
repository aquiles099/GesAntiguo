import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TablaComponent } from './views/tabla/tabla.component';
import { EstadisticasResolverService } from 'src/app/services/resolvers/medium/home/projects/gmao/estadisticas-resolver.service';
import {AlertasComponent} from './alertas.component';
const routes: Routes = [
  {
    path: "", 
    component: AlertasComponent, 
    children: [
      {
        path: "",
        component: TablaComponent,
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
export class AlertasRoutingModule { }
