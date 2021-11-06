import { Component, OnInit } from '@angular/core';
import {filter, mergeMap} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs';
import {User} from './model/user';
import {UserEntityService} from './services/user-entity.service';
import {Router} from '@angular/router';
import {globalAuthState, isLoggedIn} from '../auth/auth.selectors';
import {select, Store} from '@ngrx/store';
import {AppState} from '../reducers';
import {LazyLoadEvent} from 'primeng/api';
import {enmUserRolesAsso, enmUserRolesBankAsso, enmLanguage } from '../shared/enums';
import {QueryParams} from '@ngrx/data';
import {OrgSummaryEntityService} from '../organisations/services/orgsummary-entity.service';


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})

export class UsersComponent implements OnInit {
  loadPageSubject$ = new BehaviorSubject(null);
  selectedIdUser$ = new BehaviorSubject(null);
  users: User[];
  cols: any[];
  totalRecords: number;
  loading: boolean;
  filterBase: any;
  booShowArchived: boolean;
  displayDialog: boolean;
  booCanCreate: boolean;
  rightOptions: any[];
  languageOptions: any[];
  filteredOrganisation: any;
  filteredOrganisations: any[];
  filteredOrganisationsPrepend: any[];
  bankid: number;
  bankName: string;
  first: number;
  booShowOrganisations: boolean;
    lienDepot: number;
    depotName: string;
  constructor(private userService: UserEntityService,
              private orgsummaryService: OrgSummaryEntityService,
              private router: Router,
              private store: Store<AppState>
  ) {
      this.booCanCreate = false;
      this.booShowArchived = false;
      this.rightOptions = enmUserRolesBankAsso;
      this.languageOptions = enmLanguage;
      this.bankid = 0;
      this.bankName = '';
      this.lienDepot = 0;
      this.depotName = '';
      this.first = 0;
      this.booShowOrganisations = false;
  }

  ngOnInit() {
      this.reload();

      this.loadPageSubject$
        .pipe(
          filter(queryParams => !!queryParams),
          mergeMap(queryParams => this.userService.getWithQuery(queryParams))
          )
        .subscribe(loadedUsers => {
          console.log('Loaded users from nextpage: ' + loadedUsers.length);
          if (loadedUsers.length > 0) {
               this.totalRecords = loadedUsers[0].totalRecords;
           }  else {
              this.totalRecords = 0;
          }
          this.users  = loadedUsers;
          this.loading = false;
          this.userService.setLoaded(true);
        });
  }

  reload() {
      this.loading = true;
      this.totalRecords = 0;

      this.store
        .pipe(
            select(globalAuthState),
            filter(authState => authState.isLoggedIn)
        ).subscribe((authState) => {
            console.log('Entering Users component with authState:', authState);
            if (authState.banque) {
                this.bankid = authState.banque.bankId;
                this.bankName = authState.banque.bankName;
                switch (authState.user.rights) {
                    case 'Bank':
                    case 'Admin_Banq':
                        this.booShowOrganisations = true;
                        this.filterBase = {'lienBanque': authState.banque.bankId};
                        this.rightOptions = enmUserRolesBankAsso;
                        if (authState.user.rights === 'Admin_Banq') {
                            this.booCanCreate = true;
                        }
                        this.filteredOrganisationsPrepend = [
                            {idDis: 0, fullname: $localize`:@@bank:Bank` },
                            {idDis: null, fullname: $localize`:@@organisations:Organisations` },
                        ];
                        this.filteredOrganisation = this.filteredOrganisationsPrepend[0];
                        break;
                    case 'Asso':
                    case 'Admin_Asso':
                        if (authState.organisation && authState.organisation.depyN === true) {
                            this.booShowOrganisations = true;
                            this.lienDepot = authState.organisation.idDis;
                            this.depotName = authState.organisation.societe;
                            this.filteredOrganisationsPrepend = [
                                {idDis: this.lienDepot, fullname: 'Depot' },
                                {idDis: null, fullname: $localize`:@@organisations:Organisations` },
                            ];
                            this.filteredOrganisation = this.filteredOrganisationsPrepend[0];
                        } else {
                            this.filterBase = {'idOrg': authState.organisation.idDis};
                        }
                        this.rightOptions = enmUserRolesAsso;
                        if (authState.user.rights === 'Admin_Asso') {
                            this.booCanCreate = true;
                        }
                        break;
                    default:
                        console.log('Entering Users component with unsupported user rights, see complete authstate:', authState);
                }
            }
             console.log('Users FilterBase is: ', this.filterBase);
        });
  }
  handleSelect(user) {
    console.log( 'User was selected', user);
    this.displayDialog = true;
      this.selectedIdUser$.next(user.idUser);
  }
    showDialogToAdd() {
        this.selectedIdUser$.next('new');
        this.displayDialog = true;
    }
  handleUserQuit() {
    this.displayDialog = false;
  }

  handleUserUpdate(updatedUser) {
    const index = this.users.findIndex(user => user.idUser === updatedUser.idUser);
    this.users[index] = updatedUser;
    const latestQueryParams = this.loadPageSubject$.getValue();
    this.loadPageSubject$.next(latestQueryParams);
    this.displayDialog = false;
  }
    handleUserCreate(createdUser: User) {
        this.users.push({...createdUser});
        const latestQueryParams = this.loadPageSubject$.getValue();
        this.loadPageSubject$.next(latestQueryParams);
        this.displayDialog = false;
    }

  handleUserDeleted(deletedUser) {
    const index = this.users.findIndex(user => user.idUser === deletedUser.idUser);
    this.users.splice(index, 1);
    const latestQueryParams = this.loadPageSubject$.getValue();
    this.loadPageSubject$.next(latestQueryParams);
    this.displayDialog = false;
  }

