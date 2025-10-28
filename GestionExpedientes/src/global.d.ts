export {};

declare global {
  interface Window {
    api?: {
      leerCarpeta: (ruta: string) => string[];
      leerArchivo: (ruta: string) => Uint8Array;
    };
  }
}
