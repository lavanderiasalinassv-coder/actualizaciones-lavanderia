import { getApiBaseUrl } from "@/composables/useApiConfig";

export interface TarjetaLealtad {
  nombre: string;
  sellos: number;
  meta: number;
  premioDisponible: boolean;
  premioCanjeado?: boolean;
  premio: string;
  tipoDescuento?: "porcentaje" | "dinero";
  valorDescuento?: number;
  token?: string;
}

export interface TarjetaLealtadAdmin {
  tarjetaId: string;
  nombre: string;
  telefono: string;
  sellos: number;
  meta: number;
  premioDisponible: boolean;
  premio: string;
}

export interface ConfiguracionLealtad {
  premio: string;
  tipoDescuento: "porcentaje" | "dinero";
  valorDescuento: number;
  visitasMeta: number;
  tarjetasActivas: number;
}

export interface CodigoLealtadSolicitado {
  enviado: boolean;
  correo: string;
}

const api = async <T>(ruta: string, opciones: RequestInit = {}): Promise<T> => {
  const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json();
      if (cuerpo?.error) mensaje = cuerpo.error;
    } catch (error) {
      console.error("No se pudo leer el error de la API de lealtad:", error);
    }
    throw new Error(mensaje);
  }

  return respuesta.json() as Promise<T>;
};

export const urlRegistroLealtad = () => {
  const destino =
    "https://ls-lealtad.vercel.app/login";

  const url = new URL(destino);
  const esLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !esLocal) {
    throw new Error("El sitio público de lealtad debe usar HTTPS.");
  }
  if (typeof window !== "undefined" && url.origin === window.location.origin) {
    throw new Error(
      "El sitio público de lealtad debe estar separado de la app del personal."
    );
  }

  return url.toString();
};

export const obtenerTarjetasLealtad = () =>
  api<TarjetaLealtadAdmin[]>("/lealtad/tarjetas", {
    headers: {
      "Content-Type": "application/json",
      "x-user-role": localStorage.getItem("rol") ?? "",
    },
  });

export const ajustarVisitasLealtad = (tarjetaId: string, cambio: 1 | -1) =>
  api<TarjetaLealtadAdmin>("/lealtad/tarjetas/" + encodeURIComponent(tarjetaId) + "/visitas", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": localStorage.getItem("rol") ?? "",
    },
    body: JSON.stringify({ cambio }),
  });

export const removerTarjetaLealtad = (tarjetaId: string) =>
  api<{ tarjetaId: string; removida: boolean }>("/lealtad/tarjetas/" + encodeURIComponent(tarjetaId), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": localStorage.getItem("rol") ?? "",
    },
  });

export const obtenerConfiguracionLealtad = () =>
  api<ConfiguracionLealtad>("/lealtad/configuracion");

export const buscarTarjetaLealtadPorTelefono = (telefono: string) =>
  api<TarjetaLealtad | null>("/lealtad/tarjeta-telefono", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-role": localStorage.getItem("rol") ?? "" },
    body: JSON.stringify({ telefono }),
  });

export const actualizarPremioLealtad = (premio: string, tipoDescuento: "porcentaje" | "dinero", valorDescuento: number, visitasMeta: number) =>
  api<ConfiguracionLealtad>("/lealtad/configuracion", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": localStorage.getItem("rol") ?? "",
    },
    body: JSON.stringify({ premio, tipoDescuento, valorDescuento, visitasMeta }),
  });

export const solicitarCodigoLealtad = (telefono: string, motivo: "canje_premio" | "registro_tarjeta" = "registro_tarjeta") =>
  api<CodigoLealtadSolicitado>("/lealtad/verificacion", {
    method: "POST",
    body: JSON.stringify({ telefono, motivo }),
  });

export const solicitarCodigoCanjeLealtad = (telefono: string) =>
  api<CodigoLealtadSolicitado>("/lealtad/canje/verificacion", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-role": localStorage.getItem("rol") ?? "" },
    body: JSON.stringify({ telefono }),
  });

export const verificarCodigoCanjeLealtad = (telefono: string, codigo: string) =>
  api<TarjetaLealtad>("/lealtad/canje/verificacion/validar", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-role": localStorage.getItem("rol") ?? "" },
    body: JSON.stringify({ telefono, codigo }),
  });

export const registrarTarjetaLealtad = (datos: {
  telefono: string;
  codigo: string;
}) =>
  api<TarjetaLealtad>("/lealtad/registro", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const obtenerTarjetaLealtad = (token: string) =>
  api<TarjetaLealtad>(`/lealtad/tarjeta/${encodeURIComponent(token)}`);

export const registrarVisitaLealtad = (token: string, ordenId: string) =>
  api<TarjetaLealtad>("/lealtad/visitas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": localStorage.getItem("rol") ?? "",
    },
    body: JSON.stringify({ token, ordenId }),
  });

export const canjearPremioLealtad = (token: string, ordenId: string) =>
  api<TarjetaLealtad>("/lealtad/canjes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": localStorage.getItem("rol") ?? "",
    },
    body: JSON.stringify({ token, ordenId }),
  });
