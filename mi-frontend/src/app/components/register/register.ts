import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Registrarse</h1>
        @if (error) {
          <p class="error-msg" role="alert">{{ error }}</p>
        }
        <p class="form-hint">La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula y número.</p>
        <div class="form-field">
          <label for="nombre">Nombre</label>
          <input id="nombre" type="text" formControlName="nombre" autocomplete="name" />
        </div>
        <div class="form-field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div class="form-field">
          <label for="password">Contraseña</label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" />
        </div>
        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading">
          {{ loading ? 'Creando cuenta…' : 'Registrarse' }}
        </button>
        <a class="link-back" routerLink="/">Volver</a>
      </form>
    </main>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_PATTERN)],
    ],
  });
  protected error = '';
  protected loading = false;

  protected submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }
    this.loading = true;
    this.error = '';
    const { nombre, email, password } = this.form.getRawValue();
    this.auth.register(nombre!, email!, password!).subscribe({
      next: (resp) => {
        this.loading = false;
        this.auth.guardarSesion(resp);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.auth.errorMessage(err);
      },
    });
  }
}