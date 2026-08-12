import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Iniciar sesión</h1>
        @if (error) {
          <p class="error-msg" role="alert">{{ error }}</p>
        }
        <div class="form-field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div class="form-field">
          <label for="password">Contraseña</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
        </div>
        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading">
          {{ loading ? 'Ingresando…' : 'Iniciar sesión' }}
        </button>
        <a class="link-back" routerLink="/">Volver</a>
      </form>
    </main>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected error = '';
  protected loading = false;

  protected submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.auth.errorMessage(err);
      },
    });
  }
}