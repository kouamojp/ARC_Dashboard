import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Agent, Debiteur, Partenaire, ReponseAuth } from '../models';

const BASE = `${environment.apiUrl}/auth`;

const debiteur: Debiteur = {
  id: 'd1', societe_debitrice: 'SocieteA', gerant: 'Gerant A', ville: 'Douala',
  localisation: 'Akwa', telephone: '111', email: 'a@exemple.test',
  agent_id: null, partenaires_ids: [], cree_le: null, modifie_le: null
};

const reponseConnexion: ReponseAuth = {
  token: 'jeton-abc', type: 'bearer', expires_in: 3600,
  profil: 'debiteur', utilisateur: debiteur
};

describe('AuthService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('démarre déconnecté quand rien n\'est persisté', () => {
    const service = TestBed.inject(AuthService);

    expect(service.estConnecte()).toBeFalse();
    expect(service.token()).toBeNull();
    expect(service.profil()).toBeNull();
  });

  it('ouvre la session et la persiste après connexion', () => {
    const service = TestBed.inject(AuthService);

    service.connexion({ profil: 'debiteur', email: 'a@exemple.test', password: 'x' }).subscribe();
    http.expectOne(`${BASE}/login`).flush(reponseConnexion);

    expect(service.estConnecte()).toBeTrue();
    expect(service.token()).toBe('jeton-abc');
    expect(service.profil()).toBe('debiteur');
    expect(localStorage.getItem('recouvrement.token')).toBe('jeton-abc');
    expect(localStorage.getItem('recouvrement.profil')).toBe('debiteur');
  });

  it('vide la session et le stockage à la déconnexion', () => {
    const service = TestBed.inject(AuthService);
    service.connexion({ profil: 'debiteur', email: 'a@exemple.test', password: 'x' }).subscribe();
    http.expectOne(`${BASE}/login`).flush(reponseConnexion);

    service.deconnexion().subscribe();
    http.expectOne(`${BASE}/logout`).flush({ message: 'ok' });

    expect(service.estConnecte()).toBeFalse();
    expect(localStorage.getItem('recouvrement.token')).toBeNull();
  });

  it('déconnecte localement même si le serveur refuse le logout', () => {
    const service = TestBed.inject(AuthService);
    service.connexion({ profil: 'debiteur', email: 'a@exemple.test', password: 'x' }).subscribe();
    http.expectOne(`${BASE}/login`).flush(reponseConnexion);

    service.deconnexion().subscribe();
    http.expectOne(`${BASE}/logout`).flush({ message: 'boum' }, { status: 500, statusText: 'Server Error' });

    expect(service.estConnecte()).toBeFalse();
  });

  it('n\'appelle pas le serveur quand aucune session n\'est persistée', () => {
    const service = TestBed.inject(AuthService);

    service.restaurerSession().subscribe();

    http.expectNone(`${BASE}/me`);
  });

  it('rejoue la session persistée au démarrage', () => {
    localStorage.setItem('recouvrement.token', 'jeton-persiste');
    localStorage.setItem('recouvrement.profil', 'debiteur');
    const service = TestBed.inject(AuthService);

    service.restaurerSession().subscribe();
    http.expectOne(`${BASE}/me`).flush({ profil: 'debiteur', utilisateur: debiteur });

    expect(service.estConnecte()).toBeTrue();
    expect(service.utilisateur()).toEqual(debiteur);
  });

  it('vide la session si le token persisté n\'est plus valide', () => {
    localStorage.setItem('recouvrement.token', 'jeton-perime');
    localStorage.setItem('recouvrement.profil', 'debiteur');
    const service = TestBed.inject(AuthService);

    service.restaurerSession().subscribe();
    http.expectOne(`${BASE}/me`).flush(
      { message: 'Session expirée', code: 'token_expire' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(service.estConnecte()).toBeFalse();
    expect(localStorage.getItem('recouvrement.token')).toBeNull();
  });

  it('ignore un profil persisté invalide', () => {
    localStorage.setItem('recouvrement.profil', 'pirate');
    const service = TestBed.inject(AuthService);

    expect(service.profil()).toBeNull();
  });

  describe('nomAffiche', () => {
    const nomPour = (utilisateur: Debiteur | Partenaire | Agent, profil: 'debiteur' | 'partenaire' | 'agent') => {
      const service = TestBed.inject(AuthService);
      service.connexion({ profil, email: 'x@exemple.test', password: 'x' }).subscribe();
      http.expectOne(`${BASE}/login`).flush({ ...reponseConnexion, profil, utilisateur });
      return service.nomAffiche();
    };

    it('utilise la société pour un débiteur', () => {
      expect(nomPour(debiteur, 'debiteur')).toBe('SocieteA');
    });

    it('utilise prénom et nom pour un agent', () => {
      const agent: Agent = {
        id: 'a1', nom: 'Nkoa', prenom: 'Jean', email: 'j@exemple.test',
        telephone: '111', cree_le: null, modifie_le: null
      };
      expect(nomPour(agent, 'agent')).toBe('Jean Nkoa');
    });

    it('utilise le nom pour un partenaire', () => {
      const partenaire: Partenaire = {
        id: 'p1', nom: 'PartenaireA', adresse: 'Rue A', ville: 'Douala',
        telephone: '111', email: 'p@exemple.test', secteur: 'Banque',
        cree_le: null, modifie_le: null
      };
      expect(nomPour(partenaire, 'partenaire')).toBe('PartenaireA');
    });
  });
});
