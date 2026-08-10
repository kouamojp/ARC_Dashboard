import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ThemeOptions } from '../../../../../theme-options';
import { LIBELLES_PROFILS } from '../../../../../core/models';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-user-box',
  templateUrl: './user-box.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class UserBoxComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly libellesProfils = LIBELLES_PROFILS;
  readonly deconnexionEnCours = signal(false);

  constructor(public globals: ThemeOptions) {}

  /** Email de l'utilisateur, présent sur les trois profils. */
  email(): string {
    return this.auth.utilisateur()?.email ?? '';
  }

  seDeconnecter(): void {
    if (this.deconnexionEnCours()) {
      return;
    }

    this.deconnexionEnCours.set(true);

    this.auth.deconnexion().subscribe({
      next: () => {
        this.deconnexionEnCours.set(false);
        this.router.navigate(['/pages/login-boxed']);
      }
    });
  }
}
