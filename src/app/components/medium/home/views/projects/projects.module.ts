import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { ProjectsRoutingModule } from './projects-routing.module';

import { ListComponent } from './views/list/list.component';
import { ProjectBoxComponent } from './views/list/project-box/project-box.component';
import { ActionsComponent } from './views/project/views/actions/actions.component';
import { DetailsComponent } from './views/project/views/details/details.component';
import { AttributeSettingsComponent } from './views/project/views/attribute-settings/attribute-settings.component';
import { AttributeCreationModalComponent } from './views/project/views/attribute-settings/attribute-creation-modal/attribute-creation-modal.component';
import { PermissionManagementComponent } from './views/project/views/permission-management/permission-management.component';

// services
import { UvaxApiService } from '../../../../../services/medium/uvax-api.service';
import { PermissionManagementService } from '../../../../../services/medium/administration/permission-management.service';

@NgModule({
  declarations: [
    ListComponent,
    ProjectBoxComponent,
    ActionsComponent,
    DetailsComponent,
    AttributeSettingsComponent,
    AttributeCreationModalComponent,
    PermissionManagementComponent,
  ],
  imports: [
    ProjectsRoutingModule,
    SharedModule
  ],
  providers: [
    UvaxApiService,
    PermissionManagementService
  ]
})
export class ProjectsModule { }
