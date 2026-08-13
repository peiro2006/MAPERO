import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  template: `
    <main class="home-page">
      <button class="btn btn-secondary logout-btn" type="button" (click)="logout()">Cerrar Sesión</button>
      <h1 class="home-title">MAPERO</h1>
      <div class="home-actions">
        <button class="btn btn-primary btn-jugar" type="button" (click)="jugar()">¡JUGAR!</button>
        <button class="btn btn-secondary btn-chico" type="button" (click)="anteriores()">DÍAS ANTERIORES</button>
      </div>
      <button
        class="btn btn-secondary admin-btn"
        type="button"
        [hidden]="!esAdmin()"
        (click)="admin()"
      >
        ADMIN
      </button>
    </main>
  `,
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected esAdmin(): boolean {
    return this.auth.esAdmin();
  }

  protected jugar(): void {
    this.router.navigate(['/juego']);
  }

  protected anteriores(): void {
    this.router.navigate(['/dias-anteriores']);
  }

  protected admin(): void {
    this.router.navigate(['/admin']);
  }

  protected logout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/']);
  }
}