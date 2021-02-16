import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import {compareUsers, User} from './model/user';
import { UsersComponent } from './users.component';
import {UserComponent } from './user/user.component';

import {EntityDataService, EntityDefinitionService, EntityMetadataMap} from '@ngrx/data';
import {UsersDataService} from './services/users-data.service';
import {UserEntityService} from './services/user-entity.service';
import {HttpClientModule} from '@angular/common/http';

import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {PanelModule} from 'primeng/panel';
import {PaginatorModule} from 'primeng/paginator';
import {InputTextModule} from 'primeng/inputtext';
import {MessagesModule} from 'primeng/messages';
import {MessageModule} from 'primeng/message';




const routes: Routes = [
  { path: '',
    component: UsersComponent
  },
  {
    path: ':idUser',
    component: UserComponent
  }
];
const entityMetaData: EntityMetadataMap = {
  User: {
    sortComparer: compareUsers,
    selectId: (user: User) => user.idUser,
    entityDispatcherOptions: { optimisticUpdate: false}
  },

};
@NgModule({
  declarations: [UsersComponent, UserComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TableModule,
    HttpClientModule,
    PanelModule,
    PaginatorModule,
    InputTextModule,
    ButtonModule,
 ],
  providers: [
    UsersDataService,
    UserEntityService
  ],
})
export class UsersModule {
  constructor(
      private eds: EntityDefinitionService,
      private entityDataService: EntityDataService,
      private usersDataService: UsersDataService
  ) {
    eds.registerMetadataMap(entityMetaData);
    entityDataService.registerService('User', usersDataService);
  }

}
