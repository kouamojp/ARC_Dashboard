import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  CLASSES_STATUT_PAIEMENT,
  DESCRIPTIONS_MOYENS,
  DEVISE,
  DemandePaiement,
  Dette,
  LIBELLES_DESTINATAIRES,
  LIBELLES_MOYENS,
  LIBELLES_STATUT_PAIEMENT,
  MoyenPaiement,
  NotificationPaiement,
  Paiement,
  Partenaire,
  Synthese,
  paiementEnCours
} from '../../../core/models';
import { DebiteurService } from '../../../core/services/debiteur.service';
import { PaiementService } from '../../../core/services/paiement.service';
import { erreursValidation, messageErreur } from '../../../core/utils/erreur-api';

/** Étape courante du tunnel de paiement. */
type Etape = 'formulaire' | 'redirection' | 'attente' | 'succes' | 'echec';

/**
 * Règlement en ligne d'une dette par le débiteur.
 *
 * Le tunnel n'encaisse rien lui-même : il déclare une intention à l'API, puis
 * suit le statut jusqu'à ce que le prestataire tranche. Les montants ne sont
 * jamais recalculés ici — ils sont relus depuis l'API à la confirmation, seule
 * source de vérité sur ce qui a réellement été encaissé.
 */
@Component({
  selector: 'app-debiteur-paiements',
  templateUrl: './paiements.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class DebiteurPaiementsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly debiteurs = inject(DebiteurService);
  private readonly paiements = inject(PaiementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly moyens = DESCRIPTIONS_MOYENS;
  readonly libellesMoyens = LIBELLES_MOYENS;
  readonly libellesStatut = LIBELLES_STATUT_PAIEMENT;
  readonly classesStatut = CLASSES_STATUT_PAIEMENT;
  readonly libellesDestinataires = LIBELLES_DESTINATAIRES;
  readonly devise = DEVISE;

  readonly dettes = signal<Dette[]>([]);
  readonly partenaires = signal<Partenaire[]>([]);
  readonly synthese = signal<Synthese | null>(null);
  readonly historique = signal<Paiement[]>([]);

  readonly chargement = signal(true);
  readonly envoiEnCours = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly erreursChamps = signal<Record<string, string>>({});

  readonly etape = signal<Etape>('formulaire');
  readonly paiement = signal<Paiement | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    dette_id: ['', Validators.required],
    montant: [0, [Validators.required, Validators.min(1)]],
    moyen: ['carte' as MoyenPaiement, Validators.required],
    telephone: ['']
  });

  /** Seules les dettes non soldées peuvent être réglées. */
  readonly dettesReglables = computed(() => this.dettes().filter(dette => dette.solde > 0));

  readonly nomsPartenaires = computed(() => {
    const table = new Map<string, string>();
    for (const partenaire of this.partenaires()) {
      table.set(partenaire.id, partenaire.nom);
    }
    return table;
  });

  /** Dette et moyen retenus, dupliqués en signals pour piloter l'affichage. */
  readonly detteChoisie = signal<Dette | null>(null);
  readonly moyenChoisi = signal<MoyenPaiement>('carte');

  /** Montant saisi, suivi en signal pour recalculer le reste dû en direct. */
  readonly montantSaisi = signal(0);

  readonly descriptionMoyen = computed(
    () => this.moyens.find(m => m.moyen === this.moyenChoisi()) ?? this.moyens[0]
  );

  readonly telephoneRequis = computed(() => this.descriptionMoyen().telephoneRequis);

  /** Reste dû après le versement saisi, pour rassurer avant validation. */
  readonly resteApresPaiement = computed(() => {
    const dette = this.detteChoisie();
    if (!dette) {
      return null;
    }
    return Math.max(0, dette.solde - this.montantSaisi());
  });

  readonly notificationsEnvoyees = computed<NotificationPaiement[]>(
    () => this.paiement()?.notifications?.filter(n => n.envoyee) ?? []
  );

  constructor() {
    this.charger();

    // Le montant proposé par défaut est le solde entier : c'est le cas courant,
    // et le débiteur reste libre de verser moins.
    this.formulaire.controls.dette_id.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(id => {
        const dette = this.dettes().find(d => d.id === id) ?? null;
        this.detteChoisie.set(dette);
        this.appliquerBornesMontant(dette);
        this.formulaire.controls.montant.setValue(dette?.solde ?? 0);
      });

    this.formulaire.controls.montant.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(montant => this.montantSaisi.set(Number(montant) || 0));

    this.formulaire.controls.moyen.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(moyen => {
        this.moyenChoisi.set(moyen);
        this.appliquerValidationTelephone(moyen);
      });

    // Retour du prestataire après redirection : l'API renvoie le débiteur ici
    // avec l'identifiant du paiement, dont il faut reprendre le suivi.
    const reprise = this.route.snapshot.queryParamMap.get('paiement');
    if (reprise) {
      this.reprendre(reprise);
    }
  }

  choisirMoyen(moyen: MoyenPaiement): void {
    this.formulaire.controls.moyen.setValue(moyen);
  }

  nomPartenaire(dette: Dette | null): string {
    const identifiant = dette?.partenaire_id;
    return (identifiant && this.nomsPartenaires().get(identifiant)) || 'Partenaire non renseigné';
  }

  intituleDette(detteId: string): string {
    return this.dettes().find(d => d.id === detteId)?.intitule ?? '—';
  }

  enFaute(champ: 'dette_id' | 'montant' | 'telephone'): boolean {
    const controle = this.formulaire.controls[champ];
    return controle.touched && controle.invalid;
  }

  soumettre(): void {
    if (this.envoiEnCours()) {
      return;
    }

    this.erreur.set(null);
    this.erreursChamps.set({});

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    const valeurs = this.formulaire.getRawValue();
    const demande: DemandePaiement = {
      dette_id: valeurs.dette_id,
      montant: valeurs.montant,
      moyen: valeurs.moyen,
      url_retour: `${window.location.origin}/debiteur/paiements`
    };

    if (this.telephoneRequis()) {
      demande.telephone = valeurs.telephone.trim();
    }

    this.envoiEnCours.set(true);

    this.paiements.initier(demande).subscribe({
      next: paiement => {
        this.envoiEnCours.set(false);
        this.traiter(paiement);
      },
      error: erreur => {
        this.envoiEnCours.set(false);
        this.erreur.set(messageErreur(erreur, "Le paiement n'a pas pu être initié."));
        this.erreursChamps.set(erreursValidation(erreur));
      }
    });
  }

  /** Ouvre la page du prestataire, dans l'onglet courant. */
  poursuivreRedirection(): void {
    const url = this.paiement()?.url_redirection;
    if (url) {
      window.location.href = url;
    }
  }

  annuler(): void {
    const encours = this.paiement();
    if (!encours || !paiementEnCours(encours.statut)) {
      return;
    }

    this.paiements.annuler(encours.id).subscribe({
      next: paiement => this.traiter(paiement),
      error: erreur => this.erreur.set(messageErreur(erreur, "L'annulation a échoué."))
    });
  }

  /** Retour au formulaire pour un nouveau règlement. */
  recommencer(): void {
    this.paiement.set(null);
    this.erreur.set(null);
    this.etape.set('formulaire');
    this.formulaire.controls.dette_id.setValue('');
    this.formulaire.controls.telephone.setValue('');
    this.formulaire.markAsUntouched();
    this.nettoyerUrl();
  }

  private charger(): void {
    this.chargement.set(true);

    forkJoin({
      dettes: this.debiteurs.dettes(),
      historique: this.paiements.historique()
    }).subscribe({
      next: ({ dettes, historique }) => {
        this.dettes.set(dettes);
        this.historique.set(historique);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreur.set(messageErreur(erreur, 'Impossible de charger vos dettes.'));
        this.chargement.set(false);
      }
    });

    this.debiteurs.synthese().subscribe({ next: synthese => this.synthese.set(synthese) });
    this.debiteurs.partenaires().subscribe({ next: liste => this.partenaires.set(liste) });
  }

  /** Aiguille l'affichage selon le statut renvoyé par l'API. */
  private traiter(paiement: Paiement): void {
    this.paiement.set(paiement);

    switch (paiement.statut) {
      case 'reussi':
        this.etape.set('succes');
        this.rafraichirMontants();
        this.nettoyerUrl();
        break;

      case 'echoue':
      case 'annule':
        this.etape.set('echec');
        this.rafraichirHistorique();
        this.nettoyerUrl();
        break;

      default:
        // Carte et PayPal passent par une page tierce ; le mobile money attend
        // une validation sur le téléphone du débiteur.
        this.etape.set(paiement.url_redirection ? 'redirection' : 'attente');
        this.suivre(paiement.id);
    }
  }

  private reprendre(id: string): void {
    this.etape.set('attente');

    this.paiements.statut(id).subscribe({
      next: paiement => this.traiter(paiement),
      error: erreur => {
        this.etape.set('echec');
        this.erreur.set(messageErreur(erreur, 'Statut du paiement introuvable.'));
      }
    });
  }

  private suivre(id: string): void {
    this.paiements
      .suivre(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: paiement => {
          this.paiement.set(paiement);

          if (!paiementEnCours(paiement.statut)) {
            this.traiter(paiement);
          }
        },
        error: erreur => this.erreur.set(messageErreur(erreur, 'Suivi du paiement interrompu.'))
      });
  }

  /**
   * Relit dettes et synthèse après un encaissement confirmé.
   *
   * Rien n'est décrémenté localement : un paiement partiel, des frais ou une
   * imputation différente feraient diverger l'affichage de la comptabilité.
   */
  private rafraichirMontants(): void {
    this.debiteurs.dettes().subscribe({
      next: dettes => {
        this.dettes.set(dettes);
        const choisie = this.detteChoisie();
        if (choisie) {
          this.detteChoisie.set(dettes.find(d => d.id === choisie.id) ?? null);
        }
      }
    });

    this.debiteurs.synthese().subscribe({ next: synthese => this.synthese.set(synthese) });
    this.rafraichirHistorique();
  }

  private rafraichirHistorique(): void {
    this.paiements.historique().subscribe({ next: liste => this.historique.set(liste) });
  }

  private appliquerBornesMontant(dette: Dette | null): void {
    const controle = this.formulaire.controls.montant;
    const validateurs = [Validators.required, Validators.min(1)];

    if (dette) {
      validateurs.push(Validators.max(dette.solde));
    }

    controle.setValidators(validateurs);
    controle.updateValueAndValidity({ emitEvent: false });
  }

  private appliquerValidationTelephone(moyen: MoyenPaiement): void {
    const controle = this.formulaire.controls.telephone;
    const requis = this.moyens.find(m => m.moyen === moyen)?.telephoneRequis ?? false;

    controle.setValidators(
      requis ? [Validators.required, Validators.pattern(/^\+?[0-9\s.-]{8,20}$/)] : []
    );
    controle.updateValueAndValidity({ emitEvent: false });
  }

  /** Efface `?paiement=` pour qu'un rafraîchissement ne rejoue pas le retour. */
  private nettoyerUrl(): void {
    if (this.route.snapshot.queryParamMap.has('paiement')) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    }
  }
}
