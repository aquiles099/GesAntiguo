import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../../../../../../../shared/shared.module';
import { CommandCentersRoutingModule } from './command-centers-routing.module';
import { DatePipe } from '@angular/common';

// Centros de mando
import { CommandCentersComponent } from './command-centers.component';
import { TableComponent } from './views/table/table.component';
import { CreateComponent } from './views/create/create.component';

// CM
import { CommandCenterComponent } from './views/command-center/command-center.component';
import { DetailsComponent } from './views/command-center/views/details/details.component';
import { EditComponent } from './views/command-center/views/edit/edit.component';

// Actuaciones de CM
import { TableComponent as OperationsTableComponent } from './views/command-center/views/operations/views/table/table.component';
import { DetailsComponent as OperationsDetailsComponent } from './views/command-center/views/operations/views/details/details.component';

// Medidas de CM
import { MeasuresDashboardComponent } from './views/command-center/views/measures-dashboard/measures-dashboard.component';
import { DateFilterFormComponent } from './views/command-center/views/measures-dashboard/date-filter-form/date-filter-form.component';
import { ChartComponent } from './views/command-center/views/measures-dashboard/chart/chart.component';

// Alarmas recibidas de CM
import { TableComponent as ReceivedAlarmsComponent } from './views/command-center/views/alarms/table/table.component';

@NgModule({
  declarations: [
    CommandCentersComponent,
    TableComponent,
    CreateComponent,
    // CM
    CommandCenterComponent,
    DetailsComponent,
    EditComponent,
    // actuaciones
    OperationsTableComponent,
    OperationsDetailsComponent,
    // medidas
    MeasuresDashboardComponent,
    DateFilterFormComponent,
    ChartComponent,
    // alarmas recibidas
    ReceivedAlarmsComponent
  ],
  imports: [
    SharedModule,
    CommandCentersRoutingModule
  ],
  providers: [
    DatePipe
  ]
})
export class CommandCentersModule { }
