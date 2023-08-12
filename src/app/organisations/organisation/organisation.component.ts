import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {OrganisationEntityService} from '../services/organisation-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, Observable} from 'rxjs';
import {DefaultOrganisation, Organisation} from '../model/organisation';
import {ConfirmationService, MessageService} from 'primeng/api';
import {
    enmCountry,
    enmGender, enmLanguage,
    enmOrgActivities,
    enmOrgCategories,
    enmStatusCompany,
    enmSupplyDay,
    enmSupplyMonth,
    enmSupplyWeek
} from '../../shared/enums';
import {NgForm} from '@angular/forms';
import {Cpas} from '../../cpass/model/cpas';
import {CpasEntityService} from '../../cpass/services/cpas-entity.service';
import {DataServiceError, QueryParams} from '@ngrx/data';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../reducers';
import {globalAuthState} from '../../auth/auth.selectors';
import {OrgSummaryEntityService} from '../services/orgsummary-entity.service';
import {OrgSummary} from '../model/orgsummary';
import {RegionEntityService} from '../services/region-entity.service';
import {OrgProgramEntityService} from '../services/orgprogram-entity.service';
import {DefaultOrgProgram, OrgProgram} from '../model/orgprogram';
import {AuditChangeEntityService} from '../../audits/services/auditChange-entity.service';
import { generateTooltipSuggestions } from '../../shared/functions';

@Component({
  selector: 'app-organisation',
  templateUrl: './organisation.component.html',
  styleUrls: ['./organisation.component.css']
})
export class OrganisationComponent implements OnInit {
    @ViewChild('organisationForm') myform: NgForm;
    @ViewChild('orgProgForm') progform: NgForm;
    @Input() idDis$: Observable<number>;
    @Output() onOrganisationUpdate = new EventEmitter<Organisation>();
    @Output() onOrganisationCreate = new EventEmitter<Organisation>();
    @Output() onOrganisationDelete = new EventEmitter<Organisation>();
    @Output() onOrganisationQuit = new EventEmitter<Organisation>();
    booCalledFromTable: boolean;
    booIsAdmin: boolean;
    booCanSave: boolean;
    booCanDelete: boolean;
    booCanQuit: boolean;
    organisation: Organisation;
    orgProg:OrgProgram;
    selectedCpas: Cpas;
    filteredCpass: Cpas[];
    filteredDepots: OrgSummary[];
    selectedDepot: OrgSummary;
    selectedDepotRamasse: OrgSummary;
    genders: any[];
    statuts: any[];
    languages: any[];
    regions: any[];
    countries: any[];
    orgActivities: any[];
    orgCategories: any[];
    supplyOptionsMonth: any[];
    supplyOptionsWeek: any[];
    supplyOptionsDay: any[];
    lienBanque: number;
    userName: string;
    userId: string;
    userAsso: boolean;
    gestBen: boolean;

  constructor(
      private organisationsService: OrganisationEntityService,
      private orgProgramService: OrgProgramEntityService,
      private orgsummaryService: OrgSummaryEntityService,
      private cpassService: CpasEntityService,
      private regionService: RegionEntityService,
      private auditChangeEntityService: AuditChangeEntityService,
      private route: ActivatedRoute,
      private router: Router,
      private store: Store<AppState>,
      private messageService: MessageService,
      private confirmationService: ConfirmationService
  ) {
      this.statuts = enmStatusCompany;
      this.genders = enmGender;
      this.countries = enmCountry;
      this.languages =  enmLanguage;
      this.orgActivities = enmOrgActivities;
      this.supplyOptionsMonth = enmSupplyMonth;
      this.supplyOptionsWeek = enmSupplyWeek;
      this.supplyOptionsDay = enmSupplyDay;
      this.orgCategories = [...enmOrgCategories];
      this.orgCategories.splice(0,1); // get rid of all option
      this.booIsAdmin = false;
      this.booCalledFromTable = true;
      this.booCanDelete = false;
      this.booCanSave = false;
      this.booCanQuit = true;
      this.lienBanque = 0;
      this.userName = '' ;
      this.userId = '' ;
      this.userAsso = false;
      this.gestBen = false;
  }

