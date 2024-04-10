export interface Cpas {

    cpasId: number;

    cpasZip: string;

    cpasName: string;

    cpasMail: string;

    cpasStreet: string;

    cpasTel: string;

    cpasGsm: string;

    cpasContactName: string;

    cpasContactSurname: string;

    civilite: number;

    rem: string;

    password: string;

    lbanque: number;

    langue: number;

    totalRecords: number;
}
export function compareCpass(c1: Cpas, c2: Cpas) {

    const compare = c1.cpasId > c2.cpasId;

    if (compare) {
        return 1;
    } else if ( c1.cpasId < c2.cpasId) {
        return -1;
    } else { return 0; }

}
export class DefaultCpas implements Cpas {
    civilite: number;
    cpasContactName: string;
    cpasContactSurname: string;
    cpasGsm: string;
    cpasId: number;
    cpasMail: string;
    cpasName: string;
    cpasStreet: string;
    cpasTel: string;
    cpasZip: string;
    lbanque: number;
    langue: number;
    password: string;
    rem: string;
    totalRecords: number;
    constructor() {
        this.civilite = 0;
        this.cpasContactName = '';
        this.cpasContactSurname = '';
        this.cpasGsm = '';
        // this.cpasId = 0; // will be generated when we create a new cpas
        this.cpasMail = '';
        this.cpasName = '';
        this.cpasStreet = '';
        this.cpasTel = '';
        this.cpasZip = '';
        this.lbanque = 0;
        this.langue = 0;
        this.password = '';
        this.rem = '';
    }

}
