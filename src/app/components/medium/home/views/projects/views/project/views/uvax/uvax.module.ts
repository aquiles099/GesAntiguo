import { NgModule } from '@angular/core';
import { UvaxRoutingModule } from './uvax-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';

import { UvaxComponent } from './uvax.component';
import { TableComponent as DevicesTableComponent } from './devices/table/table.component';

import { UvaxApiService } from "../../../../../../../../../services/medium/uvax-api.service";

@NgModule({
  declarations: [
    UvaxComponent,
    DevicesTableComponent
  ],
  imports: [
    UvaxRoutingModule,
    SharedModule
  ],
  providers: [
    UvaxApiService
  ]
})
export class UvaxModule { }
