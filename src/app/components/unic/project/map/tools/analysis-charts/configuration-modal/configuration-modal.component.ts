import { Component, OnInit, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { GeoJSONFile } from '../../../../../../../models/unic/geojson/geojson-file';
import { GeojsonFilesService } from '../../../../../../../services/unic/geojson-files.service';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { showPreconfirmMessage, delayExecution } from 'src/app/shared/helpers';
import { GeojsonFilesAnalysisChartsConfigurationsService } from '../../../../../../../services/unic/geojson-files-analysis-charts-configurations.service';
import { Subscription } from 'rxjs';
import { AnalysisConfiguration, ChartConfiguration } from 'src/app/interfaces/analysis/analysis-chart-configuration';

interface AnalysisConfigurationWithId extends AnalysisConfiguration
{
  id:number;
}

interface ChartOption
{
  value:string;
  name:string;
  imageUrl:string;
  available_info:string[];
}

@Component({
  selector: 'configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.css']
})
export class ConfigurationModalComponent implements OnInit, OnDestroy
{
  @ViewChild(ModalDirective)
  private modal:ModalDirective;
  
  @ViewChild("saveConfigurationModal")
  private saveConfigurationModal:ModalDirective;
  
  @Output()
  private onHide:EventEmitter<any> = new EventEmitter;

  public configurationType:string = "new";

  public modules:Array<string> = [];

  public layerFiles:Array<GeoJSONFile> = [];

  public layerFeatureProperties:Array<string> = []; 

  public analysisModeOptions:Array<string> = [
    "Capa",
    "Mapa visualizado"
  ];
  
  public chartOptions:Array<ChartOption> = [];
  public chartImageSrc:string;
  
  public chartPositionRefSelected:number;

  public selectedAnalysisConfigurationName:string = "";
  
  public form:FormGroup;
  
  public saveConfigurationModalIsOpen:boolean = false;
  
  public analysisConfiguration:AnalysisConfigurationWithId = {
    id: null,
    name: "",
    configurations: []
  };
  public analysisConfigurations:AnalysisConfigurationWithId[] = [];
  public analysisConfigurationsSubscription:Subscription;

  constructor(
    private _spinnerService:SpinnerService,
    private _projectsService:ProjectsService,
    private _toastrService:ToastrService,
    private _geojsonFilesService:GeojsonFilesService,
    private _analysisConfigurationsService:GeojsonFilesAnalysisChartsConfigurationsService
  )
  {
    this.form = new FormGroup({
      moduleName: new FormControl(null, Validators.required),
      layerName: new FormControl(null, Validators.required),
      chartType: new FormControl(null, Validators.required),
      info: new FormControl(null, Validators.required),
      analysisMode: new FormControl(null, Validators.required)
    });
  }

  public async ngOnInit(): Promise<void>
  {
    this.analysisConfigurationsSubscription = this._analysisConfigurationsService.configuration$.subscribe(
      configurations => {
        this.analysisConfigurations = ObjectUtility.simpleCloning(configurations);
        this.getAnalysisConfigurations();
      }
    );
    
    this.setIdInAnalysisConfigurations();
  }

  private setIdInAnalysisConfigurations():void
  {
    this.analysisConfigurations.forEach((config, index) => config.id = index + 1);
  }

  public async show():Promise<void>
  {
    try {

      this._spinnerService.show();

      this.modules = Array.from(new Set( this._geojsonFilesService.getProjected().map(layerFile => layerFile.module_name) ));
        
      this.getAnalysisConfigurations();

      const chartOptions = (await this._projectsService.getAnalisysChartsOptions()).datos.graficas;
      
      this.chartOptions = chartOptions.map( (option:any) => {

          return {
            value: option.grafica,
            name: option.nombre_mostrar,
            imageUrl: option.imagen,
            available_info: option.tipos_informacion
          };

      });     

      this.modal.show();

    } catch (error) {

      console.error(error);
      this._toastrService.error(error.message,"Error");
      await this.hide();

    }
    finally{
      this._spinnerService.hide();
    }
  }

