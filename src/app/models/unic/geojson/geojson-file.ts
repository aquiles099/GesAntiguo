import { IGeoJSONFile, GeoJSONFileStatus, IGeoJSONFeaturePdfExportTemplates, FeaturePropertyValues, GeometryType } from '../../../interfaces/geojson/i-geojson-file';
import { FeaturePropertyCategory, LayerStyle } from '../../../interfaces/geojson/layer-style';
import { ObjectUtility } from '../../../shared/object-utility';
import { Feature } from 'geojson';
import { FeatureSheetTemplate } from 'src/app/interfaces/geojson/export/feature-sheet-template';
import { FeatureListingTemplate } from '../../../interfaces/geojson/export/feature-listing-template';
import { PlanimetryTemplate, PlanimetryBox } from '../../../interfaces/geojson/planimetry/planimetry-template';
import { typeValue } from '../../../shared/helpers';

type FeaturePdfExportTemplateType = "sheet" | "listing";

export class GeoJSONFile
{
  private content:any;
  private layer_id:number;
  private default_style:LayerStyle;
  private status:GeoJSONFileStatus;
  private geometry_type:GeometryType;
  private feature_property_values:FeaturePropertyValues;
  private disabled_feature_properties:Array<string>;
  private feature_property_categories;
  private categorization:string|null;
  private feature_filter:FeaturePropertyValues;
  private generatedPlanesNumber:number;
  
  public name:string;
  public layer_name:string;
  public enabled:boolean;
  public module_name:string;
  public feature_pdf_export_templates: IGeoJSONFeaturePdfExportTemplates;
  public planimetry_templates: Array<PlanimetryTemplate>;
  public planimetry_boxes: Array<PlanimetryBox>;

  constructor(data:IGeoJSONFile)
  {
    this.name = data.name;
    this.layer_name = data.layer_name;
    this.layer_id = data.layer_id;
    this.module_name = data.module_name;
    this.geometry_type = data.geometry_type;
    this.content = data.content;
    this.default_style = data.default_style;
    this.status = data.status;
    this.enabled = data.enabled;
    this.categorization = data.categorization;
    this.feature_property_values = data.feature_property_values;
    this.disabled_feature_properties = data.disabled_feature_properties;
    this.feature_filter = data.feature_filter;
    this.feature_property_categories = data.feature_property_categories;
    this.feature_pdf_export_templates = data.feature_pdf_export_templates;
    this.planimetry_templates = data.planimetry_templates;
    this.planimetry_boxes = data.planimetry_boxes;
    this.generatedPlanesNumber = data.generatedPlanesNumber;

    this.init();
  }
  
  /**
   * setters
   */

  set setStatus(status:GeoJSONFileStatus)
  {
    this.status = status;
  }

  set setCategorization(property:string)
  {
    this.categorization = property;
  }
 
  set setDefaultStyle(style:LayerStyle)
  {
    this.default_style = style;
  }

  /**
   * getters
   */
  
  // self 

  get layerId():number
  {
      return this.layer_id;
  }
  
  get isProjected():boolean
  {
      return this.status === "projected";
  }
  
  get featureProperties():Array<string>
  {
      return Object.keys( this.content.features[0].properties )
                    .filter(property => property !== "ID")
                    .sort();
  }

  get enabledFeatureProperties():Array<string>
  {
      return this.featureProperties.filter(propertyName => ! this.featurePropertyIsDisabled(propertyName))
  }

  get totalFeatures():number
  {
    return this.getContent().features.length;
  }

  get defaultStyle():LayerStyle
  {
    return this.default_style;
  }

  get geometryType():GeometryType
  {
    return this.geometry_type;
  }
  
  get generatedPlanes():number
  {
    return this.generatedPlanesNumber;
  }

  // categorization

  get hasCategorization():boolean
  {
    return this.categorizationProperty !== null;
  }

  get categorizationProperty():string
  {
    return this.categorization && ! this.featurePropertyIsDisabled( this.categorization ) ? this.categorization : null;
  }

  // feature filter

  get hasPropertyWithFilter():boolean
  {
    return Object.keys( this.getPropertiesWithFilter() ).length > 0;
  }

  /**
   * methods  
   */

  private init():void
  {
    this.correctFeatures();
    this.buildFeaturePropertyValues();
    this.buildFeatureFilter();
    this.buildFeaturePropertiesCategories();
  }

