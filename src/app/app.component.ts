import { Component } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { NgSelectConfig } from '@ng-select/ng-select';
import { SpinnerService } from './services/spinner.service';
import { ShepherdService } from 'angular-shepherd';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent
{
  public spinnerContent: string = "";

  constructor(
    private _ngCongifService: NgSelectConfig,
    private _appSpinnerService: SpinnerService,
    private router: Router,
    private _shepherdService:ShepherdService
  ) {
    this._ngCongifService.notFoundText = 'Sin opciones';
    this._ngCongifService.placeholder = 'Seleccione una opcion';
    this._ngCongifService.bindValue = 'value';
    this._ngCongifService.loadingText = "Espere...";
    this._ngCongifService.clearAllText = "Limpiar";

    this.router.events.subscribe(event => {

      if( event instanceof NavigationStart )
        this._appSpinnerService.show();

      if( event instanceof NavigationEnd )
        this._appSpinnerService.hide();

    });
  }

  ngOnInit()
  {
    /* Configuracion por defecto Shepherd JS */

    this._shepherdService.defaultStepOptions = {
      scrollTo: true,
      cancelIcon: {
        enabled: true
      },
      modalOverlayOpeningPadding: 10,
      popperOptions: {
        modifiers: [{ name: 'offset', options: { offset: [0, 12] } }]
      }
    };

    this._shepherdService.modal = true;
    
    this._shepherdService.confirmCancel = false;
    
    /* ****** */

    this._appSpinnerService.contentObservable.subscribe(text => this.spinnerContent = text);

    this.router.events.subscribe((evt) => {

      if (!(evt instanceof NavigationEnd))
        return;

      window.scrollTo(0, 0);
    });

  }
}
