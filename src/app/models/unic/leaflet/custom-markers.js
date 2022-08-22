import { Canvas } from "leaflet";

const drawingFunctions = [
    {
        name: "_updateCircle",
        draw: (ctx, p, r) => {
            ctx.arc(p.x, p.y, r, 0, 360);
        } 
    },
    {
        name: "_updateSquare",
        draw: (ctx, p, r) => {
            
            ctx.moveTo(p.x, p.y + r);
            ctx.moveTo(p.x - r, p.y + r);
            ctx.lineTo(p.x - r, p.y - r);
            ctx.lineTo(p.x + r, p.y - r);
            ctx.lineTo(p.x + r, p.y + r);
            ctx.lineTo(p.x, p.y + r);
    
        } 
    },
    {
        name: "_updateRectangle",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x, p.y + r);
            ctx.lineTo(p.x + (r * 1.5), p.y + r);
            ctx.lineTo(p.x + (r * 1.5), p.y - r);
            ctx.lineTo(p.x - (r * 1.5), p.y - r);
            ctx.lineTo(p.x - (r * 1.5), p.y + r);
            ctx.lineTo(p.x, p.y + r);
        }
    },
    {
        name: "_updateTrapezoid",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x, p.y - r);
            ctx.lineTo(p.x - r, p.y - r);
            ctx.lineTo(p.x - (r * 2), p.y + r);
            ctx.lineTo(p.x + (r * 2), p.y + r);
            ctx.lineTo(p.x + r, p.y - r);
            ctx.lineTo(p.x, p.y - r);       
        }
    },
    {
        name: "_updateParallelogram",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x, p.y + r);
            ctx.lineTo(p.x - r, p.y + r);
            ctx.lineTo(p.x - (r * 1.75), p.y - r);
            ctx.lineTo(p.x + r, p.y - r);
            ctx.lineTo(p.x + (r * 1.75), p.y + r);
            ctx.lineTo(p.x, p.y + r);
        }
    },
    {
        name: "_updateTriangle",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x, p.y - r);
            ctx.moveTo(p.x, p.y - r);
            ctx.lineTo(p.x + r, p.y + r);
            ctx.lineTo(p.x - r, p.y + r );
        }
    },
    {
        name: "_updateTriangleRight",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x + r, p.y);
            ctx.lineTo(p.x - r, p.y - r);
            ctx.lineTo(p.x - r, p.y + r);
        }
    },
    {
        name: "_updateTriangleLeft",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x - r, p.y);
            ctx.lineTo(p.x + r, p.y - r);
            ctx.lineTo(p.x + r, p.y + r);
        }
    },
    {
        name: "_updateTriangleBottom",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x, p.y + r);
            ctx.lineTo(p.x + r, p.y - r);
            ctx.lineTo(p.x - r, p.y - r );
        }
    },
    {
        name: "_updateTriangleBottom",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x, p.y + r);
            ctx.lineTo(p.x + r, p.y - r);
            ctx.lineTo(p.x - r, p.y - r );
        }
    },
    {
        name: "_updateStar",
        draw: (ctx, p, r) => {
            ctx.moveTo(p.x + r     , p.y );
            ctx.lineTo(p.x + 0.43*r, p.y + 0.25 * r);
            ctx.lineTo(p.x + 0.50*r, p.y + 0.87 * r);
            ctx.lineTo(p.x         , p.y + 0.50 * r);
            ctx.lineTo(p.x - 0.50*r, p.y + 0.87 * r);
            ctx.lineTo(p.x - 0.43*r, p.y + 0.25 * r);
            ctx.lineTo(p.x -      r, p.y );
            ctx.lineTo(p.x - 0.43*r, p.y - 0.25 * r);
            ctx.lineTo(p.x - 0.50*r, p.y - 0.87 * r);
            ctx.lineTo(p.x         , p.y - 0.50 * r);
            ctx.lineTo(p.x + 0.50*r, p.y - 0.87 * r);
            ctx.lineTo(p.x + 0.43*r, p.y - 0.25 * r);
        }
    }
];

const enableLabel = (ctx, layer) => {
   
    if( layer.feature.properties[layer.options.label] )
    {
        ctx.fillStyle = "black";
        ctx.font = ".8rem Arial";
        ctx.textAlign = "center";
        ctx.fillText(layer.feature.properties[layer.options.label], layer._point.x + 20, layer._point.y - 10);
    }
}

const newFeatures = {};

drawingFunctions.forEach(drawingFunction => {

    newFeatures[drawingFunction.name] = function (layer) {

        if (!this._drawing || layer._empty()) { return; }

        const p = layer._point,
                ctx = this._ctx,
                r = Math.max(Math.round(layer._radius), 5);

        this._layers[layer._leaflet_id] = layer;

        ctx.beginPath();
        
        drawingFunction.draw(ctx, p, r);

        if( layer.options.label )
            enableLabel(ctx, layer);

        ctx.closePath();

        this._fillStroke(ctx, layer);
    };

});

Canvas.include(newFeatures);
