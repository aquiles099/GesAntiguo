import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AnalisisComponent} from './analisis.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { EstadisticasResolverService } from 'src/app/services/resolvers/medium/home/projects/gmao/estadisticas-resolver.service';
const routes: Routes = [
  {
    path: "", 
    component: AnalisisComponent, 
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
export class AnalisisRoutingModule { }
