import {Component, Input, OnInit} from '@angular/core';
import {MembreEntityService} from '../services/membre-entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map, withLatestFrom} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Membre} from '../model/membre';
import {MessageService} from 'primeng/api';
import {civilite, langue} from '../../shared/enums';

interface Langue {
    name: string;
    code: number;
}
@Component({
  selector: 'app-membre',
  templateUrl: './membre.component.html',
  styleUrls: ['./membre.component.css']
})
export class MembreComponent implements OnInit {
    @Input() idMembre$: Observable<number>;
  membre$: Observable<Membre>;
  civilites: any[];
  langues: any[];
  constructor(
      private membresService: MembreEntityService,
      private route: ActivatedRoute,
      private router: Router,
      private messageService: MessageService
  ) {
      // Helper
      const StringIsNumber = value => isNaN(Number(value)) === false;
      // Note typescript needs filter to avoid reverse number to string entries when converting enum to object array
      this.civilites =  Object.keys(civilite).filter(StringIsNumber).map(key => ({ name: civilite[key], code: key }));
      this.langues =  Object.keys(langue).filter(StringIsNumber).map(key => ({ name: langue[key], code: key }));
  }

  ngOnInit(): void {
      // comment: this component is sometimes called from his parent Component with idDepot @Input Decorator,
      // or sometimes via a router link via the Main Menu
      if (!this.idMembre$) {
          // we must come from the menu
          console.log('We initialize a new membre object from the router!');
          this.idMembre$ = this.route.paramMap
              .pipe(
                  map(paramMap => paramMap.get('batId')),
                  map(idMembreString => Number(idMembreString))
              );
      }
      this.membre$ = this.idMembre$
          .pipe(
              withLatestFrom(this.membresService.entities$),
              map(([batId, membres]) => membres.find(membre => batId === membre.batId))
          );
  }
  delete(membre: Membre) {
    const  myMessage = {severity: 'succes', summary: 'Destruction', detail: `Le membre ${membre.nom} ${membre.prenom}  a été détruit`};
    this.membresService.delete(membre)
        .subscribe( ()  => {
          this.messageService.add(myMessage);
        });
  }

  save(oldMembre: Membre, membreForm: Membre) {
    const modifiedMembre = Object.assign({}, oldMembre, membreForm);
    this.membresService.update(modifiedMembre)
        .subscribe( ()  => {
          this.messageService.add({severity: 'succes', summary: 'Mise à jour', detail: `Le membre ${modifiedMembre.nom} ${modifiedMembre.prenom}  a été modifié`});
        });
  }

}

