import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TableComponent } from './views/table/table.component';
import { CreateComponent } from './views/create/create.component';
import { DetailsComponent } from './views/details/details.component';
import { EditComponent } from './views/edit/edit.component';

// resolvers
import { DetailsResolverService } from '../../../../../services/resolvers/medium/home/companies/details-resolver.service';
import { EditResolverService } from '../../../../../services/resolvers/medium/home/companies/edit-resolver.service';

const routes: Routes = [
  {
    path: "",
    component: TableComponent
  },
  {
    path: "nuevo",
    component: CreateComponent
  },
  {
    path: ":id",
    resolve: {
      company: DetailsResolverService
    },
    children: [
      {
        path: "",
        component: DetailsComponent
      },
      {
        path: "editar",
        component: EditComponent,
        resolve: {
          data: EditResolverService
        },
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
    DetailsResolverService,
    EditResolverService
  ]
})
export class CompaniesRoutingModule { }
