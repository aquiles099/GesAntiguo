import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TableComponent } from './views/table/table.component';
import { CreateComponent } from './views/create/create.component';
import { EditComponent } from './views/edit/edit.component';

// resolvers
import { DetailsResolverService } from '../../../../../services/resolvers/medium/home/users/details-resolver.service';

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
    path: ":id/editar",
    component: EditComponent,
    resolve: {
      user: DetailsResolverService
    }
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
    DetailsResolverService
  ]
})
export class UsersRoutingModule { }
