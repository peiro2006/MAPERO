import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <main class="landing-page">
      <h1 class="landing-title">MAPERO</h1>
      <div class="landing-buttons">
        <a class="btn btn-primary" routerLink="/login">Iniciar sesión</a>
        <a class="btn btn-secondary" routerLink="/register">Registrarse</a>
      </div>
    </main>
  `,
})
export class LandingComponent {}