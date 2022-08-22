import {Options as HighchartsOptions}  from "highcharts";

export abstract class BaseFormatter
{
    protected options:HighchartsOptions|any;
    protected optionsToAdd: HighchartsOptions|any;
    
    protected unformattedOptions: any;

    constructor(
        currentOptions:HighchartsOptions|any,
        unformattedOptions?:any
    )
    {
        this.options = currentOptions;
        this.unformattedOptions = unformattedOptions;
    }

    public abstract execute():void

    protected appendRequiredOptions(): void
    {   
        if(this.optionsToAdd)
        {
            Object.keys(this.optionsToAdd).forEach(key => {
            
                this.options[key] ?
                Object.assign(this.options[key], this.optionsToAdd[key]) :
                this.options[key] = this.optionsToAdd[key];
    
            });
        }
    }

    public getOptions():HighchartsOptions|any
    {
        return this.options;
    }
}
