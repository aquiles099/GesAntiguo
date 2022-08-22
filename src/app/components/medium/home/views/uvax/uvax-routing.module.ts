import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UvaxComponent } from './uvax.component';
import { DevicesComponent } from './devices/devices.component';

const routes: Routes = [
  {
    path: "",
    component: UvaxComponent,
    children: [
      {
        path: "",
        redirectTo: "dispositivos",
        pathMatch: "full"
      },
      {
        path: "dispositivos",
        component: DevicesComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UvaxRoutingModule { }
