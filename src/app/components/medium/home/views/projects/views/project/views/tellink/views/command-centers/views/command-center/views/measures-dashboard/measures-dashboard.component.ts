import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommandCenter } from '../../../../../../../../../../../../../../../interfaces/medium/tellink/command-center';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { ToastrService } from 'ngx-toastr';
import { TellinkApiService } from '../../../../../../../../../../../../../../../services/medium/tellink-api.service';
import { DateFilterFormComponent } from './date-filter-form/date-filter-form.component';
import { ChartComponent } from './chart/chart.component';

@Component({
  templateUrl: './measures-dashboard.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './measures-dashboard.component.css',
  ],
  animations: [
    fadeInOnEnterAnimation({duration: 250}),
    fadeOutOnLeaveAnimation({duration: 250})
  ]
})
export class MeasuresDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  private routeDataSubscription: Subscription;
  
  public cm: CommandCenter;

  public sendingForm:boolean = false;

  @ViewChild(DateFilterFormComponent)
  public DateFilterForm:DateFilterFormComponent;

  @ViewChild(ChartComponent)
  public Chart:ChartComponent;

  constructor(
    private route: ActivatedRoute,
    private _toastrService:ToastrService,
    private _tellinkApiService:TellinkApiService,
  ) {
  }

  public ngOnInit(): void {
    this.routeDataSubscription = this.route.parent.data.subscribe(data => this.cm = data.cm);
  }
 
  public ngAfterViewInit(): void
  {
    this.sendingForm = false;
  }

  public async getMeasuresAndUpdateChart(form:{frecuency:"minute"|"day"|"month", date:Date|Date[], startTime:Date, endTime:Date, from:string, to:string}):Promise<void>
  {
    try 
    {
      this.sendingForm = true;

      this.Chart.chartRef.showLoading();

      const measures = await this._tellinkApiService.getMeasuresPerCm(this.cm.id, {
        frecuency: form.frecuency,
        from: form.from,
        to: form.to
      });
      
      const selectedFrecuency = this.DateFilterForm.frequencies.find(frecuency => frecuency.value === form.frecuency);

      let chartData = Object.assign({}, form, { frecuencyLabel: selectedFrecuency.key, measures });

      this.Chart.update(chartData);
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this.sendingForm = false;
      this.Chart.chartRef.hideLoading();
    }
  }

  public ngOnDestroy(): void {
    this.routeDataSubscription.unsubscribe();
  }
}

