import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { toggleFullscreen } from 'src/app/shared/helpers';

@Component({
  templateUrl: './details.component.html',
  styleUrls: [
    './details.component.css',
    '../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class DetailsComponent implements OnInit {

  public company:any;

  public form:FormGroup;

  public routeDataSubscription:Subscription;

  constructor(
    private route:ActivatedRoute,
    private router:Router
  )
  {
    this.form = new FormGroup({
      name: new FormControl(null),
      cif: new FormControl(null),
      province: new FormControl(null),
      municipality: new FormControl(null),
      users_per_project: new FormControl(null),
      installers_per_project: new FormControl(null),
      max_users_number: new FormControl(null),
      admin_1: new FormGroup({
        nombre: new FormControl(null),
        apellidos: new FormControl(null),
        nif: new FormControl(null),
        email: new FormControl(null),
        id_usuario: new FormControl(null),
        clave: new FormControl(null),
      }),
      admin_2: new FormGroup({
        nombre: new FormControl(null),
        apellidos: new FormControl(null),
        nif: new FormControl(null),
        email: new FormControl(null),
        id_usuario: new FormControl(null),
        clave: new FormControl(null),
      })
    });
  }

  public ngOnInit(): void
  {
    this.routeDataSubscription = this.route.parent.data.subscribe(data => {
            
      this.company = data.company;

      this.form.patchValue(data.company);
      this.form.patchValue({"province": data.company.municipality.province.name});
      this.form.patchValue({"municipality": data.company.municipality.name});
      
      data.company.administrators.forEach((admin, i) => 
        
        this.form.patchValue({['admin_' + (i + 1)]: admin})

      );
      
      this.form.disable();
    });
  }

  public toggleFullscreen(event:any):void
  {
      toggleFullscreen(event);
  }

  public backToTable():void
  {
    let path = this.router.url.slice(0, this.router.url.indexOf( "/" + this.company.id ) );
    this.router.navigateByUrl( path );
  }

  public ngOnDestroy(): void
  {
    this.routeDataSubscription.unsubscribe();
  }

}
