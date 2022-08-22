import { NgModule } from '@angular/core';

import { UnicRoutingModule } from './unic-routing.module';
import { SharedModule } from '../../shared/shared.module';

// home
import { HomeComponent } from './home/home.component';
import { SidebarMenuComponent } from './home/sidebar-menu/sidebar-menu.component';
import { ProjectCreationModalComponent } from './home/project-creation-modal/project-creation-modal.component';
// projects
import { ListComponent } from './home/views/projects/list/list.component';
import { DetailsComponent } from './home/views/projects/details/details.component';
import { AttributeSettingsComponent } from './home/views/projects/attribute-settings/attribute-settings.component';

/** Projects **/
import { ProjectComponent } from './project/project.component';

// configuration
import { ConfigurationComponent } from './project/configuration/configuration.component';
import { ConfigurationBarComponent } from './project/configuration/configuration-bar/configuration-bar.component';
import { ProjectionSetupSectionComponent } from './project/configuration/configuration-bar/projection-setup-section/projection-setup-section.component';
import { LayerStyleConfigurationModalComponent } from './project/configuration/configuration-bar/projection-setup-section/layer-style-configuration-modal/layer-style-configuration-modal.component';
// map
import { MapComponent } from './project/map/map.component';
/* map tools */
import { LayerControllerComponent } from './project/map/tools/layer-controller/layer-controller.component';
import { AnalysisChartsComponent } from './project/map/tools/analysis-charts/analysis-charts.component';
import { ExportViewComponent as AnalysisExportViewComponent } from './project/map/tools/analysis-charts/export-view/export-view.component';
import { ConfigurationModalComponent as AnalysisConfigurationModalComponent } from './project/map/tools/analysis-charts/configuration-modal/configuration-modal.component';
import { ChartComponent } from './project/map/tools/analysis-charts/chart/chart.component';
import { LinearIndicatorComponent } from './project/map/tools/analysis-charts/linear-indicator/linear-indicator.component';
import { FeatureInfoComponent } from './project/map/tools/feature-info/feature-info.component';
import { NewFeatureComponent } from './project/map/tools/new-feature/new-feature.component';
import { RemoveFeatureComponent } from './project/map/tools/remove-feature/remove-feature.component';
import { EditFeatureComponent } from './project/map/tools/edit-feature/edit-feature.component';
import { EditFeatureGeometryComponent } from './project/map/tools/edit-feature-geometry/edit-feature-geometry.component';
import { StreetViewMapComponent } from './project/map/tools/street-view-map/street-view-map.component';
import { FeatureFilterComponent } from './project/map/tools/feature-filter/feature-filter.component';
import { CopyFeatureComponent } from './project/map/tools/copy-feature/copy-feature.component';
import { CategorizeFeatureComponent } from './project/map/tools/categorize-feature/categorize-feature.component';
import { CategoryConfigurationModalComponent } from './project/map/tools/categorize-feature/category-configuration-modal/category-configuration-modal.component';
import { FeatureImageGalleryComponent } from './project/map/tools/feature-image-gallery/feature-image-gallery.component';
import { FeatureExportComponent } from './project/map/tools/export/feature-export/feature-export.component';
import { FeaturePdfTemplateConfigurationComponent } from './project/map/tools/export/feature-pdf-template-configuration/feature-pdf-template-configuration.component';
import { SheetConfigurationModalComponent } from './project/map/tools/export/feature-pdf-template-configuration/sheet-configuration-modal/sheet-configuration-modal.component';
import { ListingConfigurationModalComponent } from './project/map/tools/export/feature-pdf-template-configuration/listing-configuration-modal/listing-configuration-modal.component';
import { PlanimetryComponent } from './project/map/tools/planimetry/planimetry.component';
import { PlaneConfigurationModalComponent } from './project/map/tools/planimetry/plane-configuration-modal/plane-configuration-modal.component';
import { ExportLayerFileComponent } from './project/map/tools/export-layer-file/export-layer-file.component';
import { PlaneBoxComponent } from './project/map/tools/planimetry/plane-box/plane-box.component';
import { PlaneBoxConfigurationModalComponent } from './project/map/tools/planimetry/plane-box-configuration-modal/plane-box-configuration-modal.component';
import { FilteredFeatureTableComponent } from './project/map/tools/filtered-feature-table/filtered-feature-table.component';
import { FeatureTableComponent } from './project/map/tools/feature-table/feature-table.component';
import { EditMultipleFeaturesComponent } from './project/map/tools/edit-multiple-features/edit-multiple-features.component';
import { ElementLegendComponent } from './project/map/tools/element-legend/element-legend.component';

// shared
import { HideableSectionComponent } from './shared/hideable-section/hideable-section.component';
 
@NgModule({
  declarations: [
    // home
    HomeComponent,
    SidebarMenuComponent,
    ProjectCreationModalComponent,
    /** projects **/
    ProjectComponent,
    // configuration
    ConfigurationComponent,
    ConfigurationBarComponent,
    ProjectionSetupSectionComponent,
    LayerStyleConfigurationModalComponent,
    /* map */
    MapComponent,
    /* map tools */
    LayerControllerComponent,
    AnalysisChartsComponent,
    AnalysisExportViewComponent,
    AnalysisConfigurationModalComponent,
    ChartComponent,
    LinearIndicatorComponent,
    FeatureInfoComponent,
    NewFeatureComponent,
    RemoveFeatureComponent,
    EditFeatureComponent,
    EditFeatureGeometryComponent,
    StreetViewMapComponent,
    FeatureFilterComponent,
    CopyFeatureComponent,
    CategorizeFeatureComponent,
    CategoryConfigurationModalComponent,
    FeatureImageGalleryComponent,
    FeatureExportComponent,
    FeaturePdfTemplateConfigurationComponent,
    SheetConfigurationModalComponent,
    ListingConfigurationModalComponent,
    PlanimetryComponent,
    PlaneConfigurationModalComponent,
    ExportLayerFileComponent,
    PlaneBoxComponent,
    PlaneBoxConfigurationModalComponent,
    FeatureTableComponent,
    FilteredFeatureTableComponent,
    EditMultipleFeaturesComponent,
    // shared 
    HideableSectionComponent,
    ElementLegendComponent,
    ListComponent,
    DetailsComponent,
    AttributeSettingsComponent,
  ],
  imports: [
    UnicRoutingModule,
    SharedModule
  ]
})
export class UnicModule { }
