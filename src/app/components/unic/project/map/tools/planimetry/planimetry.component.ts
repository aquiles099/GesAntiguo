import { Component, ChangeDetectorRef, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, NgZone } from '@angular/core';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { GeoJSONFile } from '../../../../../../models/unic/geojson/geojson-file';
import { ToastrService } from 'ngx-toastr';
import { GeoJSONLayer } from '../../../../../../models/unic/geojson/geojson-layer';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { ProjectService } from '../../../../../../services/unic/project.service';
import { PlanimetryTemplate, PlanimetryBox } from '../../../../../../interfaces/geojson/planimetry/planimetry-template';
import { getTimeDiff, showPreconfirmMessage } from '../../../../../../shared/helpers';
import { PlaneConfigurationModalComponent } from './plane-configuration-modal/plane-configuration-modal.component';
import { PlaneBoxConfigurationModalComponent } from './plane-box-configuration-modal/plane-box-configuration-modal.component';
import { control, Map, Rectangle, Control } from 'leaflet';
import { ObjectUtility } from '../../../../../../shared/object-utility';
import { MapService } from '../../../../../../services/unic/map.service';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { delayExecution, htmlToImageSrc } from 'src/app/shared/helpers';
import { PdfPlaneExporter } from '../../../../../../models/unic/geojson/pdf-export/pdf-plane-exporter';
import { PlaneBoxComponent } from './plane-box/plane-box.component';
import { FeaturePropertyCategory, pointShapeSvgIcons } from '../../../../../../interfaces/geojson/layer-style';
import { SafeHtml } from '@angular/platform-browser';

require('leaflet-graphicscale');

const graphicScale = (control as any).graphicScale({
  fill: "fill"
});

