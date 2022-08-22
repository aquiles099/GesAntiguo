import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// home
import { HomeComponent } from './home/home.component';
import { InternalErrorComponent } from './home/views/internal-error/internal-error.component';
import { ProfileConfigurationComponent } from './home/views/profile-configuration/profile-configuration.component';

const routes: Routes = [
  {
    path: "home",
    component: HomeComponent,
    children: [
      {
        path: '',
        redirectTo: 'proyectos',
        pathMatch: "full"
      },
      {
        path: 'proyectos',
        loadChildren: () => import("./home/views/projects/projects.module").then(m => m.ProjectsModule),
      },
      {
        path: 'usuarios',
        loadChildren: () => import("./home/views/users/users.module").then(m => m.UsersModule),
      },
      {
        path: 'empresas',
        loadChildren: () => import("./home/views/companies/companies.module").then(m => m.CompaniesModule),
      },
      {
        path: 'perfil/configuracion',
        component: ProfileConfigurationComponent
      },
      {
        path: "error-interno",
        component: InternalErrorComponent
      }
    ]
  },
  {
    path: 'proyectos/:id', 
    loadChildren: () => import("./projects/projects.module").then(m => m.ProjectsModule),
  },
  {
    path: '**',
    redirectTo: "home"
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MediumRoutingModule { }
