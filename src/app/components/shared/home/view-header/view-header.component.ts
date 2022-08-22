import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BreadcrumbsHomeNavigation } from '../../../../models/medium/breadcrumbs-home-navigation';

@Component({
  selector: 'home-view-header',
  templateUrl: './view-header.component.html',
  styleUrls: ['./view-header.component.css']
})
export class ViewHeaderComponent implements OnInit
{

  @Input()
  public title:string = "";

  @Input()
  public enableTourButton:boolean = true;
  
  @Output()
  public showTour:EventEmitter<void> = new EventEmitter;
  
  public navigation:{name:string, path: string, queryParams:{[key:string]:string}}[] = [];
  
  @Input()
  public navigationSize:number = 3; 

  constructor(
    private _router:Router,
    private route:ActivatedRoute
  )
  {  }

  public ngOnInit(): void
  {
    const breadcrumbsNavigation = new BreadcrumbsHomeNavigation(
      this._router.url,
      this.route.snapshot.routeConfig.path
    );

    this.navigation = breadcrumbsNavigation.buildAndGet();
  }

  public showTourEvent():void
  {
    this.showTour.emit();
  }
}
