import {Component, OnInit, ViewChild} from '@angular/core';
import {Organisation} from '../model/organisation';
import {OrganisationEntityService} from '../services/organisation-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../reducers';
import {enmYn} from '../../shared/enums';
import { map} from 'rxjs/operators';
import {globalAuthState} from '../../auth/auth.selectors';
import {ConfirmationService, MessageService} from 'primeng/api';
import {OrgSummary} from '../model/orgsummary';
import {OrgSummaryEntityService} from '../services/orgsummary-entity.service';
import {DefaultMailing, Mailing} from '../../mailings/model/mailing';
import {DataServiceError} from '@ngrx/data';
import {MailingEntityService} from '../../mailings/services/mailing-entity.service';
import {FileUploadService} from '../../mailings/services/file-upload.service';
import {AuthService} from '../../auth/auth.service';
import {NgForm} from '@angular/forms';
import {MembreEntityService} from '../../membres/services/membre-entity.service';
import {BanqProgEntityService} from '../../banques/services/banqprog-entity.service';

@Component({
  selector: 'app-org-membership-mailing',
  templateUrl: './org-membership-mailing.component.html',
  styleUrls: ['./org-membership-mailing.component.css']
})
export class OrgMembershipMailingComponent implements OnInit {
    @ViewChild('orgMembershipForm') myform: NgForm;
  organisation: Organisation = null;
  orgSummaries: OrgSummary[];
  orgSummaryIndex: number;
  totalOrgSummaries: number;
  YNOptions:  any[];
  loading: boolean;
  filterBase: any;
  bankName: string;
  bankMail: string;
  bankAccount: string;
  bankTreasurer: string;
  bankEntNr: string;
    bankAdress: string;
    bankZip: string;
    bankCity: string;
   bankTel: string;
  bankCotAmount: number;
  bankCotExtraAmount: number;
  lienBanque: number;
  cotYear: number;
  mailing: Mailing;
    mailingSubject: string;
    mailingText: string;
    // variables for file upload
    attachmentFileNames: string[];
    isYearlyMail: boolean;
    sendMailToOrgContact: boolean;
    sendMailToOrgTreasurer: boolean;
    typeMembership: string;
    orgsummary: OrgSummary;
  constructor(private organisationService: OrganisationEntityService,
              private orgsummaryService: OrgSummaryEntityService,
              private membreService: MembreEntityService,
              private banqProgService: BanqProgEntityService,
              private mailingService: MailingEntityService,
              private uploadService: FileUploadService,
              private messageService: MessageService,
              private confirmationService: ConfirmationService,
              private authService: AuthService,
              private router: Router,
              private route: ActivatedRoute,
              private store: Store<AppState>
  ) {
    this.lienBanque = 0;
    this.bankName = '';
    this.bankMail = '';
    this.bankAccount = '';
      this.bankTreasurer = '';
      this.bankEntNr = '';
      this.bankAdress = '';
      this.bankZip = '';
      this.bankCity = '';
      this.bankTel = '';
    this.bankCotAmount = 0;
    this.bankCotExtraAmount = 0;
    this.YNOptions = enmYn;
    this.totalOrgSummaries = 0;
    this.orgSummaryIndex = 0;
      this.mailingText = '';
      this.mailing = new DefaultMailing();
      this.attachmentFileNames = [];
      this.isYearlyMail = true;
      this.sendMailToOrgContact = true;
      this.sendMailToOrgTreasurer = true;
      this.cotYear = new Date().getFullYear() + 1;
      this.mailingSubject = '';
  }

