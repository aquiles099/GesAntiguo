import { PdfExporter} from './pdf-exporter';
import { PlanimetryTemplate } from '../../../../interfaces/geojson/planimetry/planimetry-template';

export class PdfPlaneExporter extends PdfExporter
{    
    protected plane:PlanimetryTemplate;

    protected boxWidthPercentage:number = 97.5;
    protected boxHeightPercentage:number = 20;

    protected mapImageContainerWidthPercentage:number = 97.5;
    protected mapImageContainerHeightPercentage:number = 79;

    protected staticMargin:number; // margenes estaticos de la pagina (1.25% del tama;o de la pagina en cada lado).

    constructor(
        plane: PlanimetryTemplate
    )
    {
        super(plane.title);
        this.plane = plane;
    }

    public build():void
    {
        this.startPdf({
            orientation: "landscape",
            format: "a3"
        });

        this.finalY = this.staticMargin = this.getPageWidthPerPercentage(1.25);

        this.pdf.rect(
            this.staticMargin,
            this.staticMargin,
            this.getPageWidthPerPercentage(100) - this.getPageWidthPerPercentage(2.5),
            this.getPageHeightPerPercentage(100) -  this.getPageHeightPerPercentage(2.5)
            );

        this.addMapImage();

        if( this.plane.graphic_scale.enabled )
            this.addGraphicScaleImage();
        
        if( this.plane.miniature_map.enabled )
            this.addMiniatureMapImage();
       
        if( this.plane.legend.enabled )
            this.addLegendImage();

        this.addBoxImage();
    }

    private addMapImage(): void 
    {
        const containerWidth = this.getPageWidthPerPercentage( this.mapImageContainerWidthPercentage ),
            containerHeight = this.getPageHeightPerPercentage( this.mapImageContainerHeightPercentage );

        this.pdf.rect(
            this.staticMargin,
            this.staticMargin,
            containerWidth,
            containerHeight
            );
            
        this.pdf.addImage(
            this.plane.map_image_src,
            this.staticMargin + this.getPageWidthPerPercentage(.25),
            this.staticMargin + this.getPageWidthPerPercentage(.25),
            containerWidth - this.getPageWidthPerPercentage(.5),
            containerHeight - this.getPageHeightPerPercentage(.5),
            `Mapa`
        );

        this.finalY += containerHeight;
    }

    private addGraphicScaleImage():void
    {
        const containerWidth = this.getPageWidthPerPercentage(39),
                containerHeight = this.getPageHeightPerPercentage(7.5);

        this.pdf.rect(
            this.getPageWidthPerPercentage(100) - (containerWidth + this.staticMargin),
            this.finalY - containerHeight,
            containerWidth,
            containerHeight
            );

        const x = this.getPageWidthPerPercentage(100) - (containerWidth + this.staticMargin) + this.getPageWidthPerPercentage(.25),
                y = (this.finalY - containerHeight) + this.getPageWidthPerPercentage(.25);

        this.pdf.addImage(
            this.plane.graphic_scale.image_src,
            x,
            y,
            containerWidth - this.getPageWidthPerPercentage(.5),
            containerHeight - this.getPageHeightPerPercentage(.5),
            `Escala grafica`
        );
    }
    
    private addMiniatureMapImage():void
    {
        const containerWidth = this.getPageWidthPerPercentage(19.45),
                containerHeight = this.getPageHeightPerPercentage(20) - this.staticMargin;

        this.pdf.rect(
            this.staticMargin,
            this.getPageHeightPerPercentage( this.mapImageContainerHeightPercentage ) + this.staticMargin,
            containerWidth,
            containerHeight
            );
                
        this.pdf.addImage(
            this.plane.miniature_map.image_src,
            this.staticMargin + this.getPageWidthPerPercentage(.25),
            this.finalY + this.getPageWidthPerPercentage(.25),
            containerWidth - this.getPageWidthPerPercentage(.5),
            containerHeight - this.getPageHeightPerPercentage(.5),
            `Mapa miniatura`
        );
    }

    private addLegendImage():void
    {
        const containerWidth = this.getPageWidthPerPercentage(39),
                containerHeight = this.getPageHeightPerPercentage(20) - this.staticMargin;

        this.pdf.rect(
            this.getPageWidthPerPercentage(19.45) + this.staticMargin,
            this.getPageHeightPerPercentage( this.mapImageContainerHeightPercentage ) + this.staticMargin,
            containerWidth,
            containerHeight
            );
        
        this.pdf.addImage(
            this.plane.legend.image_src,
            this.getPageWidthPerPercentage(19.45) + this.staticMargin,
            this.finalY + this.getPageWidthPerPercentage(.25),
            containerWidth - this.getPageWidthPerPercentage(.5),
            containerHeight - this.getPageHeightPerPercentage(.5),
            `Leyenda`
        );
    }

    private addBoxImage():void
    {
        const containerWidth = this.getPageWidthPerPercentage(39),
                containerHeight = this.getPageHeightPerPercentage(20) - this.staticMargin;

        this.pdf.rect(
            this.getPageWidthPerPercentage(58.45)  + this.staticMargin,
            this.getPageHeightPerPercentage( this.mapImageContainerHeightPercentage ) + this.staticMargin,
            containerWidth,
            containerHeight
            );
        
        this.pdf.addImage(
            this.plane.boxImageSrc,
            this.getPageWidthPerPercentage(58.45) + this.staticMargin  + this.getPageWidthPerPercentage(.25),
            this.finalY + this.getPageWidthPerPercentage(.25),
            containerWidth - this.getPageWidthPerPercentage(.5),
            containerHeight - this.getPageHeightPerPercentage(.5),
            `cajetin`
        );
    }
}
