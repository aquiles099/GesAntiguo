import { TileLayer, tileLayer } from 'leaflet';

export const l: TileLayer[] = [
  tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    crossOrigin: 'anonymous',
    className: 'OSM',
    maxNativeZoom: 19,
    maxZoom: 22,
    minZoom: 5
  }),
  tileLayer("https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}", {
    className: 'Google maps',
    maxNativeZoom: 22,
    maxZoom: 22,
    minZoom: 5
  }),
  tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    className:'Google satelite',
    maxNativeZoom: 22,
    maxZoom: 22,
    minZoom: 5
  }),
  tileLayer.wms("https://www.ign.es/wms-inspire/pnoa-ma?", {
    className: 'PNOA',
    layers: 'OI.OrthoimageCoverage',
    maxNativeZoom: 22,
    maxZoom: 22,
    minZoom: 5,
    format: 'image/png',
    transparent: true
  }),
  tileLayer.wms("https://idena.navarra.es/ogc/wms", {
    className: 'Idena',
    layers: 'IDENA:ortofoto_500_Pamplona_2020',
    maxNativeZoom: 22,
    maxZoom: 22,
    minZoom: 5,
    format: 'image/png',
    transparent: true
  }),
  tileLayer.wms("http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx", {
    className: 'Catastro',
    layers: 'Catastro',
    maxNativeZoom: 22,
    maxZoom: 22,
    minZoom: 5,
    format: 'image/png',
    transparent: true
  })
];