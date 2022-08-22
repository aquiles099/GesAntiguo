import { isNumeric } from '../../shared/helpers';
import { isset } from '../../shared/helpers';

interface BreadcrumbItem
{
  name:string; 
  path: string; 
  queryParams:{[key:string]:string};
}

export class BreadcrumbsHomeNavigation 
{    
    constructor(
        public url:string,
        public currentRoute:string,
        public basePath:string = "home",      
        public navigationSize:number = 3,
        public replacementRoutes:{[path:string]:{name:string, route:string}} =  {
          "/medium/home/proyectos/:param":{name: "acciones", route: "acciones"},
          "/medium/home/proyectos/:param/tellink/centros-de-mando/:param":{name: "detalles", route: ""},
          "/medium/home/proyectos/:param/tellink/centros-de-mando/:param/actuaciones/:param":{name: "detalles", route: ""},
          "/medium/home/proyectos/:param/tellink/alarmas/:param/editar":{name: "detalles", route: ""}
        },
        public resourcesLimitedRoutes:string[] = [
          ":cmId/editar",
          ":userName/editar",
        ]
    ) { }

  public buildAndGet():BreadcrumbItem[]
  {
    let _path = this.getRootPath();
    const urlSegments = this.getUrlSegmentsToUse();
    const navigation:BreadcrumbItem[] = [];
    
    urlSegments.forEach((segment:string, index:number) => {

      let queryParams = {},
          path = `${_path }/${segment}`,
          replacementRoute;

      if( index === (urlSegments.length - 1) )
      {
        let pathAsArray = path.split("?");

        path = pathAsArray[0];
        
        if( isset( pathAsArray[1] ) )
        {
          queryParams = this.getQueryParams( pathAsArray[1] );
          segment = segment.split("?")[0];
        }
      }
      
      if( isNumeric( segment ) )
      {
        replacementRoute = this.getReplacementRoute( path );
        
        if( replacementRoute )
          path += `/${replacementRoute.route}`;
      }
      
      const routeExistsInTheNavigation = navigation.some(route => route.path === path);

      if( ! routeExistsInTheNavigation )
      {
        let name = replacementRoute ? 
        replacementRoute.name : segment.split("-").join(" ");

        navigation.push({name, path, queryParams});
      }
      
      _path += `/${segment}`;

    });

    const lastResourceRoutesMustBeLimited = this.lastResourceRoutesMustBeLimited();

    return this.limitSizeInNavigationAndReturn(
      lastResourceRoutesMustBeLimited ? this.limitLastResourceRoutes(navigation) : navigation
    );
  }
   
  public getRootPath():string
  {
    return this.url.substring(
      0, this.url.indexOf( this.basePath ) + this.basePath.length
    );
  }

  private getUrlSegmentsToUse():string[]
  {
    let urlSegments = this.url.split("/").filter(segment => segment !== "");

    const indexOfBasePathSegment = urlSegments.findIndex(segment => segment ===  this.basePath);

    return urlSegments.slice( indexOfBasePathSegment + 1);
  }

  private getQueryParams(unformattedParams:string):{[key:string]:string}
  {
    let params = {};

    let paramsAsArray = unformattedParams.split("&").map(param => param.split("="));

    for(let [key, value] of paramsAsArray)
      params[key] = value;

    return params;
  }

  private getReplacementRoute(path:string):{name:string, route:string}
  {
    path = "/" + path
                .substring(1)
                .split("/")
                .map(segment =>  isNumeric(segment) ? ":param" : segment)
                .join("/");

    return this.replacementRoutes[path];
  }

  private lastResourceRoutesMustBeLimited():boolean
  {
    return this.resourcesLimitedRoutes.some(path => this.currentRoute === path);
  }

  private limitLastResourceRoutes(navigation:BreadcrumbItem[]):BreadcrumbItem[]
  {
    let lastRoute = navigation[navigation.length - 1];

    let invertedPathAsArray = lastRoute.path
                                  .substring(1)
                                  .split("/")
                                  .reverse();

    // let lastUriResourceParamsIndex = invertedPathAsArray.findIndex(segment => isNumeric( segment ));

    let commonPath = invertedPathAsArray.slice(1)
                                        .reverse()
                                        .join("/");

    navigation = navigation.filter(route => ! route.path.includes(commonPath));

    navigation.push( lastRoute );

    return navigation;                    
  }

  private limitSizeInNavigationAndReturn(navigation:BreadcrumbItem[]):BreadcrumbItem[]
  {
    navigation = [...navigation];

    if( this.navigationSize > navigation.length )
      this.navigationSize = navigation.length;

    while( navigation.length > this.navigationSize )
      navigation.shift();

    return navigation;
  }
}
