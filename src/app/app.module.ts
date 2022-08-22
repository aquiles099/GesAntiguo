import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { AgmCoreModule } from '@agm/core';
import { BrowserModule } from '@angular/platform-browser';
import { SharedModule } from './shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GoogleMapsModule } from '@angular/google-maps';
import { HttpClientJsonpModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { HttpModule} from '@angular/http';
import es from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
registerLocaleData(es);

import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

// Angular Material
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ChartModule } from 'angular-highcharts';
import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

//  Components
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';

// services
import { ShepherdService } from 'angular-shepherd';
import { FisotecDbService } from './services/unic/fisotec-db.service';
import { ProjectLayersService } from './services/medium/project-layers.service';

function buildUnicDb(fisotecDbService: FisotecDbService): () => Promise<void> {
  return () => fisotecDbService.openIDBConnection();
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ],
  imports: [
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatExpansionModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatMenuModule,
    ChartModule,
    NgxDaterangepickerMd.forRoot(),
    AgmCoreModule.forRoot( {
      //apiKey: 'AIzaSyDwFShqAUJOcBgvYoCT4eIhKX7aZo6Ygc4'
      apiKey: 'AIzaSyB97SkgD74y8v84cC3GePbP1tsEhB-YEtw'
    }),
    GoogleMapsModule,
    HttpClientJsonpModule,
    HttpModule,
    GooglePlaceModule,
    NgxSkeletonLoaderModule,
    MatDatepickerModule,
  ],
  providers: [
    ProjectLayersService,
    ShepherdService,
    {
      provide: APP_INITIALIZER,
      useFactory: () => buildUnicDb,
      deps: [FisotecDbService],
      multi: true,
    },
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
