import { Component, ViewChild } from '@angular/core';
import { ProjectCreationModalComponent } from './project-creation-modal/project-creation-modal.component';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent 
{
  @ViewChild(ProjectCreationModalComponent)
  public ProjectCreationModal:ProjectCreationModalComponent;

  constructor() { }

}
