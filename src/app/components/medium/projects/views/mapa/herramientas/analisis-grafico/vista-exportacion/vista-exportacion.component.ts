import { Component, ViewChild, ElementRef, Input, ViewChildren, QueryList } from '@angular/core';
import { jsPDF } from "jspdf";
import { getFileContent, delayExecution } from 'src/app/shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { HideableSectionComponent } from '../../../../../../../shared/hideable-section/hideable-section.component';
import html2canvas from 'html2canvas';
import { ModalDirective } from 'ngx-bootstrap/modal';
import  'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { ChartConfiguration, ChartData } from 'src/app/interfaces/analysis/analysis-chart-configuration';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { MapService } from '../../../../../../../../services/unic/map.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { GraficoComponent } from '../grafico/grafico.component';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

export interface pageMargins
{
  top:number;
  right:number;
  bottom:number;
  left:number;
}

@Component({
  selector: 'vista-exportacion',
  templateUrl: './vista-exportacion.component.html',
  styleUrls: ['./vista-exportacion.component.css']
})
export class VistaExportacionComponent extends HideableSectionComponent
{
  private projectIconSrc:string;

  public exportMode:"chartsOnly"|"complete";

  @ViewChild("container")
  public container:ElementRef<HTMLElement>;

  @ViewChild(ModalDirective)
  public exportModeSelectionModal:ModalDirective;

  @Input()
  public chartsData:Array<ChartData> = [];

  @ViewChildren(GraficoComponent)
  public charts:QueryList<GraficoComponent>;

  @ViewChildren("linearIndicator")
  public linearIndicators:QueryList<ElementRef<HTMLElement>>;

  private pdf:jsPDFWithAutoTable;

  // margenes a4 en px
  protected margins:pageMargins = {
    left: 71.811023622,
    top: 71.811023622,
    right: 49.88976378,
    bottom: 138.70866142
  };

  private finalY:number;

  private numberOfExportedCharts:number = 0;

  constructor(
    private _spinnerService: SpinnerService,
    private _mapService: MapService,
    private _toastrService:ToastrService,
    private _projectService:ProjectService
  )
  {
    super();
  }

  public async export(exportMode:"complete"|"chartsOnly"):Promise<void>
  {
      try
      {
        this.exportModeSelectionModal.hide();

        this._spinnerService.updateText("Generando pdf...");
        this._spinnerService.show();

        this.exportMode = exportMode;

        const pdfOptions:any ={
          format: "a4",
          unit: "px",
          hotfixes: ["px_scaling"]
        };

        this.pdf = new jsPDF(pdfOptions) as jsPDFWithAutoTable;

        await super.show();

        this.initHighcharts();

        await this.addPdfHeader();

        await this.addMapImage();

        await this.addChartsImages();

        this.addFooterInPages();

        this.pdf.save(`${this._projectService.project.nombre}_análisis.pdf`);
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      await super.hide();
      this._spinnerService.hide();
      this._spinnerService.cleanText();
      this.pdf = null;
      this.numberOfExportedCharts = 0;
    }
  }

  private initHighcharts():void
  {
    this.charts.forEach(chart => {

      (chart.chartRef as any).navigation.update({buttonOptions: { enabled: false }});

      const chartData = this.chartsData.find(data => data.configuration.position == chart.configuration.position);

      chart.build(chartData.parameters);
    });
  }

