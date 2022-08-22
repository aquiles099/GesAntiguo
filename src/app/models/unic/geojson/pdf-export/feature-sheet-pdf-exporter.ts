import { Feature } from 'geojson';
import { PdfExporter } from './pdf-exporter';
import { FeatureSheetTemplate } from '../../../../interfaces/geojson/export/feature-sheet-template';
import { Project } from '../../../../interfaces/project';

export class FeatureSheetPdfExporter extends PdfExporter
{
    protected feature: Feature;
    protected template:FeatureSheetTemplate;

    constructor(
        template: FeatureSheetTemplate,
        feature: any,
        project:Project
    ) {
        super(
            template.title,
            project
        );

        this.template = template;
        this.feature = feature;
    }

    public async build(): Promise<void>
    {
        await this.startPdf();
        
        await this.addHeader();

        await this.addContent();

        this.addPagination();

        //this.setPdfSrc();
    }

    private async addContent():Promise<void>
    {
        for (let propertyGroup of this.template.propertiesGroups)
        {
            if( typeof propertyGroup !== "string" )
            {
                let columns = this.addValuesToColumnCells(propertyGroup.columns);

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
                        cellPadding: 6,
                        fontStyle: "bold"
                    },
                    head: [[{
                        colSpan: propertyGroup.columns.length,
                        content: propertyGroup.title,
                        title: propertyGroup.title,
                    }]],
                    body: this.columnsToRows(columns),
                    didDrawPage: () => {
                        this.addHeader();
                    },
                    margin: {
                        top: 206.811023622, // finalY after adding the header
                        right: this.margins.right,
                        bottom: this.margins.bottom,
                        left: this.margins.left
                    }
                });
    
                this.finalY = (this.pdf as any).lastAutoTable.finalY + 30;
            }
            else
            {
                if( propertyGroup === "images" && this.template.featureImages.length )
                    await this.addFeatureImages();
                
                if( propertyGroup === "map" )
                    this.addMapImage();
            }

        }
    }

    private addValuesToColumnCells(columns: Array<string[]>): Array<string[]> {
        return columns.map(
            column => column.map(
                property => `${property}: ${this.feature && this.feature.properties[property] ? this.feature.properties[property] : "-"}`
            )
        );
    }

    private columnsToRows(columns: Array<string[]>): Array<string[]> {
        let biggestColumn: string[] = [];
        let biggestColumnIndex: number;

        columns.forEach((column, index) => {

            if (column.length > biggestColumn.length) {
                biggestColumn = column;
                biggestColumnIndex = index;
            }

        });

        let rows = biggestColumn.map((property, index) => {

            let row = [];

            row.push(property);

            columns.forEach((column, _index) => {

                if (_index !== biggestColumnIndex && column.length - 1 >= index)
                    row.push(column[index]);

            });

            return row;

        });

        return rows;
    }

    private addMapImage():void
    {        
        const imgWidth = this.getPageWidthPerPercentage() - (this.margins.right + this.margins.left),
                imgHeight = 245;

        if( this.finalY > this.getPageHeightPerPercentage() - ( this.margins.bottom + imgHeight) )
            this.addPage();

        this.pdf.addImage(this.template.mapImageSrc, "JPEG", this.margins.left, this.finalY, imgWidth, imgHeight, `imagen-Mapa` );

        this.finalY += (imgHeight + 30);
    }

    private async addFeatureImages():Promise<void>
    {
        const containerWidth = this.getPageWidthPerPercentage() - (this.margins.left + this.margins.right);
        const imageContainerWidth = (containerWidth / 2) - 15;
        const imageContainerHeight = 220;
        const defaultMarginBottom = 30;

        const verticalSpaceRequired = this.template.featureImages.length > 2 ?
        (imageContainerHeight * 2) + (defaultMarginBottom * 2):
        imageContainerHeight + defaultMarginBottom;

        if( this.finalY > this.getPageHeightPerPercentage() - (this.margins.top + verticalSpaceRequired ) )
            this.addPage();

        this.pdf.setFont("Arial", "normal");
        this.pdf.setFontSize(12);
        this.pdf.text("Imagenes:", this.margins.left, this.finalY);

        this.finalY += defaultMarginBottom;

        await new Promise(resolve => {

            for( let i = 1; i <= this.template.featureImages.length; i++ )
            {
                const image = new Image;

                image.onload = () => {

                    if( image.width >  imageContainerWidth )
                        image.width = imageContainerWidth;

                    if( image.height >  imageContainerHeight )
                        image.height = imageContainerHeight;

                    let x = i % 2 === 0 ? this.margins.left + imageContainerWidth + 30 : this.margins.left;

                    const differenceToCenterItHorizontally = image.width < imageContainerWidth ?
                    (imageContainerWidth - image.width) / 2 : 0

                    const differenceToCenterItVertically = image.height < imageContainerHeight ?
                    (imageContainerHeight - image.height) / 2 : 0

                    this.pdf.addImage(
                        image,
                        x + differenceToCenterItHorizontally,
                        this.finalY + differenceToCenterItVertically,
                        image.width,
                        image.height,
                        `imagen-elemento-${i}`
                    );
                
                    if( i === 2 && this.template.featureImages.length > 2 )
                        this.finalY += (imageContainerHeight + defaultMarginBottom);

                    if( i === this.template.featureImages.length )
                        resolve(true);
                }

                image.src = this.template.featureImages[i - 1].src;
            } 

        });
        
        this.finalY += (imageContainerHeight + defaultMarginBottom);
    }
}
