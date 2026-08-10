import { MontantPipe } from './montant.pipe';

describe('MontantPipe', () => {
  const pipe = new MontantPipe();

  it('sépare les milliers et suffixe la devise par défaut', () => {
    expect(pipe.transform(1500000)).toBe('1 500 000 FCFA');
  });

  it('omet la devise quand une chaîne vide est passée', () => {
    expect(pipe.transform(1500000, '')).toBe('1 500 000');
  });

  it('accepte la devise renvoyée par l\'API', () => {
    expect(pipe.transform(250, 'FCFA')).toBe('250 FCFA');
  });

  it('ne double pas l\'espace quand la devise en porte déjà une', () => {
    expect(pipe.transform(250, ' FCFA')).toBe('250 FCFA');
  });

  it('traite une devise faite d\'espaces comme absente', () => {
    expect(pipe.transform(250, '   ')).toBe('250');
  });

  it('affiche un tiret pour une valeur absente', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(NaN)).toBe('—');
  });

  it('gère zéro et les montants négatifs', () => {
    expect(pipe.transform(0)).toBe('0 FCFA');
    expect(pipe.transform(-1500)).toBe('-1 500 FCFA');
  });

  it('tronque les décimales', () => {
    expect(pipe.transform(1234.87)).toBe('1 234 FCFA');
  });
});