  private async addPdfHeader():Promise<void>
  {
    this.finalY = this.margins.top;

    this.pdf.setFontSize(14);
    this.pdf.setTextColor("#333")
    this.pdf.setFont("Arial-Black","normal");

    this.pdf.text(`Análisis`, this.margins.left, this.margins.top);

    if( ! this.projectIconSrc )
    {
      const iconBlob = await (await fetch(this._projectService.project.icono)).blob();
      this.projectIconSrc = await getFileContent(iconBlob, "dataURL");
    }

    this.pdf.addImage(
      this.projectIconSrc,
      "PNG",
      this.pdf.internal.pageSize.getWidth() - ((this.margins.right + this.margins.left) ),
      this.margins.top / 2,
      45, 45,
      `icono-proyecto`
    );

    this.finalY += 45;

    this.pdf.setFont("Arial","normal");
    this.pdf.setFontSize(12);

    this.pdf.text(this._projectService.project.nombre, this.pdf.internal.pageSize.getWidth() - this.margins.right, this.finalY, {align: "right"});

    this.finalY += 30;

    const date = new Date();

    this.pdf.text(
      `${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}/${(date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)}/${date.getFullYear()}`,
      this.pdf.internal.pageSize.getWidth() - this.margins.right,
      this.finalY,
      {align: "right"}
    );

    this.finalY += 30;

    this.pdf.setDrawColor("#BDBDBD");

    this.pdf.line(this.margins.left, this.finalY, this.pdf.internal.pageSize.getWidth() - this.margins.right, this.finalY);

    this.finalY += 40;
  }

  private async addMapImage():Promise<void>
  {
    const mapImageSrc = await this._mapService.getMapScreenshot(),
          imgWidth = this.pdf.internal.pageSize.getWidth() - (this.margins.right + this.margins.left),
          imgHeight = 270;

    this.pdf.addImage(mapImageSrc, "JPEG", this.margins.left, this.finalY, imgWidth, imgHeight, `imagen-Mapa` );

    this.finalY += (60 + imgHeight);
  }

  private async addChartsImages():Promise<void>
  {
    let chartsInCurrentPage = 0,
        imgWidth = this.pdf.internal.pageSize.getWidth() - (this.margins.right + this.margins.left),
        imgHeight = 200,
        chartNumber = 1,
        chartsPerPage,
        yPosWindow = 300; // para mostrar grafico en proceso de exportacion.

    const charts = [...this.charts, ...this.linearIndicators];

    for(let chart of charts)
    {
      this.container.nativeElement.scrollTo(0, yPosWindow);

      const  imgSrc = chart instanceof GraficoComponent ?
      await this.getHighchartsImage(chart) :
      (await html2canvas(chart.nativeElement)).toDataURL();

      this.pdf.addImage(
        imgSrc,
        "JPEG",
        this.margins.left,
        this.finalY,
        imgWidth,
        imgHeight,
        `grafico-${chartNumber}`
      );

      chartsInCurrentPage++;
      chartNumber++;
      this.numberOfExportedCharts++;

      if(this.exportMode === "complete")
      {
        if( chart instanceof GraficoComponent )
        {
          this.finalY += (40 + imgHeight);
          await this.addDataTable( chart.configuration );
        }
        else
        {
          this.finalY += (40 + imgHeight);
        }
      }
      else
      {
        chartsPerPage = this.pdf.getCurrentPageInfo().pageNumber === 1 ? 2 : 3;

        if(chartsInCurrentPage === chartsPerPage && this.numberOfExportedCharts !== charts.length )
        {
          await this.addPageToPdf();
          chartsInCurrentPage = 0;
        }
        else
        {
          this.finalY += (40 + imgHeight);
        }
      }

      yPosWindow += 300;
    }

  }

  private async getHighchartsImage(chart:GraficoComponent):Promise<string>
  {
    const requestBody = {
      filename: chart.chartRef.title,
      type: "image/jpeg",
      width: 0,
      scale: 2,
      svg: (chart.chartRef as any).getSVG(),
      showTable: true
    };

    const formData = new FormData();

    for(let [key, value] of Object.entries(requestBody))
    {
      formData.append(key, value);
    }

    const chartImageBlob = await (await fetch("https://export.highcharts.com/", {
      body: formData,
      method: "POST"
    })).blob();

    return getFileContent(chartImageBlob,"dataURL");
  }

  private async addPageToPdf():Promise<void>
  {
    this.pdf.addPage();

    this.pdf.setPage( this.pdf.getNumberOfPages() );

    await this.addPdfHeader();
  }

