import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { UsersRoutingModule } from './users-routing.module';

import { TableComponent } from './views/table/table.component';
import { CreateComponent } from './views/create/create.component';
import { EditComponent } from './views/edit/edit.component';

// services
import { CompanyService } from '../../../../../services/medium/administration/company.service';
import { UserService } from '../../../../../services/medium/administration/user.service';

@NgModule({
  declarations: [
    TableComponent,
    CreateComponent,
    EditComponent
  ],
  imports: [
    SharedModule,
    UsersRoutingModule
  ],
  providers:[
    CompanyService,
    UserService
  ]
})
export class UsersModule { }
