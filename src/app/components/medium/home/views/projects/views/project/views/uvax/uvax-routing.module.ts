import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UvaxComponent } from './uvax.component';
import { TableComponent as DevicesTableComponent } from './devices/table/table.component';

// resolvers
import { LoginResolverService } from '../../../../../../../../../services/resolvers/medium/home/projects/uvax/login-resolver.service';

const routes: Routes = [
  {
    path: "",
    component: UvaxComponent,
    resolve: {
      loggedIn: LoginResolverService 
    },
    children: [
      {
        path: "",
        component: DevicesTableComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    LoginResolverService
  ]
})
export class UvaxRoutingModule { }