  ngOnInit() {
    this.store
        .pipe(
            select(globalAuthState),
            map((authState) => {
              this.lienBanque = authState.banque.bankId;
              this.bankName = authState.banque.bankName;
              this.bankMail = authState.banque.bankMail;
              this.bankAccount = authState.banque.bank;
              this.bankEntNr = authState.banque.nrEntr;
              this.bankAdress = authState.banque.adresse;
                this.bankZip = authState.banque.cp;
                this.bankCity = authState.banque.localite;
                this.bankTel = authState.banque.bankTel;
              this.bankTreasurer = authState.banque.idMemberTres.toString();
              this.orgsummaryService.getWithQuery({'lienBanque': authState.banque.bankId.toString(), 'actif': '1', 'isDepot': '0', 'agreed': '1'})
                  .subscribe(loadedOrgSummaries => {
                    console.log('Loaded orgsummaries: ' + loadedOrgSummaries.length);
                    this.totalOrgSummaries = loadedOrgSummaries.length;
                    this.orgSummaries  = loadedOrgSummaries;
                    this.orgsummary = this.orgSummaries[0];
                    this.getOrganisation(this.orgsummary.idDis);

                  });
                this.membreService.getByKey(authState.banque.idMemberTres)
                    .subscribe(
                        membre => {
                            if (membre !== null) {
                                this.bankTreasurer = membre.prenom + ' ' + membre.nom;
                            }
                        });
                this.banqProgService.getByKey(authState.banque.bankId)
                    .subscribe(
                        banqProg => {
                            if (banqProg !== null) {
                                this.bankCotAmount = +banqProg.cotAmount; // unary + operator converts to number
                                this.bankCotExtraAmount = +banqProg.cotAmountSup;
                            }
                        });
            })
        )
        .subscribe();

  }
  getOrganisation(idDis: number) {
      this.organisationService.getByKey(idDis)
        .subscribe(organisation => {
            this.organisation = organisation;
            let cotreal = 100 * this.bankCotAmount * organisation.cotMonths / 12 ;
            const due = Math.round(cotreal * this.organisation.nPers) / 100;
            cotreal = Math.round(cotreal) / 100 ;
            if (organisation.langue === 2 ) {
                this.mailingSubject = `Bijdrage voor ${this.cotYear} te betalen aan de Voedselbank` ;
                this.typeMembership = 'jaarlijkse ledenbijdrage';
                this.mailingText = `<Strong>DEBETNOTA<br>${this.organisation.societe}</strong><br>${this.organisation.adresse}<br>${this.organisation.cp}<br>${this.organisation.localite}<br><br>`;
                this.mailingText += `Geachte mevrouw/mijnheer,<br>Hierbij vindt u het verzoek tot betaling van de ${this.typeMembership}`;
                this.mailingText +=  ` van uw liefdadigheidsvereniging aan onze Voedselbank. De basis bijdrage bedraagt ${cotreal}  Euro voor ${organisation.cotMonths} maand per minderbedeelde` ;
                this.mailingText += `<br>Het gemiddeld aantal begunstigden voor het voorbije jaar voor uw vereniging bedroeg ${this.organisation.nPers}`;
                this.mailingText += `<br>Gelieve het bedrag van ${due} € te willen storten op ons  rekeningnr ${this.bankAccount} ten laatste tegen <b> 31 maart 2022 </b> met melding <b>"LEDENBIJDRAGE ${this.cotYear}"</b>.<br>`;
                this.mailingText += `<br>Met dank bij voorbaat.<br><br>De Penningmeester,<br>${this.bankTreasurer}<br>${this.bankName}<br>Bedrijfsnummer: ${this.bankEntNr} `;
                this.mailingText += `Adres: ${this.bankAdress} ${this.bankZip} ${this.bankCity} ${this.bankTel}`;
                this.mailingText += '<br><br><i>Nota: Factuur te verkrijgen op aanvraag</i>';
            } else {
                this.mailingSubject = `Cotisation ${this.cotYear} payable à la Banque Alimentaire - Note de débit` ;
                this.typeMembership = 'cotisation annuelle';
                this.mailingText = `<Strong>NOTE DE DEBIT<br>${this.organisation.societe}</strong><br>${this.organisation.adresse}<br>${this.organisation.cp}<br>${this.organisation.localite}<br><br>`;
                this.mailingText += `Ce mail vous est adressé afin de vous demander de bien vouloir règler votre ${this.typeMembership}`;
                this.mailingText +=  ` de votre association soit ${cotreal}  Euro pour ${organisation.cotMonths} mois par bénéficiaire` ;
                this.mailingText += `<br>La moyenne des bénéficiaires pour l'année écoulée pour votre association était de ${this.organisation.nPers} personnes`;
                this.mailingText += `<br>Merci de verser le montant de  ${due} € sur le compte ${this.bankAccount} au plus tard le <b> 31 mars 2022 </b> avec la mention <b>"COTISATION MEMBRES ${this.cotYear}.</b><br>`;
                this.mailingText += `<br>Avec nos remerciements anticipés.<br><br>Le trésorier,<br>${this.bankTreasurer}<br>${this.bankName}<br>N° Entreprise: ${this.bankEntNr} `;
                this.mailingText += `Adresse: ${this.bankAdress} ${this.bankZip} ${this.bankCity} ${this.bankTel}`;
                this.mailingText += '<br><br><i>>Note: Facture sur demande</i>';
            }
    });
  }
  getNextOrganisation() {
      // console.log('entering getNextOrganisation with orgsummary', this.orgsummary);
      this.orgSummaryIndex = this.orgSummaries.findIndex(item => item.idDis === this.organisation.idDis);
      // console.log('Old Summary index is:', this.orgSummaryIndex);
      if (this.orgSummaryIndex < (this.totalOrgSummaries - 1)) {
          this.orgSummaryIndex++;
          this.orgsummary = this.orgSummaries[this.orgSummaryIndex];
          // console.log('New index and Summary is:', this.orgSummaryIndex, this.orgsummary);
          this.getOrganisation(this.orgsummary.idDis);
      }
  }
   getPreviousOrganisation() {
       this.orgSummaryIndex = this.orgSummaries.findIndex(item => item.idDis === this.organisation.idDis);
        if (this.orgSummaryIndex > 0) {
            this.orgSummaryIndex--;
            this.orgsummary = this.orgSummaries[this.orgSummaryIndex];
            this.getOrganisation(this.orgsummary.idDis);
        }
    }
    selectOrganisation(idDis: number) {
        this.orgSummaryIndex = this.orgSummaries.findIndex(item => item.idDis === idDis);
        this.orgsummary = this.orgSummaries[this.orgSummaryIndex];
        this.getOrganisation(idDis);
    }

