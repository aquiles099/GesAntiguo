import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CommandCentersComponent } from './command-centers.component';
import { TableComponent } from './views/table/table.component';
import { CreateComponent } from './views/create/create.component';

// CM
import { CommandCenterComponent } from './views/command-center/command-center.component';
import { EditComponent } from './views/command-center/views/edit/edit.component';
import { DetailsComponent } from './views/command-center/views/details/details.component';

// actuaciones cm
import { TableComponent as OperationsTableComponent } from './views/command-center/views/operations/views/table/table.component';
import { DetailsComponent as OperationsDetailsComponent } from './views/command-center/views/operations/views/details/details.component';

// medidas CM
import { MeasuresDashboardComponent } from './views/command-center/views/measures-dashboard/measures-dashboard.component';

// alarmas recibidas CM
import { TableComponent as ReceivedAlarmsComponent } from './views/command-center/views/alarms/table/table.component';

// resolvers
import { DetailsResolverService } from '../../../../../../../../../../../services/resolvers/medium/home/projects/tellink/command-centers/details-resolver.service';
import { DetailsResolverService as OperationsDetailsResolverService } from '../../../../../../../../../../../services/resolvers/medium/home/projects/tellink/command-centers/operations/details-resolver.service';

const routes: Routes = [
  {
    path: "",
    component: CommandCentersComponent,
    children: [
      {
        path: "",
        component: TableComponent
      },
      {
        path: "nuevo",
        component: CreateComponent
      },
      {
        path: ":cmId",
        component: CommandCenterComponent,
        resolve: {
          cm: DetailsResolverService
        },
        children: [
          {
            path: "",
            component: DetailsComponent
          },
          {
            path: "editar",
            component: EditComponent
          },
          {
            path: "actuaciones",
            children: [
              {
                path: "",
                component: OperationsTableComponent
              },
              {
                path: ":id",
                component: OperationsDetailsComponent,
                resolve: {
                  operation: OperationsDetailsResolverService
                }
              },
            ]
          },
          {
            path: "medidas",
            component: MeasuresDashboardComponent
          },
          {
            path: "alarmas-recibidas",
            component: ReceivedAlarmsComponent
          },
        ]
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
    OperationsDetailsResolverService
  ]
})
export class CommandCentersRoutingModule { }