  private correctFeatures():void
  {
    for(let i = 0; i < this.content.features.length; i++)
    {
      let feature = this.content.features[i];

      feature["id"] = i + 1;
      
      if( ! feature.properties )
        feature["properties"] = {};
      
      feature.properties["ID"] = (i + 1).toString().padStart(5,"0");
    }
  }

  private buildFeaturePropertyValues():void
  {
    Object.keys( this.feature_property_values ).length ||
    this.featureProperties.forEach(name => this.feature_property_values[name] = []);

    this.content.features.forEach(feature => {

      for( let [key, value] of Object.entries(feature.properties) )
      {       
        if( 
            ( typeof value === "boolean" || ( typeof value !== "boolean" && value) ) &&  // para tomar valores boleanos
            key !== "ID" &&
            ! this.feature_property_values[key].includes((value as any))  
          )
          this.feature_property_values[key].push((value as any));  
      }

    });
  } 

  private buildFeatureFilter():void
  {
    Object.keys( this.feature_filter ).length || 
    this.featureProperties.forEach(name => this.feature_filter[name] = []);
  }

  private buildFeaturePropertiesCategories():void
  {
    Object.keys( this.feature_property_categories ).length ||
    this.featureProperties.forEach(name => this.feature_property_categories[name] = []);
  }

  public getContent(applyConstraints:boolean = true):any
  {
    // crear copia para evitar modificaciones en contenido original.
    const contentCopy = ObjectUtility.simpleCloning( this.content );

    if( applyConstraints )
    {
      if( this.hasPropertyWithFilter )
        contentCopy.features = this.getFilteredFeatures(contentCopy.features);
  
      this.removeDisabledPropertiesinFeatures(contentCopy.features);
    }

    return contentCopy;
  }

  private getFilteredFeatures(features:any[]):Array<any>
  { 
    const propertiesWithFilter = this.getPropertiesWithFilter();

    if(propertiesWithFilter)
    {
      return features.filter(feature => {

        for(let [property, values] of Object.entries(propertiesWithFilter))
        {
          if( (values as Array<string|number>).length && 
              ! (values as Array<string|number>).includes( feature.properties[property] ) 
            )
            return false;
        }

        return true;
        
      });

    }
    else
    {
      return features;
    }
  }

  private removeDisabledPropertiesinFeatures(features:any[]):void
  {
    features.forEach(feature => {

      Object.keys(feature.properties).forEach(propertyName => {

        if( this.featurePropertyIsDisabled( propertyName ) )
          delete feature.properties[propertyName];

      });

    });
  }

  public findFeature(id:number|string):any
  {
    try
    {
      const feature = this.getContent().features.find(feature => feature.id == id);
      
      if( ! feature )
        throw new Error("Característica de capa no existe.");

      return feature;
    }
    catch (error)
    {
      throw error;
    }
  }

  public getFeaturesNumberByPropertyValue(featureProperty:string):Array<any>
  {
    let data = [];

    if( this.enabledFeatureProperties.includes(featureProperty) )
    {
      const features = this.getContent().features as Feature[];

      data = this.feature_property_values[featureProperty]
                .map(propertyValue => {

                    const totalFeaturesByValue = features.filter(feature => feature.properties[featureProperty] === propertyValue).length;

                    return {
                      value: propertyValue,
                      total: totalFeaturesByValue,
                      percentage: (totalFeaturesByValue * 100) / features.length
                    };
                });
    }

    return data;
  }

  public updateContent(data:any):void
  {
    this.content = data;
    this.init();
  }

  /**
   * features
  */

  public addNewProperty(propertyName:string):void
  {
    try
    {
      if( this.featureProperties.length === 50)
        throw new Error("El archivo de capa ya esta en el limite de atributos por elemento (50).");

      this.content.features = this.content.features.map(feature => {
  
        feature.properties[propertyName] = null;
        return feature;
  
      }); 
  
      this.feature_property_values[propertyName]      = [];
      this.feature_filter[propertyName]               = [];
      this.feature_property_categories[propertyName]  = [];
    }
    catch (error)
    {
      throw error;
    }
  }

  public updateProperty(oldPropertyName:string, newPropertyName:string):void
  {
    this.content.features = this.content.features.map(feature => {

      feature.properties[newPropertyName] = feature.properties[oldPropertyName];

      delete feature.properties[oldPropertyName];

      return feature;

    }); 

    this.feature_property_values[newPropertyName]     = this.feature_property_values[oldPropertyName];
    this.feature_filter[newPropertyName]              = this.feature_filter[oldPropertyName];
    this.feature_property_categories[newPropertyName] = this.feature_property_categories[oldPropertyName];

    delete this.feature_property_values[oldPropertyName];
    delete this.feature_filter[oldPropertyName];
    delete this.feature_property_categories[oldPropertyName];
  }

