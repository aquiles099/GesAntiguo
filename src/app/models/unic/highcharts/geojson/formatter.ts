import { GeoJSONToLineChart } from './geojson-to-line-chart';
import { GeoJSONToBarChart } from './geojson-to-bar-chart';
import { GeoJSONToPieChart } from './geojson-to-pie-chart';
import { GeoJSONToHeatMapChart } from './geojson-to-heat-map-chart';
import { GeoJSONToTreeMapChart } from './geojson-to-tree-map-chart';
import { GeoJSONToActivityGaugeChart } from './geojson-to-activity-gauge-chart';
import { GeoJSONToLinearGaugeChart } from './geojson-to-linear-gauge-chart';
import { GeoJSONFile } from '../../geojson/geojson-file';
import { ChartConfiguration } from '../../../../interfaces/analysis/analysis-chart-configuration';

export function geojsonToHighcharts(configuration:ChartConfiguration, geojsonFile:GeoJSONFile):any
{
    let formatter;

    switch(true)
    {
        case  ( configuration.chartType.includes('line') || configuration.chartType.includes('area') ) && ! configuration.chartType.includes('linear_gauge'):
            formatter = new GeoJSONToLineChart(geojsonFile, configuration);
            break;

        case configuration.chartType.includes('vertical_bar') || configuration.chartType.includes('horizontal_bar'):
            formatter = new GeoJSONToBarChart(geojsonFile, configuration);
            break;

        case configuration.chartType.includes('pie'):
            formatter = new GeoJSONToPieChart(geojsonFile, configuration);
            break;

        case configuration.chartType.includes('heat'):
            formatter = new GeoJSONToHeatMapChart(geojsonFile, configuration);
            break;
        
        case configuration.chartType.includes('tree'):
            formatter = new GeoJSONToTreeMapChart(geojsonFile, configuration);
            break;
            
        case configuration.chartType.includes('activity_gauge'):
            formatter = new GeoJSONToActivityGaugeChart(geojsonFile, configuration);
            break;
        
        case configuration.chartType.includes('linear_gauge'):
            formatter = new GeoJSONToLinearGaugeChart(geojsonFile, configuration);
            break;

        case configuration.chartType.includes('radial'):
            formatter = new GeoJSONToLineChart(geojsonFile, configuration);
            break;
    }

    return formatter.execute();
}