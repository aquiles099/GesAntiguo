import { Feature } from 'geojson';
import { PdfExporter } from './pdf-exporter';
import { jsPDFOptions } from 'jspdf';
import { FeatureListingTemplate } from '../../../../interfaces/geojson/export/feature-listing-template';
import { Project } from '../../../../interfaces/project';
import { GeoJSONHelper } from '../../../geojson-helper';

export class ListingFeaturePdfExporter extends PdfExporter
{
    public features: Array<Feature>;

    public template:FeatureListingTemplate;

    protected pdfOptions:jsPDFOptions = {
        format: "a4",
        orientation: "landscape"
    };

    constructor(
        template: FeatureListingTemplate,
        features: Array<Feature>,
        project:Project
    ) {
        super(template.title, project);
        this.template = template;
        this.features = features;
    }

    public async build(): Promise<void>
    {
        await this.startPdf({
            orientation: "landscape"
        }); 

        await this.addHeader();

        this.addContent();

        this.addPagination();
    }

    private addContent(): void 
    {
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
                halign: 'center',
                fontStyle: "bold"
            },
            head: [this.template.columns],
            body: this.features ? this.getRows() : [],
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
    }

    public getRows(): Array<string[]>
    {
        GeoJSONHelper.sortFeatures(this.features, this.template.sortColumn, this.template.sortMode);

        return this.features.map( feature => {
            
            const row = Array(this.template.columns.length);

            for(let [key, value] of Object.entries(feature.properties) )
            {
                if( this.template.columns.includes(key) )
                    row[ this.template.columns.indexOf(key) ] = value ?? "-";
            }

            return row;
        });
    }
}
