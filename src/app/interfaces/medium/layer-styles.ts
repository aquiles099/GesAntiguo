export const pointShapeOptions:{label:string; value:string;}[] = [
    {
        label: "Circulo",
        value:"circle"
    },
    {
        label: "Cuadrado",
        value:"square"
    },
    {
        label: "Paralelogramo",
        value:"parallelogram"
    },
    {
        label: "Triangulo",
        value:"triangle-up"
    },
    {
        label: "Triangulo - derecha",
        value:"triangle-right"
    },
    {
        label: "Triangulo - abajo",
        value:"triangle-down"
    },
    {
        label: "Triangulo - izquierda",
        value:"triangle-left"
    },
    {
        label: "Estrella",
        value:"star"
    },
    {
        label: "Cruz",
        value:"cross"
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

export interface AttributeStyleCategory
{
    shape?:string;
    color?:string;
    size:number;
    property:string;
    value:string|number|boolean;
    imgUrl?:string;
}
