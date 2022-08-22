import { Component, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { fadeInLeftOnEnterAnimation, fadeOutLeftOnLeaveAnimation } from 'angular-animations';
import { Subscription } from 'rxjs';
import { ProjectsService } from '../../../../services/unic/projects.service';

export interface SidebarMenuOption
{
  url: string;
  title: string;
  tag: string|number;
  icon: string;
}

const ANIMATION_DURATION = 250;

@Component({
  selector: 'home-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.css'],
  animations: [
    fadeInLeftOnEnterAnimation({ duration: ANIMATION_DURATION }),
    fadeOutLeftOnLeaveAnimation({ duration: ANIMATION_DURATION })
  ]
})
export class SidebarMenuComponent implements OnInit, OnDestroy
{
  public isCollapsed: boolean = false;

  public options:Array<SidebarMenuOption> = [];
  public projectsServiceSubscription:Subscription;

  @Output()
  public onSelectOption: EventEmitter<string> = new EventEmitter();

  constructor(
    private _projectsService:ProjectsService,
  ) { }

  public ngOnInit(): void
  {
    this.projectsServiceSubscription = this._projectsService.project$.subscribe(projects => {
      
      this.options = [
        {
          url: "/unic/home/proyectos",
          title: "Todos los proyectos",
          tag: projects.length,
          icon: null
        }
      ];

    });

    this.onWindowResize();
  }

  @HostListener("window:resize")
  public onWindowResize(): void
  {
    const screenWidth = (window as any).visualViewport ? (window as any).visualViewport.width : window.screen.width;
    this.isCollapsed = ! (screenWidth > 576);
  }

  public toggleVisibility(): void {
    this.isCollapsed = ! this.isCollapsed;
  }

  public onSelectOptionEvent(action: string): void
  {
    this.onSelectOption.emit(action);
  }

  public ngOnDestroy():void
  {
    this.projectsServiceSubscription.unsubscribe();
    this.options = [];
  }
}
