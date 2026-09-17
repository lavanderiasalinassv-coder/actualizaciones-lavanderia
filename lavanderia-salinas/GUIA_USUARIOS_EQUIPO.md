# GUÍA COMPLETA - GESTIÓN DE EQUIPO (USUARIOS)

## 📋 Descripción General

Sistema completo de gestión de usuarios de equipo para Lavandería Salinas con:
- Tres roles: **Administrador**, **Recepcionista**, **Cajero**
- Autenticación por código de 6 dígitos
- Validaciones restrictivas de código
- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- Grid visual con perfiles de usuarios

---

## 🔐 Roles y Permisos

### Administrador
- **Código**: Puede iniciar con cualquier dígito (incluyendo 0)
- **Permisos**: Acceso total a todas las funciones
- **Ejemplo de código**: `000000`, `592647`, `123456`

### Recepcionista
- **Código**: NO puede iniciar con 0
- **Permisos**: Gestión de órdenes y clientes
- **Ejemplo de código**: `123456`, `234567`, `987654`

### Cajero
- **Código**: NO puede iniciar con 0
- **Permisos**: Procesar pagos y transacciones
- **Ejemplo de código**: `345678`, `456789`, `567890`

---

## 📁 Estructura de Archivos

```
src/
├── composables/
│   ├── useEquipo.ts                    # Lógica de equipo (local)
│   └── queries/
│       ├── usuariosEquipo.sql         # Queries SQL CRUD
│       └── ApiUsuariosEquipo.ts       # Endpoints API
├── views/
│   ├── LoginPage.vue                  # Login con código
│   └── EquipoPage.vue                 # Gestión de usuarios
└── components/
    └── AppShell.vue                   # Layout principal
```

---

## 🚀 Características

### 1. Login Local (Sin API)
El sistema valida códigos localmente usando `localStorage`:

```typescript
// LoginPage.vue
import { autenticarUsuarioEquipo } from '@/composables/useEquipo'

const usuarioLocal = autenticarUsuarioEquipo(codigo)
if (usuarioLocal) {
  // Login exitoso
  localStorage.setItem('usuario', JSON.stringify(usuarioLocal))
  router.push('/tabs/home')
}
```

### 2. Validaciones de Código

```typescript
// useEquipo.ts - Validaciones incluidas
const validarCodigo = (codigo: string, rol: RolEquipo): boolean => {
  // 1. Código debe tener 6 dígitos
  if (!/^\d{6}$/.test(codigo)) return false
  
  // 2. No puede iniciar con 0 (excepto administrador)
  if (rol !== 'administrador' && codigo.startsWith('0')) return false
  
  // 3. Debe ser único
  return validarUnicidadCodigo(codigo, lista)
}
```

### 3. CRUD Completo

#### Agregar Usuario
```typescript
import { agregarUsuarioEquipo } from '@/composables/useEquipo'

try {
  const nuevoUsuario = agregarUsuarioEquipo({
    nombre: 'Juan Pérez',
    correo: 'juan@lavanderia.com',
    codigo: '123456',
    rol: 'recepcionista'
  })
  console.log('Usuario creado:', nuevoUsuario)
} catch (error) {
  console.error(error.message) // "Ya existe un usuario con ese código."
}
```

#### Actualizar Usuario
```typescript
import { editarUsuarioEquipo } from '@/composables/useEquipo'

try {
  const usuarioActualizado = editarUsuarioEquipo('usuario-id-123', {
    nombre: 'Juan García',
    codigo: '654321',
    rol: 'cajero'
  })
  console.log('Usuario actualizado:', usuarioActualizado)
} catch (error) {
  console.error(error.message)
}
```

#### Eliminar Usuario
```typescript
import { eliminarUsuarioEquipo } from '@/composables/useEquipo'

eliminarUsuarioEquipo('usuario-id-123')
console.log('Usuario eliminado')
```

