import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// home
import { HomeComponent } from './home/home.component';
import { ListComponent } from './home/views/projects/list/list.component';
import { DetailsComponent } from './home/views/projects/details/details.component';
import { AttributeSettingsComponent } from './home/views/projects/attribute-settings/attribute-settings.component';

// project
import { ProjectComponent } from './project/project.component';
import { ConfigurationComponent } from './project/configuration/configuration.component';
import { MapComponent } from './project/map/map.component';

// guards
import { CanDeactivateGuard } from '../../services/guards/can-deactivate.guard';

// resolvers
import { DetailsResolverService } from '../../services/resolvers/unic/home/projects/details-resolver.service';

const routes: Routes = [
  {
    path:"",
    redirectTo: "home"
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      {
        path: "",
        redirectTo: "proyectos",
        pathMatch: "full"
      },
      {
        path: "proyectos",
        component: ListComponent
      },
      {
        path: "proyectos/:id/informacion",
        component: DetailsComponent,
        resolve: {
          data: DetailsResolverService
        }
      },
      {
        path: "proyectos/:id/configuracion-de-atributos",
        component: AttributeSettingsComponent,
      }
    ]
  },
  {
    path: 'proyectos',
    component: ProjectComponent,
    children: [
      {
        path: "",
        redirectTo: "/home/proyectos",
        pathMatch: "full"
      },
      {
        path: ':id/configuracion',
        component: ConfigurationComponent,
        canDeactivate: [CanDeactivateGuard]
      },
      {
        path: ':id/mapa',
        component: MapComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: "home"
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    DetailsResolverService
  ]
})
export class UnicRoutingModule { }
