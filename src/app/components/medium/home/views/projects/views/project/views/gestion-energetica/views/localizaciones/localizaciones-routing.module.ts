import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {LocalizacionesComponent} from './localizaciones.component';
import { TablaComponent} from './views/tabla/tabla.component';
import { EstadisticasResolverService } from 'src/app/services/resolvers/medium/home/projects/gmao/estadisticas-resolver.service';

const routes: Routes = [
  {
    path: "", 
    component: LocalizacionesComponent, 
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
export class LocalizacionesRoutingModule { }