### 4. Grid Visual de Perfiles

El componente `EquipoPage.vue` muestra:
- Avatar en forma de grid con icono de perfil
- Nombre y rol con badge colorido
- Correo e ícono de mail
- Código e ícono de llave
- Botones de editar y eliminar

**Colores de rol:**
- **Administrador**: Azul oscuro
- **Recepcionista**: Púrpura
- **Cajero**: Azul

---

## 📊 Tipos TypeScript

### UsuarioEquipo
```typescript
export interface UsuarioEquipo {
  id: string                              // UUID único
  nombre: string                          // Nombre completo
  correo: string                          // Email único
  codigo: string                          // Código 6 dígitos único
  rol: 'administrador' | 'recepcionista' | 'cajero'
  activo: boolean                         // Usuario activo
  creadoEn: string                        // ISO timestamp
}

export type RolEquipo = 'administrador' | 'recepcionista' | 'cajero'
```

---

## 🔧 Configuración de Base de Datos

### Crear tabla SQL
```sql
CREATE TABLE usuarios_equipo (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  codigo VARCHAR(6) NOT NULL UNIQUE,
  rol ENUM('administrador', 'recepcionista', 'cajero', 'operador') DEFAULT 'cajero',
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_codigo_length CHECK (LENGTH(codigo) = 6 AND codigo REGEXP '^[0-9]{6}$'),
  CONSTRAINT chk_codigo_valido CHECK (
    rol = 'administrador' OR (rol != 'administrador' AND codigo NOT LIKE '0%')
  )
);
```

---

## 📡 API Endpoints (Si se usa backend)

### GET - Obtener todos los usuarios
```
GET /api/usuarios-equipo
Response: { usuarios: UsuarioEquipo[] }
```

### GET - Obtener usuario por código
```
GET /api/usuarios-equipo/codigo/:codigo
Response: { usuario: UsuarioEquipo }
```

### GET - Obtener usuario por ID
```
GET /api/usuarios-equipo/:id
Response: { usuario: UsuarioEquipo }
```

### POST - Crear usuario
```
POST /api/usuarios-equipo
Body: {
  nombre: string,
  correo: string,
  codigo: string,
  rol: 'administrador' | 'recepcionista' | 'cajero'
}
Response: { usuario: UsuarioEquipo, message: string }
```

### PUT - Actualizar usuario
```
PUT /api/usuarios-equipo/:id
Body: {
  nombre?: string,
  correo?: string,
  codigo?: string,
  rol?: string,
  activo?: boolean
}
Response: { usuario: UsuarioEquipo, message: string }
```

### DELETE - Eliminar usuario
```
DELETE /api/usuarios-equipo/:id
Response: { message: string }
```

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Autenticar usuario en login
```typescript
// LoginPage.vue
watch(codigo, async (nuevo) => {
  if (nuevo.length !== 6) return
  
  // Intenta autenticación local primero
  const usuario = autenticarUsuarioEquipo(nuevo)
  
  if (usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario))
    localStorage.setItem('rol', usuario.rol)
    router.replace('/tabs/home')
  }
})
```

### Ejemplo 2: Agregar usuario desde EquipoPage
```typescript
// EquipoPage.vue
const guardarUsuario = async () => {
  try {
    const payload = {
      nombre: form.value.nombre.trim(),
      correo: form.value.correo.trim(),
      codigo: form.value.codigo.trim(),
      rol: form.value.rol
    }
    
    if (!validarCodigo(payload.codigo, form.value.rol)) {
      mostrarToast(mensajeErrorCodigo.value, 'danger')
      return
    }
    
    agregarUsuarioEquipo(payload)
    mostrarToast('Usuario agregado correctamente', 'success')
    cargarUsuarios()
    cerrarFormulario()
  } catch (error) {
    mostrarToast(error.message, 'danger')
  }
}
```

