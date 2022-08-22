export interface AnalysisConfiguration
{
  name:string;
  configurations:Array<ChartConfiguration>;
}

export interface ChartConfiguration
{
  readonly moduleName?:string;
  readonly layerName?:string;
  readonly layerId?:number;
  readonly chartType:string;
  readonly info:string;
  readonly analysisMode: "Capa" | "Mapa visualizado" | "Proyecto";
  readonly position:number;
}

export interface ChartData
{
  configuration: ChartConfiguration;
  parameters: any;
}
