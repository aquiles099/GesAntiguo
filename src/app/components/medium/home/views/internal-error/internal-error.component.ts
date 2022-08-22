import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  templateUrl: './internal-error.component.html',
  styleUrls: ['./internal-error.component.css']
})
export class InternalErrorComponent
{
  constructor(
    private location:Location
  ) { }

  public goBack():void
  {
    this.location.back();
  }

}
