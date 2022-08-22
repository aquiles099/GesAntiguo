import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapaComponent } from './mapa.component';

// 
import { UserPermissionsResolverService } from '../../../../../services/resolvers/medium/projects/map/user-permissions-resolver.service';

const routes: Routes = [
  {
    path: "",
    component: MapaComponent,
    resolve:{
      userPermissions: UserPermissionsResolverService
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    UserPermissionsResolverService
  ]
})
export class MapaRoutingModule { }