  getTitle(): string {
    return $localize`:@@BankOrgsTitleMembershipMailing:Membership Mailing to Organisation ${this.organisation.idDis} ${this.organisation.societe} `;
  }
  getSubTitle():  string {
    return  $localize`:@@BankOrgsSubTitleMembershipMailing:Membership Fee based on bank regular fee ${this.bankCotAmount} and extra fee ${this.bankCotExtraAmount}`;
  }

    sendmail(event: Event) {
        const mailListArray = [];
        if (this.sendMailToOrgContact) {
            mailListArray.push( `${this.organisation.nom} ${this.organisation.prenom}<${this.organisation.email}>  ` );
        }
        if (this.sendMailToOrgTreasurer) {
            mailListArray.push( `${this.organisation.nomTres} ${this.organisation.prenomTres}<${this.organisation.emailTres}>  ` );
        }
        console.log('mailListArray', mailListArray);

        if (mailListArray.length === 0 || (mailListArray.length === 1 && mailListArray[0].trim() === '' ) ) {
            const errMessage = {
                severity: 'error', summary: 'Send',
                detail: $localize`:@@messageSendNoListError:You have no recipients. Please select the recipients for your email.`,
                life: 6000
            };
            this.messageService.add(errMessage);
            return;
        }
        this.confirmationService.confirm({
            target: event.target,
            message: $localize`:@@confirmSendMessage:Do you want to send this message?`,
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.mailing.subject = this.mailingSubject;
                this.mailing.from = this.bankMail;
                this.mailing.to = mailListArray.join(',');
                // this.mailing.bodyText = 'Hello World';
                this.mailing.bodyText = this.mailingText;
                this.mailing.attachmentFileNames = this.attachmentFileNames.toString();
                this.mailingService.add(this.mailing)
                    .subscribe((myMail: Mailing) => {
                            console.log('Returned mailing', myMail);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Creation',
                                detail: $localize`:@@messageSent:Message has been sent`
                            });
                        },
                        (dataserviceerror: DataServiceError) => {
                            console.log('Error Sending Message', dataserviceerror);
                            const errMessage = {
                                severity: 'error', summary: 'Send',
                                // tslint:disable-next-line:max-line-length
                                detail: $localize`:@@messageSendError:The message could not be sent: error: ${dataserviceerror.message}`,
                                life: 6000
                            };
                            this.messageService.add(errMessage);
                        }
                    );
            },
            reject: () => {
                console.log('We do nothing');
            }
        });
    }
    storeMailAttachment(event: any) {
        // console.log('Entering storeMailAttachment', event );
        // console.log('Current Files Selection', this.attachmentFileNames);
        const file: File | null = event.files[0];

        if (file) {
            this.uploadService.upload(file, this.authService.accessToken).subscribe(
                (response: any) => {
                    console.log(response);
                    this.attachmentFileNames = this.attachmentFileNames.filter(item => item !== file.name);
                    this.attachmentFileNames.push(file.name);
                    this.messageService.add({
                        severity: 'success',
                        summary: $localize`:@@fileUploadSuccess:Upload Mail Attachment Succeeded`,
                        detail: $localize`:@@fileUploadSuccessDetail:File ${file.name} was uploaded`,
                        life: 6000
                    });
                },
                (err: any) => {
                    console.log(err);
                    let errorMsg = '';
                    if (err.error && err.error.message) {
                        errorMsg = err.error.message;
                    }
                    this.messageService.add({
                        severity: 'error',
                        summary: $localize`:@@fileUploadError:Upload Mail Attachment Failed`,
                        detail: $localize`:@@fileUploadErrorDetail:Could not upload file ${file.name}. ${errorMsg} `,
                        life: 6000
                    });
                });

        }
    }


}
