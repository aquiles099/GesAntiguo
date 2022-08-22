import { Component, ViewChild, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { ProjectCreationModalComponent } from './project-creation-modal/project-creation-modal.component';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';

const ANIMATION_DURATION = 250;

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    fadeInOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class HomeComponent implements AfterViewChecked
{
  @ViewChild(SidebarMenuComponent)
  public SidebarMenu: SidebarMenuComponent;

  @ViewChild(ProjectCreationModalComponent)
  public ProjectCreationModal: ProjectCreationModalComponent;

  constructor(
    private changeDetector: ChangeDetectorRef
  )
  {
  }

  public ngAfterViewChecked():void
  {
    this.changeDetector.detectChanges();
  }

  public toggleSideBarMenuVisibility(): void
  {
    this.SidebarMenu.toggleVisibility();
  }

  public onSelectMenuOption(action: string): void
  {
    switch (action) {
      case "newProject":
        this.ProjectCreationModal.open();
        break;
    }

    const screenWidth = (window as any).visualViewport ? (window as any).visualViewport.width : window.screen.width;

    if (screenWidth < 576)
      this.toggleSideBarMenuVisibility();
  }

}
