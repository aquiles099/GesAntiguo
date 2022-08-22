import { NgModule } from '@angular/core';
import { CompaniesRoutingModule } from './companies-routing.module';
import { SharedModule } from '../../../../../shared/shared.module';

import { TableComponent } from './views/table/table.component';
import { CreateComponent } from './views/create/create.component';
import { DetailsComponent } from './views/details/details.component';
import { EditComponent } from './views/edit/edit.component';

import { CompanyService } from '../../../../../services/medium/administration/company.service';
import { ProvinceService } from '../../../../../services/medium/administration/province.service';

@NgModule({
  declarations: [ TableComponent, CreateComponent, EditComponent, DetailsComponent],
  imports: [
    SharedModule,
    CompaniesRoutingModule
  ],
  providers:[
    CompanyService,
    ProvinceService
  ]
})
export class CompaniesModule { }