  public deleteProperty(propertyName:string):void
  {
    this.content.features = this.content.features.map(feature => {

      delete feature.properties[propertyName];

      return feature;

    }); 

    delete this.feature_property_values[propertyName];
    delete this.feature_filter[propertyName];
    delete this.feature_property_categories[propertyName];
  }

  public updateDisabledFeatureProperties(propertyName:string):void
  {
    this.disabled_feature_properties = this.featurePropertyIsDisabled(propertyName) ?
    this.disabled_feature_properties.filter(_propertyName => _propertyName !== propertyName) :
    [...this.disabled_feature_properties, propertyName];
  }

  public featurePropertyIsDisabled(name:string):boolean
  {
    return this.disabled_feature_properties.includes(name);
  }

  public addNewFeature(feature:any):void
  {
    this.typePropertyValuesOfFeature(feature.properties);

    feature.id = this.totalFeatures + 1;

    feature.properties["ID"] = feature.id.toString().padStart(5,"0");
    
    this.content.features.push(feature);

    // actualizar objeto de valores de propiedades.
    for( let [key, value] of Object.entries(feature.properties) )
    {
      if( value && this.feature_property_values[key] !== undefined && ! this.feature_property_values[key].includes((value as any))  )
        this.feature_property_values[key].push((value as any));  
    }
  }

  public updateFeature(updatedFeature:Feature):void
  {      
    this.typePropertyValuesOfFeature( updatedFeature.properties );

    const featureIndex = this.content.features.findIndex(feature => feature.id === updatedFeature.id);
    this.content.features[featureIndex] = updatedFeature;

    // actualizar objeto de valores de propiedades de marcadores
    this.feature_property_values = {};
    this.buildFeaturePropertyValues();
  }

  private typePropertyValuesOfFeature(properties):void
  {
    Object.keys(properties).forEach(key =>  properties[key] = typeValue(properties[key]));
  }

  public deleteFeatures(ids:Array<number|string>):void
  {
    this.content.features = this.content.features.filter( feature => ! ids.includes( feature.id ) ); 
    this.correctFeatures();

    // actualizar objeto de valores de propiedades de marcadores
    this.feature_property_values = {};
    this.buildFeaturePropertyValues();
  }

  /**
   * feature property values
  */      
  
  public hasValuesOnFeatureProperty(property:string):boolean
  {
    return this.getValuesByFeatureProperty(property).length > 0;
  }  

  public getValuesByFeatureProperty(property:string):Array<string|number>
  {
    return (this.getFeaturePropertyValues()[property] as any[]).sort((a,b) => a - b);
  }  

  public getFeaturePropertyValues():FeaturePropertyValues
  {
    const propertyValuesClone = ObjectUtility.simpleCloning(this.feature_property_values);

    Object.keys(propertyValuesClone).forEach(propertyName => {

      if( this.featurePropertyIsDisabled(propertyName) )
        delete propertyValuesClone[propertyName];

    });

    return propertyValuesClone;
  }

  public getValueTypeByProperty(property:string):"string"|"number"
  {
    let type = null;

    if( this.hasValuesOnFeatureProperty(property) )
      type = ! isNaN( (this.getValuesByFeatureProperty(property)[0] as number) ) ? "number" :  "string"; 

    return type;
  }

  /**
  * feature filter
  */  
  
  public addValueOnPropertyFilter(value:string|number|boolean, property:string):void
  {
      this.feature_filter[property].push(value);
  }

  public removeValueOnPropertyFilter(value:string|number|boolean, property:string):void
  {
      this.feature_filter[property] = this.feature_filter[property].filter(_value => _value !== value);
  }

  public removeFilterOnAllProperties():void
  {
    this.featureProperties.forEach(property => this.removeFilterOnProperty(property));
  }

  public removeFilterOnProperty(property:string):void
  {
    this.feature_filter[property] = [];
  }

  public valueExistsOnPropertyFilter(value:string|number|boolean, property:string):boolean
  {
    return this.feature_filter[property].includes(value);
  }

  public propertyHasFilter(property:string):boolean
  {
    return this.getPropertiesWithFilter().hasOwnProperty(property);
  }

  public getPropertiesWithFilter():any
  {
    const feature_filter_properties = ObjectUtility.simpleCloning(this.feature_filter);

    for(let [property, values] of Object.entries(feature_filter_properties))
    {
      if( this.featurePropertyIsDisabled(property) || ! (values as Array<string|number|boolean>).length )
        delete feature_filter_properties[(property as string)];
    }

    return feature_filter_properties;
  }

