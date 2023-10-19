import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {UserEntityService} from '../services/user-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {catchError, map} from 'rxjs/operators';
import {DefaultUser, User} from '../model/user';
import {ConfirmationService, MessageService} from 'primeng/api';
import {
    enmLanguageLegacy,
    enmUserRoles,
    enmUserRolesAsso,
    enmUserRolesBank,
    enmUserRolesBankAsso,
    enmUserRolesFBBA
} from '../../shared/enums';
import {NgForm} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {globalAuthState} from '../../auth/auth.selectors';
import {AppState} from '../../reducers';
import {MembreEntityService} from '../../membres/services/membre-entity.service';
import {Membre} from '../../membres/model/membre';
import {DataServiceError, QueryParams} from '@ngrx/data';
import {combineLatest, Observable, of} from 'rxjs';
import {Organisation} from '../../organisations/model/organisation';
import {AuditChangeEntityService} from '../../audits/services/auditChange-entity.service';
import {DepotEntityService} from '../../depots/services/depot-entity.service';
import {CpasEntityService} from '../../cpass/services/cpas-entity.service';
import {generateTooltipSuggestions} from '../../shared/functions';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
    @ViewChild('userForm') myform: NgForm;
    @Input() idUser$: Observable<string>;
    @Input() currentFilteredOrg: Organisation;
    @Input() currentFilteredBankId: number;
    @Input() currentFilteredBankShortName: string;
    user: User;
    selectedMembre: Membre;
    filteredMembres: Membre[];
    @Output() onUserUpdate = new EventEmitter<User>();
    @Output() onUserDelete = new EventEmitter<User>();
    @Output() onUserCreate = new EventEmitter<User>();
    @Output() onUserQuit = new EventEmitter<User>();
    booIsOrganisation: boolean;
    booIsCreate: boolean;
    booCalledFromTable: boolean;
    booCanSave: boolean;
    booCanDelete: boolean;
    booCanQuit: boolean;
    lienBanque: number;
    idOrg: number;
    idCompany: string;
  languages: any[];
  rights: any[];
    filterMemberBase: any;
    lienDepot: number;
    lienCpas: number;
    depotName: string;
    cpasName: string;
    isAdmin: boolean;
    title: string;
    orgName: string;
    depotOptions: any[];
    cpasOptions: any[];
    loggedInUserId: string;
    loggedInUserName: string;
    loggedInUserRights: string;
    loggedInMember: Membre ;
  constructor(
      private usersService: UserEntityService,
      private membresService: MembreEntityService,
      private depotService: DepotEntityService,
      private cpasService: CpasEntityService,
      private auditChangeEntityService: AuditChangeEntityService,
      private route: ActivatedRoute,
      private router: Router,
      private store: Store<AppState>,
      private messageService: MessageService,
      private confirmationService: ConfirmationService
  ) {
      this.languages = enmLanguageLegacy;
      this.rights = [];
      this.booCalledFromTable = true;
      this.booCanDelete = false;
      this.booCanSave = false;
      this.booCanQuit = true;
      this.isAdmin = false;
      this.lienBanque = 0;
      this.idOrg = 0;
      this.idCompany = '';
      this.lienDepot = 0;
      this.lienCpas = 0;
      this.depotName = '';
      this.cpasName = '';
      this.booIsOrganisation = false;
      this.booIsCreate = false;
      this.title = '';
  }

  ngOnInit(): void {

      if (!this.idUser$) {
          // we must come from the menu
          this.booCalledFromTable = false;
          this.booCanQuit = false;
          this.booIsCreate = false;
          this.idUser$ = this.route.paramMap
              .pipe(
                  map(paramMap => paramMap.get('idUser'))
              );
      }
      const user$ = combineLatest([this.idUser$, this.usersService.entities$])
          .pipe(
              map(([idUser, users]) => users.find(user => idUser === user.idUser))
          );

      user$.subscribe(
            user => {
                if (user) {
                    this.user = user;
                    if (user.societe) {
                        this.rights = enmUserRolesAsso;
                        this.title = $localize`:@@OrgUserExisting:User ${user.idUser} for organisation  ${user.societe}`;
                    } else {
                        if (this.currentFilteredBankShortName == 'SPP') {
                            this.rights = [{label: $localize`:@@RoleFEADAdmin:FEAD Admin`, value: 'Admin_FEAD'}]
                        }
                        else if (this.user.idCompany == 'FBBA' ) {
                            this.rights = enmUserRolesFBBA;
                        }
                        else {
                            this.rights = enmUserRolesBank;
                        }
                        this.title = $localize`:@@BankUserExisting:User ${user.idUser} for bank ${this.user.idCompany}`;
                        this.loadDepotOptions(this.user.idCompany);
                        this.loadCpasOptions(this.user.lienBanque);
                    }
                    this.booIsCreate = false;
                    this.membresService.getByKey(user.lienBat)
                        .subscribe(
                            membre => {
                                if (membre != null && membre.actif == true) {
                                    this.selectedMembre = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                                }
                            });
                } else {
                    this.user = new DefaultUser();
                    if (this.isAdmin) {
                        // currentFilteredBankId should always be filled in cfr GUI
                        this.user.lienBanque = this.currentFilteredBankId;
                        this.user.idCompany = this.currentFilteredBankShortName;
                        if ( this.currentFilteredOrg && this.currentFilteredOrg.idDis != 999 && this.currentFilteredOrg.idDis != 0 ) {
                            // must be org
                            this.user.idOrg = this.currentFilteredOrg.idDis;
                            this.title = $localize`:@@OrgUserNew2:New User for organisation ${this.currentFilteredOrg.societe} `;
                            this.rights = enmUserRolesAsso;
                        }
                        else {
                            this.user.idOrg = 0;
                            this.loadDepotOptions(this.user.idCompany);
                            this.loadCpasOptions(this.user.lienBanque);
                            this.rights = enmUserRolesBank;
                            this.title =  $localize`:@@BankUserNew1:New User for bank ${this.currentFilteredBankShortName} `;
                            if (this.currentFilteredBankShortName == 'FBBA'  ) {
                                this.rights = enmUserRolesFBBA;
                            }
                            else if (this.currentFilteredBankShortName == 'SPP') {
                                this.rights = [{label: $localize`:@@RoleFEADAdmin:FEAD Admin`, value: 'Admin_FEAD'}]
                            }
                        }
                    }
                    else {
                        this.user.lienBanque = this.lienBanque;
                        this.user.idCompany = this.idCompany;
                        if (this.idOrg > 0 && this.lienDepot === 0) {
                            // handle  users from single organisation ( logged in as organisation admin
                            this.user.idOrg = this.idOrg;
                            this.rights = enmUserRolesAsso;
                            this.title = $localize`:@@OrgUserNew1:New User for organisation ${this.orgName} `;
                        } else {
                            if (this.currentFilteredOrg != null && this.currentFilteredOrg.idDis != null && this.currentFilteredOrg.idDis >0 && this.currentFilteredOrg.idDis != 999) {
                                // create user for org from bank or depot admin user
                                this.rights = enmUserRolesAsso;
                                this.user.idOrg = this.currentFilteredOrg.idDis;
                                if (this.currentFilteredOrg.societe === 'Depot') {
                                    this.title = $localize`:@@OrgUserNewC:New User for organisation  ${this.depotName}`;
                                } else {
                                    this.title = $localize`:@@OrgUserNewA:New User for organisation  ${this.currentFilteredOrg.societe}`;
                                }
                            } else {
                                // must be bank or depot
                                if (this.lienDepot > 0) {
                                    this.rights = enmUserRolesAsso;
                                    this.user.idOrg = this.lienDepot;
                                    this.title = $localize`:@@OrgUserNewB:New User for depot  ${this.depotName}`;
                                } else {
                                    this.rights = enmUserRolesBank;
                                    if (this.idCompany == 'FBBA' ) {
                                        this.rights = enmUserRolesFBBA;
                                    }
                                    this.loadDepotOptions(this.idCompany);
                                    this.loadCpasOptions(this.lienBanque);
                                    this.title = $localize`:@@BankUserNew1:New User for bank ${this.idCompany} `;
                                }
                            }
                        }
                    }
                    this.booIsCreate = true;
                     if (this.myform) {
                        this.myform.reset(this.user);
                    }
                }
            });

      this.store
          .pipe(
              select(globalAuthState),
              map((authState) => {
                  if (authState.user) {
                      this.loggedInUserName = authState.user.userName;
                      this.loggedInUserId = authState.user.idUser;
                      this.loggedInUserRights = authState.user.rights
                      this.lienCpas = authState.user.lienCpas;
                      this.membresService.getByKey(authState.user.lienBat)
                          .subscribe(
                          membre => {
                              if (membre != null) {
                                  this.loggedInMember = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                              }
                          });

                      this.lienBanque = authState.banque.bankId;
                      this.idCompany = authState.banque.bankShortName;
                      this.filterMemberBase = {'actif':1};
                      switch (authState.user.rights) {
                          case 'admin':
                          case 'Admin_FBBA':
                              this.isAdmin = true;
                              this.booCanSave = true;
                              if (this.booCalledFromTable) {
                                  this.booCanDelete = true;
                              }
                              break;
                          case 'Bank_FBBA':
                              break;
                          case 'Bank':
                          case 'Admin_Banq':
                              this.filterMemberBase['lienBanque'] = authState.banque.bankId;
                              if (authState.user.rights === 'Admin_Banq') {
                                  this.booCanSave = true;
                                  if (this.booCalledFromTable) {
                                      this.booCanDelete = true;
                                  }
                              }
                              break;
                          case 'Asso':
                          case 'Admin_Asso':
                              this.filterMemberBase['lienBanque'] = authState.banque.bankId;
                              this.idOrg = authState.organisation.idDis;
                              this.orgName = authState.organisation.societe;
                              if (authState.organisation.depyN === true) {
                                  this.lienDepot = authState.organisation.idDis;
                                  this.depotName = authState.organisation.societe;
                                  this.filterMemberBase['lienDepot'] = this.lienDepot;
                              } else {
                                  this.filterMemberBase['lienDis'] = this.idOrg;
                              }
                              this.booIsOrganisation = true;
                              if  (authState.user.rights === 'Admin_Asso') {
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
  delete(event: Event, user: User) {
      this.confirmationService.confirm({
          target: event.target,
          message: 'Confirm Deletion?',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
              const  myMessage = {
                  severity: 'success',
                  summary: 'Delete',
                  detail: $localize`:@@messageUserDeleted:The user ${user.idUser} ${user.userName}  was deleted`
              };
              this.usersService.delete(user)
                  .subscribe( () => {
                      this.messageService.add(myMessage);
                      this.onUserDelete.emit(user);
                      this.auditChangeEntityService.logDbChange(this.loggedInUserId,this.loggedInUserName,user.lienBanque,user.idOrg,'User',
                              user.idUser, 'Delete' );
                  },
                      ( dataserviceerror) => { 
                         
                         
                              const  errMessage = {severity: 'error', summary: 'Delete',
                              // tslint:disable-next-line:max-line-length
                              detail: $localize`:@@messageUserDeleteError:The user ${user.idUser} ${user.userName} could not be deleted: error: ${dataserviceerror.message}`,
                              life: 6000 };
                          this.messageService.add(errMessage) ;
                      });
          }
      });
 }

  save(oldUser: User, userForm: User) {
    const modifiedUser = Object.assign({}, oldUser, userForm);
      modifiedUser.lienBat = this.selectedMembre.batId;

      this.updateUserInfoFromMember( modifiedUser,this.selectedMembre);
      if (!modifiedUser.hasOwnProperty('isNew')) {
         this.usersService.update(modifiedUser)
        .subscribe(updatedUser  => {
            this.messageService.add({
                severity: 'success',
                summary: 'Update',
                detail: $localize`:@@messageUserUpdated:User  ${modifiedUser.idUser} ${modifiedUser.userName} was updated`});
            this.onUserUpdate.emit(updatedUser);
            this.auditChangeEntityService.logDbChange(this.loggedInUserId,this.loggedInUserName,modifiedUser.lienBanque,modifiedUser.idOrg,'User',
                    modifiedUser.idUser, 'Update' );
        } ,
            ( dataserviceerror) => { 
             
             
                const  errMessage = {severity: 'error', summary: 'Update',
                    // tslint:disable-next-line:max-line-length
                    detail: $localize`:@@messageUserUpdateError:The user ${modifiedUser.idUser} ${modifiedUser.userName} could not be updated: error: ${dataserviceerror.message}`,
                    life: 6000 };
                this.messageService.add(errMessage) ;
            }
        );
      } else {
          // todo later if we encrypt on client  const salt = bcrypt.genSaltSync(10);
          //  modifiedUser.password = bcrypt.hashSync(modifiedUser.password, salt);
          this.membresService.getByKey(modifiedUser.lienBat)
              .subscribe(
                  membre => {
                      if (membre !== null) {
                          this.updateUserInfoFromMember( modifiedUser,membre);
                          if (  modifiedUser.rights === '') { modifiedUser.rights = this.rights[0].value; } // dropdown box was not touched
                          this.usersService.add(modifiedUser)
                              .subscribe(() => {
                                      this.messageService.add({
                                          severity: 'success',
                                          summary: 'Creation',
                                          detail: $localize`:@@messageUserCreated:User  ${modifiedUser.idUser} ${modifiedUser.userName} has been created`
                                      });
                                      this.onUserCreate.emit(modifiedUser);
                                      this.auditChangeEntityService.logDbChange(this.loggedInUserId,this.loggedInUserName,modifiedUser.lienBanque,modifiedUser.idOrg,'User',
                                          modifiedUser.idUser, 'Create' );
                                  },
                                  ( dataserviceerror) => {
                                       
                                      if (!dataserviceerror.message) {
                                          dataserviceerror.message = dataserviceerror.error().message
                                      }

                                   const  errMessage = {severity: 'error', summary: 'Create',
                                          // tslint:disable-next-line:max-line-length
                                          detail: $localize`:@@messageUserCreateError:The user ${modifiedUser.idUser} ${modifiedUser.userName} could not be created: error: ${dataserviceerror.message}`,
                                          life: 6000 };
                                      this.messageService.add(errMessage) ;
                                  }
                            );
                      } else {
                         const  errMessage = {severity: 'error', summary: 'Create',
                              // tslint:disable-next-line:max-line-length
                              detail: $localize`:@@messageUserCreateErrorNoEmployee:The user ${modifiedUser.idUser}  could not be created: no employee was selected`,
                              life: 6000 };
                          this.messageService.add(errMessage) ;
                      }
                  });

      }

  }
    quit(event: Event, oldUser: User, userForm: NgForm, formDirty: boolean) {
        if (formDirty) {
            this.confirmationService.confirm({
                target: event.target,
                message: $localize`:@@messageChangesMayBeLost:Your changes may be lost. Are you sure that you want to proceed?`,
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    userForm.reset(oldUser); // reset in-memory object for next open
                    this.onUserQuit.emit();
                }
            });
        } else {
             this.onUserQuit.emit();
        }
    }
    loadDepotOptions(idCompany) {
        const  queryDepotParms: QueryParams = {};
        queryDepotParms['offset'] = '0';
        queryDepotParms['rows'] = '999';
        queryDepotParms['sortField'] = 'nom';
        queryDepotParms['sortOrder'] = '1';
        queryDepotParms['idCompany'] = idCompany;
        queryDepotParms['actif'] = '1';
        this.depotService.getWithQuery(queryDepotParms)
            .subscribe(depots => {
                this.depotOptions = [{ value: null, label: $localize`:@@All:All`}];
                depots.map((depot) =>
                    this.depotOptions.push({value: depot.idDepot, label: depot.nom})
                );
            });
    }
    loadCpasOptions(lienBanque) {
        const  queryCpasParms: QueryParams = {};
        queryCpasParms['offset'] = '0';
        queryCpasParms['rows'] = '999';
        queryCpasParms['sortField'] = 'cpasZip';
        queryCpasParms['sortOrder'] = '1';
        queryCpasParms['lienBanque'] = lienBanque;
        queryCpasParms['actif'] = '1';
        this.cpasService.getWithQuery(queryCpasParms)
            .subscribe(cpases => {
                this.cpasOptions = [];
                cpases.map((cpas) =>
                    this.cpasOptions.push({value: cpas.cpasId, label: cpas.cpasName})
                );
            });
    }
    updateUserInfoFromMember(user:User,membre:Membre) {
        user.userName = membre.nom + ' ' + membre.prenom;
        user.email = membre.batmail;
        // allow user bank to be different from bank member
       // user.idCompany =membre.bankShortName;
        switch (membre.langue) {
            case 1:
                user.idLanguage = 'fr';
                break;
            case 2:
                user.idLanguage = 'nl';
                break;
            case 3:
                user.idLanguage = 'en';
                break;
            case 4:
                user.idLanguage = 'de';
                break;
            default:
                user.idLanguage = '??';
        }

    }
    filterMembre(event ) {
        const  queryMemberParms = {...this.filterMemberBase};
        if ( this.currentFilteredOrg != null && this.currentFilteredOrg.idDis > 0) {
            queryMemberParms['lienDis'] = this.currentFilteredOrg.idDis;
        }  else {
            if (  this.idOrg === 0) { // bank members
                queryMemberParms['lienDis'] = 0;
            }
            if (this.lienDepot > 0) {
                queryMemberParms['lienDis'] = this.lienDepot;
            }
        }
        const query = event.query;
        queryMemberParms['offset'] = '0';
        queryMemberParms['rows'] = '5';
        queryMemberParms['sortField'] = 'nom';
        queryMemberParms['sortOrder'] = '1';
        queryMemberParms['nom'] = query.toLowerCase();
        this.membresService.getWithQuery(queryMemberParms)
            .subscribe(filteredMembres => {
                this.filteredMembres = filteredMembres.map((membre) =>
                    Object.assign({}, membre, {fullname: this.setMembreFullName(membre)})
                );
                if ( ['Admin_Banq',  'Admin_FBBA','admin'].includes(this.loggedInUserRights)) {
                    this.filteredMembres.push(this.loggedInMember);
                }
            });
    }

    getUserTitle(): string {
      return this.title;
    }
    setMembreFullName(membre:Membre): string  {
        if (membre.bankShortName === this.idCompany) {
            return membre.nom + ' ' + membre.prenom;
        } else {
            return membre.nom + ' ' + membre.prenom + '(' + membre.bankShortName + ')';
        }

    }
    generateTooltipManageDepot() {
        return $localize`:@@OrgToolTipManageDepot:Do you want this user to manage the stock in all depots of the bank, or only the stock of a specific depot?`;
    }
    setSelectedMembre(membre: Membre) {
        this.selectedMembre = membre;
    }

    generateTooltipAssociatedCpas() {
        return $localize`:@@OrgToolTipAssociatedCpas:Which is the Cpas the user manages?`;
    }


    protected readonly generateTooltipSuggestions = generateTooltipSuggestions;
}
