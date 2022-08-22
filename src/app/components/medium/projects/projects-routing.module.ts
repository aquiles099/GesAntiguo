import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfigurationComponent } from './views/configuration/configuration.component';

//resolvers
import { ProjectResolverService } from '../../../services/resolvers/medium/projects/project-resolver.service';
import { UserPermissionsInProjectResolverService } from '../../../services/resolvers/medium/projects/user-permissions-in-project-resolver.service';
import { ConfigurationResolverService } from '../../../services/resolvers/medium/projects/configuration-resolver.service';

import { CanDeactivateGuard } from '../../../services/guards/can-deactivate.guard';

const routes: Routes = [
  {
    path: "",
    resolve: {
      project: ProjectResolverService,
      userPermissions: UserPermissionsInProjectResolverService
    },
    children: [
      {
        path: "",
        redirectTo: "configuracion",
        pathMatch: "full"
      },
      {
        path: "configuracion",
        component: ConfigurationComponent,
        resolve: {
          availableProjections: ConfigurationResolverService
        },
        canDeactivate: [CanDeactivateGuard]
      },
      {
        path: "mapa",
        loadChildren: () => import("./views/mapa/mapa.module").then(m => m.MapaModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    ProjectResolverService,
    UserPermissionsInProjectResolverService,
    ConfigurationResolverService
  ]
})
export class ProjectsRoutingModule { }
