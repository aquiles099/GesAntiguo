import { Map, TileLayer, Layer, FeatureGroup, LayerGroup, GeoJSON, Rectangle } from 'leaflet';
import { htmlToImageSrc, getFileContent, fetchWithTimeout } from '../shared/helpers';
import LeafletWms from 'leaflet.wms';

export class MapScreenshot
{
    private imageContainer:HTMLElement = document.createElement("DIV");

    private tileLayers:TileLayer[] = [];
    private wmsLayers:(TileLayer.WMS|LeafletWms.Overlay)[] = [];
    private vectorLayers:(FeatureGroup | LayerGroup | GeoJSON | Rectangle)[] = [];

    private options:any = {}; 

    public unloadedLayers:{[layerType:string]:number} = {
        wms: 0
    };

    constructor(
        private map:Map,
        private baseLayer:TileLayer|TileLayer.WMS,
        options:any = {},
        private showOnly:any[] = [],
        private parentElementSelector:string = "body"
    )
    {
        this.imageContainer.classList.add("map-screenshot-container");

        Object.assign(
        this.options, {
            width: this.map.getContainer().offsetWidth,
            height: this.map.getContainer().offsetHeight,
        }, options ); 
    }

    public async fire():Promise<string>
    {
      try
      {        
        // limpiar capas de leaflet editable.
        (this.map.editTools as any).featuresLayer.clearLayers();
        (this.map.editTools as any).editLayer.clearLayers();

        this.filterLayersByType();

        this.removeAllTileLayersExceptBaseLayer();

        this.projectVectorLayers();

        await this.appendBaseImageInContainer();

        const wmsLayerImages = await this.getWmsLayerImages();
  
        wmsLayerImages.forEach(layerImage => this.imageContainer.appendChild( layerImage ));

        document.querySelector( this.parentElementSelector ).appendChild(this.imageContainer);

        return await htmlToImageSrc(this.imageContainer, this.options);
      }
      catch (error)
      {
        throw error;
      }
      finally
      {
        this.imageContainer.remove();

        this.projectRemovedLayers();  
      }
    }

    private filterLayersByType():void
    {
        this.map.eachLayer(layer => {

            if( layer !== this.baseLayer )
            {
                switch( true )
                {
                    case layer instanceof TileLayer.WMS || layer instanceof LeafletWms.Overlay:
                        this.wmsLayers.push(layer);
                    break;

                    case layer instanceof FeatureGroup :
                    case layer instanceof LayerGroup :
                    case layer instanceof GeoJSON:
                    case layer instanceof Rectangle:
                        this.vectorLayers.push((layer as any));
                    break;
                   
                    case layer instanceof TileLayer:
                        this.tileLayers.push((layer as TileLayer));
                    break;
                }
            }

        });
    }

    private removeAllTileLayersExceptBaseLayer():void
    {
        [ ...this.tileLayers, ...this.wmsLayers, ...this.vectorLayers ].forEach(layer => this.map.removeLayer(layer));   
    }

    private projectVectorLayers():void
    {
        if( this.vectorLayers.length )
        {
            this.vectorLayers.filter(layer => ! this.showOnly.length || this.showOnly.includes( layer ))
                            .forEach(layer => this.map.addLayer(layer));
        }
    }

    private async appendBaseImageInContainer():Promise<void>
    {
        const baseImage = new Image;
   
       baseImage.style.position = "absolute";
       baseImage.src = await htmlToImageSrc(this.map.getContainer(), this.options);
       
       this.imageContainer.appendChild( baseImage );

       return new Promise((resolve, reject) => {
   
           baseImage.onload = () => resolve();
           baseImage.onerror = e => reject({error: e, image: baseImage});
   
       });    
    }

    private async getWmsLayerImages():Promise<HTMLImageElement[]>
    {
        try
        {            
            this.wmsLayers.sort((a, b) => (a.wmsParams.zIndex ?? 0) - (b.wmsParams.zIndex ?? 0));

            const imagePromises = this.wmsLayers.filter(layer => ! this.showOnly.length || this.showOnly.includes( layer ))
                                                .map( layer => fetchWithTimeout( (layer as any).getImageUrl(), {timeout: 10000}) );

            let imageResponses = await (Promise as any).allSettled(imagePromises);

            this.unloadedLayers["wms"] = imageResponses.filter(response => response.status === "rejected").length;

            const images = [];

            for await (let response of imageResponses)
            {
              try
              {
                  if( response.status === "fulfilled" )
                  {
                      let image = new Image;
                      image.style.position = "absolute"; 
                      
                      const blob = await response.value.blob();
            
                      image.src = await getFileContent(blob, "dataURL");
            
                      await new Promise<void>((resolve, reject) => {
            
                        image.onload = () => resolve();
                        image.onerror = reject;
            
                      });

                      images.push(image);
                  }
                        
              }
              catch (error)
              {
                continue;  
              }
            }

            return images;
           
        }
        catch(error)
        {
            throw error;
        }
        finally
        {
        }
    }

    private 

    private projectRemovedLayers():void
    {
        [ ...this.tileLayers, ...this.wmsLayers, ...this.vectorLayers ].forEach(layer => this.map.addLayer(layer));   
    }

}
