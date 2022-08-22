import * as npm from '../../package.json';

export const environment = {
  production: true,
  pluginKey: '1CVJeI4Z+Q',
  baseUrl: 'https://saas.fisotecsolutions.com/',
  api: 'cgi-bin/backend.py',
  apiUrl: 'https://saas.fisotecsolutions.com/cgi-bin/backend.py',
  administrationApi: 'https://saas.fisotecsolutions.com/saas_laravel/public/api/administracion',
  version: npm.version, //package.json
  defaultProj4Crs:"+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs" //EPSG:4326  
};
