import { Capa } from '../../interfaces/medium/mapa/Modulo';
import { AttributeStyleCategory } from '../../interfaces/medium/layer-styles';
import { lightenDarkenColor } from '../../shared/helpers';

export class SLDBuilder
{
    constructor(
        private layer:Capa,
        private styleInfo?:AttributeStyleCategory[],
        public options?: {
            keepPreviousSLD: boolean;
        }
    )
    {
        this.options = options ?? {keepPreviousSLD: true};
    }

    get userStyleName():string
    {
        return `${this.layer.capaWms.wmsParams.layers}#sld_style`;
    }

    public getSLD():string
    {
        let rules = this.getRules().join("");

        return `<StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`+
                `<NamedLayer>`+
                    `<Name>${this.layer.capaWms.wmsParams.layers}</Name>`+
                    `<UserStyle>`+
                        `<Name>${this.userStyleName}</Name>`+
                        `<FeatureTypeStyle>`+
                            rules +
                        `</FeatureTypeStyle>` +
                    `</UserStyle>`+
                `</NamedLayer>`+
            `</StyledLayerDescriptor>`;
    }

    private getRules():string[]
    {
        let rules =  this.options.keepPreviousSLD ? this.getExistingRules() : [];

        if( ! rules.length )
            rules.push( this.getRuleForDefaultStyle() );

        if( this.styleInfo )
            rules.unshift( ...this.getRulesForAttributeStyles() );

        return rules;
    }

    public getExistingRules():string[]
    {
        const sld = this.layer.capaWms.wmsParams.SLD_BODY;

        let rules = [];

        if( sld )
        {
            const findAndGetRule = (str:string) => 
            {
                const start = str.indexOf("<Rule>"),
                      end = str.indexOf("</Rule>") + "</Rule>".length;

                const rule = str.substring(start, end);
                
                rules.push(rule);

                const remainingString = str.substring(end);

                if( remainingString.includes("<Rule>") )
                    findAndGetRule(remainingString);
            }
            
            findAndGetRule(sld);
        }

        return rules;
    }

    private getRuleForDefaultStyle():string
    {
        let defaultRule;

        switch( this.layer.tipo_geometria )
        {
            case "POINT":
                
                defaultRule = 
                `<Rule>` +
                    `<ElseFilter/>` +
                    `<PointSymbolizer>` +
                        `<Graphic>` +
                            `<Mark>` +
                                `<WellKnownName>circle</WellKnownName>` +
                                `<Fill>` +
                                    `<CssParameter name="fill">${ lightenDarkenColor("#f1ff17", 30) }</CssParameter>` +
                                `</Fill>` +
                                `<Stroke>` +
                                    `<CssParameter name="stroke">#f1ff17</CssParameter>` +
                                `</Stroke>` +
                            `</Mark>` +
                            `<Size>10</Size>` +
                        `</Graphic>` +
                    `</PointSymbolizer>` +
                `</Rule>`;
                
                break;

            case "LINESTRING":
            case "MULTILINESTRING":

                defaultRule = ``;
                
                break;

            case "POLYGON":
            case "MULTIPOLYGON":

                defaultRule = ``;

                break;
        }

        return defaultRule;
    }

    private getRulesForAttributeStyles():string[]
    {
        return this.styleInfo.map(styleInfo => {

            return `<Rule>`+
                        `<ogc:Filter>`+
                            `<PropertyIsEqualTo>`+
                                `<PropertyName>${styleInfo.property}</PropertyName> `+
                                `<Literal>${styleInfo.value}</Literal>`+
                            `</PropertyIsEqualTo>`+
                        `</ogc:Filter>`+
                        this.getFeatureStyle( styleInfo ) +
                    `</Rule>`;
        });
    }

    private getFeatureStyle(styleInfo:AttributeStyleCategory):string
    {
        let featureStyle;

        switch( this.layer.tipo_geometria )
        {
        case "POINT":
            
            featureStyle = 
                `<PointSymbolizer>`+
                    `<Graphic>`+
                        `<Mark>`+
                            `<WellKnownName>${styleInfo.shape}</WellKnownName>`+
                            `<Fill>`+
                                `<CssParameter name="fill">${ lightenDarkenColor(styleInfo.color, 30)}</CssParameter>`+
                            `</Fill>`+
                            `<Stroke>`+
                                `<CssParameter name="stroke">${styleInfo.color}</CssParameter>`+
                            `</Stroke>`+
                        `</Mark>`+
                        `<Size>${styleInfo.size}</Size>`+
                    `</Graphic>`+
                `</PointSymbolizer>`;
            
            break;

        case "LINESTRING":
        case "MULTILINESTRING":

            featureStyle = `
            <LineSymbolizer>
            <Stroke>
                <CssParameter name="stroke">${styleInfo.color}</CssParameter>
                <CssParameter name="stroke-width">${styleInfo.size}</CssParameter>
            </Stroke>
            </LineSymbolizer>
            `;
            
            break;

        case "POLYGON":
        case "MULTIPOLYGON":

            featureStyle = `
            <PolygonSymbolizer>
            <Fill>
                <CssParameter name="fill">${ lightenDarkenColor( styleInfo.color, 30 ) }</CssParameter>
                <CssParameter name="fill-opacity">1</CssParameter>
            </Fill>
            <Stroke>
                <CssParameter name="stroke">${styleInfo.color}</CssParameter>
            </Stroke>
            </PolygonSymbolizer>
            `;

            break;
        }

        return featureStyle;
    }
}