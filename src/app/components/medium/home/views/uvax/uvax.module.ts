import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { UvaxRoutingModule } from './uvax-routing.module';


import { UvaxComponent } from './uvax.component';
import { DevicesComponent } from './devices/devices.component';

import { UvaxApiService } from '../../../../../services/medium/uvax-api.service';

@NgModule({
  declarations: [
    UvaxComponent,
    DevicesComponent
  ],
  imports: [
    CommonModule,
    UvaxRoutingModule,
    SharedModule
  ],
  providers: [
    UvaxApiService
  ]
})
export class UvaxModule { }