### Ejemplo 3: Validar código con restricciones
```typescript
// Validar en componente
const validarCodigo = (codigo: string, rol: RolEquipo) => {
  // No puede iniciar con 0 (excepto admin)
  if (rol !== 'administrador' && codigo.startsWith('0')) {
    return { valido: false, error: 'El código no puede iniciar con 0' }
  }
  
  // Debe ser único
  const existe = usuarios.value.some(u => u.codigo === codigo)
  if (existe) {
    return { valido: false, error: 'Este código ya está en uso' }
  }
  
  return { valido: true }
}
```

---

## ✅ Checklist de Validación

### En Frontend (useEquipo.ts)
- ✅ Código debe tener 6 dígitos
- ✅ Código no puede iniciar con 0 (excepto administrador)
- ✅ Código debe ser único entre usuarios activos
- ✅ Correo debe ser único y válido
- ✅ Nombre es obligatorio
- ✅ Rol debe ser válido

### En Base de Datos
- ✅ CHECK constraint para validar formato de código
- ✅ CHECK constraint para validar regla de dígito inicial
- ✅ UNIQUE constraint para código
- ✅ UNIQUE constraint para correo
- ✅ ENUM constraint para rol
- ✅ DEFAULT para activo y timestamps

---

## 🎨 Personalización

### Cambiar colores de roles
En `EquipoPage.vue`, actualizar estilos:
```css
.badge-role.administrador {
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
}

.badge-role.recepcionista {
  background: rgba(168, 85, 247, 0.12);
  color: #7c3aed;
}

.badge-role.cajero {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}
```

### Cambiar tamaño del grid de perfiles
```css
.usuarios-grid {
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); /* Cambiar 230px */
  gap: 16px;
}
```

### Agregar más validaciones
```typescript
// En useEquipo.ts, extender validarCodigo()
const validarCodigo = (codigo: string, rol: RolEquipo): boolean => {
  // Agregar lógica adicional aquí
  // Ej: Evitar códigos secuenciales (123456, 654321, etc.)
}
```

---

## 🐛 Solución de Problemas

### Problema: "El código ya está asignado"
- Verifica que no exista otro usuario con ese código
- Revisa que `activo = true` en la BD
- Intenta cambiar el código por uno diferente

### Problema: "El correo ya está asignado"
- Usa un correo diferente o modifica el existente
- Verifica que el formato sea válido (usuario@dominio.com)

### Problema: "El código no puede iniciar con 0"
- Solo aplica a roles: recepcionista y cajero
- Para administrador, puedes usar códigos como "000000"
- Intenta con un código como "123456"

### Problema: Cambios no se guardan
- Verifica que `localStorage` esté disponible
- Revisa la consola del navegador (F12)
- Intenta limpiar el caché del navegador

---

## 📚 Recursos Adicionales

- **Queries SQL**: `src/composables/queries/usuariosEquipo.sql`
- **API TypeScript**: `src/composables/queries/ApiUsuariosEquipo.ts`
- **Componente Vue**: `src/views/EquipoPage.vue`
- **Lógica Local**: `src/composables/useEquipo.ts`
- **Login**: `src/views/LoginPage.vue`

---

## 🔒 Seguridad

Recomendaciones:
1. Nunca guardes códigos en texto plano
2. Usa HTTPS en producción
3. Valida en servidor también (no solo frontend)
4. Usa JWT o sesiones seguras para autenticación
5. Implementa rate limiting para intentos de login
6. Auditoria: registra cambios en tabla separate

---

## 📝 Notas Importantes

- El usuario administrador por defecto tiene código `592647`
- Los datos se guardan en `localStorage` (cliente) o base de datos (servidor)
- El sistema usa soft delete: `activo = false` en lugar de eliminar
- Las validaciones ocurren tanto en frontend como en backend
- El formato de código es siempre 6 dígitos numéricos

---

**Última actualización**: 2026-08-12  
**Versión**: 1.0.0
