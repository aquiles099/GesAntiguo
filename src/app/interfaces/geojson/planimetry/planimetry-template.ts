export interface PlanimetryTemplate
{
    title: string;
    map_image_src:string;
    graphic_scale:PlaneSection;
    miniature_map:PlaneSection;
    legend:PlaneSection;
    boxImageSrc?:string;
    boxModel:number;
    created_at:string;
    updated_at:string;
}

interface PlaneSection
{
  enabled: boolean;
  image_src:string;
}

export interface PlanimetryBox
{
  model:number;
  title:string;
  designation:string;
  titular:string;
  sponsor:string;
  images:Array<BoxImage>;
  scale?:string;
  number?:string;
  date?:string;
};

export interface BoxImage
{
  src:string;
  name:string;
  position:"left"|"right";
}
