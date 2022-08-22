import { Component, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { fadeInOnEnterAnimation, fadeInRightOnEnterAnimation, fadeOutOnLeaveAnimation, fadeOutRightOnLeaveAnimation, fadeInLeftOnEnterAnimation, fadeOutLeftOnLeaveAnimation, fadeInDownOnEnterAnimation, fadeOutDownOnLeaveAnimation, fadeInUpOnEnterAnimation, fadeOutUpOnLeaveAnimation } from 'angular-animations';
import { delayExecution } from "../../../shared/helpers"

const ANIMATION_DURATION = 250;

@Component({
  template: ``,
  styleUrls: ['./hideable-section.component.css'],
  animations: [
    fadeInOnEnterAnimation({ duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({ duration: ANIMATION_DURATION}),
    fadeInRightOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutRightOnLeaveAnimation({duration: ANIMATION_DURATION}),
    fadeInLeftOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutLeftOnLeaveAnimation({duration: ANIMATION_DURATION}),
    fadeInDownOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutDownOnLeaveAnimation({duration: ANIMATION_DURATION}),
    fadeInUpOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutUpOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class HideableSectionComponent
{
  protected ANIMATION_DURATION = ANIMATION_DURATION;

  protected _isVisible:boolean = false;

  @ViewChild('templateRef')
  public templateRef:ElementRef<HTMLElement>;

  @Output()
  public onShowing:EventEmitter<void> = new EventEmitter;

  @Output()
  public onHidden:EventEmitter<void> = new EventEmitter;

  constructor() {}
    
  get isVisible():boolean
  {
    return this._isVisible;
  }

  public async show():Promise<void>
  {
    this._isVisible = true;

    await delayExecution(this.ANIMATION_DURATION);

    this.onShowing.emit();
  }

  public async hide():Promise<void>
  {
    this._isVisible = false;

    await delayExecution(this.ANIMATION_DURATION);

    this.onHidden.emit();
  }

}