  private getAnalysisConfigurations():void
  {
    const projectLayerIds = this._geojsonFilesService.getProjected().map(layerFile => layerFile.layerId);

    this.analysisConfigurations = this.analysisConfigurations.map(analysisConfig => {

      analysisConfig.configurations = analysisConfig.configurations.filter(config => { 
      
        const layerFile = this._geojsonFilesService.getProjected().find(layerFile => layerFile.layerId === config.layerId );

        return projectLayerIds.includes(config.layerId) && // archivo esta proyectado? 
               ! layerFile.featurePropertyIsDisabled(config.info); // propiedad para analisis esta habilitada?
      });
      
      return analysisConfig;
    });
  }

  public onSelectExistingConfiguration(config:AnalysisConfiguration):void
  {
    this.analysisConfiguration = ObjectUtility.simpleCloning(config);

    if( this.chartPositionRefSelected )
      this.onSelectChartPositionRef( this.chartPositionRefSelected );
  }

  public onChangeConfigurationType(type:string):void
  {
    ObjectUtility.overrideValues(this.analysisConfiguration);
    this.selectedAnalysisConfigurationName = null;
    this.configurationType = type;
    this.clearForm();
    this.form.disable();
  }

  public onChangeModuleSelector():void
  {
    this.layerFiles = this. _geojsonFilesService.getProjected().filter(layerFile => layerFile.module_name === this.form.get("moduleName").value);
   
    this.form.patchValue({
      layerName: null,
      info: null
    });
  }

  public onChangeLayerSelect(layerFile:GeoJSONFile):void
  {
    this.layerFeatureProperties = [...layerFile.enabledFeatureProperties];

    this.form.patchValue({
      info: null
    });
  }

  public onChangeChartTypeSelect(chartOption:ChartOption):void
  {
    this.chartImageSrc = chartOption.imageUrl;

    const featurePropertyFormControl = this.form.get("info");

    if( chartOption.value === "linear_gauge" )
    {
      featurePropertyFormControl.disable();
      featurePropertyFormControl.patchValue('n/a');
      featurePropertyFormControl.clearValidators();
    }
    else
    {
      if( featurePropertyFormControl.disabled )
      {
        featurePropertyFormControl.setValidators(Validators.required);
        featurePropertyFormControl.enable();
        featurePropertyFormControl.patchValue(null);
      }
    }
    
  }

  public onSelectChartPositionRef(position:number):void
  {
    if( this.form.disabled )
    {
      this.form.enable();

      if( ! this.form.get("info").validator )
        this.form.get("info").setValidators(Validators.required);
    }

    if( this.chartPositionIsConfigured(position) )
    {
      const chartConfig = this.getChartConfig(position);

      const chartOptionSelected = this.chartOptions.find(chartOption => chartOption.value === chartConfig.chartType);

      this.onChangeChartTypeSelect(chartOptionSelected);

      const layerFile = this._geojsonFilesService.getProjected().find(
        file => file.module_name === chartConfig.moduleName && file.layer_name === chartConfig.layerName
      );

      this.onChangeLayerSelect(layerFile);

      this.form.patchValue({
        moduleName: chartConfig.moduleName, 
        layerName: chartConfig.layerName, 
        chartType: chartConfig.chartType, 
        info: chartConfig.info,
        analysisMode: chartConfig.analysisMode
      });

    }
    else
    {
      this.clearForm();
    }

    this.chartPositionRefSelected = position;
  }

  public addChartConfiguration():void
  {
    try {
      
      if( this.form.invalid )
        throw new Error("Faltan datos para la configuración del gráfico.");
        
      const config = this.form.value;
      
      if( this.isThereAnyConfigurationWithTheSameData(config) )
        throw new Error("Ya existe un gráfico con la misma configuración.");
                
      config["position"] = this.chartPositionRefSelected;

      config["layerId"] = this.layerFiles.find(
        layerFile => layerFile.module_name === config.moduleName && layerFile.layer_name === config.layerName
      ).layerId;

      let message = `Configuración de gráfico ${this.chartPositionRefSelected} añadida.`;
      
      if( this.chartPositionIsConfigured(config.position) )
      {
        this.analysisConfiguration.configurations = this.analysisConfiguration.configurations.map(_config => {
            
          if(_config.position === config.position)
            _config = config;

          return _config;
        });

        message = `Configuración de gráfico ${this.chartPositionRefSelected} actualizada.`;
      }
      else
      {
        this.analysisConfiguration.configurations = [...this.analysisConfiguration.configurations, config];
      }

      this.clearForm();

      this.form.disable();

      this._toastrService.success(message,"Exito");

    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error"); 
    }
  }

