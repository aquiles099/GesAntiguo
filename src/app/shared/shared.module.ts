import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '../pipes/pipes.module';
import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from "ngx-spinner";
import { ToastrModule } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { DataTablesModule } from 'angular-datatables';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';
import { HighchartsChartModule } from 'highcharts-angular';
import { SortablejsModule } from 'ngx-sortablejs';
import { ColorPickerModule } from 'ngx-color-picker';

// ngx-bootstrap
import { ModalModule } from 'ngx-bootstrap/modal';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { TabsModule } from 'ngx-bootstrap/tabs';

// material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';

// components
import { HeaderComponent } from '../components/shared/home/header/header.component';
import { MapHeaderComponent } from '../components/shared/projects/map/map-header/map-header.component';
import { ProjectCardComponent } from '../components/shared/projects/project-card/project-card.component';
import { ProjectMapComponent } from '../components/shared/project-map/project-map.component';
import { ViewHeaderComponent } from '../components/shared/home/view-header/view-header.component';
import { BaseDatatableComponent } from '../components/shared/base-datatable/base-datatable.component';
import { HideableSectionComponent } from '../components/shared/hideable-section/hideable-section.component';

import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    HeaderComponent,
    MapHeaderComponent,
    ProjectCardComponent,
    ProjectMapComponent,
    ViewHeaderComponent,
    BaseDatatableComponent,
    HideableSectionComponent
  ],
  imports: [
    //
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    NgxSpinnerModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      preventDuplicates: true,
      enableHtml: true
    }),
    NgSelectModule,
    //ngx bootstrap
    ModalModule.forRoot(),
    CarouselModule.forRoot(),
    TypeaheadModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot(),
    TabsModule.forRoot(),
    //
    DataTablesModule.forRoot(),
    LeafletModule,
    LeafletDrawModule,
    HighchartsChartModule,
    PipesModule,
    SortablejsModule.forRoot({ animation: 150 }),
    ColorPickerModule,
    // material
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    //
  ],
  exports: [
    //
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxSpinnerModule,
    ToastrModule,
    //ngx bootstrap
    ModalModule,
    CarouselModule,
    NgSelectModule,
    TypeaheadModule,
    CollapseModule,
    BsDatepickerModule,
    TimepickerModule,
    TabsModule, 
    //
    DataTablesModule,
    LeafletModule,
    LeafletDrawModule,
    HighchartsChartModule,
    PipesModule,
    SortablejsModule,
    ColorPickerModule,
    // material
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    // COMPONENTS
    HeaderComponent,
    MapHeaderComponent,
    ProjectCardComponent,
    ProjectMapComponent,
    ViewHeaderComponent,
    BaseDatatableComponent,
    HideableSectionComponent
  ]
})
export class SharedModule { }
