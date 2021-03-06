export interface Depot {
    idDepot: string;

    nom: string;

    adresse: string;

    adresse2: string;

    cp: string;

    ville: string;

    telephone: string;

    contact: string;

    email: string;

    memo: string;

    depPrinc: boolean;

    actif: boolean;

    depFead: boolean;
    lienBanque: number;
}
export function compareDepots(c1: Depot, c2: Depot) {

    const compare = c1.idDepot > c2.idDepot;

    if (compare) {
        return 1;
    } else if ( c1.idDepot < c2.idDepot) {
        return -1;
    } else { return 0; }

}

export class DefaultDepot implements Depot {
    actif: boolean;
    adresse: string;
    adresse2: string;
    contact: string;
    cp: string;
    depFead: boolean;
    depPrinc: boolean;
    email: string;
    idDepot: string;
    lienBanque: number;
    memo: string;
    nom: string;
    telephone: string;
    ville: string;
    isNew: boolean; // calculated property to indicate we are creating a new depot
    constructor() {
        this.actif = true;
        this.adresse = '';
        this.adresse2 = '';
        this.contact = '';
        this.cp = '';
        this.depFead = false;
        this.depPrinc = false;
        this.email = '';
        this.idDepot = '';
        this.lienBanque = 0;
        this.memo = '';
        this.nom = '';
        this.telephone = '';
        this.ville = '';
        this.isNew = true;
    }
}
