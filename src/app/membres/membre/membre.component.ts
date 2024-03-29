import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MembreEntityService} from '../services/membre-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, Observable} from 'rxjs';
import {DefaultMembre, Membre} from '../model/membre';
import {ConfirmationService, MessageService} from 'primeng/api';
import {enmGender, enmLanguage, enmLanguageLegacy} from '../../shared/enums';
import {NgForm} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {globalAuthState} from '../../auth/auth.selectors';
import {AppState} from '../../reducers';
import {DataServiceError} from '@ngrx/data';
import {Organisation} from '../../organisations/model/organisation';
import {UserHttpService} from '../../users/services/user-http.service';
import {AuthService} from '../../auth/auth.service';
import {User} from '../../users/model/user';
import {OrganisationEntityService} from '../../organisations/services/organisation-entity.service';
import {MembreFunctionEntityService} from '../services/membreFunction-entity.service';
import {MembreEmploiTypeEntityService} from '../services/membreEmploiType-entity.service';
import {OrgSummaryEntityService} from '../../organisations/services/orgsummary-entity.service';
import {AuditChangeEntityService} from '../../audits/services/auditChange-entity.service';

@Component({
  selector: 'app-membre',
  templateUrl: './membre.component.html',
  styleUrls: ['./membre.component.css']
})
export class MembreComponent implements OnInit {
    @ViewChild('membreForm') myform: NgForm;
    @Input() batId$: Observable<number>;
    @Input() currentFilteredOrg: Organisation;
    @Input() currentFilteredBankId: number;
    @Input() currentFilteredBankShortName: string;
    @Output() onMembreUpdate = new EventEmitter<Membre>();
    @Output() onMembreCreate = new EventEmitter<Membre>();
    @Output() onMembreDelete = new EventEmitter<Membre>();
    @Output() onMembreQuit = new EventEmitter<Membre>();
    membre: Membre;
    booIsOrganisation: boolean;
    booCalledFromTable: boolean;
    booCanSave: boolean;
    booCanDelete: boolean;
    booCanQuit: boolean;
    genders: any[];
  languages: any[];
  legacyLanguages: any[];
  userLanguage: string;
  userId: string;
  userName: string;
  lienBanque: number;
  lienDis: number;
    lienDepot: number;
    title: string;
    idCompany: string;
    orgName: string;
    depotName: string;
    isAdmin: boolean;
    userIds: string;
    membreFunctions : any[];
    membreEmploiTypes : any[];
    selectedFunction: any;
    selectedEmploiType: any;
    depots: any[];
    selectedDepot: any;
    constructor(
      private membresService: MembreEntityService,
      private membreFunctionEntityService: MembreFunctionEntityService,
      private membreEmploiTypeEntityService: MembreEmploiTypeEntityService,
      private organisationsService: OrganisationEntityService,
      private orgsummaryService: OrgSummaryEntityService,
      private userHttpService: UserHttpService,
      private auditChangeEntityService: AuditChangeEntityService,
      private authService: AuthService,
      private route: ActivatedRoute,
      private router: Router,
      private store: Store<AppState>,
      private messageService: MessageService,
      private confirmationService: ConfirmationService
  ) {
      this.genders =  enmGender;
      this.languages =  enmLanguage;
      this.legacyLanguages = enmLanguageLegacy;
      this.booCalledFromTable = true;
      this.booCanDelete = false;
      this.booCanSave = false;
      this.booCanQuit = true;
      this.isAdmin = false;
      this.lienBanque = 0 ;
      this.idCompany = '';
      this.lienDis = 0;
      this.lienDepot = 0;
      this.depotName = '';
      this.booIsOrganisation = false;
      this.title = '';
      this.userIds = '';
      this.depots = [{label: ' ',value: null}];
      this.membreFunctions = [{label: ' ',value: null}];
      this.membreEmploiTypes = [{label: ' ',value: null}];
  }

