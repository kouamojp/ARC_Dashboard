import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ACCUEIL_PROFILS,
  LIBELLES_PROFILS,
  PROFILS,
  Profil
} from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { erreursValidation, messageErreur } from '../../../core/utils/erreur-api';

@Component({
  selector: 'app-login-boxed',
  templateUrl: './login-boxed.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class LoginBoxedComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly profils = PROFILS;
  readonly libelles = LIBELLES_PROFILS;

  readonly enCours = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly erreursChamps = signal<Record<string, string>>({});

  readonly formulaire = this.fb.nonNullable.group({
    profil: ['debiteur' as Profil, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  /** Sélection du profil : trois onglets plutôt qu'une liste déroulante. */
  choisirProfil(profil: Profil): void {
    this.formulaire.controls.profil.setValue(profil);
    this.erreur.set(null);
  }

  profilChoisi(): Profil {
    return this.formulaire.controls.profil.value;
  }

  soumettre(): void {
    if (this.enCours()) {
      return;
    }

    this.erreur.set(null);
    this.erreursChamps.set({});

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);

    this.auth.connexion(this.formulaire.getRawValue()).subscribe({
      next: reponse => {
        this.enCours.set(false);
        const retour = this.route.snapshot.queryParamMap.get('retour');
        this.router.navigateByUrl(retour || ACCUEIL_PROFILS[reponse.profil]);
      },
      error: erreur => {
        this.enCours.set(false);
        this.erreur.set(messageErreur(erreur, 'Connexion impossible.'));
        this.erreursChamps.set(erreursValidation(erreur));
      }
    });
  }

  /** Vrai quand le champ a été touché et qu'il est invalide. */
  enFaute(champ: 'email' | 'password'): boolean {
    const controle = this.formulaire.controls[champ];
    return controle.touched && controle.invalid;
  }
}