  ngOnInit(): void {
// comment: this component is sometimes called from his parent Component with BankId @Input Decorator,
      // or sometimes via a router link via the Main Menu
      let organisation$: Observable<Organisation>;
      if (!this.idDis$) {
          // we must come from the menu
             this.booCalledFromTable = false;
             this.booCanQuit = false;
          organisation$ = this.route.paramMap
              .pipe(
                  map(paramMap => paramMap.get('idDis')),
                  map(idDisString => Number(idDisString)),
                switchMap(idDis => this.organisationsService.getByKey(idDis))
             );
      } else {
          organisation$ = combineLatest([this.idDis$, this.organisationsService.entities$])
              .pipe(
                  map(([idDis, organisations]) => organisations.find(organisation => idDis === organisation.idDis))
              );
      }
      organisation$.subscribe(organisation => {
          if (organisation) {
              this.organisation = organisation;
              this.orgProgramService.getByKey(organisation.idDis)
                  .subscribe(
                      orgProg => {
                          if (orgProg !== null) {
                              this.orgProg = orgProg;
                          }
                      });
              if (this.organisation.lienCpas != null && this.organisation.lienCpas !== 0  ) {
                  this.cpassService.getByKey(this.organisation.lienCpas)
                      .subscribe(
                          cpas => {
                              if (cpas !== null) {
                                  this.selectedCpas = {...cpas};
                              }
                          });
              }
              if (this.organisation.lienDepot != null && this.organisation.lienDepot !== 0  ) {
                  this.orgsummaryService.getByKey(this.organisation.lienDepot)
                      .subscribe(
                          orgsummary => {
                              if (orgsummary !== null) {
                                  this.selectedDepot = {...orgsummary};
                              }
                          });
              }
              if (this.organisation.depotram != null && this.organisation.depotram !== 0  ) {
                  this.orgsummaryService.getByKey(this.organisation.depotram)
                      .subscribe(
                          orgsummary => {
                              if (orgsummary !== null) {
                                  this.selectedDepotRamasse = {...orgsummary};
                              }
                          });
              }
          } else {
              this.organisation = new DefaultOrganisation();
              if (this.myform) {
                  this.myform.reset(this.organisation);
              }
              this.selectedCpas = null;
              this.selectedDepot = null;
              this.selectedDepotRamasse = null;
          }
      });
      this.store
          .pipe(
              select(globalAuthState),
              map((authState) => {
                  if (authState.user) {
                      const regionQuery = {};
                      this.userName = authState.user.userName;
                      this.userId= authState.user.idUser;

                      switch (authState.user.rights) {
                          case 'admin':
                          case 'Admin_FBBA':
                              this.booCanSave = true;
                              this.booIsAdmin = true;
                              break;
                          case 'Admin_Banq':
                          case 'Bank':
                              this.lienBanque = authState.banque.bankId;
                              regionQuery['lienBanque'] = this.lienBanque.toString();
                              if (authState.user.rights === 'Admin_Banq' || authState.user.gestAsso) {
                                  this.booCanSave = true;
                                  this.booIsAdmin = true;
                                  if (this.booCalledFromTable) {
                                      this.booCanDelete = true;
                                  }
                              }
                              break;
                          case 'Admin_Asso':
                              this.lienBanque = authState.banque.bankId;
                              regionQuery['lienBanque'] = this.lienBanque.toString();
                              this.booCanSave = true;
                              this.userAsso = true;
                              break;
                          case 'Asso':
                              this.userAsso = true;
                          default:
                      }
                      this.regionService.getWithQuery(regionQuery)
                          .subscribe(regions => {
                              this.regions = [{ value: null, label: ' '}];
                              regions.map((region) =>
                                  this.regions.push({value: region.regId, label: region.regName})
                              );
                          });
                  }
              })
          )
          .subscribe();

  }
  save(oldOrganisation: Organisation, organisationForm: Organisation) {
    const modifiedOrganisation = Object.assign({}, oldOrganisation, organisationForm);
    if (this.selectedCpas) {
        modifiedOrganisation.lienCpas = this.selectedCpas.cpasId;
    }
      if (this.selectedDepot) {
          modifiedOrganisation.lienDepot = this.selectedDepot.idDis;
      }
      if (this.selectedDepotRamasse) {
          modifiedOrganisation.depotram = this.selectedDepotRamasse.idDis;
      }
    modifiedOrganisation.lupdUserName = this.userName;
      if (modifiedOrganisation.hasOwnProperty('idDis')) {
         this.organisationsService.update(modifiedOrganisation)
              .subscribe( ()  => {
                  this.messageService.add({
                      severity: 'success',
                      summary: 'Update',
                      detail: $localize`:@@messageOrganisationUpdated:Organisation ${modifiedOrganisation.idDis}  ${modifiedOrganisation.societe} was updated`
                  });
                  this.onOrganisationUpdate.emit(modifiedOrganisation);
                      this.auditChangeEntityService.logDbChange(this.userId,this.userName,modifiedOrganisation.lienBanque,modifiedOrganisation.idDis,'Org',
                           ' ' , 'Update' );
              },
                  ( dataserviceerror) => { 
                     
                     
                      const  errMessage = {severity: 'error', summary: 'Update',
                       detail: $localize`:@@messageOrganisationUpdateError:The organisation ${modifiedOrganisation.idDis} ${modifiedOrganisation.societe} could not be updated: error: ${dataserviceerror.message}`,
                       life: 6000 };
                      this.messageService.add(errMessage) ;
              });
      } else {
          modifiedOrganisation.lienBanque = this.lienBanque;
          this.organisationsService.add(modifiedOrganisation)
              .subscribe((newOrganisation) => {
                  this.messageService.add({
                      severity: 'success',
                      summary: 'Creation',
                      detail: $localize`:@@messageOrganisationCreated:Organisation ${newOrganisation.idDis}  ${newOrganisation.societe} was created`
                  });
                  this.onOrganisationCreate.emit(newOrganisation);
                  this.auditChangeEntityService.logDbChange(this.userId,this.userName,newOrganisation.lienBanque,newOrganisation.idDis,'Org',
                          ' ' , 'Create' );
              },
                  ( dataserviceerror) => { 
                     
                     
                      const  errMessage = {severity: 'error', summary: 'Creation',
                          // tslint:disable-next-line:max-line-length
                          detail: $localize`:@@messageOrganisationCreateError:The organisation ${modifiedOrganisation.societe} could not be created: error: ${dataserviceerror.message}`,
                          life: 6000 };
                      this.messageService.add(errMessage) ;
                  });
      }
  }
    saveOrgProgram(progForm: OrgProgram) {

        const modifiedOrgProgram = Object.assign({}, this.orgProg, progForm);
        this.orgProgramService.update(modifiedOrgProgram)
            .subscribe(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Update',
                        detail: $localize`:@@messageOrgDetailsUpdated:Org Program for organisation  ${this.organisation.idDis} ${this.organisation.societe} was updated`
                    });
                    this.auditChangeEntityService.logDbChange(this.userId,this.userName,this.organisation.lienBanque,this.organisation.idDis,'OrgProgram',
                        ' ', 'Update' );

                },
                ( dataserviceerror) => { 
                     
                     
                    const  errMessage = {severity: 'error', summary: 'Update',
                        // tslint:disable-next-line:max-line-length
                        detail: $localize`:@@messageOrgDetailsUpdateError:Org Program for organisation  ${this.organisation.idDis} ${this.organisation.societe} could not be updated: error: ${dataserviceerror.message}`,
                        life: 6000 };
                    this.messageService.add(errMessage) ;
                });
    }
    delete(event: Event, organisation: Organisation) {
        this.confirmationService.confirm({
            target: event.target,
            message: 'Confirm Deletion?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const  myMessage = {
                    severity: 'success',
                    summary: 'Delete',
                    detail: $localize`:@@messageOrganisationDeleted:Organisation ${organisation.idDis} ${organisation.societe} was deleted`};
                this.organisationsService.delete(organisation)
                    .subscribe( () => {
                        this.messageService.add(myMessage);
                        this.onOrganisationDelete.emit();
                        this.auditChangeEntityService.logDbChange(this.userId,this.userName,organisation.lienBanque,organisation.idDis,'Org',
                                ' ' , 'Delete' );
                    },
                        ( dataserviceerror) => { 
                         
                         
                            const  errMessage = {severity: 'error', summary: 'Delete',
                                // tslint:disable-next-line:max-line-length
                                detail: $localize`:@@messageOrganisationDeleteError:The organisation ${organisation.idDis} ${organisation.societe} could not be deleted: error: ${dataserviceerror.message}`,
                                life: 6000 };
                            this.messageService.add(errMessage) ;
                        }
                    );
            }
        });
    }
    quit(event: Event, oldOrganisation: Organisation, organisationForm: NgForm, formDirty: boolean) {
        if (formDirty) {
            this.confirmationService.confirm({
                target: event.target,
                message: $localize`:@@messageChangesMayBeLost:Your changes may be lost. Are you sure that you want to proceed?`,
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    organisationForm.reset( oldOrganisation); // reset in-memory object for next open
                   this.onOrganisationQuit.emit();
                }
            });
        } else {
               this.onOrganisationQuit.emit();
        }
    }
    filterCpas(event ) {
        const  queryCpasParms: QueryParams = {};
        const query = event.query;
        queryCpasParms['offset'] = '0';
        queryCpasParms['rows'] = '10';
        queryCpasParms['sortField'] = 'cpasName';
        queryCpasParms['sortOrder'] = '1';
        queryCpasParms['searchField'] = 'cpasName';
        queryCpasParms['searchValue'] = query.toLowerCase();
        this.cpassService.getWithQuery(queryCpasParms)
            .subscribe(filteredCpass =>  this.filteredCpass = filteredCpass);
    }
    filterDepot(event ) {
        const  queryDepotParms = {};
        const query = event.query;
        queryDepotParms['offset'] = '0';
        queryDepotParms['rows'] = '10';
        queryDepotParms['sortField'] = 'Societe';
        queryDepotParms['sortOrder'] = '1';
        queryDepotParms['lienBanque'] = this.lienBanque.toString();
        queryDepotParms['isDepot'] = true;
        queryDepotParms['actif'] = true;
        queryDepotParms['societe'] = query.toLowerCase();
        this.orgsummaryService.getWithQuery(queryDepotParms)
            .subscribe(filteredDepots =>  this.filteredDepots = filteredDepots);
    }

    createOrgProgram() {
        this.orgProg = new DefaultOrgProgram();
        /* if (this.progform) {
            this.progform.reset(this.orgProg);
        } */
        this.orgProg.lienBanque = this.organisation.lienBanque;
        this.orgProg.lienDis = this.organisation.idDis;
        this.orgProg.lienDepot = this.organisation.lienDepot;
    }

    deleteOrgProgram(event: Event,myOrgProgram:OrgProgram) {
        this.confirmationService.confirm({
            target: event.target,
            message: 'Confirm Deletion?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const  myMessage = {
                    severity: 'success',
                    summary: 'Delete',
                    detail: $localize`:@@messageOrgProgramDeleted:Org Program was deleted for organisation  ${this.organisation.idDis}  ${this.organisation.societe} `};
                this.orgProgramService.delete(myOrgProgram)
                    .subscribe( () => {
                            this.messageService.add(myMessage);
                            this.orgProg = null;
                            this.auditChangeEntityService.logDbChange(this.userId,this.userName,this.organisation.lienBanque,this.organisation.idDis,'OrgProgram',
                                ' ', 'Delete' );
                        },
                        ( dataserviceerror) => { 
                         
                         
                            const  errMessage = {severity: 'error', summary: 'Delete',
                                // tslint:disable-next-line:max-line-length
                                detail: $localize`:@@messageOrgProgramDeleteError:The org program for organisation  ${this.organisation.idDis} ${this.organisation.societe} could not be deleted: error: ${dataserviceerror.message}`,
                                life: 6000 };
                            this.messageService.add(errMessage) ;
                        }
                    );
            }
        });
    }
    generateTooltipSuggestions() {
        return generateTooltipSuggestions();
    }
}

