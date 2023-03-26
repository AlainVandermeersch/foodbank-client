import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {BanqueEntityService} from '../services/banque-entity.service';
import {MembreEntityService} from '../../membres/services/membre-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {combineLatest, Observable} from 'rxjs';
import {Banque, DefaultBanque} from '../model/banque';
import {ConfirmationService, MessageService} from 'primeng/api';
import {NgForm} from '@angular/forms';
import {DataServiceError, QueryParams} from '@ngrx/data';
import {Membre} from '../../membres/model/membre';
import {select, Store} from '@ngrx/store';
import {globalAuthState} from '../../auth/auth.selectors';
import {AppState} from '../../reducers';
import {BanqProg} from '../model/banqprog';
import {BanqProgEntityService} from '../services/banqprog-entity.service';
import {AuditChangeEntityService} from '../../audits/services/auditChange-entity.service';


@Component({
  selector: 'app-banque',
  templateUrl: './banque.component.html',
  styleUrls: ['./banque.component.css']
})
export class BanqueComponent implements OnInit {
    @ViewChild('banqueForm') bankform: NgForm;
    @ViewChild('detailForm') detailform: NgForm;
    @ViewChild('membershipForm') membershipForm: NgForm;
    @Input() bankId$: Observable<number>;
    @Output() onBanqueCreate = new EventEmitter<Banque>();
    @Output() onBanqueUpdate = new EventEmitter<Banque>();
    @Output() onBanqueDelete = new EventEmitter<Banque>();
    @Output() onBanqueQuit = new EventEmitter<Banque>();
    userId: string;
    userName: string;
    userLanguage: string;
    booCalledFromTable: boolean;
    booCanSave: boolean;
    booCanDelete: boolean;
    booCanQuit: boolean;
    booIsCreate: boolean;
    banque: Banque;
    banqProg: BanqProg;
    selectedPresident: Membre;
    selectedVicePresident: Membre;
    selectedCEO: Membre;
    selectedSecretary: Membre;
    selectedTreasurer: Membre;
    selectedHR: Membre;
    selectedLogistics: Membre;
    selectedSecHygiene: Membre;
    selectedIT: Membre;
    selectedSupply: Membre;
    selectedPress: Membre;
    selectedAssocRel: Membre;
    selectedPubRel: Membre;
    selectedFEAD: Membre;
    selectedQuality: Membre;

    filteredMembres: Membre[];
    isCotCustomText: boolean;
    mailingText: string;
    mailingTextCurrentLanguage: string;
    mailingTextNl: string;
    mailingTextFr: string;
    mailingTextDefaultNl: string;
    mailingTextDefaultFr: string;

    baseurl: string;


  constructor(
      private banquesService: BanqueEntityService,
      private membresService: MembreEntityService,
      private banqProgService: BanqProgEntityService,
      private auditChangeEntityService: AuditChangeEntityService,
      private route: ActivatedRoute,
      private router: Router,
      private store: Store<AppState>,
      private messageService: MessageService,
      private confirmationService: ConfirmationService
  ) {
      this.baseurl = window.location.origin;
      this.booCalledFromTable = true;
      this.booCanDelete = false;
      this.booCanSave = false;
      this.booCanQuit = true;
      this.booIsCreate = false;
      this.isCotCustomText = false;
      this.mailingTextDefaultNl = '';
      this.mailingTextDefaultNl = `<Strong>DEBETNOTA<br>-----organisation.societe-----</strong><br>-----organisation.adresse-----<br>-----organisation.cp-----<br>-----organisation.localite-----<br><br>`;
      this.mailingTextDefaultNl += `Geachte mevrouw/mijnheer,<br>Hierbij vindt u het verzoek tot betaling van de -----typeMembership-----`;
      this.mailingTextDefaultNl +=  ` van uw liefdadigheidsvereniging aan onze Voedselbank. De basis bijdrage bedraagt -----cotreal-----  Euro voor -----organisation.cotMonths----- maand per minderbedeelde` ;
      this.mailingTextDefaultNl += `<br>Het gemiddeld aantal begunstigden voor het voorbije jaar voor uw vereniging bedroeg -----organisation.nPers-----`;
      this.mailingTextDefaultNl += `<br>Gelieve het bedrag van -----due----- € te willen storten op ons  rekeningnr -----bankAccount----- ten laatste tegen <b> -----dueDate----- </b> met melding <b>"LEDENBIJDRAGE -----cotYear-----"</b>.<br>`;
      this.mailingTextDefaultNl += `<br>Met dank bij voorbaat.<br><br>De Penningmeester,<br>-----bankTreas-----<br>-----bankName-----<br>Bedrijfsnummer: -----bankEntNr----- `;
      this.mailingTextDefaultNl += `Adres: -----bankAdress----- -----bankZip----- -----bankCity----- -----bankTel-----`;
      this.mailingTextDefaultNl += '<br><br><i>Nota: Factuur te verkrijgen op aanvraag</i>';
      this.mailingTextDefaultFr = '';
      this.mailingTextDefaultFr = `<Strong>NOTE DE DEBIT<br>-----organisation.societe-----</strong><br>-----organisation.adresse-----<br>-----organisation.cp-----<br>-----organisation.localite-----<br><br>`;
      this.mailingTextDefaultFr += `Ce mail vous est adressé afin de vous demander de bien vouloir règler votre -----typeMembership-----`;
      this.mailingTextDefaultFr +=  ` de votre association soit -----cotreal-----  Euro pour -----organisation.cotMonths----- mois par bénéficiaire` ;
      this.mailingTextDefaultFr += `<br>La moyenne des bénéficiaires pour l'année écoulée pour votre association était de -----organisation.nPers----- personnes`;
      this.mailingTextDefaultFr += `<br>Merci de verser le montant de  -----due----- € sur le compte -----bankAccount----- au plus tard le <b> -----dueDate----- </b> avec la mention <b>"COTISATION MEMBRES -----cotYear-----.</b><br>`;
      this.mailingTextDefaultFr += `<br>Avec nos remerciements anticipés.<br><br>Le trésorier,<br>-----bankTreas-----<br>-----bankName-----<br>N° Entreprise: -----bankEntNr----- `;
      this.mailingTextDefaultFr += `Adresse: -----bankAdress----- -----bankZip----- -----bankCity----- -----bankTel-----`;
      this.mailingTextDefaultFr += '<br><br><i>>Note: Facture sur demande</i>';
      this.mailingText = "";
      this.mailingTextNl = "";
      this.mailingTextFr = "";

    }

