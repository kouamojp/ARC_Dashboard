import { Dette } from '../../core/models';
import { consoliderParDebiteur } from './consolidation';
import { echeanceDe, estEnRetard, joursDeRetard, statutDe } from './statut-dette';
import { Debiteur } from '../../core/models';

const AUJOURDHUI = new Date('2026-06-15T12:00:00Z');

function dette(surcharge: Partial<Dette> = {}): Dette {
  return {
    id: 'x',
    intitule: 'Dette',
    montant_reclame: 1000,
    montant_reconnu: 1000,
    montant_verse: 0,
    solde: 1000,
    dernier_versement: null,
    date_echeance_mensuelle: null,
    debiteur_id: 'd1',
    partenaire_id: 'p1',
    ...surcharge
  };
}

describe('statutDe', () => {
  it('classe une dette au solde nul comme soldée, même si l\'échéance est passée', () => {
    const d = dette({ solde: 0, date_echeance_mensuelle: '2020-01-01' });

    expect(statutDe(d, AUJOURDHUI)).toBe('soldee');
  });

  it('classe une dette au solde négatif comme soldée', () => {
    expect(statutDe(dette({ solde: -50 }), AUJOURDHUI)).toBe('soldee');
  });

  it('classe une échéance dépassée comme en retard', () => {
    const d = dette({ date_echeance_mensuelle: '2026-05-01' });

    expect(statutDe(d, AUJOURDHUI)).toBe('en_retard');
    expect(estEnRetard(d, AUJOURDHUI)).toBeTrue();
  });

  it('classe une échéance future comme en cours', () => {
    expect(statutDe(dette({ date_echeance_mensuelle: '2026-09-30' }), AUJOURDHUI)).toBe('en_cours');
  });

  it('classe une dette sans échéance comme en cours plutôt qu\'en retard', () => {
    expect(statutDe(dette({ date_echeance_mensuelle: null }), AUJOURDHUI)).toBe('en_cours');
  });

  it('ne déclare pas en retard une échéance illisible', () => {
    const d = dette({ date_echeance_mensuelle: 'à convenir' });

    expect(echeanceDe(d)).toBeNull();
    expect(statutDe(d, AUJOURDHUI)).toBe('en_cours');
  });
});

describe('joursDeRetard', () => {
  it('compte les jours écoulés depuis l\'échéance', () => {
    const d = dette({ date_echeance_mensuelle: '2026-06-05T12:00:00Z' });

    expect(joursDeRetard(d, AUJOURDHUI)).toBe(10);
  });

  it('renvoie null quand la dette n\'est pas en retard', () => {
    expect(joursDeRetard(dette({ solde: 0 }), AUJOURDHUI)).toBeNull();
    expect(joursDeRetard(dette({ date_echeance_mensuelle: '2026-12-31' }), AUJOURDHUI)).toBeNull();
  });
});

describe('consoliderParDebiteur', () => {
  const debiteurs: Debiteur[] = [
    {
      id: 'd1', societe_debitrice: 'Alpha', gerant: 'A', ville: 'Douala', localisation: '',
      telephone: '', email: '', agent_id: null, partenaires_ids: [], cree_le: null, modifie_le: null
    },
    {
      id: 'd2', societe_debitrice: 'Beta', gerant: 'B', ville: 'Yaounde', localisation: '',
      telephone: '', email: '', agent_id: null, partenaires_ids: [], cree_le: null, modifie_le: null
    }
  ];

  const dettes: Dette[] = [
    dette({ id: 'a', debiteur_id: 'd1', montant_reconnu: 800, montant_verse: 200, solde: 600,
            date_echeance_mensuelle: '2026-05-01' }),
    dette({ id: 'b', debiteur_id: 'd1', montant_reconnu: 200, montant_verse: 200, solde: 0 }),
    dette({ id: 'c', debiteur_id: 'd2', montant_reconnu: 100, montant_verse: 50, solde: 50 })
  ];

  it('agrège les montants par débiteur', () => {
    const lignes = consoliderParDebiteur(debiteurs, dettes);
    const alpha = lignes.find(l => l.debiteur.id === 'd1')!;

    expect(alpha.nombreDettes).toBe(2);
    expect(alpha.reconnu).toBe(1000);
    expect(alpha.verse).toBe(400);
    expect(alpha.solde).toBe(600);
    expect(alpha.taux).toBe(40);
  });

  it('trie du plus gros encours au plus petit', () => {
    const lignes = consoliderParDebiteur(debiteurs, dettes);

    expect(lignes.map(l => l.debiteur.societe_debitrice)).toEqual(['Alpha', 'Beta']);
  });

  it('compte les dettes en retard par débiteur', () => {
    const lignes = consoliderParDebiteur(debiteurs, dettes);

    expect(lignes.find(l => l.debiteur.id === 'd1')!.enRetard).toBe(1);
    expect(lignes.find(l => l.debiteur.id === 'd2')!.enRetard).toBe(0);
  });

  it('ne divise pas par zéro quand rien n\'est reconnu', () => {
    const lignes = consoliderParDebiteur(debiteurs, []);

    expect(lignes.every(ligne => ligne.taux === 0)).toBeTrue();
    expect(lignes.every(ligne => ligne.nombreDettes === 0)).toBeTrue();
  });
});