 nextPage(event: LazyLoadEvent) {
      this.store
        .pipe(
            select(isLoggedIn),
            filter(isLoggedIn => isLoggedIn))
        .subscribe(_ => {
            console.log('Lazy Loaded Event', event, 'FilterBase:', this.filterBase);
            this.loading = true;
            const queryParms = {...this.filterBase};
            queryParms['offset'] = event.first.toString();
            queryParms['rows'] = event.rows.toString();
            queryParms['sortOrder'] = event.sortOrder.toString();
            if (event.sortField) {
                queryParms['sortField'] = event.sortField.toString();
            } else {
                queryParms['sortField'] =  'idUser';
            }
            if (this.booShowOrganisations && this.filteredOrganisation && this.filteredOrganisation.idDis != null) {
                queryParms['idOrg'] = this.filteredOrganisation.idDis;
            } else {
                    if ( this.lienDepot !== 0) {
                        queryParms['lienDepot'] = this.lienDepot;
                    }
            }
            if (this.booShowArchived ) {
                queryParms['actif'] = '0';
            }  else {
                queryParms['actif'] = '1';
            }
            if (event.filters) {
                if (event.filters.idUser && event.filters.idUser.value) {
                    queryParms['idUser'] =  event.filters.idUser.value;
                }
                if (event.filters.membreNom && event.filters.membreNom.value) {
                    queryParms['membreNom'] = event.filters.membreNom.value;
                }
                if (event.filters.membreLangue && event.filters.membreLangue.value) {
                        queryParms['membreLangue'] = event.filters.membreLangue.value;
                }
                if (event.filters.membreEmail && event.filters.membreEmail.value) {
                        queryParms['membreEmail'] = event.filters.membreEmail.value;
                }
                if (event.filters.rights && event.filters.rights.value) {
                        queryParms['rights'] = event.filters.rights.value;
                }
            }

            this.loadPageSubject$.next(queryParms);
        })
     ;
  }

    filterOrganisation(event ) {
        const  queryOrganisationParms: QueryParams = {};
        queryOrganisationParms['lienBanque'] = this.bankid.toString();
        if (this.lienDepot === 0) {
            queryOrganisationParms['lienBanque'] = this.bankid.toString();
        }  else {
            queryOrganisationParms['lienDepot'] = this.lienDepot.toString();
        }
        this.orgsummaryService.getWithQuery(queryOrganisationParms)
            .subscribe(filteredOrganisations => {
                this.filteredOrganisations = this.filteredOrganisationsPrepend.concat(filteredOrganisations.map((organisation) =>
                    Object.assign({}, organisation, {fullname: organisation.idDis + ' ' + organisation.societe})
                ));
            });
    }
    filterOrganisationUsers(idDis: number) {
        this.first = 0;
        const latestQueryParams = {...this.loadPageSubject$.getValue()};
        latestQueryParams['offset'] = '0';
        console.log('Latest Query Parms and new IdOrg', latestQueryParams, idDis);
        // when we switch from active to archived list and vice versa , we need to restart from first page
        if (idDis != null) {
            if (latestQueryParams.hasOwnProperty('lienDepot')) {
                delete latestQueryParams['lienDepot'];
            }
            latestQueryParams['idOrg'] = idDis;
        } else {
            if (latestQueryParams.hasOwnProperty('idOrg')) {
                delete latestQueryParams['idOrg'];
            }
            if ( this.lienDepot !== 0) {
                latestQueryParams['lienDepot'] = this.lienDepot;
            }
        }
        this.loadPageSubject$.next(latestQueryParams);
    }

    labelLanguage(membreLangue: number) {
            switch (membreLangue) {
                case 1:
                    return 'Fr';
                case 2:
                    return 'Nl';
                case 3:
                    return 'En';
                default:
                    return '?';
            }


        }

    labelRights(rights: string) {
        switch (rights.toLowerCase()) {
            case 'admin_banq':
                return $localize`:@@RoleBankAdmin:Bank admin`;
            case 'bank':
                return $localize`:@@RoleBankUser:Bank User`;
            case 'admin_asso':
                return  $localize`:@@RoleOrgAdmin:Org Admin`;
            case 'asso':
                return $localize`:@@RoleOrgUser:Org User`;
            case 'admin':
                return $localize`:@@RoleAdmin:Global admin`;
            default:
                return rights;
        }
    }
    changeArchiveFilter($event) {
        console.log('Archive is now:', $event);
        this.booShowArchived = $event.checked;
        this.first = 0;
        const latestQueryParams = {...this.loadPageSubject$.getValue()};
        console.log('Latest Query Parms', latestQueryParams);
        // when we switch from active to archived list and vice versa , we need to restart from first page
        latestQueryParams['offset'] = '0';
        if (this.booShowArchived ) {
            latestQueryParams['actif'] = '0';
        } else {
            latestQueryParams['actif'] = '1';
        }
        this.loadPageSubject$.next(latestQueryParams);
    }
    getTitle(): string {
        if ( this.depotName) {
            if (this.booShowArchived) {
                return $localize`:@@DepotUsersTitleArchive:Archived Users of depot ${this.depotName} `;
            } else {
                return $localize`:@@DepotUsersTitleActive:Active Users of depot ${this.depotName} `;
            }
        } else {
            if (this.booShowArchived) {
                return $localize`:@@BankUsersTitleArchive:Archived Users of bank ${this.bankName} `;
            } else {
                return $localize`:@@BankUsersTitleActive:Active Users of bank ${this.bankName} `;
            }
        }
    }
}
