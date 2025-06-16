import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/pages/login/login.component';
import { RestablecerClaveComponent } from './modules/login/pages/restablecer-clave/restablecer-clave.component';
import { MainLayoutComponent } from './modules/layout/pages/main-layout/main-layout.component';
import { HomeComponent } from './modules/login/pages/home/home.component';
import { ExpedientesRegisterComponent } from './modules/expedientes/pages/expedientes-register/expedientes-register.component';
import { UsuariosExpedientesComponent } from './modules/maestras/pages/usuarios-expedientes/usuarios-expedientes.component';
import { ExpedientesMonitoreoComponent } from './modules/expedientes/pages/expedientes-monitoreo/expedientes-monitoreo.component';
import { DashboardComponent } from './modules/dashboard/pages/dashboard/dashboard.component';
import { ExpedienteDetalleComponent } from './modules/expedientes/pages/expediente-detalles/expediente-detalle/expediente-detalle.component';
import { authGuard } from './core/guards/auth.guard';
import { VerCargoComponent } from './modules/cargos/pages/ver-cargo/ver-cargo.component';
import { ProyectoComponent } from './modules/maestras/pages/proyectos/proyecto/proyecto.component';
import { AreasGruposComponent } from './modules/maestras/pages/areas-grupos/areas-grupos.component';

export const routes: Routes = [
  { path: 'ver-cargo/:uuid', component: VerCargoComponent },
  { path: 'login', component: LoginComponent },
  { path: 'restablecer-clave', component: RestablecerClaveComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'monitoreo-expediente', component: ExpedientesMonitoreoComponent },
      { path: 'registro-expediente', component: ExpedientesRegisterComponent },
      { path: 'detalle-expediente/:id', component: ExpedienteDetalleComponent },
      { path: 'usuarios-expedientes', component: UsuariosExpedientesComponent },
      { path: 'proyectos', component: ProyectoComponent },
      { path: 'areas-grupos', component: AreasGruposComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
