import {
  calendarClearOutline,
  calendarOutline,
  cartOutline,
  cubeOutline,
  documentTextOutline,
  peopleOutline,
  pricetagOutline,
  receiptOutline,
  settingsOutline,
  shirtOutline,
  statsChartOutline,
  personOutline
} from 'ionicons/icons'

export type RolAcceso = 'administrador' | 'recepcionista' | 'cajero' | 'operador'

export type RutaPrincipalAcceso =
  | '/tabs/home'
  | '/tabs/ordenes'
  | '/tabs/reportes'
  | '/tabs/calendario'
  | '/tabs/clientes'
  | '/tabs/productos'
  | '/tabs/inventario'
  | '/tabs/promociones'
  | '/tabs/facturas'
  | '/tabs/equipo'
  | '/tabs/horarios'
  | '/tabs/configuracion'

export type AccesoDirecto = {
  route: RutaPrincipalAcceso
  label: string
  icon: string
  color: string
  destacado?: boolean
  roles: RolAcceso[]
}

export const OPCIONES_ACCESO_PRINCIPAL: AccesoDirecto[] = [
  { route: '/tabs/home', label: 'Vender', icon: cartOutline, color: '', destacado: true, roles: ['administrador', 'recepcionista', 'cajero'] },
  { route: '/tabs/ordenes', label: 'Órdenes', icon: documentTextOutline, color: '#2563eb', roles: ['administrador', 'recepcionista', 'cajero', 'operador'] },
  { route: '/tabs/reportes', label: 'Caja y Reportes', icon: statsChartOutline, color: '#0d9488', roles: ['administrador', 'cajero'] },
  { route: '/tabs/calendario', label: 'Calendario', icon: calendarOutline, color: '#0d5681', roles: ['administrador', 'recepcionista', 'cajero', 'operador'] },
  { route: '/tabs/clientes', label: 'Clientes', icon: peopleOutline, color: '#7c3aed', roles: ['administrador'] },
  { route: '/tabs/productos', label: 'Catálogo', icon: shirtOutline, color: '#c026d3', roles: ['administrador'] },
  { route: '/tabs/inventario', label: 'Inventario', icon: cubeOutline, color: '#ea580c', roles: ['administrador'] },
  { route: '/tabs/promociones', label: 'Promociones', icon: pricetagOutline, color: '#e11d48', roles: ['administrador'] },
  { route: '/tabs/facturas', label: 'Facturas', icon: receiptOutline, color: '#ca8a04', roles: ['administrador'] },
  { route: '/tabs/equipo', label: 'Usuarios y Rol', icon: personOutline, color: '#0891b2', roles: ['administrador'] },
  { route: '/tabs/horarios', label: 'Horarios', icon: calendarClearOutline, color: '#0284c7', roles: ['administrador', 'recepcionista', 'cajero', 'operador'] },
  { route: '/tabs/configuracion', label: 'Configuración', icon: settingsOutline, color: '#475569', roles: ['administrador', 'recepcionista', 'cajero', 'operador'] },
]

export const RUTAS_ACCESO_PRINCIPAL_PREDETERMINADAS: RutaPrincipalAcceso[] =
  OPCIONES_ACCESO_PRINCIPAL.map((opcion) => opcion.route)