@Component({
  selector: 'planimetry-section',
  templateUrl: './planimetry.component.html',
  styleUrls: ['./planimetry.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class PlanimetryComponent extends HideableSectionComponent implements AfterViewChecked
{
  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  @ViewChild(PlaneConfigurationModalComponent)
  public PlaneConfigurationModal:PlaneConfigurationModalComponent;
 
  @ViewChild(PlaneBoxConfigurationModalComponent)
  public PlaneBoxConfigurationModal:PlaneBoxConfigurationModalComponent;

  @ViewChild(ModalDirective)
  public templateDataModal:ModalDirective;

  @Output()
  public showFeatureExportTool:EventEmitter<any> = new EventEmitter;
  
  public modules:string[] = [];
  public selectedModule:string = null;
  
  public fileLayers:GeoJSONLayer[] = [];
  public selectedFileLayerName:string = null;
  public selectedFile:GeoJSONFile

  public templateInExport:PlanimetryTemplate = null;
  public graphicScaleImgSrc:string = "";
  public templateBoxInExport:PlanimetryBox;

  @ViewChild(PlaneBoxComponent)
  public PlaneBox:PlaneBoxComponent;
  
  @ViewChild("graphicScaleImageContainer")
  public graphicScaleImageContainer:ElementRef<HTMLElement>;
  
  @ViewChild("legendImageContainer")
  public legendImageContainer:ElementRef<HTMLElement>;

  public categoryGroups:FeaturePropertyCategory[][] = [];

  private selectedTemplate:PlanimetryTemplate;

  public rectangle:Rectangle;
  
  private onDrawingRectangle: (event:any) => void = event => 
  {
    try
    {
      this._mapService.map.fitBounds(this.rectangle.getBounds(), { duration: .50 });
  
      this._mapService.map.editTools.stopDrawing();
  
      this.rectangle.remove();
      
      this._ngZone.run(() => this.export());
    }
    catch(error)
    {
      this.rectangle.remove();
      setTimeout(() => this.selectTemplateAndDrawPolygon(), 250);
    }
  };

  
  constructor(
    private _changeDetector:ChangeDetectorRef,
    private _geojsonLayersService:GeojsonLayersService,
    private _mapService:MapService,
    private _projectService:ProjectService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _ngZone:NgZone
  )
  {
    super();
  }

  get map():Map
  {
    return this._mapService.map;
  }

  get drawing():boolean
  {
    return this.map.editTools.drawing();
  }

  get templates():Array<PlanimetryTemplate>
  {
    return this.selectedFile ? [...this.selectedFile.planimetry_templates] : [];
  }

  get recentTemplates():Array<PlanimetryTemplate>
  {
    return this.templates.length ? this.templates.filter(template => {

      const creationDate = new Date(template.created_at);

      return getTimeDiff(creationDate) < 7;

    }) :
    [];
  }

  get graphicScaleRequired():boolean
  {
    return this.templateInExport && this.templateInExport.graphic_scale.enabled;
  }

  get projectConfiguration():any
  {
    return this._projectService.configuration;
  }

  public ngAfterViewChecked():void
  {
    this._changeDetector.detectChanges();
  }

  public async show():Promise<void>
  {
    this.map.addControl(graphicScale);

    this.modules = this._geojsonLayersService.getModuleNames("projected");

    const changePolygonColor = event => event.layer.setStyle({color: 'mediumseagreen'}) ;

    this.map.on('editable:drawing:commit', this.onDrawingRectangle);
    this.map.on('editable:editing', changePolygonColor);

    await super.show();
  }

  public async onChangeModuleSelector():Promise<void>
  {    
    this.selectedFile = null;
    this.selectedFileLayerName = null;
    this.fileLayers = this._geojsonLayersService.getPerModule(this.selectedModule,"projected");
  }

  public async onChangeFileLayerSelect(fileLayer:GeoJSONLayer):Promise<void>
  {
    this.selectedFile = fileLayer.file;
  }

  public getTemplateAge(template:PlanimetryTemplate):string
  {
    const diffInHours = getTimeDiff( new Date(template.created_at), new Date, "hour");

    let tag = "";

    switch( true )
    {
      case diffInHours < 1:
        const diffInMinutes = getTimeDiff( new Date(template.created_at), new Date, "minute");
        tag = diffInMinutes < 3 ? "Hace un momento." : `Hace ${diffInMinutes} minutos.`
        break;
      case diffInHours >= 1 && diffInHours < 24:
        tag = diffInHours === 1 ? `Hace una hora.` : `Hace ${diffInHours} horas.`;
        break;
      case diffInHours >= 24:
        const resultInDays = getTimeDiff( new Date(template.created_at), new Date, "day");
        tag = resultInDays === 1 ? `Hace un dia.` : `Hace ${resultInDays} dias.`;
        break;
    }
    
    return tag;
  }

  public async editTemplate(index:number):Promise<void>
  {
    this.PlaneConfigurationModal.templateIndexToEdit = index;
    await this.PlaneConfigurationModal.show();
  }

  public async deleteTemplate(index:number):Promise<void>
  { 
    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Eliminar plantilla?",
        "Esta accion no es reversible."
      );
    
      if( userResponse.isConfirmed )
      {
        this.selectedFile.deletePlane(index);
        await this._geojsonLayersService.geojsonFilesService.update( this.selectedFile );
        this._toastrService.success("Plantilla eliminada.","Exito!");
      }  
    } 
    catch (error) 
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
  }

  public selectTemplateAndDrawPolygon(template?:PlanimetryTemplate):void
  {
    if(template)
      this.selectedTemplate = template;

    this.rectangle = this.map.editTools.startRectangle();
  }

  public clearRectangle():void
  {
    this.rectangle.remove();
    this.rectangle = null;
    this.map.editTools.stopDrawing();
  }

  public async export():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Generando pdf...");
      this._spinnerService.show();

      await delayExecution(250);

      this._geojsonLayersService
          .getProjected()
          .filter(fileLayer => fileLayer.layerId !== this.selectedFile.layerId)
          .forEach(fileLayer => this.map.removeLayer( fileLayer.layer ));

      this.templateInExport = ObjectUtility.simpleCloning(this.selectedTemplate);

      this.templateBoxInExport = this.selectedFile.planimetry_boxes.find(box => box.model === this.templateInExport.boxModel); 
      
      this.templateBoxInExport = ObjectUtility.simpleCloning(this.templateBoxInExport);

      const date = new Date();

      this.templateBoxInExport.date = `${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}/${(date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)}/${date.getFullYear()}`,

      await delayExecution(3000); // esperar a que escala se actualize.

      this.templateBoxInExport.scale = '1:' + this._mapService.getScale();
      
      this.templateBoxInExport.number = (this.selectedFile.generatedPlanes + 1).toString().padStart(5,"0");

      if( this.templateInExport.graphic_scale.enabled )
        this.graphicScaleImgSrc = await htmlToImageSrc((graphicScale as Control).getContainer());

      this.map.removeControl(graphicScale);

      this.templateInExport.map_image_src = await this._mapService.getMapScreenshot({
        width: 1539.77,
        height: 881.1782,  
        windowHeight: 881.1782  
      });

      this.categoryGroups = this.getFileCategorizationByGroup();

      this.templateDataModal.show();

      await delayExecution(500); // tiempo que tarda abriendo el modal.
      
      if( this.templateInExport.graphic_scale.enabled )
        this.templateInExport.graphic_scale.image_src = await htmlToImageSrc(this.graphicScaleImageContainer.nativeElement);
     
      if( this.templateInExport.miniature_map.enabled )
        this.templateInExport.miniature_map.image_src = await this._mapService.getMapZoneScreenshot();
     
      if( this.templateInExport.legend.enabled )
      {
        if( this.selectedFile.hasCategorization && this.selectedFile.getCategorization().length > 35 )
          throw new Error("El número de categorias no se pueden mostrar en la leyenda (maximo 35).");

        const imageOptions = {
          height: 199.04890000000003
        };

        if( this.legendImageContainer.nativeElement.offsetHeight > 199.04890000000003 )
          delete imageOptions.height;

        this.templateInExport.legend.image_src = await htmlToImageSrc(this.legendImageContainer.nativeElement, imageOptions);
      }
      
      const boxHeight = this.PlaneBox.templateRef.nativeElement.offsetHeight;

      this.templateInExport.boxImageSrc = await htmlToImageSrc(this.PlaneBox.templateRef.nativeElement, {
        width: this.PlaneBox.templateRef.nativeElement.offsetWidth,
        height: boxHeight > 204.66150000000002 ? boxHeight : 204.66150000000002
      });

      const pdf = new PdfPlaneExporter(this.templateInExport);

      await pdf.build();

      pdf.download();

      this.selectedFile.updatedGeneratedPlanesNumber();

      await this._geojsonLayersService.geojsonFilesService.update(this.selectedFile);

    } 
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
    }
    finally
    {
      this._geojsonLayersService
          .getProjected()
          .filter(fileLayer => fileLayer.layerId !== this.selectedFile.layerId)
          .forEach(fileLayer => this.map.addLayer( fileLayer.layer ));

      if(this.templateDataModal)
        this.templateDataModal.hide();

      await delayExecution(500);

      this.map.addControl(graphicScale);
        
      this.templateInExport = null;
      this.templateBoxInExport = null;
      this.graphicScaleImgSrc = null;
      this.categoryGroups = [];
      this.rectangle = null;

      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }
  }

  public getShapeSvgIcon(category:FeaturePropertyCategory, size:number):SafeHtml
  {
    return pointShapeSvgIcons.find(shape => shape.name === category.shape)?.getSvg(category.color, size) || "";
  }

  public getFileCategorizationByGroup():Array<FeaturePropertyCategory[]>
  {
    const categoryGroups = [];
    
    if( this.selectedFile.hasCategorization && this.selectedFile.getCategorization().length > 7 )
    {
      let categoryGroup = [],
          categories = this.selectedFile.getCategorization();

      for(let i = 0; i < categories.length; i++ )
      {
        categoryGroup.push( categories[i] );

        if( i === categories.length - 1)
        {
          categoryGroups.push(categoryGroup);
          break;
        } 
          
        if(i === 6)
        {
          categoryGroups.push(categoryGroup);
          categoryGroup = [];
        }
                  
      }
    }
    else
    {
      categoryGroups.push(this.selectedFile.getCategorization());
    }

    return categoryGroups;
  }

  public getFormattedCategoryValue(value:string|number):string
  {
    value = String(value);
    
    return value.length > 10 ? value.substring(0, 7) + "..." : value; 
  }
 
  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.selectedTemplate = null;

    if( this.rectangle )
      this.clearRectangle();

    this.map.off('editable:drawing:commit', this.onDrawingRectangle);
    this.map.off('editable:editing');
    
    this.selectedModule = null;
    this.selectedFile = null;
    this.selectedFileLayerName = null;

    this.map.removeControl(graphicScale);
    
    await super.hide();

    this._spinnerService.hide();
    this._spinnerService.cleanText();
  }

}
