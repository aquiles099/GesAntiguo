import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListComponent } from './views/list/list.component';

import { ActionsComponent } from './views/project/views/actions/actions.component';
import { DetailsComponent } from './views/project/views/details/details.component';
import { AttributeSettingsComponent } from './views/project/views/attribute-settings/attribute-settings.component';
import { PermissionManagementComponent } from './views/project/views/permission-management/permission-management.component';

// resolvers
import { ProjectResolverService } from '../../../../../services/resolvers/medium/projects/project-resolver.service';
import { DetailsResolverService } from '../../../../../services/resolvers/medium/home/projects/details-resolver.service';
import { AttributeSettingsResolverService } from '../../../../../services/resolvers/medium/home/projects/attribute-settings-resolver.service';
import { PermissionManagementResolverService } from '../../../../../services/resolvers/medium/home/projects/permission-management-resolver.service';
import { UserPermissionsInProjectResolverService } from '../../../../../services/resolvers/medium/projects/user-permissions-in-project-resolver.service';

// uvax
import { LoginResolverService as UvaxLoginResolverService } from '../../../../../services/resolvers/medium/home/projects/uvax/login-resolver.service';

const routes: Routes = [
  {
    path: "",
    component: ListComponent
  },
  {
    path: ":id",
    resolve: {
      project: ProjectResolverService,
      userPermissions: UserPermissionsInProjectResolverService
    },
    children: [
      {
        path: '',
        redirectTo: "acciones"
      },
      {
        path: 'acciones',
        component: ActionsComponent,
      },
      {
        path: 'informacion',
        component: DetailsComponent,
        resolve: {
          data: DetailsResolverService
        }
      },
      {
        path: 'configuracion-de-atributos',
        component: AttributeSettingsComponent,
        resolve: {
          data: AttributeSettingsResolverService
        }
      },
      {
        path: 'gestion-de-permisos',
        component: PermissionManagementComponent,
        resolve: {
          data: PermissionManagementResolverService
        }
      },
      {
        path: 'tellink',
        loadChildren: () => import("./views/project/views/tellink/tellink.module").then(m => m.TellinkModule)
      },
      // {
      //   path: 'uvax',
      //   resolve: {
      //     loggedIn: UvaxLoginResolverService 
      //   },
      //   children: [
      //     {
      //       path: "dispositivos",
      //       loadChildren: () => import("./views/project/views/uvax/devices/devices.module").then(m => m.DevicesModule)
      //     }
      //   ]
      // },
      {
        path: 'gmao',
        loadChildren: () => import("./views/project/views/gmao/gmao.module").then(m => m.GmaoModule)
      },
      {
        path: 'gestion-energetica',
        loadChildren: () => import("./views/project/views/gestion-energetica/gestion-energetica.module").then(m => m.GestionEnergeticaModule)
      },
      {
        path: "**",
        redirectTo: "acciones"
      }
    ]
  },
  {
    path: "**",
    redirectTo: ""
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    // resolvers
    ProjectResolverService,
    DetailsResolverService,
    AttributeSettingsResolverService,
    PermissionManagementResolverService,
    UserPermissionsInProjectResolverService,
    UvaxLoginResolverService
  ]
})
export class ProjectsRoutingModule { }