  private async addDataTable(chartConfiguration:ChartConfiguration):Promise<void>
  {
    const chartData = this.chartsData.find(chartData => chartData.configuration.position === chartConfiguration.position);
  
    this.finalY += 10;

    this.pdf.autoTable({
      startY: this.finalY,
      styles: {
        font: "Raleway-Regular"
      },
      headStyles: {
          fontSize: 10,
          halign: 'center',
          fillColor: [149, 149, 149]
      },
      bodyStyles: {
          fontSize: 8,
          cellPadding: 4,
          fontStyle: "bold"
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' }
      },
      head: [[
        chartData.parameters.eje_x && chartData.parameters.eje_x.titulo ? chartData.parameters.eje_x.titulo : "Categoria",
        "Nº de elementos"
      ]],
      body: this.getTableRows(chartData),
      didDrawPage: () => {
          this.addPdfHeader();
      },
      margin: {
        top: this.margins.top + 150,
        right: this.margins.right,
        bottom: this.margins.bottom,
        left: this.margins.left
      }
    });

    if( this.numberOfExportedCharts < (this.charts.length + this.linearIndicators.length))
      await this.addPageToPdf();
  }

  private getTableRows(chartData:ChartData):string[][]
  {
    let rows = [];

    switch(true)
    {
      case chartData.configuration.chartType.includes('radial') ||
        this.getChartType(chartData.configuration.chartType) === 'line' ||
        this.getChartType(chartData.configuration.chartType) === 'area':

        rows = chartData.parameters.eje_x.categorias.map(
          (category, index) => [category, chartData.parameters.series[0].data[ index ]]
        );
        break;

        case (! chartData.configuration.chartType.includes('radial') && 
          this.getChartType(chartData.configuration.chartType) === 'column') ||
            this.getChartType(chartData.configuration.chartType) === 'bar':

          rows = chartData.parameters.series.map(serie => [serie.name, serie.data[0]]);
          break;

        case this.getChartType(chartData.configuration.chartType) === 'pie' :
          rows = chartData.parameters.series[0].data.map(item => [item.name, item.y]);
          break;

        case this.getChartType(chartData.configuration.chartType) === 'treemap':
          rows = chartData.parameters.series[0].data.map(item => [item.name, item.value]);
          break;

        case this.getChartType(chartData.configuration.chartType) === 'heatmap':
          rows = chartData.parameters.eje_x.categorias.map(
            (category, index) => [ category, chartData.parameters.series[0].data[index][2] ]
          );
          break;

        case this.getChartType(chartData.configuration.chartType) === 'solidgauge':
          rows = chartData.parameters.series.map(
            serie => [ serie.name, serie.data[0].y ]
          );
          break;
    }

    return rows;
  }


  public getChartType(unformatedType):string
  {
    let formatedType = undefined;

    switch(true)
    {
      case unformatedType.includes('line'):
        formatedType = "line";
        break;
      case unformatedType.includes('area'):
        formatedType = "area";
        break;
      case unformatedType.includes('vertical_bar'):
        formatedType = "column";
        break;
      case unformatedType.includes('horizontal_bar'):
        formatedType = "bar";
        break;
      case unformatedType.includes('pie'):
        formatedType = "pie";
        break;
      case unformatedType.includes('heat'):
        formatedType = "heatmap";
        break;
      case unformatedType.includes('tree'):
        formatedType = "treemap";
        break;
      case unformatedType.includes('activity_gauge'):
        formatedType = "solidgauge";
        break;
      case unformatedType.includes('radial'):
        formatedType = "column";
        break;
    }

    return formatedType;
  }

  private addFooterInPages():void
  {
    this.pdf.setFont("Arial","normal");
    this.pdf.setFontSize(12);

    for(let i = 1; i <= this.pdf.getNumberOfPages(); i++)
    {
      this.pdf.setPage(i);

      this.pdf.text(
        `Página ${i} de ${this.pdf.getNumberOfPages()}`,
       this.pdf.internal.pageSize.getWidth() - this.margins.right,
       this.pdf.internal.pageSize.getHeight() - this.margins.top,
       {align: "right"}
      );
    }
  }
}

