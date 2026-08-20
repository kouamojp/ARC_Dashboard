import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PaiementService } from './paiement.service';
import { environment } from '../../../environments/environment';
import { Paiement, StatutPaiement } from '../models';

const BASE = `${environment.apiUrl}/debiteur/me/paiements`;

function paiement(statut: StatutPaiement): Paiement {
  return {
    id: 'p1',
    reference: 'ARC-2026-000001',
    dette_id: 'd1',
    partenaire_id: 'part1',
    montant: 50000,
    devise: 'FCFA',
    moyen: 'orange_money',
    statut,
    url_redirection: null,
    instruction: 'Validez sur votre téléphone',
    message_echec: null,
    notifications: [],
    cree_le: '2026-08-19',
    confirme_le: null
  };
}

describe('PaiementService', () => {
  let http: HttpTestingController;
  let service: PaiementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PaiementService);

    // L'application est zoneless : fakeAsync n'est pas disponible. Le temps est
    // avancé à la main via l'horloge Jasmine, que rxjs suit puisqu'il passe par
    // les setInterval globaux.
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    http.verify();
  });

  it("transmet la demande d'initiation telle quelle", () => {
    service.initier({ dette_id: 'd1', montant: 50000, moyen: 'carte' }).subscribe();

    const requete = http.expectOne(BASE);
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body.montant).toBe(50000);
    requete.flush(paiement('initie'));
  });

  it("relit le statut tant que le prestataire n'a pas tranché", () => {
    const statuts: StatutPaiement[] = [];
    service.suivre('p1').subscribe(p => statuts.push(p.statut));

    jasmine.clock().tick(4000);
    http.expectOne(`${BASE}/p1`).flush(paiement('en_attente'));

    jasmine.clock().tick(4000);
    http.expectOne(`${BASE}/p1`).flush(paiement('reussi'));

    // Le statut décisif est bien émis, puis le suivi s'arrête de lui-même.
    jasmine.clock().tick(8000);
    http.expectNone(`${BASE}/p1`);

    expect(statuts).toEqual(['en_attente', 'reussi']);
  });

  it('abandonne le suivi après le nombre de tentatives imparti', () => {
    const statuts: StatutPaiement[] = [];
    service.suivre('p1', 2).subscribe(p => statuts.push(p.statut));

    jasmine.clock().tick(4000);
    http.expectOne(`${BASE}/p1`).flush(paiement('en_attente'));

    jasmine.clock().tick(4000);
    http.expectOne(`${BASE}/p1`).flush(paiement('en_attente'));

    jasmine.clock().tick(8000);
    http.expectNone(`${BASE}/p1`);

    expect(statuts.length).toBe(2);
  });
});
