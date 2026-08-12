import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  template: `
    <main class="home-page">
      <button class="btn btn-secondary logout-btn" type="button" (click)="logout()">Cerrar Sesión</button>
      <h1 class="home-title">MAPERO</h1>
      <div class="home-actions">
        <button class="btn btn-primary btn-jugar" type="button" (click)="jugar()">¡JUGAR!</button>
        <button class="btn btn-secondary btn-chico" type="button" (click)="proximamente()">DÍAS ANTERIORES</button>
        @if (aviso()) {
          <p class="home-aviso" role="status">{{ aviso() }}</p>
        }
      </div>
    </main>
  `,
})
export class HomeComponent {
  private readonly router = inject(Router);

  protected readonly aviso = signal('');

  protected jugar(): void {
    this.router.navigate(['/juego']);
  }

  protected proximamente(): void {
    this.aviso.set('Próximamente');
  }

  protected logout(): void {
    this.router.navigate(['/']);
  }
}