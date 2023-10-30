import {Component, OnInit, ViewChild} from '@angular/core';
import {Organisation} from '../model/organisation';
import {OrganisationEntityService} from '../services/organisation-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../reducers';
import {enmYn} from '../../shared/enums';
import {map} from 'rxjs/operators';
import {globalAuthState} from '../../auth/auth.selectors';
import {ConfirmationService, MessageService} from 'primeng/api';
import {OrgSummary} from '../model/orgsummary';
import {OrgSummaryEntityService} from '../services/orgsummary-entity.service';
import {DefaultMailing, Mailing} from '../../mailings/model/mailing';
import {DataServiceError, QueryParams} from '@ngrx/data';
import {MailingEntityService} from '../../mailings/services/mailing-entity.service';
import {FileUploadService} from '../../mailings/services/file-upload.service';
import {AuthService} from '../../auth/auth.service';
import {NgForm} from '@angular/forms';
import {MembreEntityService} from '../../membres/services/membre-entity.service';
import {BanqProgEntityService} from '../../banques/services/banqprog-entity.service';
import {FileUpload} from 'primeng/fileupload';
import {getMemberShipMailingTextDefaultFr, getMemberShipMailingTextDefaultNl} from '../../shared/functions';

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
  ccAdress: string;
  bankEntNr: string;
    bankAdress: string;
    bankZip: string;
    bankCity: string;
   bankTel: string;
    bankTreas: string;
  bankCotAmount: number;
  bankCotExtraAmount: number;
  lienBanque: number;
  cotYear: number;
    cotYears: any[];
  mailing: Mailing;
    mailingSubject: string;
    mailingLanguage: string;
    mailingText: string;
    mailingTextNl: string;
    mailingTextFr: string;
    mailingTextDefaultNl: string;
    mailingTextDefaultFr: string;
    isCotCustomText: boolean;
    // variables for file upload
    attachmentFileNames: string[];
    isYearlyMail: boolean;
    typeMembership: string;
    orgsummary: OrgSummary;
    orgemail: string;
    dueDate: string;
    due: number;
    maxAttachmentFileSize: number;
    isAttachmentUploadOngoing: boolean;
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
      this.ccAdress = '';
      this.bankEntNr = '';
      this.bankAdress = '';
      this.bankZip = '';
      this.bankCity = '';
      this.bankTel = '';
      this.bankTreas = '';
      this.orgemail = '';
      this.bankCotAmount = 0;
    this.bankCotExtraAmount = 0;
    this.YNOptions = enmYn;
    this.totalOrgSummaries = 0;
    this.orgSummaryIndex = 0;
      this.mailingText = '';
      this.mailing = new DefaultMailing();
      this.attachmentFileNames = [];
      this.isYearlyMail = true;
      this.cotYear = new Date().getFullYear() ;
      this.mailingSubject = '';
      this.cotYears = [
          {label: this.cotYear.toString(), value: this.cotYear.toString()},
          {label: (this.cotYear + 1).toString(), value: (this.cotYear + 1).toString()},
      ];
      this.due = 0;
      this.dueDate = '';
      this.maxAttachmentFileSize = 5000000; // max 5 MB file size
      this.isAttachmentUploadOngoing = false;
      this.isCotCustomText = false;
      this.mailingText = "";
      this.mailingTextNl = "";
      this.mailingTextFr = "";
      
      this.mailingTextDefaultFr = getMemberShipMailingTextDefaultFr();
      this.mailingTextDefaultNl = getMemberShipMailingTextDefaultNl();

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
                this.loadOrgSummaries(true);
                this.membreService.getByKey(authState.banque.idMemberTres)
                    .subscribe(
                        membre => {
                            if (membre !== null) {
                                this.bankTreas = membre.prenom + ' ' + membre.nom;
                            }
                        });
                this.banqProgService.getByKey(authState.banque.bankId)
                    .subscribe(
                        banqProg => {
                            if (banqProg !== null) {
                                this.bankCotAmount = +banqProg.cotAmount; // unary + operator converts to number
                                this.bankCotExtraAmount = +banqProg.cotAmountSup;
                                this.isCotCustomText = banqProg.cotTextCustom;
                                this.mailingTextFr = banqProg.cotTextFr;
                                this.mailingTextNl = banqProg.cotTextNl;
                            }
                        });
            })
        )
        .subscribe();

  }
  setMailContent() {
      if (this.organisation.email && this.organisation.email.trim() ) {
          this.orgemail = `${this.organisation.email.toLowerCase()}`;
      }
      let cotreal = 100 * this.bankCotAmount * this.organisation.cotMonths / 12 ;
      if (!this.isYearlyMail) {
          cotreal = 100 * this.bankCotExtraAmount * this.organisation.cotMonths / 12 ;
      }
      this.due = Math.round(cotreal * this.organisation.nPers) / 100;
      cotreal = Math.round(cotreal) / 100 ;
      if (this.organisation.langue === 2 ) {
          this.mailingLanguage = 'nl';
          this.mailingSubject = `Bijdrage voor ${this.cotYear} te betalen aan de Voedselbank` ;
          if (this.isYearlyMail) {
              this.typeMembership = 'jaarlijkse ledenbijdrage';
          } else {
              this.typeMembership = 'extra ledenbijdrage';
          }
          if (this.isCotCustomText) {
                this.mailingText = this.mailingTextNl;
          }
          else {
          this.mailingText = this.mailingTextDefaultNl;
            }
          this.mailingText = this.mailingText.replace(/{{organisatieNaam}}/g, this.organisation.societe);
            this.mailingText = this.mailingText.replace(/{{organisatieAdres}}/g, this.organisation.adresse);
            this.mailingText = this.mailingText.replace(/{{organisatiePostCode}}/g, this.organisation.cp);
            this.mailingText = this.mailingText.replace(/{{organisatieGemeente}}/g, this.organisation.localite);
            this.mailingText = this.mailingText.replace(/{{Type Bijdrage}}/g, this.typeMembership);
            this.mailingText = this.mailingText.replace(/{{BijdrageBedrag}}/g, cotreal.toString());
            this.mailingText = this.mailingText.replace(/{{Aantal Maanden}}/g, this.organisation.cotMonths.toString());
            this.mailingText = this.mailingText.replace(/{{Aantal Personen}}/g, this.organisation.nPers.toString());
            this.mailingText = this.mailingText.replace(/{{Bank Rekening Nummer}}/g, this.bankAccount);
            this.mailingText = this.mailingText.replace(/{{Verschuldigd Bedrag}}/g, this.due.toString());
            this.mailingText = this.mailingText.replace(/{{Verval Datum}}/g, this.dueDate);
          if (this.isYearlyMail) {
              this.mailingText = this.mailingText.replace(/{{Extra}}/g, " ");
          }
          else {
              this.mailingText = this.mailingText.replace(/{{Extra}}/g, " EXTRA ");
          }
            this.mailingText = this.mailingText.replace(/{{Jaar Bijdrage}}/g, this.cotYear.toString());
          this.mailingText = this.mailingText.replace(/{{Schatbewaarder}}/g, this.bankTreas);
          this.mailingText = this.mailingText.replace(/{{Naam Voedselbank}}/g, this.bankName);
          this.mailingText = this.mailingText.replace(/{{BedrijfsNummer Voedselbank}}/g, this.bankEntNr);
          this.mailingText = this.mailingText.replace(/{{Adres Voedselbank}}/g, this.bankAdress);
          this.mailingText = this.mailingText.replace(/{{PostCode Voedselbank}}/g, this.bankZip);
          this.mailingText = this.mailingText.replace(/{{Gemeente Voedselbank}}/g, this.bankCity);
          this.mailingText = this.mailingText.replace(/{{Telefoon Voedselbank}}/g, this.bankTel);
          
      } else {
          this.mailingLanguage = 'fr';
          this.mailingSubject = `Cotisation ${this.cotYear} payable à la Banque Alimentaire - Note de débit` ;
          this.typeMembership = 'cotisation annuelle';
          if (this.isYearlyMail) {
              this.typeMembership = 'cotisation annuelle';
          } else {
              this.typeMembership = 'cotisation annuelle supplémentaire';
          }
          if (this.isCotCustomText) {
              this.mailingText = this.mailingTextFr;
          }
          else {
              this.mailingText = this.mailingTextDefaultFr;
          }
          this.mailingText = this.mailingText.replace(/{{Nom Organisation}}/g, this.organisation.societe);
          this.mailingText = this.mailingText.replace(/{{Adresse Organisation}}/g, this.organisation.adresse);
          this.mailingText = this.mailingText.replace(/{{Code Postal Organisation}}/g, this.organisation.cp);
          this.mailingText = this.mailingText.replace(/{{Commune Organisation}}/g, this.organisation.localite);
          this.mailingText = this.mailingText.replace(/{{Type Cotisation}}/g, this.typeMembership);
          this.mailingText = this.mailingText.replace(/{{Montant Cotisation}}/g, cotreal.toString());
          this.mailingText = this.mailingText.replace(/{{Nb de Mois}}/g, this.organisation.cotMonths.toString());
          this.mailingText = this.mailingText.replace(/{{Nb de Personnes}}/g, this.organisation.nPers.toString());
          this.mailingText = this.mailingText.replace(/{{Numéro Compte Bancaire}}/g, this.bankAccount);
          this.mailingText = this.mailingText.replace(/{{Montant dû}}/g, this.due.toString());
          this.mailingText = this.mailingText.replace(/{{Date échéance}}/g, this.dueDate);
          if (this.isYearlyMail) {
              this.mailingText = this.mailingText.replace(/{{Supplémentaire}}/g, " ");
          }
          else {
              this.mailingText = this.mailingText.replace(/{{Supplémentaire}}/g, " SUPPLEMENTAIRE ");
          }
          this.mailingText = this.mailingText.replace(/{{Année de Cotisation}}/g, this.cotYear.toString());
          this.mailingText = this.mailingText.replace(/{{Trésorier}}/g, this.bankTreas);
          this.mailingText = this.mailingText.replace(/{{Nom Banque Alimentaire}}/g, this.bankName);
          this.mailingText = this.mailingText.replace(/{{N° Entreprise Banque Alimentaire}}/g, this.bankEntNr);
          this.mailingText = this.mailingText.replace(/{{Adresse Banque Alimentaire}}/g, this.bankAdress);
          this.mailingText = this.mailingText.replace(/{{Code Postal Banque Alimentaire}}/g, this.bankZip);
          this.mailingText = this.mailingText.replace(/{{Commune Banque Alimentaire}}/g, this.bankCity);
          this.mailingText = this.mailingText.replace(/{{Téléphone Banque Alimentaire}}/g, this.bankTel);
      }
  }
  getOrganisation(idDis: number) {
      this.organisationService.getByKey(idDis)
        .subscribe(organisation => {
            this.ccAdress =  '';
            this.orgemail = '';
            this.organisation = organisation;
            this.setMailContent();
    });
  }
  getNextOrganisation() {
      this.orgSummaryIndex = this.orgSummaries.findIndex(item => item.idDis === this.organisation.idDis);
      if (this.orgSummaryIndex < (this.totalOrgSummaries - 1)) {
          this.orgSummaryIndex++;
          this.orgsummary = this.orgSummaries[this.orgSummaryIndex];
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
    return $localize`:@@BankOrgsTitleMembershipMailing:To Organisation ${this.organisation.idDis} ${this.organisation.societe}. President: ${ this.organisation.nom } ${this.organisation.prenom } `;
  }
  getSubTitle():  string {
    return  $localize`:@@BankOrgsSubTitleMembershipMailing:Membership Fee based on bank regular fee ${this.bankCotAmount} and extra fee ${this.bankCotExtraAmount}`;
  }

    sendmail(event: Event) {
        const mailListArray = [];
        if (this.orgemail) {
            mailListArray.push(  this.orgemail  );
        }
        if (this.ccAdress) {
            mailListArray.push( this.ccAdress );
        }
        if (mailListArray.length === 0 ) {
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
                this.mailing.language=this.mailingLanguage;
                this.mailing.bodyText = this.mailingText;
                this.mailing.attachmentFileNames = this.attachmentFileNames.toString();
                this.mailingService.add(this.mailing)
                    .subscribe((myMail: Mailing) => {
                           this.messageService.add({
                                severity: 'success',
                                summary: 'Creation',
                                detail: $localize`:@@messageSent:Message has been sent`
                            });
                        },
                        ( dataserviceerror) => { 
                         
                         
                            const errMessage = {
                                severity: 'error', summary: 'Send',
                                // tslint:disable-next-line:max-line-length
                                detail: $localize`:@@messageSendError:The message could not be sent: error: ${dataserviceerror.message}`,
                                life: 6000
                            };
                            this.messageService.add(errMessage);
                        }
                    );
            }
        });
    }
    storeMailAttachment(event: any,uploader: FileUpload) {
        const newFiles : File[] = event.files.filter(item => !this.attachmentFileNames.includes( item.name));

        if (newFiles.length > 0) {
            const file = newFiles[0];
            const i = event.files.findIndex(x => x.name === file.name);
            if (file.size > this.maxAttachmentFileSize) {
                uploader.remove(event, i);
                this.messageService.add({
                    severity: 'error',
                    summary: $localize`:@@fileUploadError:Upload Mail Attachment Failed`,
                    detail: $localize`:@@fileUploadErrorDetailSize:Could not upload file ${file.name}. Size ${file.size} is too big for our internal mailing system(maximum is ${this.maxAttachmentFileSize} bytes) `,
                    life: 6000
                });
            }
            else {
                this.isAttachmentUploadOngoing = true;
                this.uploadService.upload(file, this.authService.accessToken).subscribe(
                    (response: any) => {
                        this.isAttachmentUploadOngoing = false;
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
                        this.isAttachmentUploadOngoing = false;
                        uploader.remove(event, i);
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
    removeMailAttachment(event: any) {
        const file: File | null = event.file;
        this.attachmentFileNames = this.attachmentFileNames.filter(item => item !== file.name);
    }
    loadOrgSummaries(regular: boolean) {
       const queryparms: QueryParams = {'lienBanque': this.lienBanque.toString(),
           'actif': '1', 'isDepot': '0', 'agreed': '1', 'cotType': '1'} ;
        if (regular === false) {
            queryparms['cotType'] = '0';
        }
        this.orgsummaryService.getWithQuery(queryparms)
            .subscribe(loadedOrgSummaries => {
                this.totalOrgSummaries = loadedOrgSummaries.length;
                this.orgSummaries  = loadedOrgSummaries;
                this.orgsummary = this.orgSummaries[0];
                this.getOrganisation(this.orgsummary.idDis);

            });
    }

    getNoMembershipMessage() {
        return  $localize`:@@OrgNoMembership:There is no membership to pay for the ${ this.organisation.nPers} beneficiaries of the organisation`;
    }
}
