import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { useTurno } from '@/composables/useTurno'
import { useSesion } from '@/composables/useSesion'
import { useHorarios } from '@/composables/Usehorarios'
import { combinarFechaHoraCentroamerica } from '@/composables/useFechas'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/verificacion-2fa',
    component: () => import('@/views/Verificacion2FA.vue')
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue'),
        meta: { requiresTurno: true }
      },
      {
        path: 'reportes',
        component: () => import('@/views/ReportesPage.vue')
      },
      {
        path: 'configuracion',
        component: () => import('@/views/ConfiguracionPage.vue')
      },
      {
        path: 'ajustes-burbujita',
        component: () => import('@/views/SaliAiAjustesPage.vue')
      },
      {
        path: 'entrenamiento-sali',
        component: () => import('@/views/EntrenamientoSaliPage.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'apariencia',
        component: () => import('@/views/AparienciaPage.vue')
      },
      {
        path: 'api',
        component: () => import('@/views/ApiPage.vue')
      },
      {
        path: 'base-datos',
        component: () => import('@/views/BaseDatosPage.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'respaldo',
        component: () => import('@/views/RespaldoPage.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'mantenimiento',
        component: () => import('@/views/MantenimientoPage.vue')
      },
      {
        path: 'equipo',
        component: () => import('@/views/EquipoPage.vue')
      },
      {
        path: 'clientes',
        component: () => import('@/views/ClientesPage.vue')
      },
      {
        path: 'inventario',
        component: () => import('@/views/InventarioPage.vue')
      },
      {
        path: 'promociones',
        component: () => import('@/views/PromocionesPage.vue')
      },
      {
        path: 'ordenes',
        component: () => import('@/views/OrdenesPage.vue'),
        meta: { requiresTurno: true }
      },
      {
        path: 'productos',
        component: () => import('@/views/CatalogoPage.vue')
      },
      {
        path: 'tareas',
        component: () => import('@/views/TareasPage.vue')
      },
      {
        path: 'depositos',
        component: () => import('@/views/DepositosPage.vue')
      },
      {
        path: 'principal',
        component: () => import('@/views/PrincipalPage.vue')
      },
      {
        path: 'facturas',
        component: () => import('@/views/FacturasPage.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'horarios',
        component: () => import('@/views/horariosPage.vue')
      },
      {
        path: 'configuracion',
        component: () => import('@/views/ConfiguracionPage.vue')
      },
      {
        path: 'apariencia',
        component: () => import('@/views/AparienciaPage.vue')
      },
      {
        path: 'calendario',
        component: () => import('@/views/CalendarioPage.vue')
      },
      {
        path: 'modelosia',
        component: () => import('@/views/modelosia.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

const rutasPermitidasRecepcionista = new Set([
  '/tabs/home',
  '/tabs/ordenes',
  '/tabs/horarios',
  '/tabs/principal',
  '/login',
  '/verificacion-2fa',
  '/tabs/calendario',
  '/tabs/configuracion',
  '/tabs/ajustes-burbujita'
])

const rutasPermitidasOperador = new Set([
  '/tabs/principal',
  '/tabs/ordenes',
  '/tabs/horarios',
  '/tabs/tareas',
  '/login',
  '/verificacion-2fa',
  '/tabs/calendario',
  '/tabs/configuracion',
  '/tabs/ajustes-burbujita'
])

const obtenerRolActual = () =>
  (localStorage.getItem('rol') ?? '').toLowerCase()

const esAdministrador = (rol: string) =>
  rol === 'administrador' || rol === 'admin'

router.beforeEach(async (to) => {
  const rolActual = obtenerRolActual()
  if (rolActual === 'operador' && !rutasPermitidasOperador.has(to.path)) {
    return { path: '/tabs/principal' }
  }

  if (rolActual === 'recepcionista' && !rutasPermitidasRecepcionista.has(to.path)) {
    return { path: '/tabs/principal' }
  }

  if (
    to.meta.requiresAdmin &&
    rolActual !== 'administrador' &&
    rolActual !== 'admin'
  ) {
    return { path: '/tabs/principal' }
  }

  if (rolActual === 'operador' && to.path === '/tabs/principal') {
    return true
  }

  if (to.meta.requiresTurno && !esAdministrador(rolActual)) {
    const { usuarioActual } = useSesion()
    const { cargarHorarios, encontrarEmpleadoPara, turnoDeHoyDe } = useHorarios()
    await cargarHorarios()
    const empleado = encontrarEmpleadoPara(usuarioActual.value)
    const turnoProgramado = empleado ? turnoDeHoyDe(empleado.id).value : null

    if (turnoProgramado && !turnoProgramado.libre) {
      const finDelTurno = combinarFechaHoraCentroamerica(turnoProgramado.fecha, turnoProgramado.horaFin)
      if (Date.now() >= finDelTurno.getTime() + 5 * 60 * 1000) {
        return {
          path: '/tabs/principal',
          query: { aviso: 'turno-terminado' }
        }
      }
    }
  }

  if (!to.meta.requiresTurno) return true

  // Los administradores pueden acceder sin turno abierto, EXCEPTO para la página de venta (home)
  if (esAdministrador(rolActual) && to.path !== '/tabs/home') return true

  const { turno, cargarTurno } = useTurno()
  if (turno.abierto) return true

  const turnoActual = await cargarTurno()
  if (turnoActual?.abierto) return true

  return {
    path: '/tabs/principal',
    query: { aviso: 'turno-requerido' }
  }
})

export default router
