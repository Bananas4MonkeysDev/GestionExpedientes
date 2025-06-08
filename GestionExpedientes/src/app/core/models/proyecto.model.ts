export interface Proyecto {
  id?: number;  // obligatorio porque lo usas así en los selects
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
}
