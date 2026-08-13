import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { HomeComponent } from './components/home/home';
import { JuegoComponent } from './components/juego/juego';
import { DiasAnterioresComponent } from './components/dias-anteriores/dias-anteriores';
import { AdminComponent } from './components/admin/admin';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'juego', component: JuegoComponent },
  { path: 'juego/:id', component: JuegoComponent },
  { path: 'dias-anteriores', component: DiasAnterioresComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' },
];