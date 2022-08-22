import { Component, Output, EventEmitter, Input, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { isset, delayExecution } from 'src/app/shared/helpers';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { Map, Polyline, Polygon, CircleMarker } from 'leaflet';
import { GeoJSONLayer } from '../../../../../../models/unic/geojson/geojson-layer';
import { GeojsonLayersService } from '../../../../../../services/unic/geojson-layers.service';
import { LayerHighlighter } from '../../../../../../models/unic/leaflet/layer-highlighter';
import { ObjectUtility } from '../../../../../../shared/object-utility';

@Component({
  selector: 'filtered-feature-table',
  templateUrl: './filtered-feature-table.component.html',
  styleUrls: ['./filtered-feature-table.component.css','../../../../../../../themes/styles/map-tool-bar.scss']
})
export class FilteredFeatureTableComponent  extends HideableSectionComponent implements OnDestroy
{
  @Input()
  public map:Map;

  public projectModules:string[] = [];
  public selectedModuleName:string = null;

  public fileLayers:GeoJSONLayer[] = [];
  public selectedFileLayer:GeoJSONLayer = null;
  public selectedLayerName:string = null;

  public search:string = null;

  public enabledFeatureProperties:string[] = [];
  public selectedProperties:string[] = [];
  public featurePropertyValues:{[key:string]:number|string};
  public valuesToFilter:{[property:string]:string} = {};

  public dataTableIsVisible:boolean = false;

  @ViewChild(DataTableDirective)
  public dtElement: DataTableDirective;

  @ViewChild('tableContainer')
  public tableContainer: ElementRef<HTMLElement>;

  public dtOptions:any; 
  public dtTrigger:Subject<any>; 

  private highlightedDataTableRow:HTMLElement;
  private lastHighlightedLayer:CircleMarker|Polyline|Polygon;

  private layerHighlighter:LayerHighlighter;

  public showFilterCriteria:boolean = false;
  
  public showSpinner:boolean = false;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  constructor(
    private _toastrService:ToastrService,
    private _geojsonLayersService:GeojsonLayersService
  )
  {
    super();
  }

  public async show():Promise<void>
  {    
    this.projectModules = this._geojsonLayersService.getModuleNames("projected");

    this.layerHighlighter = new LayerHighlighter( this._geojsonLayersService.getProjected() );

    await super.show();
  }

  public onChangingModuleSelector(moduleName:string):void
  {
    this.selectedModuleName = moduleName;
    this.selectedLayerName = null;
    this.selectedFileLayer = null;
    this.enabledFeatureProperties = [];
    this.selectedProperties = [];
    this.fileLayers = this._geojsonLayersService.getPerModule( this.selectedModuleName, "projected" );
  }
  
  public onChangingLayerSelector(fileLayer:GeoJSONLayer):void
  {
    this.selectedFileLayer = fileLayer;
    this.enabledFeatureProperties = fileLayer.file.enabledFeatureProperties.filter(property => fileLayer.file.hasValuesOnFeatureProperty(property) );
    this.selectedProperties = [];
  }

  public updateSelectedProperties(propertyName:string):void
  {
    this.propertyIsSelected(propertyName) ?
    this.selectedProperties = this.selectedProperties.filter(_propertyName => _propertyName !== propertyName) :
    this.selectedProperties = [...this.selectedProperties, propertyName];
  }

  public propertyIsSelected(propertyName):boolean
  {
    return this.selectedProperties.includes(propertyName);
  }

  public async showPropertyValuesSection():Promise<void>
  {
    this.selectedProperties.forEach(property => this.valuesToFilter[property] = null);
    
    this.featurePropertyValues = this.selectedProperties.reduce(
      (object, propertyName) => {
        object[propertyName] = [...this.selectedFileLayer.file.getValuesByFeatureProperty(propertyName)];
        return object;
      }, {}
    );

    this.showFilterCriteria = true;
  }

  public propertiesToFilterHaveSelectedValues():boolean
  {
    return Object.values(this.valuesToFilter).every(value => isset(value));
  }

  public async showDataTable():Promise<void>
  {
    try
    {
      setTimeout(() => {this.showSpinner = true}, 0);

      const features = this.selectedFileLayer.file.getContent().features.filter(feature => {
        
        for(const [property, value] of Object.entries(this.valuesToFilter))
        {
          if(feature.properties[property] !== value)
            return false
        }

        return true;

      });

      if( ! features.length )
        throw new Error("No hay elementos para los criterios seleccionados.");

      this.dataTableIsVisible = true;

      await delayExecution(this.ANIMATION_DURATION);

      await this.buildDataTable(features);
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");  
    }
    finally
    {
      await delayExecution(this.ANIMATION_DURATION);
      this.showSpinner = false;
    }
  }

  public async buildDataTable(features:Array<any>):Promise<void>
  {
    if( this.dtTrigger )
      this.dtTrigger.unsubscribe();

    this.dtTrigger = new Subject(); 

    const columnTitles = this.selectedFileLayer.file.enabledFeatureProperties;

    columnTitles.unshift("search");

    const columns = columnTitles.map((propertyName, index) => {
      return {
        data: propertyName,
        name: propertyName,
        responsivePriority: index,
        title: propertyName !== "search" ? propertyName : "",
        searchable: propertyName !== "search" || false,
        orderable: propertyName !== "search" || false,
        type: propertyName === "search" ? "html" : "string"
      };
    });

    const rows = features.map(feature => {

      feature.properties["search"] = `<img src="assets/icons/SVG/LUPA.svg" data-id="${feature.id}" class="icon pointer locate-feature" alt="lupa" title="Ubicar elemento en el mapa.">`;

      return feature.properties;

    });

    this.dtOptions = {
      stripeClasses: [],
      pagingType: 'full_numbers',
      pageLength: 10,
      scrollY: this.getTableBodyScrollY(),
      scrollX: true,
      scrollCollapse: true,
      data: rows,
      order: [[1,'desc']],
      serverSide: false,
      processing: true,
      columns: columns,
      buttons: [],
      autoWidth: false,
      dom: 'Brtip',
      language: {
        processing: "Procesando...",
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ elementos",
        info: "Mostrando desde _START_ al _END_ de _TOTAL_ elementos",
        infoEmpty: "Mostrando ningún elemento.",
        infoFiltered: "(filtrado _MAX_ elementos total)",
        infoPostFix: "",
        loadingRecords: "Cargando registros...",
        zeroRecords: "No se encontraron registros",
        emptyTable: "No hay features disponibles en la tabla",
        paginate: {
          first: "Primero",
          previous: "Anterior",
          next: "Siguiente",
          last: "Último"
        },
        aria: {
          sortAscending: ": Activar para ordenar la tabla en orden ascendente",
          sortDescending: ": Activar para ordenar la tabla en orden descendente"
        }
      }
    };

    await delayExecution(this.ANIMATION_DURATION);

    this.dtTrigger.next();
  }

  private getTableBodyScrollY():string
  {
    const screenWidth = (window as any).visualViewport ? (window as any).visualViewport.width : window.screen.width;
  
    let scrollY;

    switch(true)
    {
      case screenWidth > 1600:
        scrollY = "22.5vh";
        break;
      case screenWidth <= 1600 && screenWidth > 768:
        scrollY = "21vh";
        break;
      case screenWidth <= 768:
        scrollY = "17.5vh";
        break;
    }

    return scrollY; 
  }

  public getFilterTag():string
  {
    const properties = Object.keys(this.valuesToFilter).map(propertyName => `"${propertyName}"`).join(', ');

    return `Filtrado por: "${this.selectedModuleName}", "${this.selectedLayerName}", "${properties}`;
  }

  public filterElementsInDataTable(event:any):void
  {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.search(event.target.value.trim());
      dtInstance.draw();
    });
  }

  public async onClickingInDataTableBody(event:any):Promise<void>
  {
    try
    {
      if (event.target.classList.contains("locate-feature"))
      {
        setTimeout(() => { this.showSpinner = true }, 0);

        const featureId = event.target.getAttribute('data-id');

        const featureLayer = this.selectedFileLayer.findFeatureLayer(featureId);
        const feature = ObjectUtility.simpleCloning((featureLayer as any).feature);

        if( ! feature.geometry || ! feature.geometry.coordinates || ! feature.geometry.coordinates.length)
          throw new Error('Geometría nula.');

        let featureGeometry;

        switch (feature.geometry.type)
        {
          case "Point":
            featureGeometry = feature.geometry.coordinates.reverse();
            break;
          case "LineString":
            featureGeometry = feature.geometry.coordinates.map(point => point.reverse());
            break;
          case "Polygon":
            featureGeometry = feature.geometry.coordinates.map(points => points.map(point => point.reverse()))
            break;
          case "MultiLineString":
            featureGeometry = feature.geometry.coordinates.map(points => points.map(point => point.reverse()))
            break;
          case "MultiPolygon":
            featureGeometry = feature.geometry.coordinates.map(
              pointListingArray => pointListingArray.map(
                points => points.map(
                  point => point.reverse()
                )
              )
            )
            break;
        }

        if (this.highlightedDataTableRow)
          this.highlightedDataTableRow.classList.remove('table-active');

        this.highlightedDataTableRow = event.target.parentElement.parentElement;
        this.highlightedDataTableRow.classList.add('table-active');

        if (this.lastHighlightedLayer)
          this.layerHighlighter.remove(this.lastHighlightedLayer);

        this.layerHighlighter.apply(featureLayer);

        this.lastHighlightedLayer = featureLayer;

        feature.geometry.type === "Point" ?
        this.map.flyTo(featureGeometry, 20, { duration: .50 }) :
        this.map.flyToBounds(featureGeometry, { maxZoom: 20, duration: .50 });

        await delayExecution(1000);
      }
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");  
    }
    finally
    {
      setTimeout(() => { this.showSpinner = false }, 0);
    }
  };

  public showInitialSection():void
  {
    this.search = null;
    this.selectedProperties = [];
    this.valuesToFilter = {};
    this.featurePropertyValues = {};
    this.showFilterCriteria = false;    
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    if( this.lastHighlightedLayer )
    {
      this.highlightedDataTableRow = null;
      this.layerHighlighter.remove(this.lastHighlightedLayer);
      this.lastHighlightedLayer = null;
      this.layerHighlighter = null;
    }

    if( this.dtTrigger )
    {
      this.dtTrigger.unsubscribe();
      this.dtTrigger = null;
      this.dtOptions = null;
    }

    this.selectedModuleName = null;
    this.selectedLayerName = null;
    this.fileLayers = [];
    this.enabledFeatureProperties = [];
    this.dataTableIsVisible = false;
    this.showInitialSection();
    this.showSpinner = false;
    await super.hide();
  }

  public ngOnDestroy():void
  {       
    if( this.dtTrigger )
      this.dtTrigger.unsubscribe();
  }

}