  ngOnInit(): void {
      // comment: this component is sometimes called from his parent Component with idDepot @Input Decorator,
      // or sometimes via a router link via the Main Menu
      if (!this.batId$) {
          // we must come from the menu
          this.booCalledFromTable = false;
          this.booCanQuit = false;
          this.route.paramMap
              .pipe(
                  map(paramMap => paramMap.get('batId')),
                  map(batIdString => Number(batIdString)),
                  switchMap(batId => this.membresService.getByKey(batId))
              ).subscribe(membre => {
               this.membre = membre;
          });
      }  else {
         const membre$ = combineLatest([this.batId$, this.membresService.entities$])
              .pipe(
                  map(([batId, membres]) => membres.find(membre => membre['batId'] === batId))
              );

          membre$.subscribe(
              membre => {
                  this.userIds = '';
                  console.log( ' We have a membre ' + JSON.stringify(membre));
                  if (membre) {
                      this.membre = membre;
                      console.log( ' We have a existing membre ' );
                     if(membre.lienDis > 0) {
                         console.log( ' We have a existing org membre ' );
                          this.organisationsService.getByKey(this.membre.lienDis).subscribe(
                              (org: Organisation) => {
                                  if (org) {
                                      this.membre.lienBanque = org.lienBanque;
                                      this.membre.bankShortName = org.bankShortName;
                                      console.log('Correcting membre bank info from org info with content:', membre);
                                  }



                          });
                      }
                      else {
                         console.log( ' We have a existing bank membre ' );


                         this.loadFunctions(this.membre.lienBanque);
                         this.loadEmploiTypes(this.membre.lienBanque);
                         this.loadDepots(this.membre.lienBanque);

                     }

                      if (membre.societe) {
                          this.title = $localize`:@@OrgMemberExisting:Member for organisation ${membre.societe} Updated On ${ membre.lastVisit}`;
                      } else {

                          this.title = $localize`:@@BankMemberExisting:Member for bank ${membre.bankShortName} Updated On ${ membre.lastVisit}`;
                      }

                      if (membre.nbUsers > 0 ) {
                         let queryParams = { 'actif':'1', 'lienBat': membre.batId.toString() };
                          let params = new URLSearchParams();
                          for(let key in queryParams){
                              params.set(key, queryParams[key])
                          }
                          this.userHttpService.getUserReport(this.authService.accessToken, params.toString()).subscribe(
                              (users: User[]) => {
                                  users.map((user) => {
                                      this.userIds += user.idUser + ' ';
                                  })
                              });
                      }
                  } else {
                      console.log( ' We have a new membre ' );
                      this.membre = new DefaultMembre();
                      this.selectedEmploiType= null;
                      this.selectedFunction= null;
                      this.selectedDepot= null;
                      const userLanguageObj  = enmLanguageLegacy.find(obj => obj.value === this.userLanguage);
                      if (userLanguageObj) {
                          const newMemberLanguageObj  = enmLanguage.find(obj => obj.label === userLanguageObj.label);
                          if (newMemberLanguageObj) {
                              console.log('Setting new member language to user language', newMemberLanguageObj);
                              this.membre.langue = newMemberLanguageObj.value;
                          }
                      }
                   
                      if (this.isAdmin) {
                          // currentFilteredBankId should always be filled in cfr GUI
                            this.membre.lienBanque = this.currentFilteredBankId;
                          console.log('Setting new member bank to current bankid', this.currentFilteredBankId);
                            if ( this.currentFilteredOrg && this.currentFilteredOrg.idDis != 999 && this.currentFilteredOrg.idDis != 0 ) {
                                // must be org
                                this.membre.lienDis = this.currentFilteredOrg.idDis;
                                this.title = $localize`:@@OrgMemberNew2:New Member for organisation ${this.currentFilteredOrg.societe} `;
                            }
                            else {
                                this.membre.lienDis = 0;
                                console.log('Setting new member bank to current bankshortname', this.currentFilteredBankShortName);
                                this.title =  $localize`:@@BankMemberNew1:New Member for bank ${this.currentFilteredBankShortName} `;
                                this.loadFunctions(this.membre.lienBanque);
                                this.loadEmploiTypes(this.membre.lienBanque);
                                this.loadDepots(this.membre.lienBanque);
                            }
                      }
                      else {
                          this.membre.lienBanque = this.lienBanque;

                          if (this.lienDis > 0 && this.lienDepot === 0) {
                              // handle organisation membres
                              this.membre.lienDis = this.lienDis;
                              this.title = $localize`:@@OrgMemberNew1:New Member for organisation ${this.orgName} `;
                          } else {
                              // tslint:disable-next-line:max-line-length
                              if (this.currentFilteredOrg != null && this.currentFilteredOrg.idDis != null && this.currentFilteredOrg.idDis > 0 && this.currentFilteredOrg.idDis != 999) {
                                  // create membre from bank admin membre or depot admin membre
                                  this.membre.lienDis = this.currentFilteredOrg.idDis;
                                  if (this.currentFilteredOrg.societe === 'Depot') {
                                      this.title = $localize`:@@OrgMemberNewC:New Member for organisation  ${this.depotName}`;
                                  } else {
                                      this.title = $localize`:@@OrgMemberNewA:New Member for organisation  ${this.currentFilteredOrg.societe}`;
                                  }
                              } else {
                                  if (this.lienDepot > 0) {
                                      this.membre.lienDis = this.lienDepot;
                                      this.title = $localize`:@@OrgMemberNewB:New Member for depot  ${this.depotName}`;
                                  } else {
                                      // must be bank
                                      this.title = $localize`:@@BankMemberNew1:New Member for bank ${this.idCompany} `;
                                      this.loadFunctions(this.membre.lienBanque);
                                      this.loadEmploiTypes(this.membre.lienBanque);
                                      this.loadDepots(this.membre.lienBanque);

                                  }
                              }
                          }
                      }



                  }
              });
      }
    this.store
      .pipe(
          select(globalAuthState),
          map((authState) => {
              if (authState.user) {
                  this.userLanguage = authState.user.idLanguage;
                  this.userId= authState.user.idUser;
                  this.userName = authState.user.membreNom + ' ' + authState.user.membrePrenom;
                  switch (authState.user.rights) {
                      case 'admin':
                      case 'Admin_FBBA':
                          this.booCanSave = true;
                          this.isAdmin = true;
                          if (this.booCalledFromTable) {
                              this.booCanDelete = true;
                          }
                          break;
                      case 'Bank':
                      case 'Admin_Banq':
                          this.lienBanque = authState.banque.bankId;
                          this.idCompany = authState.banque.bankShortName;
                          if (authState.user.rights === 'Admin_Banq' || authState.user.gestMemb) {
                              this.booCanSave = true;
                              if (this.booCalledFromTable) {
                                  this.booCanDelete = true;
                              }
                          }
                          break;
                      case 'Asso':
                      case 'Admin_Asso':
                          this.lienBanque = authState.banque.bankId;
                          this.idCompany = authState.banque.bankShortName;
                          this.lienDis = authState.user.idOrg;
                          this.orgName = authState.organisation.societe;
                          if (authState.organisation.depyN === true) {
                              this.lienDepot = authState.organisation.idDis;
                              this.depotName = authState.organisation.societe;
                          }
                          this.booIsOrganisation = true;
                         if  (authState.user.rights === 'Admin_Asso' || authState.user.gestMemb) {
                             this.booCanSave = true;
                             if (this.booCalledFromTable) {
                                 this.booCanDelete = true;
                             }
                         }
                          break;
                      default:
                  }
              }
             })
      )
      .subscribe();
  }
  loadFunctions(lienBanque: number) {
        if (!lienBanque) return;
      const queryParms = { 'actif': '1' , 'language': this.userLanguage,'lienBanque': lienBanque.toString() };
      this.membreFunctions = [{ value: 0, label: $localize`:@@SelectFunction:Select Function` }];
      this.membreFunctionEntityService.getWithQuery(queryParms)
          .subscribe((membreFunctions) => {
              console.log('Membre functions now loaded');
              membreFunctions.map((membreFunction) => {
                  if(this.userLanguage == 'fr') {
                      this.membreFunctions.push({label: membreFunction.bankShortName + ' ' + membreFunction.fonctionName, value: membreFunction.funcId});
                  }
                  else {
                      this.membreFunctions.push({label: membreFunction.bankShortName + ' ' + membreFunction.fonctionNameNl, value: membreFunction.funcId});
                  }
            });
              this.selectedFunction = this.membre.fonction;
          })
  }
  loadEmploiTypes(lienBanque: number) {
      if (!lienBanque) return;
      const queryParms = { 'actif': '1' , 'language': this.userLanguage,'lienBanque': lienBanque.toString() };
      this.membreEmploiTypes= [{label: 'Select', value: 0}];
      this.membreEmploiTypeEntityService.getWithQuery(queryParms)
          .subscribe((membreEmploiTypes) => {
              console.log('Membre emploitypes now loaded');
              membreEmploiTypes.map((membreEmploiType) => {
                  if(this.userLanguage == 'fr') {
                      this.membreEmploiTypes.push({label: membreEmploiType.bankShortName + ' ' + membreEmploiType.jobNameFr, value: membreEmploiType.jobNr});
                  }
                  else {
                      this.membreEmploiTypes.push({label: membreEmploiType.bankShortName + ' ' + membreEmploiType.jobNameNl, value: membreEmploiType.jobNr});
                  }
              });
              this.selectedEmploiType= this.membre.typEmploi;
          })
  }
    delete(event: Event, membre: Membre) {
        this.confirmationService.confirm({
            target: event.target,
            message: 'Confirm Deletion?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const  myMessage = {severity: 'success', summary: 'Delete',
                    detail: $localize`:@@messageEmployeeDeleted:The employee ${membre.prenom} ${membre.nom} was deleted`};
                this.membresService.delete(membre)
                    .subscribe( () => {
                        this.messageService.add(myMessage);
                        this.onMembreDelete.emit(membre);
                        this.auditChangeEntityService.logDbChange(this.userId,this.userName,membre.lienBanque,membre.lienDis,'Member',
                                membre.nom + ' ' + membre.prenom, 'Delete' );
                    },
                        ( dataserviceerror) => { 
                             
                             
                            const  errMessage = {severity: 'error', summary: 'Delete',
                                // tslint:disable-next-line:max-line-length
                                detail: $localize`:@@messageEmployeeDeleteError:The employee ${membre.prenom} ${membre.nom} could not be deleted: error: ${dataserviceerror.message}`,
                                life: 6000 };
                                this.messageService.add(errMessage) ;
                        }
                    );
            }

        });
    }

  save(oldMembre: Membre, membreForm: Membre) {
    const modifiedMembre = Object.assign({}, oldMembre, membreForm);
      modifiedMembre.fonction = this.selectedFunction;
      modifiedMembre.typEmploi = this.selectedEmploiType;
      modifiedMembre.ldep= this.selectedDepot;
      if (modifiedMembre.hasOwnProperty('batId')) {

          this.membresService.update(modifiedMembre)
              .subscribe((updatedMembre) => {
                  this.messageService.add({
                      severity: 'success',
                      summary: 'Update',
                      detail: $localize`:@@messageEmployeeUpdated:The employee ${updatedMembre.nom} ${updatedMembre.prenom}  was updated`
                  });
                  this.onMembreUpdate.emit(updatedMembre);
                  this.auditChangeEntityService.logDbChange(this.userId,this.userName,updatedMembre.lienBanque,updatedMembre.lienDis,'Member',
                      updatedMembre.nom + ' ' + updatedMembre.prenom, 'Update' );
              },
                  ( dataserviceerror) => { 
                     
                     
                    const  errMessage = {severity: 'error', summary: 'Update',
                          // tslint:disable-next-line:max-line-length
                          detail: $localize`:@@messageEmployeeUpdateError:The employee ${modifiedMembre.nom} ${modifiedMembre.prenom} could not be updated: error: ${dataserviceerror.message}`,
                          life: 6000 };
                    this.messageService.add(errMessage) ;
                  }
              );
      } else {
          if (modifiedMembre.fonction == null && modifiedMembre.lienDis == 0) {
              modifiedMembre.fonction = 26; // set general help function by default for new bank members
          }
          this.membresService.add(modifiedMembre)
              .subscribe((createdMembre) => {
                  this.messageService.add({
                      severity: 'success',
                      summary: 'Creation',
                      detail: $localize`:@@messageEmployeeCreated:The employee ${createdMembre.nom} ${createdMembre.prenom}  was created`
                  });
                  this.onMembreCreate.emit(createdMembre);
                      this.auditChangeEntityService.logDbChange(this.userId,this.userName,createdMembre.lienBanque,createdMembre.lienDis,'Member',
                          createdMembre.nom + ' ' + createdMembre.prenom, 'Create' );
              },
                  ( dataserviceerror) => { 
                     
                     
                    const  errMessage = {severity: 'error', summary: 'Create',
                          // tslint:disable-next-line:max-line-length
                          detail: $localize`:@@messageEmployeeCreateError:The employee ${modifiedMembre.nom} ${modifiedMembre.prenom} could not be created: error: ${dataserviceerror.message}`,
                          life: 6000 };
                    this.messageService.add(errMessage) ;
                  }
              );
      }
  }

    quit(event: Event, oldMembre: Membre, membreForm: NgForm, formDirty: boolean) {
        if (formDirty) {
            this.confirmationService.confirm({
                target: event.target,
                message: $localize`:@@messageChangesMayBeLost:Your changes may be lost. Are you sure that you want to proceed?` ,
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    membreForm.reset(oldMembre); // reset in-memory object for next open
                    this.onMembreQuit.emit();
                }
            });
        } else {
            this.onMembreQuit.emit();
        }
    }

    getMemberTitle(): string {
        return this.title;
    }
    loadDepots(lienBanque: number ) {
        const queryDepotParms = {};
        queryDepotParms['offset'] = '0';
        queryDepotParms['rows'] = '100';
        queryDepotParms['sortField'] = 'Societe';
        queryDepotParms['sortOrder'] = '1';
        if (lienBanque) {
            queryDepotParms['lienBanque'] = lienBanque.toString();
        }
        queryDepotParms['isDepot'] = true;
        queryDepotParms['actif'] = true;
        this.orgsummaryService.getWithQuery(queryDepotParms)
            .subscribe(filteredDepots => {
                this.depots = [{label: ' ',value: null}];
                filteredDepots.map((orgSummary) => {
                    this.depots.push({label: orgSummary.societe, value: orgSummary.idDis});
                });
                this.selectedDepot= this.membre.ldep;
            })
    }
    generateTooltipFunction() {
        return $localize`:@@TooltipFunction:Functions can be standard for all banks or specific for a food bank`;
    }
}

