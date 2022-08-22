import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Spinner } from 'ngx-spinner/lib/ngx-spinner.enum';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  public contentObservable:Observable<string>
  public contentSubject:BehaviorSubject<string>

  constructor(
    public spinner:NgxSpinnerService
  ) {
    this.contentSubject = new BehaviorSubject("");
    this.contentObservable = this.contentSubject.asObservable();
   }

   public show(name?:string, options?:Spinner):void
   {
     this.spinner.show(name ?? "appSpinner", options);
   }

   public hide(name?:string):void
   {
     this.spinner.hide(name ?? "appSpinner");
   }

   public updateText(text:string):void
   {
     this.contentSubject.next(text);
   }

   public cleanText():void
   {
     this.contentSubject.next("");
   }

}
