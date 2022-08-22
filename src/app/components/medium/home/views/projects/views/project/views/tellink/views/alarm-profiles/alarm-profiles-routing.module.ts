import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TableComponent } from './table/table.component';
import { CreateComponent } from './create/create.component';
import { DetailsComponent } from './details/details.component';
import { EditComponent } from './edit/edit.component';

// resolvers
import { DetailsResolverService } from '../../../../../../../../../../../services/resolvers/medium/home/projects/tellink/alarm-profiles/details-resolver.service';

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
      alarmProfile: DetailsResolverService
    },
    children: [
      {
        path: "",
        component: DetailsComponent
      },
      {
        path: "editar",
        component: EditComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers:[
    DetailsResolverService
  ]
})
export class AlarmProfilesRoutingModule { }
