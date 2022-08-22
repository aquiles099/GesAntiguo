import { lightenDarkenColor } from "src/app/shared/helpers";

export interface LayerStyle
{
    shape:string;
    color:string;
    size:number;
}

export interface FeaturePropertyCategory extends LayerStyle
{
    value:string|number;
}

export const pointShapeOptions = [
    {
      label: "Circulo",
      value: "circle"
    },
    {
      label: "Cuadrado",
      value: "square"
    },
    {
      label: "Rectangulo",
      value: "rectangle"
    },
    {
      label: "Trapezoide",
      value: "trapezoid"
    },
    {
      label: "Paralelogramo",
      value: "parallelogram"
    },
    {
      label: "Triangulo",
      value: "triangle-up"
    },
    {
      label: "Triangulo - derecha",
      value: "triangle-right"
    },
    {
      label: "Triangulo - abajo",
      value: "triangle-down"
    },
    {
      label: "Triangulo - izquierda",
      value: "triangle-left"
    },
    {
      label: "Estrella",
      value: "star"
    }
  ];

export const polyLineShapeOptions = [
    {
      label: "línea continua",
      value: "0"
    },
    {
      label: "línea discontinua",
      value: "15"
    }
  ];

  export const POLYLINE_COLOR = "#3388ff";
  export const POINT_COLOR = '#196869'; 

export const pointShapeSvgIcons = [
 {
   name: "circle",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `<?xml version="1.0" encoding="utf-8"?>
   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 100 100" width="${size}" height="${size}" style="transition: width .2s; enable-background:new 0 0 100 100;" xml:space="preserve">
      <circle fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" cx="50" cy="50" r="43.4"/>
   </svg>   
   `
 },
 {
   name: "square",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `<?xml version="1.0" encoding="utf-8"?>
   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 100 100" width="${size}" height="${size}" style="transition: width .2s; enable-background:new 0 0 100 100;" xml:space="preserve">
    <rect fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" x="6.24" y="6.24" width="87.53" height="87.53"/>
   </svg>
   `
 },
 {
   name: "trapezoid",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `<?xml version="1.0" encoding="utf-8"?>
   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 100 100" width="${size}" height="${size}" style="transition: width .2s; enable-background:new 0 0 100 100;" xml:space="preserve">
   <polygon fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" points="90.7,77.5 9.3,77.5 30.1,22.5 69.3,22.5 "/>
   </svg>
   `
 },
 {
   name: "parallelogram",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `<?xml version="1.0" encoding="UTF-8"?>
   <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="${size}" height="${size}"
    version="1.1" style="transition: width .2s; enable-background:new 0 0 100 100;"
   viewBox="0 0 4400 2600"
    xmlns:xlink="http://www.w3.org/1999/xlink">
    <g>
     <polygon fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" points="175,2450 925,150 4225,150 3475,2450 "/>
    </g>
   </svg>
   `
 },
 {
   name: "triangle-up",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `<?xml version="1.0" encoding="utf-8"?>
   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 100 100" width="${size}" height="${size}" style="transition: width .2s; enable-background:new 0 0 100 100;" xml:space="preserve">
   <polygon fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" points="50,16.4 88.8,83.6 11.2,83.6 "/>
   </svg>
   `
 },
 {
   name: "triangle-right",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `
      <?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" version="1.1" width="${size}" height="${size}" style="transition: width .2s; enable-background:new 0 0 100 100;"
    viewBox="0 0 2700 2700"
    xmlns:xlink="http://www.w3.org/1999/xlink">
    <g>
      <polygon fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" points="2470,1340 1320,765 170,190 170,1340 170,2490 1320,1915 "/>
    </g>
    </svg>
   `
 },
 {
   name: "triangle-down",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `
      <?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" version="1.1" width="${size}" height="${size}" style="transition: width .2s; enable-background:new 0 0 100 100;"
    viewBox="0 0 2700 2700"
    xmlns:xlink="http://www.w3.org/1999/xlink">
    <g>
      <polygon fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" points="1390,2460 815,1310 240,160 1390,160 2540,160 1965,1310 "/>
    </g>
    </svg>
   `
 },
 {
   name: "triangle-left",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `
      <?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" version="1.1" width="${size}" height="${size}" style="transition: width .2s; enable-background:new 0 0 100 100;"
    viewBox="0 0 2700 2700"
    xmlns:xlink="http://www.w3.org/1999/xlink">
    <g>
      <polygon fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" points="240,1350 1390,775 2540,200 2540,1350 2540,2500 1390,1925 "/>
    </g>
    </svg>
   `
 },
 {
   name: "star",
   getSvg: (color:string  = "#2E3192", size:number = 100) =>  `<?xml version="1.0" encoding="utf-8"?>
   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 100 100" width="${size}" height="${size}" style="transition: width .2s; enable-background:new 0 0 100 100;" xml:space="preserve">
   <polygon fill="${lightenDarkenColor(color,30)}" stroke="${color}" stroke-width="13" stroke-miterlimit="10" points="72.6,84.4 50.2,72.7 27.8,84.6 31.9,59.6 13.7,42 38.8,38.2 49.9,15.4 61.2,38.1 86.3,41.6 68.2,59.4 
     "/>
   </svg>
   `
 }
];