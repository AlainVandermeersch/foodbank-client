import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {MembresComponent} from './membres.component';
import {MembreComponent} from './membre/membre.component';
import {EntityDataService, EntityDefinitionService} from '@ngrx/data';
import {MembresDataService} from './services/membres-data.service';
import {MembreEntityService} from './services/membre-entity.service';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {PanelModule} from 'primeng/panel';
import {PaginatorModule} from 'primeng/paginator';
import {InputTextModule} from 'primeng/inputtext';
import {DialogModule} from 'primeng/dialog';
import {appEntityMetadata} from '../app-entity.metadata';
import {MessageModule} from 'primeng/message';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {ConfirmationService} from 'primeng/api';
import {CalendarModule} from 'primeng/calendar';
import {ToastModule} from 'primeng/toast';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {OrgSummariesDataService} from '../organisations/services/orgsummaries-data.service';
import {OrgSummaryEntityService} from '../organisations/services/orgsummary-entity.service';
import {InputSwitchModule} from 'primeng/inputswitch';
import {CheckboxModule} from 'primeng/checkbox';
import {BanquesDataService} from '../banques/services/banques-data.service';
import {BanqueEntityService} from '../banques/services/banque-entity.service';
import {TooltipModule} from 'primeng/tooltip';
import {OrganisationsDataService} from '../organisations/services/organisations-data.service';
import {OrganisationEntityService} from '../organisations/services/organisation-entity.service';
import {MembreEmploiTypesComponent} from './membre-emploitypes/membre-emploitypes.component';
import {MembreEmploiTypeComponent} from './membre-emploitypes/membre-emploitype/membre-emploitype.component';
import {MembreFunctionComponent} from './membre-functions/membre-function/membre-function.component';
import {MembreFunctionsComponent} from './membre-functions/membre-functions.component';
import {MembreEmploiTypesDataService} from './services/membreEmploiTypes-data.service';
import {MembreEmploiTypeEntityService} from './services/membreEmploiType-entity.service';
import {MembreFunctionsDataService} from './services/membreFunctions-data.service';
import {MembreFunctionEntityService} from './services/membreFunction-entity.service';
import {AuditChangesDataService} from '../audits/services/auditChanges-data.service';
import {AuditChangeEntityService} from '../audits/services/auditChange-entity.service';
import {DepotsDataService} from '../depots/services/depots-data.service';
import {DepotEntityService} from '../depots/services/depot-entity.service';


const routes: Routes = [
    {   path: 'membreemploitypes',
        component: MembreEmploiTypesComponent,

    },
    {   path: 'membrefunctions',
        component: MembreFunctionsComponent,
    },
  { path: '',
    component: MembresComponent,
  },
  {
    path: ':batId',
    component: MembreComponent,
  }
];
@NgModule({
  declarations: [MembresComponent, MembreComponent, MembreEmploiTypesComponent, MembreEmploiTypeComponent, MembreFunctionComponent, MembreFunctionsComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        TableModule,
        PanelModule,
        PaginatorModule,
        InputTextModule,
        ButtonModule,
        DialogModule,
        MessageModule,
        SelectButtonModule,
        ConfirmPopupModule,
        CalendarModule,
        ToastModule,
        AutoCompleteModule,
        InputSwitchModule,
        CheckboxModule,
        TooltipModule
    ],
  providers: [
    MembresDataService,
    MembreEntityService,
      MembreEmploiTypesDataService,
      MembreEmploiTypeEntityService,
      MembreFunctionsDataService,
      MembreFunctionEntityService,
      OrganisationsDataService,
      OrganisationEntityService,
      OrgSummariesDataService,
      OrgSummaryEntityService,
      BanquesDataService,
      BanqueEntityService,
      DepotsDataService,
      DepotEntityService,
      AuditChangesDataService,
      AuditChangeEntityService,
    ConfirmationService
  ],
})
export class MembresModule {
  constructor(
      private eds: EntityDefinitionService,
      private entityDataService: EntityDataService,
      private membresDataService: MembresDataService,
      private membreFunctionsDataService: MembreFunctionsDataService,
      private membreEmploiTypesDataService: MembreEmploiTypesDataService,
      private banquesDataService: BanquesDataService,
      private depotsDataService: DepotsDataService,
      private organisationsDataService: OrganisationsDataService,
      private orgSummariesDataService: OrgSummariesDataService,
      private auditChangesDataService: AuditChangesDataService,
  ) {
    eds.registerMetadataMap(appEntityMetadata);
    entityDataService.registerService('Membre', membresDataService);
    entityDataService.registerService('MembreFunction', membreFunctionsDataService);
    entityDataService.registerService('MembreEmploiType', membreEmploiTypesDataService);
    entityDataService.registerService('Banque', banquesDataService);
    entityDataService.registerService('Organisation', organisationsDataService);
    entityDataService.registerService('OrgSummary', orgSummariesDataService);
    entityDataService.registerService('Depot', depotsDataService);
    entityDataService.registerService('AuditChange', auditChangesDataService);
  }

}
