import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';

// resolvers
import { UserProjectsResolverService } from './services/resolvers/user-projects-resolver.service';
import { UserPermissionsResolverService as UserPermissionsInProjectMapResolverService } from './services/resolvers/medium/projects/map/user-permissions-resolver.service';
import { UserPermissionsResolverService } from './services/resolvers/medium/user-permissions-resolver.service';
import { AuthenticatedUserDataResolverService } from './services/resolvers/authenticated-user-data-resolver.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'unic',
    loadChildren: () => import("./components/unic/unic.module").then(m => m.UnicModule),
    resolve: {
      projectsWereLoaded: UserProjectsResolverService
    }
  },
  {
    path: 'medium',
    loadChildren: () => import("./components/medium/medium.module").then(m => m.MediumModule),
    resolve: {
      userData: AuthenticatedUserDataResolverService,
      userPermissions: UserPermissionsResolverService,
      projectsWereLoaded: UserProjectsResolverService,
    }
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    UserPermissionsInProjectMapResolverService,
  ]
})
export class AppRoutingModule { }
