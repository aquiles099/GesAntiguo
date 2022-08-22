import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../../../../../shared/shared.module';
import { TellinkRoutingModule } from './tellink-routing.module';

import { DashboardComponent } from './views/dashboard/dashboard.component';

@NgModule({
  declarations: [
    DashboardComponent,
  ],
  imports: [
    SharedModule,
    TellinkRoutingModule
  ]
})
export class TellinkModule { }
