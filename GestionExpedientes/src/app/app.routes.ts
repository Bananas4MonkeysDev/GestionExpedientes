import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/pages/login/login.component';
import { ExpedientesRegisterComponent } from './modules/expedientes/pages/expedientes-register/expedientes-register.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro-expediente', component: ExpedientesRegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
