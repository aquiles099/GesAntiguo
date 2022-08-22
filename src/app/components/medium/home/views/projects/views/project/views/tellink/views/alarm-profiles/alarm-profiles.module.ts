import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../../../../../../../shared/shared.module';
import { AlarmProfilesRoutingModule } from './alarm-profiles-routing.module';

import { TableComponent } from './table/table.component';
import { CreateComponent } from './create/create.component';
import { EditComponent } from './edit/edit.component';
import { DetailsComponent } from './details/details.component';


@NgModule({
  declarations: [TableComponent, CreateComponent, EditComponent, DetailsComponent],
  imports: [
    SharedModule,
    AlarmProfilesRoutingModule
  ]
})
export class AlarmProfilesModule { }
