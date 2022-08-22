import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './views/dashboard/dashboard.component';

// RESOLVERS
import { LoginResolverService } from '../../../../../../../../../services/resolvers/medium/home/projects/tellink/login-resolver.service';

const routes: Routes = [
  {
    path: "",
    resolve: {
      loggedIn: LoginResolverService 
    },
    children: [
      {
        path: "",
        redirectTo: "tablero",
        pathMatch: "full"
      },
      {
        path: "tablero",
        component: DashboardComponent
      },
      {
        path: "centros-de-mando",
        loadChildren: () => import("./views/command-centers/command-centers.module").then(m => m.CommandCentersModule)
      },
      {
        path: "perfiles-de-alarmas",
        loadChildren: () => import("./views/alarm-profiles/alarm-profiles.module").then(m => m.AlarmProfilesModule)
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
    LoginResolverService
  ]
})
export class TellinkRoutingModule { }
