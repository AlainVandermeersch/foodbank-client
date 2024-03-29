import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {BeneficiairesComponent} from './beneficiaires.component';
import {BeneficiaireComponent} from './beneficiaire/beneficiaire.component';

import {EntityDataService, EntityDefinitionService} from '@ngrx/data';
import {BeneficiaireEntityService} from './services/beneficiaire-entity.service';
import {CpassDataService} from '../cpass/services/cpass-data.service';
import {BeneficiairesDataService} from './services/beneficiaires-data.service';
import {TableModule} from 'primeng/table';
import {PaginatorModule} from 'primeng/paginator';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {PanelModule} from 'primeng/panel';
import {DialogModule} from 'primeng/dialog';
import {appEntityMetadata} from '../app-entity.metadata';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {ConfirmationService} from 'primeng/api';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {CpasEntityService} from '../cpass/services/cpas-entity.service';
import {DependentsComponent} from './dependents/dependents.component';
import {DependentComponent} from './dependents/dependent/dependent.component';
import {DependentsDataService} from './services/dependents-data.service';
import {DependentEntityService} from './services/dependent-entity.service';
import {CalendarModule} from 'primeng/calendar';
import {MessageModule} from 'primeng/message';
import {InputSwitchModule} from 'primeng/inputswitch';
import {CheckboxModule} from 'primeng/checkbox';
import {OrgSummariesDataService} from '../organisations/services/orgsummaries-data.service';
import {OrgSummaryEntityService} from '../organisations/services/orgsummary-entity.service';
import {InputNumberModule} from 'primeng/inputnumber';
import {BeneficiariesReportComponent} from './beneficiaries-report/beneficiaries-report.component';
import {BanquesDataService} from '../banques/services/banques-data.service';
import {BanqueEntityService} from '../banques/services/banque-entity.service';
import {ChartModule} from 'primeng/chart';
import {AuditChangesDataService} from '../audits/services/auditChanges-data.service';
import {AuditChangeEntityService} from '../audits/services/auditChange-entity.service';
import {TooltipModule} from 'primeng/tooltip';
import {OrganisationsDataService} from '../organisations/services/organisations-data.service';
import {OrganisationEntityService} from '../organisations/services/organisation-entity.service';
import {BeneficiariesListComponent} from './beneficiaries-list/beneficiaries-list.component';
import {NgxPrintModule} from 'ngx-print';
import {ToastModule} from 'primeng/toast';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import {MailingsDataService} from '../mailings/services/mailings-data.service';
import {MailingEntityService} from '../mailings/services/mailing-entity.service';
import {ZipcodesDataService} from '../cpass/zipcodes/services/zipcodes-data.service';
import {ZipcodeEntityService} from '../cpass/zipcodes/services/zipcode-entity.service';
import {UsersDataService} from '../users/services/users-data.service';
import {UserEntityService} from '../users/services/user-entity.service';


const routes: Routes = [
    {
        path: 'Dependent',
        component: DependentsComponent,
    },
    {
        path: 'Dependent/:idDep',
        component: DependentComponent
    },
    {
        path: 'reports',
        component: BeneficiariesReportComponent,
    },
    {
        path: 'list',
        component: BeneficiariesListComponent,
    },
    {
        path: '',
        component: BeneficiairesComponent,
    },
    {
        path: ':idClient',
        component: BeneficiaireComponent
    },

];

@NgModule({
  declarations: [BeneficiairesComponent, BeneficiaireComponent, DependentsComponent, DependentComponent, BeneficiariesReportComponent,BeneficiariesListComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        TableModule,
        PaginatorModule,
        InputTextModule,
        ButtonModule,
        RadioButtonModule,
        PanelModule,
        DialogModule,
        ConfirmPopupModule,
        AutoCompleteModule,
        CalendarModule,
        MessageModule,
        ToastModule,
        ProgressSpinnerModule,
        InputSwitchModule,
        CheckboxModule,
        InputNumberModule,
        TooltipModule,
        ChartModule,
        NgxPrintModule
    ],
  providers: [
        BeneficiairesDataService,
        DependentsDataService,
      BanquesDataService,
      BanqueEntityService,
      OrganisationsDataService,
      OrganisationEntityService,
        OrgSummariesDataService,
        CpassDataService,
        BeneficiaireEntityService,
        DependentEntityService,
        OrgSummaryEntityService,
        CpasEntityService,
      ZipcodesDataService,
      ZipcodeEntityService,
      UsersDataService,
      UserEntityService,
      AuditChangesDataService,
      AuditChangeEntityService,
      MailingsDataService,
      MailingEntityService,
        ConfirmationService
  ]

})
export class BeneficiairesModule {
  constructor(
      private eds: EntityDefinitionService,
      private entityDataService: EntityDataService,
      private beneficiairesDataService: BeneficiairesDataService,
      private banquesDataService: BanquesDataService,
      private cpassDataService: CpassDataService,
      private zipcodesDataService: ZipcodesDataService,
      private organisationsDataService: OrganisationsDataService,
      private orgSummariesDataService: OrgSummariesDataService,
      private usersDataService: UsersDataService,
      private auditChangesDataService: AuditChangesDataService,
      private mailingsDataService: MailingsDataService,
  ) {
    eds.registerMetadataMap(appEntityMetadata);
    entityDataService.registerService('Organisation', organisationsDataService);
    entityDataService.registerService('Beneficiaire', beneficiairesDataService);
    entityDataService.registerService('Banque', banquesDataService);
    entityDataService.registerService('Cpas', cpassDataService);
    entityDataService.registerService('Zipcode', zipcodesDataService);
    entityDataService.registerService('OrgSummary', orgSummariesDataService);
    entityDataService.registerService('User', usersDataService);
    entityDataService.registerService('AuditChange', auditChangesDataService);
    entityDataService.registerService('Mailing', mailingsDataService);
  }
}
