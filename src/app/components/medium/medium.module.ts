import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { MediumRoutingModule } from './medium-routing.module';

// home
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './home/header/header.component';
import { SidebarMenuComponent } from './home/sidebar-menu/sidebar-menu.component';
import { ProjectCreationModalComponent } from './home/project-creation-modal/project-creation-modal.component';
import { InternalErrorComponent } from './home/views/internal-error/internal-error.component';
import { ProfileConfigurationComponent } from './home/views/profile-configuration/profile-configuration.component';
import { CompanyTabComponent } from './home/views/profile-configuration/company-tab/company-tab.component';
import { UserTabComponent } from './home/views/profile-configuration/user-tab/user-tab.component';

// services
import { ProvinceService } from '../../services/medium/administration/province.service';
import { CompanyService } from '../../services/medium/administration/company.service';
import { ProfileService } from '../../services/medium/administration/profile.service';

@NgModule({
  declarations: [
    // home
    HomeComponent,
    HeaderComponent,
    SidebarMenuComponent,
    ProjectCreationModalComponent,
    InternalErrorComponent,
    // profile configuration
    ProfileConfigurationComponent,
    CompanyTabComponent,
    UserTabComponent,
  ],
  imports: [
    SharedModule,
    MediumRoutingModule
  ],
  providers: [
    ProvinceService,
    CompanyService,
    ProfileService
  ]
})
export class MediumModule { }
