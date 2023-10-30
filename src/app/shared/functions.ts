export function labelCivilite(civilite: number) {

    switch (civilite) {
        case 1:
            return $localize`:@@TitleMr:Mr`;
        case 2:
            return $localize`:@@TitleMrs:Mrs`;
        case 3:
            return $localize`:@@TitleMiss:Miss`;
        default:
            return ' ';
    }

}
export function  labelRights(rights: string) {
    if (rights) {
        switch (rights.toLowerCase()) {
            case 'admin_banq':
                return $localize`:@@RoleBankAdmin:Bank Admin`;
            case 'bank':
                return $localize`:@@RoleBankUser:Bank User`;
            case 'admin_asso':
                return $localize`:@@RoleOrgAdmin:Org Admin`;
            case 'asso':
                return $localize`:@@RoleOrgUser:Org User`;
            case 'admin':
                return $localize`:@@RoleAdmin:Global admin`;
            case 'admin_cpas':
                return $localize`:@@RoleCPASAdmin:CPAS Admin`;
            case 'admin_fead':
                return $localize`:@@RoleFEADAdmin:FEAD Admin`;
            case 'admin_fbba':
                return $localize`:@@RoleFBBAAdmin:FBBA Admin`;
            case 'bank_fbba':
                return $localize`:@@RoleFBBAUser:FBBA User`;
            default:
                return rights;
        }
    }
    return '?';
}
export function  labelLanguage(membreLangue: number) {
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

export function labelAgreed(agreed: boolean) {
    if (agreed) {
        return $localize`:@@Yes:Yes`;
    }
    else {
        return $localize`:@@No:No`;
    }
}
export function labelActive(active: boolean) {
    if (active) {
        return $localize`:@@Yes:Yes`;
    }
    else {
        return $localize`:@@No:No`;
    }
}
export function labelCoeff(coeff: number) {
    let label = '0%'
    if (coeff >0) {
        const percentage = Math.round(100/coeff);
        label = percentage + '%';
    }
    return label;

}

export function getCoeffTooltip() {
    return $localize`:@@BenefCoeffTooltip:The coefficient shows the percentage of the beneficiary's needs that are covered by the food aid`;
}

export function generateTooltipOrganisation() {
    return $localize`:@@OrganisationTooltip:Enter In the rectangle below either the id of the organisation, either a part of the organisation name to see and select the desired organisation`;
}
export function generateTooltipSuggestions() {
    return $localize`:@@SuggestionsTooltip:This is a suggestions List Box. To find the item, clear the text the rectangle below and enter  a part of the name to see and select the desired item`;
}
export function getMemberShipMailingTextDefaultFr() {
    let mailingTextDefaultFr  = `<Strong>NOTE DE DEBIT<br>{{Nom Organisation}}</strong><br>{{Adresse Organisation}}<br>{{Code Postal Organisation}}<br>{{Commune Organisation}}<br><br>`;
    mailingTextDefaultFr += `Ce mail vous est adressé afin de vous demander de bien vouloir règler votre {{Type Cotisation}}`;
    mailingTextDefaultFr +=  ` de votre association soit {{Montant Cotisation}}  Euro pour {{Nb de Mois}} mois par bénéficiaire` ;
    mailingTextDefaultFr += `<br>La moyenne des bénéficiaires pour l'année écoulée pour votre association était de {{Nb de Personnes}} personnes`;
    mailingTextDefaultFr += `<br>Merci de verser le montant de  {{Montant dû}} € sur le compte {{Numéro Compte Bancaire}} au plus tard le <b> {{Date échéance}} </b> avec la mention <b>"COTISATION MEMBRES{{Supplémentaire}}{{Année de Cotisation}}".</b><br>`;
    mailingTextDefaultFr += `<br>Avec nos remerciements anticipés.<br><br>Le trésorier,<br>{{Trésorier}}<br>{{Nom Banque Alimentaire}}<br>N° Entreprise: {{N° Entreprise Banque Alimentaire}} `;
    mailingTextDefaultFr += `Adresse: {{Adresse Banque Alimentaire}} {{Code Postal Banque Alimentaire}} {{Commune Banque Alimentaire}} {{Téléphone Banque Alimentaire}}`;
    mailingTextDefaultFr += '<br><br><i>>Note: Facture sur demande</i>';
    return mailingTextDefaultFr;
}
export function getMemberShipMailingTextDefaultNl() {
    let   mailingTextDefaultNl = `<Strong>DEBETNOTA<br>{{organisatieNaam}}</strong><br>{{organisatieAdres}}<br>{{organisatiePostCode}}<br>{{organisatieGemeente}}<br><br>`;
    mailingTextDefaultNl += `Geachte mevrouw/mijnheer,<br>Hierbij vindt u het verzoek tot betaling van de {{Type Bijdrage}}`;
    mailingTextDefaultNl +=  ` van uw liefdadigheidsvereniging aan onze Voedselbank. De basis bijdrage bedraagt {{BijdrageBedrag}}  Euro voor {{Aantal Maanden}} maand per minderbedeelde` ;
    mailingTextDefaultNl += `<br>Het gemiddeld aantal begunstigden voor het voorbije jaar voor uw vereniging bedroeg {{Aantal Personen}}`;
    mailingTextDefaultNl += `<br>Gelieve het bedrag van {{Verschuldigd Bedrag}} € te willen storten op ons  rekeningnr {{Bank Rekening Nummer}} ten laatste tegen <b> {{Verval Datum}} </b> met melding <b>"LEDENBIJDRAGE{{Extra}}{{Jaar Bijdrage}}"</b>.<br>`;
    mailingTextDefaultNl += `<br>Met dank bij voorbaat.<br><br>De Penningmeester,<br>{{Schatbewaarder}}<br>{{Naam Voedselbank}}<br>Bedrijfsnummer: {{BedrijfsNummer Voedselbank}} `;
    mailingTextDefaultNl += `Adres: {{Adres Voedselbank}} {{PostCode Voedselbank}} {{Gemeente Voedselbank}} {{Telefoon Voedselbank}}`;
    mailingTextDefaultNl += '<br><br><i>Nota: Factuur te verkrijgen op aanvraag</i>';
    return mailingTextDefaultNl;
}


