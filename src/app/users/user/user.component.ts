import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {UserEntityService} from '../services/user-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {DefaultUser, User} from '../model/user';
import {MessageService} from 'primeng/api';
import {ConfirmationService} from 'primeng/api';
import {enmLanguageLegacy, enmUserRolesAsso, enmUserRolesBankAsso} from '../../shared/enums';
import {NgForm} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {globalAuthState} from '../../auth/auth.selectors';
import {AppState} from '../../reducers';
import {MembreEntityService} from '../../membres/services/membre-entity.service';
import {Membre} from '../../membres/model/membre';
import {DataServiceError} from '@ngrx/data';
import {Observable, combineLatest} from 'rxjs';
import {Organisation} from '../../organisations/model/organisation';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
    @ViewChild('userForm') myform: NgForm;
    @Input() idUser$: Observable<string>;
    @Input() currentFilteredOrg: Organisation;
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
  constructor(
      private usersService: UserEntityService,
      private membresService: MembreEntityService,
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
      this.lienBanque = 0;
      this.idOrg = 0;
      this.idCompany = '';
      this.booIsOrganisation = false;
      this.booIsCreate = false;
  }

  ngOnInit(): void {
      if (!this.idUser$) {
          // we must come from the menu
          console.log('We initialize a new user object from the router!');
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
                    this.booIsCreate = false;
                    this.membresService.getByKey(user.lienBat)
                        .subscribe(
                            membre => {
                                if (membre != null) {
                                    this.selectedMembre = Object.assign({}, membre, {fullname: membre.nom + ' ' + membre.prenom});
                                    console.log('our users membre:', this.selectedMembre);
                                } else {
                                    console.log('There is no membre for this user!');
                                }
                            });
                } else {
                    this.user = new DefaultUser();
                    this.booIsCreate = true;
                    if (this.myform) {
                        this.myform.reset(this.user);
                    }
                    if (this.booIsOrganisation === false) { // a bank can create employees of its own or employees for its organisations
                        if (this.currentFilteredOrg != null && this.currentFilteredOrg.idDis > 0) {
                            this.idOrg = this.currentFilteredOrg.idDis;
                        } else {
                            this.idOrg = 0;
                        }
                    }
                }
            });

      this.store
          .pipe(
              select(globalAuthState),
              map((authState) => {
                  if (authState.user) {
                      this.lienBanque = authState.banque.bankId;
                      this.idCompany = authState.banque.bankShortName;
                      switch (authState.user.rights) {
                          case 'Bank':
                              this.filterMemberBase = { 'lienBanque': authState.banque.bankId};
                              this.rights = enmUserRolesBankAsso;
                              break;
                          case 'Admin_Banq':
                              this.filterMemberBase = { 'lienBanque': authState.banque.bankId};
                              this.rights = enmUserRolesBankAsso;
                              this.booCanSave = true;
                              if (this.booCalledFromTable) {
                                  this.booCanDelete = true;
                              }
                              break;
                          case 'Asso':
                          case 'Admin_Asso':
                              this.idOrg = authState.organisation.idDis;
                              this.filterMemberBase = { 'lienDis': authState.organisation.idDis};
                              this.booIsOrganisation = true;
                              this.rights = enmUserRolesAsso;
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
                  },
                      (dataserviceerror: DataServiceError) => {
                          console.log('Error deleting user', dataserviceerror.message);
                          const  errMessage = {severity: 'error', summary: 'Delete',
                              // tslint:disable-next-line:max-line-length
                              detail: $localize`:@@messageUserDeleteError:The user ${user.idUser} ${user.userName} could not be deleted: error: ${dataserviceerror.message}`,
                              life: 6000 };
                          this.messageService.add(errMessage) ;
                      });
          },
          reject: () => {
              console.log('We do nothing');
          }
      });
 }

  save(oldUser: User, userForm: User) {
    const modifiedUser = Object.assign({}, oldUser, userForm);
      modifiedUser.lienBat = this.selectedMembre.batId;
      if (!modifiedUser.hasOwnProperty('isNew')) {
          console.log('Updating User with content:', modifiedUser);
          this.usersService.update(modifiedUser)
        .subscribe(updatedUser  => {
            this.messageService.add({
                severity: 'success',
                summary: 'Update',
                detail: $localize`:@@messageUserUpdated:User  ${modifiedUser.idUser} ${modifiedUser.userName} was updated`});
            this.onUserUpdate.emit(updatedUser);
        } ,
            (dataserviceerror: DataServiceError) => {
                console.log('Error updating user', dataserviceerror.message);
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
                          modifiedUser.userName = membre.nom + ' ' + membre.prenom;
                          modifiedUser.email = membre.batmail;
                          switch (membre.langue) {
                              case 1:
                                  modifiedUser.idLanguage = 'fr';
                                  break;
                              case 2:
                                  modifiedUser.idLanguage = 'nl';
                                  break;
                              case 3:
                                  modifiedUser.idLanguage = 'en';
                                  break;
                              case 4:
                                  modifiedUser.idLanguage = 'de';
                                  break;
                              default:
                                  modifiedUser.idLanguage = '??';
                          }
                          modifiedUser.lienBanque = this.lienBanque;
                          modifiedUser.idOrg = this.idOrg;
                          modifiedUser.idCompany = this.idCompany;
                          console.log('Creating User with content:', modifiedUser);
                          this.usersService.add(modifiedUser)
                              .subscribe(() => {
                                      this.messageService.add({
                                          severity: 'success',
                                          summary: 'Creation',
                                          detail: $localize`:@@messageUserCreated:User  ${modifiedUser.idUser} ${modifiedUser.userName} has been created`
                                      });
                                      this.onUserCreate.emit(modifiedUser);
                                  },
                                  (dataserviceerror: DataServiceError) => {
                                      console.log('Error creating user', dataserviceerror.message);
                                      const  errMessage = {severity: 'error', summary: 'Create',
                                          // tslint:disable-next-line:max-line-length
                                          detail: $localize`:@@messageUserCreateError:The user ${modifiedUser.idUser} ${modifiedUser.userName} could not be created: error: ${dataserviceerror.message}`,
                                          life: 6000 };
                                      this.messageService.add(errMessage) ;
                                  }
                            );
                      } else {
                          console.log('Error creating user: no employee was selected');
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
                    console.log('We have reset the user form to its original value');
                    this.onUserQuit.emit();
                },
                reject: () => {
                    console.log('We do nothing');
                }
            });
        } else {
            console.log('Form is not dirty, closing');
            this.onUserQuit.emit();
        }
    }
    filterMembre(event ) {
        const  queryMemberParms = {...this.filterMemberBase};
        const query = event.query;
        queryMemberParms['offset'] = '0';
        queryMemberParms['rows'] = '10';
        queryMemberParms['sortField'] = 'nom';
        queryMemberParms['sortOrder'] = '1';
        queryMemberParms['nom'] = query.toLowerCase();
        this.membresService.getWithQuery(queryMemberParms)
            .subscribe(filteredMembres => {
                this.filteredMembres = filteredMembres.map((membre) =>
                    Object.assign({}, membre, {fullname: membre.nom + ' ' + membre.prenom})
                );
            });
    }
}
