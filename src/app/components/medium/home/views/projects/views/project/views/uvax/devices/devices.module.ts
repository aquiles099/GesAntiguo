import { NgModule } from '@angular/core';
import { DevicesRoutingModule } from './devices-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';

import { TableComponent } from './table/table.component';


@NgModule({
  declarations: [
    TableComponent
  ],
  imports: [
    SharedModule,
    DevicesRoutingModule
  ]
})
export class DevicesModule { }
