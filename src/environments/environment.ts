// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import * as npm from '../../package.json';


  /**
   * Compilacion con bandera --prod falla debido a un problema
   * con alguna libreria, por ello, se compilara con "ng build --aot=true --output-hashing=all"
   * hasta que se de con una solucion al problema. Comentar y descomentar variables de entorno
   * segun se vaya a trabajar (desarrollo o produccion).
  */
export const environment = {
  production: false,
  pluginKey: '1CVJeI4Z+Q',
  baseUrl: 'https://saas.fisotecsolutions.com/',
  api: 'cgi-bin/backend.py',
  apiUrl: 'https://saas.fisotecsolutions.com/cgi-bin/backend.py',
  administrationApi: 'https://saas.fisotecsolutions.com/saas_laravel/public/api/administracion',
  version: npm.version, //package.json
  defaultProj4Crs:"+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs" //EPSG:4326  
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
