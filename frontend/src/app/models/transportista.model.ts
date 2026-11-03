export interface Transportista {
  id: number;
  razon_social: string;
  ruc: string;
  activo: boolean;
}

export interface NuevoTransportista {
  razon_social: string;
  ruc: string;
}

export type CambiosTransportista = Partial<NuevoTransportista>;
