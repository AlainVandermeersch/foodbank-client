import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CpasEntityService} from '../services/cpas-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {combineLatest, Observable} from 'rxjs';
import {Cpas, DefaultCpas} from '../model/cpas';
import {ConfirmationService, MessageService} from 'primeng/api';
import {enmGender, enmLanguage} from '../../shared/enums';
import {NgForm} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {globalAuthState} from '../../auth/auth.selectors';
import {AppState} from '../../reducers';

@Component({
  selector: 'app-cpas',
  templateUrl: './cpas.component.html',
  styleUrls: ['./cpas.component.css']
})
export class CpasComponent implements OnInit {
    @Input() cpasId$: Observable<number>;
    @Output() onCpasUpdate = new EventEmitter<Cpas>();
    @Output() onCpasCreate = new EventEmitter<Cpas>();
    @Output() onCpasDelete = new EventEmitter<Cpas>();
    @Output() onCpasQuit = new EventEmitter<Cpas>();
    cpas: Cpas;
    lienBanque: number;
    booCalledFromTable: boolean;
    booCanSave: boolean;
    booCanDelete: boolean;
    booCanQuit: boolean;
    genders: any[];
    languages: any[];
  constructor(
      private cpassService: CpasEntityService,
      private route: ActivatedRoute,
      private router: Router,
      private store: Store<AppState>,
      private messageService: MessageService,
      private confirmationService: ConfirmationService
  ) {
      this.lienBanque = 0;
      this.genders = enmGender;
      this.languages =  enmLanguage;
      this.booCalledFromTable = true;
      this.booCanDelete = false;
      this.booCanSave = false;
      this.booCanQuit = true;
  }

  ngOnInit(): void {
      if (!this.cpasId$) {
          // we must come from the menu
          this.booCalledFromTable = false;
          this.booCanQuit = false;
          this.cpasId$ = this.route.paramMap
              .pipe(
                  map(paramMap => paramMap.get('cpasId')),
                  map(cpasIdString => Number(cpasIdString))
              );
      }
      const cpas$ = combineLatest([this.cpasId$, this.cpassService.entities$])
          .pipe(
              map(([cpasId, cpass]) => cpass.find(cpas => cpas['cpasId'] === cpasId))
          );

      cpas$.subscribe(
                  cpas => {
                      if (cpas) {
                          this.cpas = cpas; // existing cpas
                      }  else {
                          this.cpas = new DefaultCpas();
                          this.cpas.lbanque = this.lienBanque;
                      }
                  });
      this.store
          .pipe(
              select(globalAuthState),
              map((authState) => {
                  if (authState.user) {
                      switch (authState.user.rights) {
                          case 'admin':
                                this.booCanSave = true;
                              if (this.booCalledFromTable ) {
                                  this.booCanDelete = true;
                              }
                              break;
                          case 'Admin_Banq':
                              this.lienBanque = authState.banque.bankId;
                              this.booCanSave = true;
                              if (this.booCalledFromTable ) {
                                  this.booCanDelete = true;
                              }
                              break;
                              case 'Bank':
                                  this.lienBanque = authState.banque.bankId;
                                  break;
                          default:
                      }
                  }
              })
          )
          .subscribe();
  }

    delete(event: Event, cpas: Cpas) {
        this.confirmationService.confirm({
            target: event.target,
            message: 'Confirm Deletion?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const  myMessage = {severity: 'success', summary: 'Delete', detail: `Cpas ${cpas.cpasName} was deleted`};
                this.cpassService.delete(cpas)
                    .subscribe( () => {
                        this.messageService.add(myMessage);
                        this.onCpasDelete.emit(cpas);
                    });
            } 
        });
    }

  save(oldCpas: Cpas, cpasForm: Cpas) {
    const modifiedCpas = Object.assign({}, oldCpas, cpasForm);
     if (modifiedCpas.hasOwnProperty('cpasId')) {
          this.cpassService.update(modifiedCpas)
              .subscribe(() => {
                  this.messageService.add({
                      severity: 'success',
                      summary: 'Update',
                      detail: `Cpas/Ocmw ${modifiedCpas.cpasName} was updated`
                  });
                  this.onCpasUpdate.emit(modifiedCpas);
              });
      } else {
          this.cpassService.add(modifiedCpas)
              .subscribe((newCpas) => {
                  this.messageService.add({
                      severity: 'success',
                      summary: 'Creation',
                      detail: `Cpas/Ocmw ${newCpas.cpasName} was created`
                  });
                  this.onCpasCreate.emit(newCpas);
              });
      }
  }
    quit(event: Event, oldCpas: Cpas, cpasForm: NgForm, formDirty: boolean) {
        if (formDirty) {
            this.confirmationService.confirm({
                target: event.target,
                message: $localize`:@@messageChangesMayBeLost:Your changes may be lost. Are you sure that you want to proceed?`,
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    cpasForm.reset(oldCpas); // reset in-memory object for next open
                    this.onCpasQuit.emit();
                }
            });
        } else {
            console.log('Form is not dirty, closing');
            this.onCpasQuit.emit();
        }
    }
}