  ngOnInit(): void {
      // comment: this component is sometimes called from his parent Component with BankId @Input Decorator,
      // or sometimes via a router link via the Main Menu
      if (!this.bankId$) {
          // we must come from the menu
          this.booCalledFromTable = false;
          this.booCanQuit = false;
          this.booIsCreate = false;
          this.bankId$ = this.route.paramMap
            .pipe(
              map(paramMap => paramMap.get('bankId')),
              map(bankIdString => Number(bankIdString))
            );
      }

      const bank$ = combineLatest([this.bankId$, this.banquesService.entities$])
        .pipe(
          map(([bankId, banques]) => banques.find(banque => bankId === banque.bankId))
        );

      bank$.subscribe(banque => {
          if (banque) {
              this.banque = banque;
              this.booIsCreate = false;
              this.banqProgService.getByKey(banque.bankId)
                  .subscribe(
                      banqProg => {
                          if (banqProg !== null) {
                              this.banqProg = banqProg;
                              this.isCotCustomText = banqProg.cotTextCustom;
                              this.mailingTextFr = banqProg.cotTextFr;
                              this.mailingTextNl = banqProg.cotTextNl;
                              this.mailingTextCurrentLanguage = "fr"
                              this.mailingText = this.mailingTextFr;
                          }
                      });
              this.membresService.getByKey(banque.idMemberPres)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedPresident = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberVp)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedVicePresident = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberCeo)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedCEO = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberSec)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedSecretary = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberTres)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedTreasurer = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberRh)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedHR = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberLog)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedLogistics = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberSh)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedSecHygiene = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                           }
                      });
              this.membresService.getByKey(banque.idMemberIt)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedIT = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberAppro)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedSupply = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberPp)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedPress = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberAsso)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedAssocRel = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberPubrel)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedPubRel = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });
              this.membresService.getByKey(banque.idMemberFead)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedFEAD = Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                          }
                      });

              this.membresService.getByKey(banque.idMemberQual)
                  .subscribe(
                      membre => {
                          if (membre !== null) {
                              this.selectedQuality =  Object.assign({}, membre, {fullname: this.setMembreFullName(membre)});
                           }
                      });

      } else {
          this.banque = new DefaultBanque();
          if (this.bankform) {
              this.bankform.reset(this.banque);
          }
          this.booIsCreate = true;
        }
      }); // End of Subscribe
      this.store
          .pipe(
              select(globalAuthState),
              map((authState) => {
                  if (authState.user) {
                      this.userId= authState.user.idUser;
                      this.userName = authState.user.membreNom + ' ' + authState.user.membrePrenom;
                      this.userLanguage = authState.user.idLanguage;
                      switch (authState.user.rights) {
                        case 'admin':
                        case 'Admin_FBBA':
                        case 'Admin_Banq':
                           this.booCanSave = true;
                          if (this.booCalledFromTable ) {
                              this.booCanDelete = true;
                          }
                          break;
                        default:
                      }
                  }
              })
          )
          .subscribe();
}

     setMembreFullName(membre:Membre): string  {
      if (membre.bankShortName === this.banque.bankShortName) {
          return membre.nom + ' ' + membre.prenom;
      } else {
          return membre.nom + ' ' + membre.prenom + '(' + membre.bankShortName + ')';
      }
      
    }

    filterMembre(event ) {
      const  queryMemberParms: QueryParams = {};
        const query = event.query;
        queryMemberParms['offset'] = '0';
        queryMemberParms['rows'] = '10';
        queryMemberParms['sortField'] = 'nom';
        queryMemberParms['sortOrder'] = '1';
        queryMemberParms['actif'] = '1';
        queryMemberParms['lienDis'] = '0';
        if (!this.booCalledFromTable ) {
            queryMemberParms['lienBanque'] = this.banque.bankId.toString();
        }
        queryMemberParms['nom'] = query.toLowerCase();
        this.membresService.getWithQuery(queryMemberParms)
        .subscribe(filteredMembres => {
            this.filteredMembres = filteredMembres.map((membre) =>
                Object.assign({}, membre, {fullname: this.setMembreFullName(membre)})
            );
        });
    }

 save(oldBanque: Banque, banqueForm: Banque) {
      const modifiedBanque = Object.assign({}, oldBanque, banqueForm);
      modifiedBanque.idMemberPres = this.selectedPresident? this.selectedPresident.batId : 0;
      modifiedBanque.idMemberVp = this.selectedVicePresident ? this.selectedVicePresident.batId : 0;
      modifiedBanque.idMemberCeo = this.selectedCEO ? this.selectedCEO.batId: 0;
      modifiedBanque.idMemberSec = this.selectedSecretary ? this.selectedSecretary.batId: 0;
      modifiedBanque.idMemberTres = this.selectedTreasurer ? this.selectedTreasurer.batId: 0;
      modifiedBanque.idMemberRh = this.selectedHR ? this.selectedHR.batId: 0;
      modifiedBanque.idMemberLog = this.selectedLogistics ? this.selectedLogistics.batId: 0;
      modifiedBanque.idMemberSh = this.selectedSecHygiene ? this.selectedSecHygiene.batId: 0;
      modifiedBanque.idMemberIt = this.selectedIT ? this.selectedIT.batId: 0;
      modifiedBanque.idMemberAppro = this.selectedSupply?  this.selectedSupply.batId: 0;
      modifiedBanque.idMemberPp = this.selectedPress ? this.selectedPress.batId: 0;
      modifiedBanque.idMemberAsso = this.selectedAssocRel? this.selectedAssocRel.batId: 0;
      modifiedBanque.idMemberPubrel = this.selectedPubRel ? this.selectedPubRel.batId : 0;
      modifiedBanque.idMemberFead = this.selectedFEAD? this.selectedFEAD.batId: 0;
      modifiedBanque.idMemberQual = this.selectedQuality ? this.selectedQuality.batId: 0;
     if (modifiedBanque.hasOwnProperty('bankId')) {
         this.banquesService.update(modifiedBanque)
             .subscribe(() => {
                 this.messageService.add({
                     severity: 'success',
                     summary: 'Update',
                     detail: $localize`:@@messageBankUpdated:Bank ${modifiedBanque.bankShortName} ${modifiedBanque.bankName}  was updated`
                 });
                 this.onBanqueUpdate.emit();
                 this.auditChangeEntityService.logDbChange(this.userId,this.userName,modifiedBanque.bankId,0,'Bank',
                     modifiedBanque.bankShortName , 'Update' );
             },
                 (dataserviceerrorFn: () => DataServiceError) => { 
                 const dataserviceerror = dataserviceerrorFn();
                 if (!dataserviceerror.message) { dataserviceerror.message = dataserviceerror.error().message }
                    const  errMessage = {severity: 'error', summary: 'Update',
                         // tslint:disable-next-line:max-line-length
                         detail: $localize`:@@messageBankUpdateError:The bank ${modifiedBanque.bankShortName} ${modifiedBanque.bankName} could not be updated: error: ${dataserviceerror.message}`,
                         life: 6000 };
                    this.messageService.add(errMessage) ;
                 });
     } else {
          this.banquesService.add(modifiedBanque)
             .subscribe((newBanque) => {
                 this.messageService.add({
                     severity: 'success',
                     summary: 'Creation',
                     detail: $localize`:@@messageBankCreated:Bank ${newBanque.bankName} was created`
                 });
                 this.onBanqueCreate.emit(newBanque);
                     this.auditChangeEntityService.logDbChange(this.userId,this.userName,newBanque.bankId,0,'Bank',
                         newBanque.bankShortName, 'Create' );
             },
                 (dataserviceerrorFn: () => DataServiceError) => { 
                    const dataserviceerror = dataserviceerrorFn();
                    if (!dataserviceerror.message) { dataserviceerror.message = dataserviceerror.error().message }
                      const  errMessage = {severity: 'error', summary: 'Create',
                         // tslint:disable-next-line:max-line-length
                         detail: $localize`:@@messageBankCreateError:The bank ${modifiedBanque.bankShortName} ${modifiedBanque.bankName} could not be created: error: ${dataserviceerror.message}`,
                         life: 6000 };
                     this.messageService.add(errMessage) ;
                 });
     }
  }
    delete(event: Event, banque: Banque) {
        this.confirmationService.confirm({
            target: event.target,
            message: 'Confirm Deletion?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const  myMessage = {
                    severity: 'success',
                    summary: 'Delete',
                    detail: $localize`:@@messageBankDeleted:Bank ${banque.bankName} was deleted`
                };
                this.banquesService.delete(banque)
                    .subscribe( () => {
                        this.messageService.add(myMessage);
                        this.onBanqueDelete.emit();
                            this.auditChangeEntityService.logDbChange(this.userId,this.userName,banque.bankId,0,'Bank',
                                banque.bankShortName , 'Delete' );
                    },
                        (dataserviceerrorFn: () => DataServiceError) => { 
                            const dataserviceerror = dataserviceerrorFn();
                            if (!dataserviceerror.message) { dataserviceerror.message = dataserviceerror.error().message }
                                const  errMessage = {severity: 'error', summary: 'Delete',
                                // tslint:disable-next-line:max-line-length
                                detail: $localize`:@@messageBankDeleteError:The bank ${banque.bankId} ${banque.bankShortName} ${banque.bankName} could not be deleted: error: ${dataserviceerror.message}`,
                                life: 6000 };
                            this.messageService.add(errMessage) ;
                        }
                        );
            }
        });
    }
    quit(event: Event, oldBanque: Banque, banqueForm: NgForm, formDirty: boolean) {
        if (formDirty) {
            this.confirmationService.confirm({
                target: event.target,
                message: $localize`:@@messageChangesMayBeLost:Your changes may be lost. Are you sure that you want to proceed?`,
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    banqueForm.reset( oldBanque); // reset in-memory object for next open
                    this.onBanqueQuit.emit();
                }
            });
        } else {
            this.onBanqueQuit.emit();
        }
    }
    saveDetails(oldBanqProg: BanqProg, banqProgForm: BanqProg) {
        const modifiedBanqProg = Object.assign({}, oldBanqProg, banqProgForm);
        modifiedBanqProg.cotTextCustom = this.isCotCustomText;
        modifiedBanqProg.cotTextNl = this.mailingTextNl;
        modifiedBanqProg.cotTextFr = this.mailingTextFr;
        this.banqProgService.update(modifiedBanqProg)
            .subscribe(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Update',
                        detail: $localize`:@@messageBankDetailsUpdated:Bank  ${this.banque.bankShortName} ${this.banque.bankName}  details were updated`
                    });
                    this.onBanqueUpdate.emit();
                },
                (dataserviceerrorFn: () => DataServiceError) => { 
                    const dataserviceerror = dataserviceerrorFn();
                    if (!dataserviceerror.message) { dataserviceerror.message = dataserviceerror.error().message }
                    const  errMessage = {severity: 'error', summary: 'Update',
                        // tslint:disable-next-line:max-line-length
                        detail: $localize`:@@messageBankDetailsUpdateError:The bank  ${this.banque.bankShortName} ${this.banque.bankName} details could not be updated: error: ${dataserviceerror.message}`,
                        life: 6000 };
                    this.messageService.add(errMessage) ;
                });
    }

    switchCotMailLanguage($event: any) {
        console.log('switchCotMailLanguage',$event);
        if ($event.value === 'fr') {
            this.mailingTextNl = this.mailingText;
            this.mailingText = this.mailingTextFr;
        }
        else {
            this.mailingTextFr = this.mailingText;
            this.mailingText = this.mailingTextNl;
        }
    }

    loadDefaultText() {
        if (this.mailingTextCurrentLanguage === 'fr') {
            this.mailingTextFr = this.mailingTextDefaultFr;
            this.mailingText = this.mailingTextFr;
        }
        else {
            this.mailingTextNl = this.mailingTextDefaultNl;
            this.mailingText = this.mailingTextNl;
        }
    }
}

