import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { Project } from '../../../../interfaces/project';
import { getFileContent } from '../../../../shared/helpers';

export interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export abstract class PdfExporter {

  protected pdf: jsPDFWithAutoTable;

  public src: string = "";

  // margenes a4 en px
  protected margins: Margins = {
    left: 71.811023622,
    top: 71.811023622,
    right: 49.88976378,
    bottom: 138.70866142
  };

  protected finalY: number;

  protected projectIconSrc: string;

  constructor(
    protected title:string,
    protected project?:Project
  )
  {
    this.finalY = this.margins.top;
  }

  public abstract build(): void

  protected startPdf(options?:any):void
  {
    const pdfOptions: any = {
        format: "a4",
        unit: "px",
        hotfixes: ["px_scaling"]
      };

    if(options)
      Object.assign(pdfOptions, options);
  
    this.pdf = new jsPDF(pdfOptions) as jsPDFWithAutoTable;
  }

  protected async addHeader(): Promise<void> 
  {
    this.finalY = this.margins.top;

    this.pdf.setFontSize(14);
    this.pdf.setTextColor("#333")
    this.pdf.setFont("Arial-Black", "normal");

    this.pdf.text(this.title, this.margins.left, this.margins.top);

    if (!this.projectIconSrc) {
      const iconBlob = await (await fetch(this.project.icono)).blob();
      this.projectIconSrc = await getFileContent(iconBlob, "dataURL");
    }

    this.pdf.addImage(
      this.projectIconSrc,
      "PNG",
      this.getPageWidthPerPercentage() - ((this.margins.right + this.margins.left)),
      this.margins.top / 2,
      45, 45,
      `icono-proyecto`
    );

    this.finalY += 45;

    this.pdf.setFont("Arial", "normal");
    this.pdf.setFontSize(12);

    this.pdf.text(this.project.nombre, this.getPageWidthPerPercentage() - this.margins.right, this.finalY, { align: "right" });

    this.finalY += 30;

    const date = new Date();

    this.pdf.text(
      `${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}/${(date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)}/${date.getFullYear()}`,
      this.getPageWidthPerPercentage() - this.margins.right,
      this.finalY,
      { align: "right" }
    );

    this.finalY += 30;

    this.pdf.setDrawColor("#BDBDBD");

    this.pdf.line(this.margins.left, this.finalY, this.getPageWidthPerPercentage() - this.margins.right, this.finalY);

    this.finalY += 30;
  }

  protected async addPage():Promise<void>
  {
    this.pdf.addPage();

    this.pdf.setPage( this.pdf.getNumberOfPages() );

    await this.addHeader();
  }

  protected addPagination():void
  {
    this.pdf.setFont("Arial","normal");
    this.pdf.setFontSize(12);

    for(let i = 1; i <= this.pdf.getNumberOfPages(); i++)
    {
      this.pdf.setPage(i);

      this.pdf.text(
        `Página ${i} de ${this.pdf.getNumberOfPages()}`,
       this.getPageWidthPerPercentage() - this.margins.right,
       this.getPageHeightPerPercentage() - this.margins.top,
       {align: "right"}
      );
    }
  }

  protected setPdfSrc(): void {
    const pdfBlob = new Blob([this.pdf.output('blob')], { type: "aplication/pdf" });
    this.src = URL.createObjectURL(pdfBlob);
  }

  protected getPageWidthPerPercentage(percentage:number = 100):number
  {
    return  ( percentage * this.pdf.internal.pageSize.getWidth() ) / 100;
  }

  protected getPageHeightPerPercentage(percentage:number = 100):number
  {
    return  ( percentage * this.pdf.internal.pageSize.getHeight() ) / 100;
  }

  public download(): void {
    this.pdf.save(`${this.title}.pdf`);
  }
}
