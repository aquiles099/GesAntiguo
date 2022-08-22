import { NgModule } from '@angular/core';
import { ProjectsRoutingModule } from './projects-routing.module';
import { SharedModule } from '../../../shared/shared.module';

// configuration
import { ConfigurationComponent } from './views/configuration/configuration.component';
import { SidebarComponent } from './views/configuration/sidebar/sidebar.component';
import { ProjectionSettingsSectionComponent } from './views/configuration/sidebar/projection-settings-section/projection-settings-section.component';
import { CabeceraComponent } from './views/configuration/cabecera/cabecera.component';

@NgModule({
  declarations: [
    ConfigurationComponent, 
    SidebarComponent, 
    ProjectionSettingsSectionComponent, 
    CabeceraComponent, 
  ],
  imports: [
    SharedModule,
    ProjectsRoutingModule,
  ]
})
export class ProjectsModule { }
