import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/pages/login/login.component';
import { RestablecerClaveComponent } from './modules/login/pages/restablecer-clave/restablecer-clave.component';
import { MainLayoutComponent } from './modules/layout/pages/main-layout/main-layout.component';
import { HomeComponent } from './modules/login/pages/home/home.component';
import { ExpedientesRegisterComponent } from './modules/expedientes/pages/expedientes-register/expedientes-register.component';
import { UsuariosExpedientesComponent } from './modules/maestras/pages/usuarios-expedientes/usuarios-expedientes.component';
import { ExpedientesMonitoreoComponent } from './modules/expedientes/pages/expedientes-monitoreo/expedientes-monitoreo.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'restablecer-clave', component: RestablecerClaveComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'monitoreo-expediente', component: ExpedientesMonitoreoComponent },
      { path: 'registro-expediente', component: ExpedientesRegisterComponent },
      { path: 'usuarios-expedientes', component: UsuariosExpedientesComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