  public chartPositionIsConfigured(position:number):boolean
  {
    return this.analysisConfiguration.configurations.some(config => config.position === position);
  }

  public isThereAnyConfigurationWithTheSameData(newConfig:ChartConfiguration):boolean
  {
    return this.analysisConfiguration.configurations.some(_config => {

      const configCopy = ObjectUtility.simpleCloning(_config);

      delete configCopy.position;

      return ObjectUtility.areEquals(newConfig, configCopy);
    });
  }

  public isThereAnyChartPositionConfigured():boolean
  {
    return this.analysisConfiguration.configurations.length > 0;
  }

  private getChartConfig(position:number):ChartConfiguration
  {
    return this.analysisConfiguration.configurations.find(config => config.position === position);
  }

  public removeChartConfiguration():void
  {
    this.analysisConfiguration.configurations = this.analysisConfiguration.configurations.filter(
      config => config.position !== this.chartPositionRefSelected
    );

    this._toastrService.success(`Configuración de gráfico ${this.chartPositionRefSelected} removida.`);

    this.clearForm();

    this.form.disable();
  }

  public runAnalysis():void
  {
    this.hide( ObjectUtility.simpleCloning(this.analysisConfiguration) );
  }

  public async saveAnalysisConfiguration():Promise<void>
  {
    try {

      const isThereAnyConfigurationWithTheSameName = this.analysisConfigurations.some(
        config => config.name === this.analysisConfiguration.name
      );

      if( isThereAnyConfigurationWithTheSameName )
        throw new Error("Ya existe una configuración de análisis con el mismo nombre.");

      const record = ObjectUtility.simpleCloning(this.analysisConfiguration);

      delete record.id;

      await this._analysisConfigurationsService.save(record);

      ObjectUtility.overrideValues(this.analysisConfiguration);

      this.clearForm();

      this.saveConfigurationModal.hide();

      this._toastrService.success("Configuración guardada.","Exito!"); 

      this.setIdInAnalysisConfigurations();
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error"); 
    }
  }

  public async updateAnalysisConfiguration():Promise<void>
  {
    try
    {
      const isThereAnyConfigurationWithTheSameName = this.analysisConfigurations.filter(
        config => config.id !== this.analysisConfiguration.id
      ).some(
        config => config.name === this.analysisConfiguration.name
      );

      if( isThereAnyConfigurationWithTheSameName )
        throw new Error("Ya existe una configuración de análisis con el mismo nombre.");

      await this._analysisConfigurationsService.delete(this.selectedAnalysisConfigurationName);

      const record = ObjectUtility.simpleCloning(this.analysisConfiguration);

      delete record.id;

      await this._analysisConfigurationsService.save(record);

      this._toastrService.success("Configuración de análisis actualizada.","Exito!");

      this.clearForm();
      
      this.selectedAnalysisConfigurationName = this.analysisConfiguration.name;

      this.saveConfigurationModal.hide();

      this.setIdInAnalysisConfigurations();
    }
    catch (error) 
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
  }

  public async removeAnalysisConfiguration(event:any):Promise<void>
  {
    try
    {
      event.preventDefault();

      const userResponse = await showPreconfirmMessage(
        `¿Eliminar configuración de análisis?`,
        "Esta acción no es reversible.",
        "warning"
      );
  
      if( userResponse.isConfirmed )
      {
        await this._analysisConfigurationsService.delete(this.analysisConfiguration.name);
        
        this._toastrService.success("Configuración de análisis eliminada.","Exito!");

        this.clearForm();

        ObjectUtility.overrideValues(this.analysisConfiguration);

        this.selectedAnalysisConfigurationName = null;

        this.setIdInAnalysisConfigurations();
      }
      
    }
    catch (error) 
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
  }

  public clearForm():void
  {          
    this.chartPositionRefSelected = null;

    this.chartImageSrc = null;

    this.form.reset();
  }

  public async hide(dismissReason?:any):Promise<void>
  {
    ObjectUtility.overrideValues(this.analysisConfiguration);
    this.selectedAnalysisConfigurationName = "";
    this.layerFeatureProperties = []; 
    this.configurationType = "new";
    this.clearForm();
    this.modal.hide();
    await delayExecution(500);
    this.onHide.emit(dismissReason);
  }

  public ngOnDestroy():void
  {
    this.analysisConfigurationsSubscription.unsubscribe();
  }
}