  /**
   * feature property categories
  */      
  
    public getCategorization():Array<FeaturePropertyCategory>
    {
      return  this.hasCategorization ? this.getCategoriesByProperty( this.categorizationProperty ) : [];
    }
  
    public addPropertyCategory(property:string, category:FeaturePropertyCategory):void
    {
        try {
            
            if(this.propertyCategoryExists(property, category.value))
                throw new Error("Ya existe una categoria con el valor seleccionado.");

            this.feature_property_categories[property].push(category);

        } catch (error) {
            
            throw error;
        }
    }

    public propertyCategoryExists(property:string, value:string|number):boolean
    {
        return this.feature_property_categories[property].some( category =>  category.value === value);
    }

    public updatePropertyCategory(property:string, valueOfCategoryToEdit:string|number, newCategory:FeaturePropertyCategory):void
    {
        try {
            
            if(valueOfCategoryToEdit !== newCategory.value && this.propertyCategoryExists(property, newCategory.value))
                throw new Error("Ya existe una categoria con el valor seleccionado.");

            this.feature_property_categories[property] = this.feature_property_categories[property].map(
                (category:FeaturePropertyCategory) =>  category.value === valueOfCategoryToEdit ? newCategory : category
            );

        } catch (error) {
            
            throw error;
        }
    }

    public deletePropertyCategory(property:string, valueOfCategoryToDelete:string|number):void
    {
        this.feature_property_categories[property] = this.feature_property_categories[property].filter(
            (category:FeaturePropertyCategory) =>  category.value !== valueOfCategoryToDelete
        );
    }

    public hasCategoryInValue(property:string, value:string|number|boolean):boolean
    {
      return this.hasCategoriesInProperty(property) ?
              this.getCategoriesByProperty(property).some(category => category.value === value) :
              false;
    }
    
    public hasCategoriesInProperty(property:string):boolean
    {
        return this.getCategoriesByProperty(property).length > 0;
    }

    public getCategoriesByProperty(property:string):Array<FeaturePropertyCategory>
    {
        return this.feature_property_categories[property];
    }
    
    public countCategories(property:string):number
    {
        return this.feature_property_categories[property].length;
    }

    public getCategoryByFeature(feature:Feature):any
    {
      return this.getCategorization().find(category => category.value == feature.properties[ this.categorizationProperty ]);
    }

  /**
   * feature pdf export templates
   */

  public addFeaturePdfExportTemplate(
    type: FeaturePdfExportTemplateType,
    template: FeatureSheetTemplate | FeatureListingTemplate
  ):void
  {
      this.feature_pdf_export_templates[type].push((template as FeatureSheetTemplate & FeatureListingTemplate));
  }

  public updateFeaturePdfExportTemplate(
    type: FeaturePdfExportTemplateType, 
    index:number, 
    modifiedTemplate: FeatureSheetTemplate | FeatureListingTemplate
  ):void
  {
      this.feature_pdf_export_templates[type][index] = modifiedTemplate;
  }

  public deleteFeaturePdfExportTemplate(type: FeaturePdfExportTemplateType, index:number):void
  {
      this.feature_pdf_export_templates[type].splice(index,1);
  }

  public hasPdfExportTemplates(type: FeaturePdfExportTemplateType):boolean
  {
    return this.feature_pdf_export_templates[type].length > 0;
  }

  /**
  * planimetry
  */

    public hasPlanes():boolean
    {
      return this.planimetry_templates.length > 0;
    }

    public addPlane(template: PlanimetryTemplate):void
  {
    this.planimetry_templates.push(template);
  }

  public updatePlane(index:number, updatedTemplate: PlanimetryTemplate):void
  {
      this.planimetry_templates[index] = updatedTemplate;
  }

  public deletePlane(index:number):void
  {
      this.planimetry_templates.splice(index, 1);
  }
  
  public addPlaneBox(box: PlanimetryBox):void
  {
    this.planimetry_boxes.push(box);
  }

  public updatePlaneBox(updatedBox: PlanimetryBox):void
  {
    let index = this.planimetry_boxes.findIndex(_box => _box.model === updatedBox.model);
    this.planimetry_boxes[index] = updatedBox;
  }

  public deletePlaneBox(index:number):void
  {
      this.planimetry_boxes.splice(index, 1);
  }

  public updatedGeneratedPlanesNumber():void
  {
    this.generatedPlanesNumber++;
  }

}
