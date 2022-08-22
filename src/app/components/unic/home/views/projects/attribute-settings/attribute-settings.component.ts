import { Component, OnInit, ViewChild } from '@angular/core';
import { ProjectService } from '../../../../../../services/unic/project.service';
import { Project } from '../../../../../../interfaces/project';
import { GeojsonFilesService } from '../../../../../../services/unic/geojson-files.service';
import { ToastrService } from 'ngx-toastr';
import { GeoJSONFile } from '../../../../../../models/unic/geojson/geojson-file';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { showPreconfirmMessage } from 'src/app/shared/helpers';

@Component({
  templateUrl: './attribute-settings.component.html',
  styleUrls: ['./attribute-settings.component.css']
})
export class AttributeSettingsComponent implements OnInit
{
  public moduleNames:string[] = [];
  public selectedModuleName:string;

  public layerNames:string[] = [];
  public selectedLayerName:string;

  public selectedFile:GeoJSONFile;

  public search:string;

  @ViewChild(ModalDirective)
  public propertyConfigurationModal:ModalDirective;

  public newPropertyName:string; 
  public propertyNameToUpdate:string; 

  constructor(
    private _projectService:ProjectService,
    private _geojsonFilesService:GeojsonFilesService,
    private _toastrService:ToastrService,
  ) { }

  get project():Project
  {
    return this._projectService.project;
  }

  public async ngOnInit():Promise<void>
  {
    await this._geojsonFilesService.load();
    this.moduleNames = Array.from(new Set( this._geojsonFilesService.get().map(file => file.module_name) ));      
  }

  public onChangeModuleSelector(moduleName:string):void
  {
    this.layerNames = [];
    this.selectedFile = null;
    this.selectedLayerName = null;
    this.layerNames = this._geojsonFilesService.get().filter( file => file.module_name === moduleName).map( file => file.layer_name );
  }

  public async onChangeLayerSelector(layerName:string):Promise<void>
  {
    this.selectedFile = this._geojsonFilesService.get().find(
      file => file.module_name === this.selectedModuleName && file.layer_name === layerName
    );
  }

  public showPropertyConfigurationModal(propertyNameToUpdate?:string):void
  {
    this.newPropertyName = this.propertyNameToUpdate = propertyNameToUpdate;
    this.propertyConfigurationModal.show();
  }

  public onClosePropertyConfigurationModal():void
  {
    this.newPropertyName =this.propertyNameToUpdate = null;
  }

  public async updateLayerProperties():Promise<void>
  {
    try
    {
      this.propertyNameToUpdate ?
      this.selectedFile.updateProperty( this.propertyNameToUpdate, this.newPropertyName ) :
      this.selectedFile.addNewProperty( this.newPropertyName );

      await this._geojsonFilesService.update(this.selectedFile);
      
      this._toastrService.success("Atributos de capa actualizados.","Exito!");
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this.propertyConfigurationModal.hide();
    }
  }
  
  public async deleteProperty(propertyName:string):Promise<void>
  {
    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Estas seguro?",
        "Esta acción no es reversible."
      );

      if( userResponse.isConfirmed )
      {
        this.selectedFile.deleteProperty( propertyName );
  
        await this._geojsonFilesService.update(this.selectedFile);
        
        this._toastrService.success("Atributos de capa actualizados.","Exito!");
      }
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");
    }
  }

  public async updateDisabledFeatureProperties(propertyName:string):Promise<void>
  {
    try
    {
      this.selectedFile.updateDisabledFeatureProperties( propertyName );
      await this._geojsonFilesService.update(this.selectedFile);
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");
    }
  }

}
