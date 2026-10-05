const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");

const ARTICULOS_INICIALES = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000001",
    titulo: "Crear una orden paso a paso",
    descripcion: "Registra al cliente, agrega los servicios y prendas, define la entrega y revisa el pago antes de crear la orden.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">El formulario de venta organiza la captura de la orden en pasos. Avanza con <strong style="color:#087e8b">Siguiente</strong> y revisa el resumen antes de confirmarla.</p>
  <div style="display:grid;gap:12px">
    <div style="padding:15px;border-left:4px solid #16808a;border-radius:10px;background:#fff"><h3 style="margin:0 0 6px;color:#123a66">01 · Cliente</h3><p style="margin:0;color:#526a80;line-height:1.6">Busca al cliente por teléfono o selecciona una sugerencia. Si es nuevo, completa su nombre y teléfono; el correo es opcional y puede usarse para enviar una confirmación.</p></div>
    <div style="padding:15px;border-left:4px solid #5685c5;border-radius:10px;background:#fff"><h3 style="margin:0 0 6px;color:#123a66">02 · Servicios</h3><p style="margin:0;color:#526a80;line-height:1.6">Agrega los servicios o artículos disponibles en el catálogo y ajusta las cantidades. El resumen lateral actualiza los artículos y el total.</p></div>
    <div style="padding:15px;border-left:4px solid #d9a441;border-radius:10px;background:#fff"><h3 style="margin:0 0 6px;color:#123a66">03 · Prendas</h3><p style="margin:0;color:#526a80;line-height:1.6">Indica cuántas prendas recibiste y agrega notas sobre manchas, daños u otros detalles que el equipo deba conocer. Las fotos son opcionales.</p></div>
    <div style="padding:15px;border-left:4px solid #6caa83;border-radius:10px;background:#fff"><h3 style="margin:0 0 6px;color:#123a66">04 · Entrega y pago</h3><p style="margin:0;color:#526a80;line-height:1.6">Selecciona la fecha y hora de entrega. Si corresponde, activa envío a domicilio. Registra el método de pago y los datos que solicite (por ejemplo, referencia de tarjeta o comprobante de transferencia).</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #f1dfb8;border-radius:10px;background:#fff8e8;color:#76531d"><strong>Antes de crearla:</strong> revisa los datos del cliente, los servicios, la entrega y el resumen. Pulsa <strong>Crear orden</strong> una sola vez y espera la confirmación.</div>
  <p style="margin:16px 0 0;color:#718499;font-size:13px;line-height:1.6">Luego puedes encontrarla en <strong>Órdenes</strong>, buscarla por cliente o número y abrir su detalle para consultar los servicios, pagos, notas y estado.</p>
</div>`,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000002",
    titulo: "Programar horarios y registrar asistencia",
    descripcion: "Aprende a asignar turnos semanales o individuales y a usar el registro de entrada, pausa y salida.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">La sección <strong style="color:#087e8b">Horarios</strong> reúne el calendario, la programación de turnos y los reportes de asistencia. Las opciones de administración están disponibles según el rol.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Programar una semana</h3><ol style="margin:0;padding-left:20px;color:#526a80;line-height:1.75"><li>En el calendario, pulsa <strong>Programar semana</strong>.</li><li>Elige al empleado y la fecha de inicio.</li><li>Define entrada, salida y, si aplica, horario de almuerzo.</li><li>Marca los días libres y usa los atajos para aplicar una plantilla a varios días.</li><li>Pulsa <strong>Guardar semana</strong>.</li></ol></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Agregar un día individual</h3><p style="margin:0;color:#526a80;line-height:1.7">En la vista semanal o mensual, usa el botón <strong>+</strong> del día y asigna empleado, entrada, salida y almuerzo opcional. Los días pasados no se pueden programar desde el calendario.</p></div>
  </div>
  <div style="margin-top:14px;padding:16px;border:1px solid #d6e8dd;border-radius:12px;background:#f2faf4">
    <h3 style="margin:0 0 8px;color:#286745">Registrar asistencia</h3>
    <p style="margin:0;color:#456653;line-height:1.7">El empleado abre <strong>Principal</strong> y usa el control de asistencia para marcar entrada y salida. Al pausar la jornada, el tramo queda pausado; al activar de nuevo, se registra una reanudación. Horarios muestra los reportes de entradas tarde, pausas, reanudaciones y salidas para su consulta.</p>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #f1dfb8;border-radius:10px;background:#fff8e8;color:#76531d"><strong>Importante:</strong> una semana guardada omite los días que ya pasaron; no los modifica. Verifica el empleado y las horas antes de guardar.</div>
</div>`,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V2 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000003",
    titulo: "Consultar entregas en el Calendario",
    descripcion: "Navega por mes o semana, busca una orden y filtra las entregas por estado.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">El <strong style="color:#087e8b">Calendario</strong> organiza las órdenes por su fecha de entrega. Puedes cambiar de periodo y abrir una orden directamente desde sus eventos.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Elige la vista</h3><p style="margin:0;color:#526a80;line-height:1.7">Usa <strong>Mes</strong> para ver la distribución completa o <strong>Semana</strong> para revisar cada día con más detalle. Las flechas cambian de periodo y <strong>Hoy</strong> vuelve a la fecha actual.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Busca y filtra</h3><p style="margin:0;color:#526a80;line-height:1.7">Escribe el nombre del cliente o número de orden en el buscador. Usa los filtros de estado para mostrar solo las órdenes que necesitas revisar.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Abre el detalle</h3><p style="margin:0;color:#526a80;line-height:1.7">Selecciona una orden del calendario para consultar su información y continuar con las acciones permitidas para tu rol.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #d6e8dd;border-radius:10px;background:#f2faf4;color:#456653"><strong>Consejo:</strong> los colores de los eventos ayudan a reconocer el estado de la orden. Si hay varios eventos en un día, abre ese día para revisar la lista completa.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000004",
    titulo: "Controlar insumos en Inventario",
    descripcion: "Registra existencias y costos, identifica productos bajos y suma reposiciones con Refill.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">La vista <strong style="color:#087e8b">Inventario</strong> ayuda a controlar los insumos que usa la lavandería y a revisar cuándo hace falta reponerlos.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
    <div style="padding:16px;border-left:4px solid #16808a;border-radius:11px;background:#fff"><h3 style="margin:0 0 7px;color:#123a66">Registra un insumo</h3><p style="margin:0;color:#526a80;line-height:1.7">Pulsa <strong>Agregar insumo</strong> y completa nombre, categoría, unidad de medida, cantidad disponible y costo. Puedes añadir descripción e imagen.</p></div>
    <div style="padding:16px;border-left:4px solid #5685c5;border-radius:11px;background:#fff"><h3 style="margin:0 0 7px;color:#123a66">Encuentra productos</h3><p style="margin:0;color:#526a80;line-height:1.7">Busca por nombre y selecciona una categoría. Las tarjetas muestran cantidad disponible, costo unitario, valor total y nivel de stock.</p></div>
    <div style="padding:16px;border-left:4px solid #d9a441;border-radius:11px;background:#fff"><h3 style="margin:0 0 7px;color:#123a66">Repón con Refill</h3><p style="margin:0;color:#526a80;line-height:1.7">Pulsa <strong>Refill</strong>, busca el insumo, escribe cuánto agregas en su unidad y presiona <strong>Sumar</strong>. La reposición incrementa la existencia actual.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #f1dfb8;border-radius:10px;background:#fff8e8;color:#76531d"><strong>Importante:</strong> verifica la unidad y la cantidad antes de guardar una reposición para que el inventario refleje las existencias reales.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000005",
    titulo: "Buscar y organizar clientes",
    descripcion: "Encuentra clientes por nombre, revisa sus órdenes y cambia entre las listas Total, Recurrentes y Top.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">La vista <strong style="color:#087e8b">Clientes</strong> reúne la información del directorio y permite localizar rápidamente a una persona.</p>
  <div style="display:grid;gap:11px">
    <div style="display:flex;gap:13px;padding:15px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><strong style="color:#16808a">01</strong><div><h3 style="margin:0 0 5px;color:#123a66">Busca un cliente</h3><p style="margin:0;color:#526a80;line-height:1.65">Escribe su nombre en el buscador. La tarjeta muestra teléfono, correo y cantidad de órdenes asociadas.</p></div></div>
    <div style="display:flex;gap:13px;padding:15px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><strong style="color:#16808a">02</strong><div><h3 style="margin:0 0 5px;color:#123a66">Usa las vistas rápidas</h3><p style="margin:0;color:#526a80;line-height:1.65"><strong>Total</strong> muestra el directorio completo; <strong>Recurrentes</strong> destaca clientes frecuentes; <strong>Top</strong> muestra a los clientes destacados por su actividad.</p></div></div>
    <div style="display:flex;gap:13px;padding:15px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><strong style="color:#16808a">03</strong><div><h3 style="margin:0 0 5px;color:#123a66">Administra el perfil</h3><p style="margin:0;color:#526a80;line-height:1.65">Usa las acciones de la tarjeta para editar datos o eliminar el registro, y la paginación para recorrer los resultados.</p></div></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #e1d9f2;border-radius:10px;background:#f7f3ff;color:#59457a"><strong>Consejo:</strong> antes de eliminar un perfil, confirma que seleccionaste al cliente correcto.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000006",
    titulo: "Buscar órdenes y usar sus filtros",
    descripcion: "Encuentra una orden por cliente, teléfono o número y consulta estados o fechas específicas.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">La vista <strong style="color:#087e8b">Órdenes</strong> permite revisar el trabajo en curso, localizar registros y abrir su detalle.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Busca una orden</h3><p style="margin:0;color:#526a80;line-height:1.7">Escribe nombre, teléfono o identificador de la orden en el buscador. Pulsa la tarjeta o fila del resultado para abrir sus detalles.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Filtra resultados</h3><p style="margin:0;color:#526a80;line-height:1.7">Usa los filtros para ver todos los estados o enfocarte en una etapa. También puedes filtrar por fecha de creación o de entrega; <strong>Restablecer</strong> limpia esos filtros.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Revisa el detalle</h3><p style="margin:0;color:#526a80;line-height:1.7">El detalle reúne servicios, prendas, cargos, pagos, fechas, notas y movimientos disponibles. Las acciones de edición dependen del estado, los permisos y el turno de caja.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #f1dfb8;border-radius:10px;background:#fff8e8;color:#76531d"><strong>Órdenes cerradas:</strong> forman parte del historial. No son lo mismo que las órdenes canceladas; usa los filtros y la búsqueda para distinguirlas.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V3 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000007",
    titulo: "Qué hacer si aparece un error de conexión",
    descripcion: "Pasos para distinguir un problema de red o base de datos y reportarlo con información útil.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">Mensajes como <strong>“No se pudo conectar”</strong>, tiempos de espera agotados o datos que no cargan suelen indicar que la aplicación no logra comunicarse con el servidor o la base de datos.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Prueba lo básico</h3><p style="margin:0;color:#526a80;line-height:1.7">Comprueba que el equipo tenga conexión a la red y espera unos segundos antes de volver a cargar la vista. Si el error continúa, evita repetir varias veces una acción que pudo haberse guardado.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Verifica el resultado</h3><p style="margin:0;color:#526a80;line-height:1.7">Antes de volver a crear una orden, pago o reposición, busca el registro para confirmar si la operación anterior sí quedó guardada.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Solicita ayuda</h3><p style="margin:0;color:#526a80;line-height:1.7">Si no se resuelve, contacta al administrador e indica la hora, la vista, qué estabas haciendo y el mensaje exacto. Una captura ayuda a localizar el problema.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #f1dfb8;border-radius:10px;background:#fff8e8;color:#76531d"><strong>Para soporte técnico:</strong> errores como ETIMEDOUT suelen significar que se agotó el tiempo de conexión con la base de datos. El administrador puede revisar el estado del servidor y los registros; no cambies credenciales ni configuración por tu cuenta.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000008",
    titulo: "Qué se puede modificar en una orden",
    descripcion: "Conoce las opciones del detalle y por qué algunas acciones pueden estar deshabilitadas.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">Abre una orden desde la vista <strong style="color:#087e8b">Órdenes</strong> para consultar su detalle. Según tu rol, el estado de la orden y el turno de caja, puedes tener disponibles distintas modificaciones.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
    <div style="padding:16px;border-top:4px solid #16808a;border-radius:11px;background:#fff"><h3 style="margin:0 0 7px;color:#123a66">Datos del servicio</h3><p style="margin:0;color:#526a80;line-height:1.7">Cuando estén habilitados, puedes ajustar fechas, actualizar datos del cliente, añadir servicios o cargos, registrar descuentos y agregar notas o fotos.</p></div>
    <div style="padding:16px;border-top:4px solid #5685c5;border-radius:11px;background:#fff"><h3 style="margin:0 0 7px;color:#123a66">Prendas y pagos</h3><p style="margin:0;color:#526a80;line-height:1.7">Las opciones para modificar prendas, anticipos y otros movimientos pueden requerir permisos de administrador y pueden solicitar una razón para dejar constancia.</p></div>
    <div style="padding:16px;border-top:4px solid #d9a441;border-radius:11px;background:#fff"><h3 style="margin:0 0 7px;color:#123a66">Estado de la orden</h3><p style="margin:0;color:#526a80;line-height:1.7">Los cambios de estado siguen un flujo permitido por la aplicación. Una orden cerrada o un turno cerrado puede impedir algunas operaciones; no intentes eludir esos bloqueos.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #d6e8dd;border-radius:10px;background:#f2faf4;color:#456653"><strong>Si una opción no aparece:</strong> confirma que abriste la orden correcta. Si sigue deshabilitada, consulta a un administrador; puede ser una restricción de estado, turno o permisos.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000009",
    titulo: "Corregir datos de clientes e inventario",
    descripcion: "Edita perfiles e insumos existentes y registra las reposiciones en el campo adecuado.",
    contenido: `<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">Puedes corregir información existente desde las vistas <strong style="color:#087e8b">Clientes</strong> e <strong style="color:#087e8b">Inventario</strong>, usando las acciones de edición de cada registro.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Editar un cliente</h3><p style="margin:0;color:#526a80;line-height:1.7">Busca el perfil, pulsa editar, actualiza los datos y guarda. Revisa especialmente el nombre y el celular antes de confirmar; son campos requeridos.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Editar un insumo</h3><p style="margin:0;color:#526a80;line-height:1.7">Abre la edición del producto para corregir su información. Para registrar una compra o reposición, usa <strong>Refill</strong> y suma la cantidad recibida en vez de reemplazar por error la existencia disponible.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">Si no guarda los cambios</h3><p style="margin:0;color:#526a80;line-height:1.7">Lee el mensaje mostrado por la aplicación, verifica los campos obligatorios y vuelve a buscar el registro para comprobar si se actualizó. Si aparece un error de conexión, consulta el artículo de solución de errores antes de reintentar.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #e1d9f2;border-radius:10px;background:#f7f3ff;color:#59457a"><strong>Precaución:</strong> eliminar un registro no equivale a editarlo. Confirma la selección y revisa sus relaciones antes de usar una acción de eliminación.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V4 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000010",
    titulo: "Órdenes que requieren intervención",
    descripcion: "Entiende las alertas de pagos, anticipos y entregas que no coinciden con el cierre de caja.",
    contenido: `<div style="padding:20px;border:1px solid #f0d8ad;border-radius:16px;background:linear-gradient(135deg,#fff9ed,#f7faff)">
  <p style="margin:0 0 16px;color:#425a70;font-size:16px;line-height:1.7">La etiqueta <strong style="color:#b66a0b">Requiere atención</strong> indica que la información de la orden no coincide con los registros de pago o cierre. La aplicación muestra estas alertas a administradores para que revisen la orden; no significa por sí sola que debas volver a cobrar o entregar.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #f1dfb8;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#8a570e">Orden cerrada sin pago completo</h3><p style="margin:0;color:#526a80;line-height:1.7">La orden está cerrada, pero su estado de pago no aparece como pagado. Confirma el total y los pagos registrados y revisa el cierre relacionado antes de corregir el estado.</p></div>
    <div style="padding:16px;border:1px solid #f1dfb8;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#8a570e">Anticipo ausente del cierre</h3><p style="margin:0;color:#526a80;line-height:1.7">Un anticipo tiene asociado un turno cerrado, pero ese anticipo no figura en el cierre asignado. Compara el monto, la fecha y el turno con el detalle de la orden y el historial de cierres.</p></div>
    <div style="padding:16px;border:1px solid #f1dfb8;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#8a570e">Entrega ausente del cierre</h3><p style="margin:0;color:#526a80;line-height:1.7">La orden aparece entregada o cerrada, pero no se encuentra en el cierre del turno relacionado. Revisa el turno y el historial de cierres; no registres otra entrega para intentar quitar la alerta.</p></div>
  </div>
  <div style="margin-top:16px;padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Cómo revisar la alerta</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.8">
      <li>En <strong>Órdenes</strong>, selecciona el filtro <strong>Intervención</strong> o abre la orden marcada con el aviso.</li>
      <li>Lee el motivo de la alerta y revisa los anticipos, el estado de pago, el turno y los movimientos de la orden.</li>
      <li>Compara esos datos con el historial del cierre correspondiente y confirma con la persona responsable del turno si hace falta.</li>
      <li>Si encuentras un dato incorrecto, corrígelo únicamente con la acción administrativa disponible y siguiendo el procedimiento de caja. Si no puedes confirmar qué ocurrió, conserva el registro y escala el caso a quien administra el sistema.</li>
    </ol>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #e9c9c5;border-radius:10px;background:#fff3f1;color:#82443b"><strong>Importante:</strong> no elimines anticipos, no cambies el estado a ciegas ni registres un pago o una entrega duplicados para ocultar la alerta. Primero concilia la orden con el cierre; deja que un administrador resuelva cualquier diferencia no comprobada.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V5 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000011",
    titulo: "Cupones y promociones: creación, uso y errores comunes",
    descripcion: "Configura descuentos, comparte cupones QR y resuelve los motivos por los que un cupón puede rechazarse.",
    contenido: `<div style="padding:20px;border:1px solid #ead7e5;border-radius:16px;background:linear-gradient(135deg,#fff4f8,#f2faff)">
  <p style="margin:0 0 16px;color:#425a70;font-size:16px;line-height:1.7">En <strong style="color:#a33d73">Promociones</strong>, un administrador puede crear descuentos y convertirlos en cupones QR para compartirlos con clientes y aplicarlos al crear una orden.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #ead7e5;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#843561">Crear o editar</h3><p style="margin:0;color:#526a80;line-height:1.7">Pulsa <strong>Nueva Promoción</strong> y define nombre, beneficio porcentual o monto fijo, clientes elegibles, fechas y días de aplicación. Activa <strong>Generar cupón QR</strong> si quieres compartirlo; opcionalmente define un máximo de usos por cliente. Guarda y verifica la tarjeta en la pestaña correspondiente.</p></div>
    <div style="padding:16px;border:1px solid #d8e6f1;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#285d8d">Compartir el QR</h3><p style="margin:0;color:#526a80;line-height:1.7">En la pestaña <strong>Cupones</strong>, descarga el QR o selecciona WhatsApp/correo. Busca o escribe el nombre y contacto del destinatario y pulsa <strong>Compartir cupón</strong>. Comprueba el estado y la fecha de vigencia que aparecen en la tarjeta.</p></div>
    <div style="padding:16px;border:1px solid #dce8dd;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#36724b">Aplicar en una orden</h3><p style="margin:0;color:#526a80;line-height:1.7">En la creación guiada de una orden, completa los datos del cliente y escanea el QR desde la opción de cupón. El sistema valida la promoción, los requisitos del cliente y los usos disponibles antes de aplicarla.</p></div>
  </div>
  <div style="margin-top:16px;padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Si el cupón no se acepta</h3>
    <ul style="margin:0;padding-left:22px;color:#526a80;line-height:1.8">
      <li><strong>“Promoción expirada” o “todavía no está disponible”:</strong> revisa las fechas de inicio y fin; edita la promoción si se ingresaron mal.</li>
      <li><strong>“Promoción inactiva”:</strong> un administrador debe revisar que esté marcada como vigente.</li>
      <li><strong>“No aplica hoy” o “no aplica a este cliente”:</strong> confirma el día configurado, el teléfono del cliente, si está registrado y si cumple el mínimo de órdenes cuando se limita a recurrentes.</li>
      <li><strong>Se excedió el máximo de usos:</strong> revisa el límite por cliente y las órdenes asociadas; no cambies el teléfono para evadir el límite.</li>
      <li><strong>QR inválido:</strong> confirma que sea el QR de un cupón de Lavandería Salinas y vuelve a generarlo o descargarlo desde la tarjeta correcta.</li>
      <li><strong>No se puede abrir la cámara:</strong> concede permiso de cámara a la aplicación. Si el problema continúa, comparte el QR y solicita que un administrador revise el caso.</li>
    </ul>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #e9c9c5;border-radius:10px;background:#fff3f1;color:#82443b"><strong>Importante:</strong> no apliques manualmente un descuento para sustituir un cupón rechazado sin autorización. Verifica las condiciones y confirma el beneficio antes de finalizar la orden.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V6 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000012",
    titulo: "Registrar un nuevo miembro del equipo",
    descripcion: "Agrega un usuario, asigna su rol y define su código de acceso y estado.",
    contenido: `<div style="padding:20px;border:1px solid #d5e5ed;border-radius:16px;background:linear-gradient(135deg,#f0faff,#f7f8ff)">
  <p style="margin:0 0 16px;color:#425a70;font-size:16px;line-height:1.7">Un administrador puede dar acceso a un nuevo miembro desde la vista <strong style="color:#176d85">Equipo</strong>. Antes de guardar, confirma que el correo y el rol correspondan a la persona.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">1. Abre el formulario</h3><p style="margin:0;color:#526a80;line-height:1.7">En <strong>Equipo</strong>, pulsa <strong>Agregar usuario</strong>. Completa nombre, correo electrónico y un código de acceso de seis dígitos.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">2. Asigna rol y acceso</h3><p style="margin:0;color:#526a80;line-height:1.7">Selecciona el rol que corresponda: <strong>Administrador</strong>, <strong>Recepcionista</strong>, <strong>Cajero</strong> u <strong>Operador</strong>. Deja activado <strong>Usuario activo</strong> si debe poder ingresar.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">3. Guarda y verifica</h3><p style="margin:0;color:#526a80;line-height:1.7">Pulsa <strong>Agregar usuario</strong> y confirma el aviso de éxito. El nuevo miembro debe usar su correo y su código personal para acceder.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #d6e8dd;border-radius:10px;background:#f2faf4;color:#456653"><strong>Validación del código:</strong> debe contener exactamente seis números. Para roles distintos de administrador, no puede comenzar en cero. Si aparece un aviso de validación, revisa el código y corrígelo antes de guardar.</div>
  <div style="margin-top:10px;padding:13px 15px;border:1px solid #e9c9c5;border-radius:10px;background:#fff3f1;color:#82443b"><strong>Seguridad:</strong> asigna el rol con los permisos mínimos necesarios. No envíes el código de acceso en un reporte ni lo compartas públicamente; entrégalo al miembro por un canal seguro.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000013",
    titulo: "Reportar un error desde la campanita",
    descripcion: "Envía un reporte útil al equipo y consulta su avance en Mis reportes.",
    contenido: `<div style="padding:20px;border:1px solid #d7e5f0;border-radius:16px;background:linear-gradient(135deg,#f0f8ff,#f8f7ff)">
  <p style="margin:0 0 16px;color:#425a70;font-size:16px;line-height:1.7">Si algo no funciona como esperas, puedes avisar desde el menú de la <strong style="color:#176d85">campanita</strong>. Un reporte claro facilita que el equipo pueda reproducir y revisar el problema.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">1. Describe el problema</h3><p style="margin:0;color:#526a80;line-height:1.7">Abre la campanita y selecciona <strong>Reportar problema</strong>. Escribe un tema breve, por ejemplo “No puedo guardar una orden”, y en los detalles indica en qué vista estabas y qué acción intentabas realizar.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">2. Añade datos reproducibles</h3><p style="margin:0;color:#526a80;line-height:1.7">Explica qué esperabas que ocurriera, qué ocurrió en realidad, los pasos anteriores al error, la hora aproximada y el texto exacto del mensaje. Si sucede siempre o solo a veces, indícalo.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">3. Envía y consulta</h3><p style="margin:0;color:#526a80;line-height:1.7">Pulsa <strong>Enviar reporte</strong>. Después vuelve a la campanita y abre <strong>Mis reportes</strong> para consultar si está pendiente, en proceso o resuelto. Si ya funciona, utiliza la acción <strong>Ya funciona</strong> disponible en tu reporte.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #f1dfb8;border-radius:10px;background:#fff8e8;color:#76531d"><strong>Protege la información:</strong> no incluyas códigos de acceso, contraseñas ni datos completos de tarjetas o clientes. Para identificar un caso, describe la vista y comparte solo el número de orden si es necesario y está permitido.</div>
  <div style="margin-top:10px;padding:13px 15px;border:1px solid #dce8ef;border-radius:10px;background:#fff;color:#526a80"><strong>Si no puedes enviar el reporte:</strong> revisa que el tema y los detalles no estén vacíos. Si la app muestra un error de conexión, anota el mensaje y la hora y vuelve a intentarlo cuando el servicio esté disponible.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V7 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000014",
    titulo: "Burbujita IA: cómo aprovecharla de forma segura",
    descripcion: "Aprende qué puede consultar la asistente, cómo hacer buenas preguntas y qué información no compartir.",
    contenido: `<div style="padding:20px;border:1px solid #cfe4eb;border-radius:18px;background:linear-gradient(135deg,#effbff,#f6f4ff)">
  <p style="margin:0 0 16px;color:#38566c;font-size:16px;line-height:1.75">🫧 <strong style="color:#087e8b">Burbujita</strong> es la asistente de consulta de Lavandería Salinas. Puede orientarte sobre las vistas y procedimientos de la app y, según tu rol, ayudarte a interpretar información operativa disponible. No sustituye la revisión del personal ni ejecuta cambios en los registros.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
    <div style="padding:17px;border:1px solid #d7e7ee;border-radius:13px;background:#fff"><h3 style="margin:0 0 9px;color:#123a66">En qué puede ayudar</h3><ul style="margin:0;padding-left:20px;color:#526a80;line-height:1.8"><li>Explicar cómo usar Órdenes, Clientes, Calendario, Inventario, Promociones, Equipo y otras vistas.</li><li>Responder preguntas sobre tareas, productos y promociones usando el conocimiento disponible.</li><li>Buscar una orden si das su número, o identificas al cliente por nombre o teléfono; puede resumir estado, servicios, anticipos, cargos, fotos y movimientos disponibles para tu rol.</li><li>Orientarte sobre una alerta de intervención con los motivos que muestra la app.</li><li>Llevarte a la vista Guía cuando se lo pidas.</li><li>Responder por texto y, si el dispositivo ofrece micrófono/voz, escuchar la pregunta y leer la respuesta.</li></ul></div>
    <div style="padding:17px;border:1px solid #d7e7ee;border-radius:13px;background:#fff"><h3 style="margin:0 0 9px;color:#123a66">Cómo obtener una respuesta útil</h3><ol style="margin:0;padding-left:20px;color:#526a80;line-height:1.8"><li>Abre Burbujita desde el botón flotante de asistencia.</li><li>Pregunta en lenguaje sencillo y menciona la vista o tarea: “¿Cómo registro un anticipo?”</li><li>Para consultar una orden, indica un identificador claro: “¿Qué estado tiene la orden 123?”</li><li>Si la respuesta es general, añade contexto no sensible o pregunta un solo punto a la vez.</li><li>Lee la respuesta completa y confirma cualquier paso en la pantalla correspondiente.</li></ol></div>
  </div>
  <div style="margin-top:14px;padding:16px;border:1px solid #d7e7ee;border-radius:13px;background:#fff"><h3 style="margin:0 0 9px;color:#123a66">Lo que Burbujita no hace</h3><ul style="margin:0;padding-left:20px;color:#526a80;line-height:1.8"><li>No crea, edita, cancela ni elimina órdenes, clientes, pagos, usuarios o inventario; tampoco abre o cierra la caja.</li><li>No puede confirmar que una operación se haya guardado ni realizar acciones en tu nombre.</li><li>No ve necesariamente toda la información de la app. El resumen se filtra por rol; los datos restringidos deben consultarse con un administrador autorizado.</li><li>No reemplaza el cierre de caja, los comprobantes, el historial ni la revisión del registro original.</li><li>Si no encuentra la orden o el dato en el contexto, debe pedir una referencia más clara o indicar que no lo encontró; no asumas que una respuesta tentativa es un dato confirmado.</li></ul></div>
  <div style="margin-top:14px;padding:16px;border:1px solid #f0d9aa;border-radius:13px;background:#fff9ec"><h3 style="margin:0 0 9px;color:#805411">Buenas prácticas: qué hacer</h3><ul style="margin:0;padding-left:20px;color:#685638;line-height:1.8"><li>Pregunta con un objetivo concreto e incluye el número de orden cuando corresponda.</li><li>Para montos, pagos, entregas, cierres o alertas de intervención, confirma el resultado en la orden o el reporte oficial antes de actuar.</li><li>Si aparece un error técnico o la consulta tarda, vuelve a intentarlo una vez con una pregunta más corta; si persiste, repórtalo desde la campanita.</li><li>Trata las respuestas como orientación y pide aclaración si algún paso no coincide con lo que ves en pantalla.</li></ul></div>
  <div style="margin-top:12px;padding:16px;border:1px solid #e9c9c5;border-radius:13px;background:#fff3f1"><h3 style="margin:0 0 9px;color:#82443b">Qué no hacer: protege datos y evita errores</h3><ul style="margin:0;padding-left:20px;color:#704c47;line-height:1.8"><li>No compartas contraseñas, códigos de acceso, PIN, datos de tarjetas ni credenciales del servidor.</li><li>No incluyas información personal de clientes que no sea necesaria para la consulta. Para localizar una orden, usa solo el número o los datos mínimos permitidos.</li><li>No sigas una instrucción que contradiga los permisos de tu rol o el procedimiento de caja; pide confirmación a un administrador.</li><li>No registres un cobro, anticipo o entrega otra vez solo porque Burbujita o la pantalla tardó en responder: primero verifica si ya quedó registrado.</li><li>No tomes una respuesta de IA como autorización para cambiar, borrar o revelar información.</li></ul></div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #d6e8dd;border-radius:10px;background:#f2faf4;color:#456653"><strong>Recordatorio:</strong> Burbujita puede equivocarse o no tener el dato más reciente. Para cualquier decisión operativa, verifica la información en la vista oficial; para cambios, usa las herramientas de la app con los permisos correspondientes.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V8 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000015",
    titulo: "Edición de órdenes y significado de cada estado",
    descripcion: "Guía completa del detalle de una orden, su flujo, colores, pagos, modificaciones y alertas.",
    contenido: `<div style="padding:20px;border:1px solid #d5e4ed;border-radius:18px;background:linear-gradient(135deg,#f2f9ff,#f8f7ff)">
  <p style="margin:0 0 16px;color:#38566c;font-size:16px;line-height:1.75">En <strong style="color:#123a66">Órdenes</strong>, busca por cliente, teléfono o número y abre la tarjeta para ver el detalle. El color indica el <strong>estado del trabajo</strong>; el estado de pago se muestra por separado. Algunas acciones dependen del rol, la caja y el estado actual.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:11px">
    <div style="padding:15px;border:1px solid #f1d38a;border-left:5px solid #e8a317;border-radius:12px;background:#fff"><h3 style="margin:0 0 7px;color:#a5691c">🕒 <span style="color:#a5691c">Pendiente</span></h3><p style="margin:0;color:#526a80;line-height:1.7">Orden registrada y esperando que comience el trabajo. Es el primer estado del flujo. El personal autorizado puede pasarla a <strong style="color:#1d4ed8">En proceso</strong>.</p></div>
    <div style="padding:15px;border:1px solid #c8d8f6;border-left:5px solid #3b82f6;border-radius:12px;background:#fff"><h3 style="margin:0 0 7px;color:#1d4ed8">⚙️ <span style="color:#1d4ed8">En proceso</span></h3><p style="margin:0;color:#526a80;line-height:1.7">El equipo está trabajando en la orden. Al terminar, puede avanzar a <strong style="color:#15803d">Listo</strong>. Operadores pueden avanzar de Pendiente a En proceso y de En proceso a Listo.</p></div>
    <div style="padding:15px;border:1px solid #bfe5cb;border-left:5px solid #16a34a;border-radius:12px;background:#fff"><h3 style="margin:0 0 7px;color:#15803d">✅ <span style="color:#15803d">Listo</span></h3><p style="margin:0;color:#526a80;line-height:1.7">El trabajo está terminado y la orden espera que el cliente la recoja o que se complete la entrega. El siguiente paso normal es <strong style="color:#1f6e7d">Entregado</strong>.</p></div>
    <div style="padding:15px;border:1px solid #b9dfe5;border-left:5px solid #2b8da0;border-radius:12px;background:#fff"><h3 style="margin:0 0 7px;color:#1f6e7d">📦 <span style="color:#1f6e7d">Entregado</span></h3><p style="margin:0;color:#526a80;line-height:1.7">La orden fue entregada. El registro de entrega se relaciona con el turno/caja correspondiente. Después puede quedar <strong style="color:#374151">Cerrada</strong> al concluir el proceso de caja.</p></div>
    <div style="padding:15px;border:1px solid #d5dbe2;border-left:5px solid #6b7280;border-radius:12px;background:#fff"><h3 style="margin:0 0 7px;color:#374151">🔒 <span style="color:#374151">Cerrada</span></h3><p style="margin:0;color:#526a80;line-height:1.7">Orden completada y archivada en el historial. No se muestra como trabajo activo y la mayoría de sus campos de edición quedan bloqueados. Si es necesario recuperarla, un administrador puede usar <strong>Restaurar orden cerrada</strong>: vuelve a Pendiente, elimina el pago del cierre del turno de entrega y conserva anticipos de otros turnos. Revisa la confirmación antes de restaurar.</p></div>
    <div style="padding:15px;border:1px solid #f2caca;border-left:5px solid #dc2626;border-radius:12px;background:#fff"><h3 style="margin:0 0 7px;color:#b91c1c">⛔ <span style="color:#b91c1c">Cancelada</span></h3><p style="margin:0;color:#526a80;line-height:1.7">Orden cancelada; no equivale a una orden Cerrada. La cancelación requiere motivo y permiso de administrador. Al cancelarla, el sistema revierte el inventario asociado, elimina los anticipos y restablece el estado de pago. Confirma el número y el motivo antes de aceptar: no es un simple cambio visual.</p></div>
  </div>
  <div style="margin-top:11px;padding:15px;border:1px solid #e4d7ef;border-left:5px solid #7f1d1d;border-radius:12px;background:#fff"><h3 style="margin:0 0 7px;color:#7f1d1d">Estado histórico: Cerrada-Cancelada</h3><p style="margin:0;color:#526a80;line-height:1.7">Es un estado especial que puede aparecer en registros históricos. No es uno de los pasos normales del flujo actual; si lo encuentras y necesitas corregirlo, consulta con un administrador en lugar de intentar cambiarlo como una orden activa.</p></div>
  <div style="margin-top:16px;padding:16px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Cómo cambiar el estado</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.8">
      <li>Abre el detalle y revisa el estado actual en la barra de progreso.</li>
      <li>Selecciona el siguiente estado disponible. Para usuarios que no son administradores, el flujo normalmente avanza paso a paso; el rol Operador solo puede avanzar Pendiente → En proceso → Listo.</li>
      <li>El cambio a Entregado puede pedir confirmar o registrar el pago y asociar una caja/turno válido, especialmente si la entrega corresponde a una fecha anterior.</li>
      <li>La caja cerrada bloquea acciones operativas para usuarios no administradores. Si un botón está deshabilitado, no intentes eludir esa restricción.</li>
    </ol>
  </div>
  <div style="margin-top:12px;padding:16px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Qué puedes revisar o modificar en el detalle</h3>
    <ul style="margin:0;padding-left:22px;color:#526a80;line-height:1.8">
      <li><strong>Servicios y prendas:</strong> revisa productos y cantidades. Administradores pueden ajustar prendas y añadir o quitar elementos mientras la orden no esté cerrada; quitar un producto puede solicitar una razón.</li>
      <li><strong>Fechas:</strong> el administrador puede corregir creación y entrega mientras no esté cerrada. Guarda el cambio explícitamente.</li>
      <li><strong>Cliente:</strong> los campos editables y el guardado dependen del rol; verifica nombre, teléfono y correo antes de confirmar.</li>
      <li><strong>Cargos y descuentos:</strong> se pueden agregar cargos en órdenes activas. El administrador puede aplicar descuento antes del cierre; no se aplica a órdenes cerradas o canceladas.</li>
      <li><strong>Fotos y notas internas:</strong> agrega evidencia o contexto útil. Las notas son internas; no las confundas con un mensaje enviado al cliente.</li>
      <li><strong>Pagos y anticipos:</strong> revisa monto recibido, saldo, método, comprobante y movimientos. Registrar un anticipo modifica el historial de caja; confirma que no esté ya anotado.</li>
      <li><strong>Acciones adicionales:</strong> según permisos, se puede imprimir el ticket de la orden o de prendas, compartir por WhatsApp o enviar factura por correo.</li>
    </ul>
  </div>
  <div style="margin-top:12px;padding:16px;border:1px solid #dbe5ef;border-radius:13px;background:#f8fbff">
    <h3 style="margin:0 0 9px;color:#123a66">El estado de pago es distinto</h3>
    <p style="margin:0;color:#526a80;line-height:1.8"><strong style="color:#a5691c">Por cobrar</strong> indica que hay saldo pendiente; <strong style="color:#8a5a09">Anticipo</strong> indica que se recibió un pago parcial y queda saldo; <strong style="color:#15803d">Pagado</strong> significa que se completó el pago registrado. Una orden puede estar <strong style="color:#15803d">Lista</strong> y seguir <strong style="color:#a5691c">Por cobrar</strong>: trabajo y pago son datos diferentes. El pago solo puede revertirlo un administrador.</p>
  </div>
  <div style="margin-top:12px;padding:15px;border:1px solid #f0d8ad;border-radius:12px;background:#fff9ed;color:#76531d"><strong>Alerta de intervención:</strong> una orden puede requerir revisión si está Cerrada sin pago completo, si el anticipo no aparece en el cierre asignado o si la entrega no aparece en el cierre. Abre el motivo y compáralo con el historial de caja antes de corregir nada. No repitas pagos/entregas ni borres anticipos para quitar la alerta.</div>
  <div style="margin-top:12px;padding:15px;border:1px solid #e9c9c5;border-radius:12px;background:#fff3f1;color:#82443b"><strong>Antes de confirmar cualquier cambio:</strong> verifica el número de orden, el estado y el importe; revisa el turno activo y explica el motivo cuando se solicite. Si no estás seguro o el cambio afectaría caja o inventario, detente y consulta a un administrador.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V9 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000016",
    titulo: "Caja y Reportes: guía completa de turnos, movimientos e historial",
    descripcion: "Aprende a abrir y cerrar caja, interpretar los totales, registrar gastos y consultar reportes y cierres anteriores.",
    contenido: `<div style="padding:20px;border:1px solid #cfe2eb;border-radius:18px;background:linear-gradient(135deg,#f1faff,#f8f7ff)">
  <p style="margin:0 0 16px;color:#38566c;font-size:16px;line-height:1.75">La vista <strong style="color:#123a66">Reportes</strong> reúne el turno de caja, sus principales cifras, gráficos de ventas, gastos, órdenes y consultas por fecha. También puedes abrir el detalle del turno actual y revisar cierres anteriores. Las secciones y montos visibles pueden variar según tu rol.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">1. Iniciar un turno</h3><p style="margin:0;color:#526a80;line-height:1.75">En el panel superior, pulsa <strong>Iniciar turno</strong>. Cuenta el efectivo físico disponible y registra el monto inicial. Puedes añadir notas, por ejemplo, cambio recibido del turno anterior. Si el turno anterior dejó saldo, se muestra como referencia; confirma el monto real. Los administradores también pueden indicar la fecha de inicio. Pulsa <strong>Iniciar turno</strong> y espera la confirmación.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">2. Consultar caja abierta</h3><p style="margin:0;color:#526a80;line-height:1.75">El panel identifica el número de caja y cuánto tiempo lleva abierto el turno. Pulsa <strong>Ver detalle</strong> para revisar número de caja, usuario, monto inicial, hora de apertura, saldo dejado anteriormente y notas disponibles.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">3. Registrar movimientos</h3><p style="margin:0;color:#526a80;line-height:1.75">Los accesos de <strong>Gasto</strong> y <strong>Depósito</strong> están en las herramientas de la aplicación y pueden depender del rol. Para un gasto, indica monto, tipo y motivo; guarda solo después de verificar la salida real. Para depósitos, usa la vista Depósitos y confirma monto y caja correctos.</p></div>
  </div>
  <div style="margin-top:16px;padding:16px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 10px;color:#123a66">Cómo leer las cifras del turno</h3>
    <div style="display:grid;gap:9px">
      <p style="margin:0;color:#526a80;line-height:1.75"><strong style="color:#16808a">Efectivo en caja:</strong> la tarjeta muestra las ventas del día menos los gastos del turno actual. Úsala como indicador de la vista y no como sustituto del conteo físico.</p>
      <p style="margin:0;color:#526a80;line-height:1.75"><strong style="color:#16808a">Cobrado del turno:</strong> pagos recibidos durante el turno; la tarjeta aclara que no resta los gastos.</p>
      <p style="margin:0;color:#16808a;line-height:1.75"><strong style="color:#16808a">Venta del día:</strong> suma de las órdenes creadas en el turno actual. No es necesariamente igual al efectivo contado ni a los cobros del turno.</p>
      <p style="margin:0;color:#526a80;line-height:1.75"><strong style="color:#16808a">Anticipos del turno:</strong> anticipos de órdenes con saldo pendiente.</p>
      <p style="margin:0;color:#526a80;line-height:1.75"><strong style="color:#16808a">Pendiente de cobrar:</strong> saldo que todavía falta cobrar en las órdenes indicadas.</p>
      <p style="margin:0;color:#526a80;line-height:1.75"><strong style="color:#16808a">Cancelaciones y gastos:</strong> presentan por separado órdenes canceladas y egresos registrados. Revisa cada movimiento antes de sacar conclusiones del total.</p>
    </div>
    <p style="margin:12px 0 0;padding:11px 13px;border-radius:9px;background:#f1f7fb;color:#526a80;line-height:1.7"><strong>Atajo:</strong> pulsa una tarjeta interactiva para bajar a las órdenes o gastos relacionados. Vuelve a pulsarla o usa <strong>Restaurar</strong> en el historial para retirar el filtro.</p>
  </div>
  <div style="margin-top:12px;padding:16px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Gráficos y movimientos</h3>
    <p style="margin:0;color:#526a80;line-height:1.8">Los gráficos resumen ventas por día dentro del rango mostrado y distribuyen órdenes por estado. Usa las flechas para revisar rangos anteriores y volver hacia el actual. La sección <strong>Gastos de caja</strong> lista los egresos del turno con monto, motivo, categoría, fecha, caja, usuario y comprobante si existe. El administrador puede eliminar un gasto desde allí; eliminarlo modifica el registro y no se debe usar para cuadrar diferencias sin comprobar el error.</p>
  </div>
  <div style="margin-top:12px;padding:16px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Historial de órdenes y reportes por fecha</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Usa <strong>Órdenes Activas</strong> para buscar por nombre, teléfono o número y filtrar pagos: Todas, Anticipo, Por cobrar o Pagadas. Seleccionar una fila abre el detalle de la orden.</li>
      <li>Usa <strong>Histórico</strong> para consultar por un periodo desde/hasta. Busca por cliente, número o teléfono y elige qué fecha usar: creación de la orden, pago, anticipo o entrega.</li>
      <li>Aplica filtros por estado: Todas, Pendiente, En proceso, Listo, Entregado, Canceladas o Cerradas. El tipo de fecha elegido determina qué registros entran en el periodo; para pago y anticipo, la ayuda indica que se muestran las operaciones realizadas dentro del rango.</li>
      <li>Revisa los resúmenes de entregados y cobrados y el valor que corresponde al criterio activo. Los cobros parciales pueden aparecer en varios movimientos/fechas, no solo en la fecha de creación de la orden.</li>
      <li>Si una orden aparece con alerta de atención, abre su detalle y compara los anticipos, entrega y turno con el cierre correspondiente.</li>
    </ol>
  </div>
  <div style="margin-top:12px;padding:16px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Terminar turno y cuadrar caja</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Antes del cierre, confirma que los pagos, anticipos, gastos y depósitos del turno estén registrados una sola vez y asociados a la caja correcta.</li>
      <li>Cuenta el efectivo real y pulsa <strong>Terminar turno</strong>. Escribe el monto que efectivamente queda en caja; no copies automáticamente el total de ventas. Añade notas si ayudan a explicar el cierre.</li>
      <li>El administrador puede ajustar la fecha de cierre. Confirma la acción y espera el resultado. Un cajero puede tener permisos limitados y la aplicación puede mostrarle solo la apertura de turno.</li>
      <li>Compara el saldo contado con el <strong>Saldo esperado</strong>. El cierre muestra cobros, depósitos, cancelaciones, gastos, total recaudado y <strong>Diferencia</strong>. Si hay diferencia, revisa los movimientos y órdenes asociadas antes de darla por explicada.</li>
    </ol>
    <p style="margin:12px 0 0;padding:11px 13px;border:1px solid #dce8dd;border-radius:9px;background:#f2faf4;color:#456653;line-height:1.75"><strong>Importante:</strong> el saldo esperado se calcula a partir de la apertura y los movimientos que la app asocia al turno. El depósito reduce el efectivo esperado; los cobros, cancelaciones y gastos afectan el total recaudado. Si el resultado no coincide, no inventes un gasto o depósito para cuadrarlo: localiza primero el movimiento real.</p>
  </div>
  <div style="margin-top:12px;padding:16px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Consultar cierres anteriores</h3>
    <p style="margin:0;color:#526a80;line-height:1.8">Desde <strong>Cierres</strong> abre el historial, filtra por fecha desde/hasta y selecciona una fila para ver el cierre. El detalle incluye quién abrió, apertura, saldo final, saldo esperado, diferencia, órdenes y movimientos. Puedes abrir órdenes asociadas, revisar gastos y descargar el reporte PDF. Si el cierre incluye información de depósito, verifica su estado y motivo en el detalle.</p>
    <p style="margin:10px 0 0;padding:11px 13px;border:1px solid #f1dfb8;border-radius:9px;background:#fff8e8;color:#76531d;line-height:1.75"><strong>Eliminar un cierre:</strong> es una acción administrativa delicada e irreversible. Descarga el PDF o respalda la información, confirma que sea el cierre correcto y entiende que las órdenes no se eliminan. No borres un cierre solo porque presenta una diferencia.</p>
  </div>
  <div style="margin-top:14px;padding:15px;border:1px solid #e9c9c5;border-radius:12px;background:#fff3f1;color:#82443b;line-height:1.8"><strong>Buenas prácticas:</strong> registra cada operación al ocurrir; describe claramente gastos y notas; compara número de caja, usuario y fecha; no dupliques pagos por una pantalla lenta; y si hay un error o una diferencia no explicada, conserva los registros y avisa al administrador. Para un fallo técnico puedes usar <strong>Reportar problema</strong> en la campanita.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V10 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000017",
    titulo: "Enviar avisos y administrar depósitos",
    descripcion: "Comunica novedades desde la campanita y registra o concilia depósitos de caja con comprobantes.",
    contenido: `<div style="padding:20px;border:1px solid #cfe4eb;border-radius:18px;background:linear-gradient(135deg,#effaff,#f8f7ff)">
  <p style="margin:0 0 16px;color:#38566c;font-size:16px;line-height:1.75">Esta guía reúne dos herramientas distintas: <strong style="color:#087e8b">Enviar aviso</strong> distribuye mensajes internos al equipo desde la campanita; <strong style="color:#16805a">Depósitos</strong> registra salidas de efectivo hacia el banco y ayuda a conciliar el dinero de cierres anteriores.</p>
  <div style="padding:17px;border:1px solid #d8e6f1;border-left:5px solid #5685c5;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 10px;color:#285d8d">Enviar un aviso al equipo</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Abre la <strong>campanita</strong> y elige <strong>Enviar aviso</strong>. Esta opción está disponible para administradores y modo desarrollador.</li>
      <li>En <strong>Destinatarios</strong>, selecciona Todos los usuarios, un rol (Administradores, Recepcionistas, Cajeros u Operadores) o Usuario específico. Si eliges una persona, selecciónala en la lista que aparece.</li>
      <li>Escribe un <strong>título</strong> claro y redacta el mensaje. La barra permite negrita, cursiva, subrayado, color, listas con puntos/asteriscos/guiones y emojis informativos.</li>
      <li>Si hace falta, agrega imagen o video mediante su URL y revisa la vista previa para confirmar texto y archivos adjuntos.</li>
      <li>Pulsa <strong>Enviar aviso</strong> una vez y espera. El formulario no permite enviar si falta título o mensaje, o si no seleccionaste el destinatario individual.</li>
    </ol>
    <div style="margin-top:13px;padding:12px 14px;border:1px solid #dce8ef;border-radius:10px;background:#f6fafc;color:#526a80;line-height:1.75"><strong>Después de enviarlo:</strong> los destinatarios pueden abrir la notificación y marcarla como leída. Un administrador puede revisar sus avisos enviados y, según permisos, editar o eliminar un aviso que administra.</div>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #d6e8dd;border-left:5px solid #16805a;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 10px;color:#36724b">Registrar un depósito</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Abre <strong>Depósitos</strong> y confirma que haya un turno de caja abierto. Sin turno abierto, el formulario no permite guardar.</li>
      <li>Escribe el monto real depositado, mayor que cero, y un concepto o referencia, por ejemplo la cuenta bancaria de destino o una referencia de transacción.</li>
      <li>Si corresponde, selecciona una imagen como comprobante. Espera a que cargue y usa el enlace de vista previa para verificarla. Cargar el archivo no guarda por sí solo el depósito: guarda el formulario después.</li>
      <li>Pulsa <strong>Guardar depósito</strong> y confirma el mensaje de éxito. El movimiento queda asociado al turno actual y aparece en <strong>Movimientos del turno</strong>.</li>
    </ol>
    <p style="margin:12px 0 0;padding:11px 13px;border:1px solid #dce8ef;border-radius:9px;background:#f6fafc;color:#526a80;line-height:1.75"><strong>Resumen:</strong> la página muestra cierres anteriores pendientes, depósitos del turno, nómina pendiente y neto disponible. El neto se calcula restando depósitos del turno y nómina pendiente a lo recaudado en cierres pendientes; úsalo como referencia y verifica el dinero y los cierres antes de transferir.</p>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">Revisar cierres anteriores pendientes</h3>
    <p style="margin:0;color:#526a80;line-height:1.8">Si hay cierres pendientes de depósito, la vista puede abrir una revisión con el efectivo disponible calculado. Elige la situación comprobada:</p>
    <ul style="margin:8px 0 0;padding-left:22px;color:#526a80;line-height:1.85">
      <li><strong>“Sí, ya fue depositado”:</strong> registra como depósito el monto que la revisión presenta y marca los cierres pendientes como depositados.</li>
      <li><strong>“La cantidad fue diferente”:</strong> introduce cuánto se depositó realmente y explica por qué difiere, por ejemplo efectivo reservado para cambio. La revisión registra el monto real y actualiza los cierres asociados.</li>
      <li><strong>“Todavía no”:</strong> deja los cierres pendientes para revisarlos después; no se registra un depósito desde esa confirmación.</li>
    </ul>
    <p style="margin:11px 0 0;color:#526a80;line-height:1.8">También puedes revisar movimientos del turno, editar un depósito existente o eliminarlo con confirmación. La eliminación puede devolver los cierres asociados a estado pendiente, así que verifica sus vínculos y el historial antes de hacerlo. El rol Cajero tiene acceso limitado y no ve los resúmenes, historial ni acciones de edición/eliminación de otros depósitos.</p>
  </div>
  <div style="margin-top:13px;padding:14px 16px;border:1px solid #f1dfb8;border-radius:12px;background:#fff8e8;color:#76531d"><strong>Precauciones importantes:</strong> no marques como depositado dinero que aún no se entregó al banco; no inventes un monto para cuadrar un cierre; registra la diferencia y su motivo real. Comprueba el concepto, monto, comprobante y cierres asociados antes de guardar, editar o eliminar.</div>
  <div style="margin-top:11px;padding:14px 16px;border:1px solid #e9c9c5;border-radius:12px;background:#fff3f1;color:#82443b"><strong>Si falla el envío o el guardado:</strong> comprueba si el aviso o depósito ya aparece antes de volver a enviarlo, para evitar duplicados. Si el problema persiste, registra el mensaje y la hora y usa <strong>Reportar problema</strong> en la campanita. No incluyas contraseñas ni códigos de acceso en avisos.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V11 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000018",
    titulo: "Catálogo: categorías, servicios y cada campo",
    descripcion: "Guía completa para recorrer el catálogo, crear y editar categorías y servicios, entender las unidades, los insumos y descargar el PDF.",
    contenido: `<div style="padding:20px;border:1px solid #cfe4eb;border-radius:18px;background:linear-gradient(135deg,#effaff,#f8f7ff)">
  <p style="margin:0 0 16px;color:#38566c;font-size:16px;line-height:1.8">El <strong style="color:#087e8b">Catálogo</strong> define los servicios y precios que el personal puede seleccionar al crear órdenes. Las categorías agrupan los elementos por tipo de trabajo —por ejemplo, Lavado, Planchado o Tintorería— y su color ayuda a reconocerlos. Tómate el tiempo para revisar cada campo: un precio o una unidad incorrectos pueden reflejarse en órdenes nuevas.</p>
  <div style="padding:17px;border:1px solid #d8e6f1;border-left:5px solid #5685c5;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#285d8d">1. Entender la pantalla</h3>
    <ul style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li><strong>Todo:</strong> muestra las categorías como tarjetas. Cada tarjeta indica cuántos elementos contiene; selecciónala para entrar. La flecha regresa a la lista de categorías.</li>
      <li><strong>Servicios:</strong> muestra los servicios agrupados por categoría, con nombre, precio y unidad. Si estás dentro de una categoría, el botón <strong>Categorías</strong> vuelve al resumen.</li>
      <li><strong>Buscar servicio:</strong> aparece en Servicios o dentro de una categoría. Filtra los elementos por nombre mientras escribes.</li>
      <li><strong>Nuevo / Nuevo servicio:</strong> abre el formulario para crear un servicio. <strong>Nueva categoría</strong> crea una agrupación. El lápiz de una tarjeta permite editarla; el lápiz de un servicio abre sus datos.</li>
      <li><strong>Descargar:</strong> genera el catálogo de servicios en PDF, agrupado y con precios/unidades. En móvil puede abrir las opciones para compartir; en navegador, descargarlo o compartirlo si el dispositivo lo permite. No es un reporte de órdenes.</li>
    </ul>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #d6e8dd;border-left:5px solid #16805a;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#36724b">2. Crear una categoría</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Pulsa <strong>Nueva categoría</strong>.</li>
      <li>Escribe un nombre reconocible, por ejemplo “Lavado” o “Servicios extra”. El nombre no debe confundirse con el de otra categoría.</li>
      <li>Pulsa <strong>Crear categoría</strong>. La categoría se mostrará como una tarjeta en Todo.</li>
      <li>Para cambiarla, abre su lápiz, edita el nombre o el color y pulsa <strong>Guardar</strong>. El color distingue visualmente sus elementos.</li>
    </ol>
    <p style="margin:10px 0 0;padding:11px 13px;border:1px solid #f1dfb8;border-radius:9px;background:#fff8e8;color:#76531d;line-height:1.75"><strong>Eliminar categoría:</strong> confirma solo si estás seguro. Eliminarla no borra sus servicios: estos quedan sin categoría, así que reorganízalos después.</p>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">3. Crear o editar un servicio, campo por campo</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li><strong>Nombre:</strong> escribe el nombre que el equipo reconocerá al vender, como “Lavado por kilo”.</li>
      <li><strong>Categoría:</strong> selecciona una existente. Si no hay ninguna, usa <strong>Crear Primera Categoría</strong>; también puedes crear una desde <strong>Nueva</strong> dentro del selector.</li>
      <li><strong>Precio:</strong> introduce el precio base, que puede ser cero o mayor. Revisa moneda y decimales antes de guardar.</li>
      <li><strong>Tipo / unidad:</strong> indica cómo se cobra: <strong>Kilo</strong>, <strong>Libra</strong>, <strong>Pieza</strong>, <strong>Por m²</strong>, <strong>Galón</strong>, <strong>mL</strong> u <strong>Otro</strong> (unidad). Esta elección se muestra junto al precio y orienta cómo capturar la cantidad.</li>
      <li><strong>Clasificación para prendas:</strong> solo aparece en servicios. <strong>Servicio por prenda</strong> indica un servicio aplicado a las prendas capturadas; <strong>Servicio extra</strong> distingue un cargo adicional del servicio habitual.</li>
      <li><strong>Ícono / imagen personalizada:</strong> puedes subir una imagen para identificar el elemento. Si no subes una, se usa un ícono automático según el nombre. <strong>Usar ícono automático</strong> quita la imagen personalizada.</li>
      <li><strong>Descripción:</strong> es opcional; úsala para explicar alcance, condiciones o detalles que ayuden a seleccionar correctamente el servicio.</li>
      <li>Comprueba el resumen y pulsa <strong>Crear Servicio</strong> o <strong>Guardar Cambios</strong>. Si estás editando, <strong>Eliminar</strong> solicita confirmación y elimina el servicio; úsalo con cuidado.</li>
    </ol>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #e5dcf3;border-left:5px solid #8666bb;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#60478a">4. Asociar insumos a un servicio</h3>
    <p style="margin:0;color:#526a80;line-height:1.8">La sección <strong>Insumos del servicio</strong> vincula un servicio con productos ya registrados en Inventario. Al usar el servicio en una orden, las cantidades configuradas se descuentan del inventario.</p>
    <ol style="margin:8px 0 0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Selecciona un producto disponible en el inventario.</li>
      <li>Elige la unidad de consumo compatible (por ejemplo, gramos/kilogramos o mL/litros/galones).</li>
      <li>Escribe cuánto se consume <strong>por orden</strong> y pulsa <strong>Guardar</strong>. La lista muestra el consumo y la unidad en que se controla el stock.</li>
      <li>Para quitar un insumo asociado, usa la <strong>X</strong> de su fila. Verifica cuidadosamente cantidades y unidades para evitar descuentos erróneos.</li>
    </ol>
    <p style="margin:10px 0 0;color:#526a80;line-height:1.75">Si no aparecen productos, regístralos primero en Inventario. Si agregas el mismo insumo otra vez, su cantidad se acumula en la configuración del servicio.</p>
  </div>
  <div style="margin-top:13px;padding:14px 16px;border:1px solid #e9c9c5;border-radius:12px;background:#fff3f1;color:#82443b;line-height:1.8"><strong>Antes de guardar o cambiar precios:</strong> verifica nombre, categoría, precio, unidad y consumo de inventario con la lista autorizada del negocio. Los cambios de catálogo afectan selecciones futuras en las órdenes. Si el catálogo no carga, usa <strong>Reintentar</strong>; no repitas el guardado sin revisar si ya se creó el elemento.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000019",
    titulo: "Paneles de navegador, Facebook y WhatsApp",
    descripcion: "Aprende qué hace cada panel, cómo acomodarlo y qué permisos aplican al navegador y a las redes.",
    contenido: `<div style="padding:20px;border:1px solid #cfe4eb;border-radius:18px;background:linear-gradient(135deg,#effaff,#f8f7ff)">
  <p style="margin:0 0 16px;color:#38566c;font-size:16px;line-height:1.8">Los accesos de <strong style="color:#087e8b">Navegador</strong>, <strong style="color:#0866ff">Facebook</strong> y <strong style="color:#16805a">WhatsApp</strong> abren paneles web dentro de la aplicación de escritorio. Permiten consultar esos sitios sin salir de Lavandería Salinas, pero cada servicio mantiene su propia cuenta, sesión y condiciones de uso.</p>
  <div style="padding:17px;border:1px solid #d8e6f1;border-left:5px solid #5685c5;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#285d8d">Navegador</h3>
    <ul style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Se abre inicialmente en Google. En la versión de escritorio integrada puedes usar las páginas y enlaces del sitio, alternar pestañas, abrir una pestaña nueva con <strong>+</strong> y cerrar pestañas adicionales con <strong>X</strong>. Debe quedar al menos una abierta.</li>
      <li><strong>Colocar a la izquierda / derecha:</strong> sitúa el panel a ese lado para trabajar junto a la vista de la app.</li>
      <li><strong>Maximizar / restaurar:</strong> cambia entre el panel lateral y la pantalla completa.</li>
      <li><strong>Recargar:</strong> vuelve a cargar la página de la pestaña activa. <strong>Minimizar</strong> oculta temporalmente el panel; pulsa de nuevo el botón Navegador para restaurarlo. <strong>Cerrar</strong> lo cierra.</li>
      <li>En versiones que no son la aplicación de escritorio, el botón <strong>Abrir navegador</strong> abre Google en una pestaña del navegador del dispositivo.</li>
    </ul>
    <p style="margin:10px 0 0;color:#526a80;line-height:1.75">El navegador integrado está disponible para administradores.</p>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #d6e8dd;border-left:5px solid #16805a;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#36724b">WhatsApp Web</h3>
    <p style="margin:0;color:#526a80;line-height:1.8">Pulsa el ícono de WhatsApp para abrir WhatsApp Web. En el primer uso, inicia sesión con el método que muestra WhatsApp (por ejemplo, vincular el dispositivo mediante QR desde tu teléfono). Si la sesión vence, vuelve a vincular el equipo desde el sitio oficial. No compartas el QR ni códigos de verificación.</p>
    <p style="margin:8px 0 0;color:#526a80;line-height:1.8">Puedes cambiar el panel a izquierda/derecha, maximizarlo o restaurarlo, recargarlo y cerrarlo. El sitio conserva su propia sesión. En escritorio puede recibir solicitudes de carga o adjuntos iniciadas por funciones de la app, como compartir un cupón; revisa el chat y el contenido antes de enviarlo.</p>
    <p style="margin:8px 0 0;color:#526a80;line-height:1.8">El acceso no se muestra a Operadores. Para usuarios no administradores puede estar deshabilitado cuando las funciones operativas están bloqueadas; si no responde, consulta con el administrador.</p>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #dce8ef;border-left:5px solid #0866ff;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#285d8d">Facebook / Messenger</h3>
    <p style="margin:0;color:#526a80;line-height:1.8">El botón abre Facebook (desde donde puedes usar Messenger si la cuenta y el sitio lo permiten). Inicia sesión en el servicio con la cuenta autorizada. Sus controles permiten ubicar el panel a la izquierda o derecha, maximizar/restaurar, recargar y cerrar. En equipos donde no se integra el panel, ofrece abrir Messenger en una pestaña nueva del navegador.</p>
    <p style="margin:8px 0 0;color:#526a80;line-height:1.8">El acceso está reservado al administrador. La app no cambia la contraseña, los contactos ni la configuración de Facebook.</p>
  </div>
  <div style="margin-top:13px;padding:14px 16px;border:1px solid #f1dfb8;border-radius:12px;background:#fff8e8;color:#76531d;line-height:1.8"><strong>Sesión segura:</strong> cierra la sesión de la red cuando uses un equipo compartido. Verifica destinatario y contenido antes de enviar mensajes o adjuntos; no envíes datos de clientes, contraseñas, PIN ni información de pagos sin autorización. Si un panel queda en blanco, comprueba la conexión e intenta recargar.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000020",
    titulo: "Cambiar mi PIN, nombre o foto de perfil",
    descripcion: "Actualiza la información de tu perfil desde Principal y conoce los límites que protegen la cuenta.",
    contenido: `<div style="padding:20px;border:1px solid #cfe4eb;border-radius:18px;background:linear-gradient(135deg,#effaff,#f8f7ff)">
  <p style="margin:0 0 16px;color:#38566c;font-size:16px;line-height:1.8">Puedes actualizar tu nombre, PIN de acceso y foto desde <strong style="color:#087e8b">Mi perfil</strong>. Abre tu foto o el ícono de usuario del encabezado y elige editar el perfil; en la pantalla Principal también está el acceso a tu perfil.</p>
  <div style="padding:17px;border:1px solid #d8e6f1;border-left:5px solid #5685c5;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#285d8d">Cambiar nombre o PIN</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>En <strong>Nombre</strong>, escribe el nombre correcto. No puede quedar vacío.</li>
      <li>Para cambiar el PIN, escribe el nuevo PIN en <strong>Nuevo PIN de acceso</strong> y vuelve a escribirlo en <strong>Confirmar nuevo PIN</strong>. Si solo quieres cambiar el nombre, deja ambos campos del PIN vacíos.</li>
      <li>El PIN debe tener exactamente <strong>6 dígitos</strong> y no puede ser uno de los códigos prohibidos por el sistema. Para roles que no sean administrador tampoco puede comenzar con 0.</li>
      <li>Pulsa <strong>Guardar cambios</strong> y espera la confirmación. Si aparece un error, corrige los campos indicados; el perfil no se guarda si la confirmación no coincide.</li>
    </ol>
    <div style="margin-top:12px;padding:12px 14px;border:1px solid #e9c9c5;border-radius:10px;background:#fff3f1;color:#82443b;line-height:1.75"><strong>Protege tu PIN:</strong> no lo anotes en avisos ni lo compartas por WhatsApp. El cambio afecta el acceso a tu cuenta; usa un código que puedas recordar y que otras personas no puedan adivinar.</div>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #d6e8dd;border-left:5px solid #16805a;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#36724b">Cambiar o quitar la foto</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Pulsa <strong>Cambiar foto</strong> y selecciona una imagen JPG, PNG o WebP de hasta <strong>5 MB</strong>.</li>
      <li>Espera a que termine la carga. La foto actualizada aparecerá en el encabezado y el perfil.</li>
      <li>Si quieres quitarla, pulsa <strong>Eliminar foto</strong>. El perfil vuelve a mostrar el ícono predeterminado.</li>
    </ol>
    <p style="margin:10px 0 0;padding:11px 13px;border:1px solid #f1dfb8;border-radius:9px;background:#fff8e8;color:#76531d;line-height:1.75"><strong>Límite:</strong> se permiten hasta 2 cambios de foto. Cambiarla y eliminarla consumen cambios; una vez alcanzado el límite, el control queda deshabilitado. El contador indica cuántos cambios quedan.</p>
  </div>
  <div style="margin-top:13px;padding:14px 16px;border:1px solid #dce8ef;border-radius:12px;background:#fff;color:#526a80;line-height:1.8"><strong>Cuenta de desarrollador:</strong> desde la aplicación no se permite cambiar su nombre, PIN ni foto. Si necesitas ayuda con un perfil bloqueado o una actualización fallida, pide apoyo al administrador. No compartas capturas que muestren tu PIN.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

const ARTICULOS_ADICIONALES_V12 = [
  {
    id: "ad7af4d0-219a-4bca-9c10-000000000021",
    titulo: "Apariencia: personalizar colores, imágenes y Login",
    descripcion: "Guía completa para cambiar el fondo de la aplicación, el encabezado, la pantalla de acceso y sus orbes, previsualizar y guardar los cambios.",
    contenido: `<div style="padding:20px;border:1px solid #cfe4eb;border-radius:18px;background:linear-gradient(135deg,#effaff,#f8f7ff)">
  <p style="margin:0 0 16px;color:#38566c;font-size:16px;line-height:1.8">La vista <strong style="color:#087e8b">Apariencia</strong> permite adaptar los colores y las imágenes de la aplicación. Se administra desde <strong>Configuración → Apariencia</strong> y está disponible para administradores. Los cambios de AppShell afectan la navegación y el fondo general; los de Login se muestran al iniciar sesión y durante la verificación de acceso.</p>
  <div style="padding:17px;border:1px solid #d8e6f1;border-left:5px solid #5685c5;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#285d8d">1. AppShell: fondo y encabezado</h3>
    <ul style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li><strong>Color de página:</strong> elige el color base que acompaña el área de trabajo y las vistas de la aplicación.</li>
      <li><strong>Color del header:</strong> cambia el color del encabezado de la navegación principal.</li>
      <li><strong>Imagen de AppShell:</strong> establece una imagen para el ambiente visual de la aplicación. También se utiliza como imagen de marca en el encabezado cuando está configurada.</li>
      <li><strong>Seleccionar imagen:</strong> abre el selector de archivos para cargar una imagen. Mientras se sube, el control indica <strong>Subiendo...</strong> y se desactiva para evitar iniciar otra carga al mismo tiempo.</li>
      <li>También puedes pegar una <strong>URL de imagen</strong> en el campo. Comprueba que sea accesible y que corresponda a una imagen antes de guardar.</li>
      <li><strong>Predeterminado</strong> restaura solo el color o la imagen del campo seleccionado. <strong>Restablecer AppShell</strong> restaura juntos el color de página, el color del header y la imagen.</li>
    </ul>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #d6e8dd;border-left:5px solid #16805a;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#36724b">2. Login: pantalla de acceso</h3>
    <ul style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li><strong>Color de fondo:</strong> modifica el fondo de la pantalla donde la persona ingresa su PIN.</li>
      <li><strong>Imagen de Login:</strong> cambia el logotipo que aparece en la pantalla de acceso. Puedes subir un archivo o pegar una URL en el campo.</li>
      <li>La <strong>vista previa</strong> muestra una aproximación del fondo, la marca, el ingreso del PIN y los orbes. Úsala para revisar la combinación antes de guardar.</li>
      <li><strong>Predeterminado</strong> devuelve al valor inicial únicamente el campo correspondiente; <strong>Restablecer Login</strong> restaura el color y la imagen del acceso juntos.</li>
    </ul>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #e5dcf3;border-left:5px solid #8666bb;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#60478a">3. Orbes del Login</h3>
    <p style="margin:0;color:#526a80;line-height:1.8"><strong>Orbe superior</strong> y <strong>Orbe inferior</strong> cambian los colores de los detalles circulares decorativos que ambientan la pantalla de acceso. No son campos de texto ni modifican usuarios o PINes. Cada botón <strong>Predeterminado</strong> restablece su orbe; <strong>Restablecer Orbes</strong> restablece ambos.</p>
  </div>
  <div style="margin-top:13px;padding:17px;border:1px solid #dce8ef;border-radius:13px;background:#fff">
    <h3 style="margin:0 0 9px;color:#123a66">4. Aplicar y guardar cambios</h3>
    <ol style="margin:0;padding-left:22px;color:#526a80;line-height:1.85">
      <li>Entra a <strong>Configuración → Apariencia</strong>. La pantalla carga los valores guardados para preparar la edición.</li>
      <li>Modifica uno o más colores, introduce una URL de imagen o usa <strong>Seleccionar imagen</strong> para cargar un archivo.</li>
      <li>Revisa la vista previa del Login y confirma que los colores y la imagen se vean como esperas.</li>
      <li>Pulsa <strong>Guardar cambios</strong> y espera el aviso de confirmación. Mientras se guarda, el botón indica <strong>Guardando...</strong> y no permite enviar otra solicitud.</li>
      <li>Si se muestra un error, el aviso explica que no se guardaron los cambios. Comprueba la conexión con el servidor e inténtalo de nuevo.</li>
    </ol>
    <p style="margin:10px 0 0;padding:11px 13px;border:1px solid #d6e8dd;border-radius:9px;background:#f2faf4;color:#456653;line-height:1.75"><strong>Nota sobre las imágenes:</strong> al seleccionar un archivo, la aplicación lo carga y actualiza la configuración de imagen en el servidor. Si además editaste colores u otros campos, pulsa <strong>Guardar cambios</strong> para guardar el conjunto completo.</p>
  </div>
  <div style="margin-top:13px;padding:14px 16px;border:1px solid #f1dfb8;border-radius:12px;background:#fff8e8;color:#76531d;line-height:1.8"><strong>Buenas prácticas:</strong> usa imágenes nítidas y apropiadas para el negocio, revisa que el logotipo contraste con el fondo y evita imágenes con información privada. Los cambios de apariencia son visuales: no cambian los datos de las órdenes, los permisos ni las credenciales. Si quieres descartar lo que preparaste antes de guardar, restablece los campos que cambiaste y confirma el resultado.</div>
</div>`,
    imagenUrl: null,
    videoUrl: null,
  },
];

let asegurarTablaPromise;

const asegurarTabla = async () => {
  if (!asegurarTablaPromise) {
    asegurarTablaPromise = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS guia_articulos (
    id CHAR(36) NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    contenido MEDIUMTEXT NOT NULL,
    imagen_url VARCHAR(2048) NULL,
    video_url VARCHAR(2048) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_guia_actualizado (actualizado_en)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      const [columnas] = await pool.query("SHOW COLUMNS FROM guia_articulos LIKE 'imagen_url'");
      if (columnas.length === 0) {
        await pool.query("ALTER TABLE guia_articulos ADD COLUMN imagen_url VARCHAR(2048) NULL AFTER contenido");
      }
      await pool.query(`CREATE TABLE IF NOT EXISTS guia_configuracion (
        clave VARCHAR(80) NOT NULL,
        valor VARCHAR(255) NOT NULL,
        PRIMARY KEY (clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      const [estadoSemilla] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_iniciales_v1' LIMIT 1",
      );
      if (estadoSemilla.length === 0) {
        for (const articulo of ARTICULOS_INICIALES) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, video_url)
             VALUES (?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_iniciales_v1', 'completado')",
        );
      }
      const [estadoSemillaV2] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v2' LIMIT 1",
      );
      if (estadoSemillaV2.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V2) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v2', 'completado')",
        );
      }
      const [estadoSemillaV3] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v3' LIMIT 1",
      );
      if (estadoSemillaV3.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V3) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v3', 'completado')",
        );
      }
      const [estadoSemillaV4] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v4' LIMIT 1",
      );
      if (estadoSemillaV4.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V4) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v4', 'completado')",
        );
      }
      const [estadoSemillaV5] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v5' LIMIT 1",
      );
      if (estadoSemillaV5.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V5) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v5', 'completado')",
        );
      }
      const [estadoSemillaV6] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v6' LIMIT 1",
      );
      if (estadoSemillaV6.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V6) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v6', 'completado')",
        );
      }
      const [estadoSemillaV7] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v7' LIMIT 1",
      );
      if (estadoSemillaV7.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V7) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v7', 'completado')",
        );
      }
      const [estadoSemillaV8] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v8' LIMIT 1",
      );
      if (estadoSemillaV8.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V8) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v8', 'completado')",
        );
      }
      const [estadoSemillaV9] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v9' LIMIT 1",
      );
      if (estadoSemillaV9.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V9) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v9', 'completado')",
        );
      }
      const [estadoSemillaV10] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v10' LIMIT 1",
      );
      if (estadoSemillaV10.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V10) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v10', 'completado')",
        );
      }
      const [estadoSemillaV11] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v11' LIMIT 1",
      );
      if (estadoSemillaV11.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V11) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v11', 'completado')",
        );
      }
      const [estadoSemillaV12] = await pool.query(
        "SELECT valor FROM guia_configuracion WHERE clave = 'articulos_adicionales_v12' LIMIT 1",
      );
      if (estadoSemillaV12.length === 0) {
        for (const articulo of ARTICULOS_ADICIONALES_V12) {
          await pool.query(
            `INSERT IGNORE INTO guia_articulos
              (id, titulo, descripcion, contenido, imagen_url, video_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articulo.id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
          );
        }
        await pool.query(
          "INSERT IGNORE INTO guia_configuracion (clave, valor) VALUES ('articulos_adicionales_v12', 'completado')",
        );
      }
    })().catch((error) => {
      asegurarTablaPromise = null;
      throw error;
    });
  }
  await asegurarTablaPromise;
};

const texto = (valor, limite) =>
  typeof valor === "string" ? valor.trim().slice(0, limite) : "";

const esDesarrollador = (req) => {
  const rol = String(req.header("x-user-role") || "").toLowerCase();
  const nombre = String(req.header("x-user-name") || "").toLowerCase();
  const userId = String(req.header("x-user-id") || "").toLowerCase();
  return (
    rol === "developer" ||
    rol === "desarrollador" ||
    nombre === "desarrollador" ||
    userId === "dev-mode"
  );
};

const exigirDesarrollador = (req, res) => {
  if (esDesarrollador(req)) return true;
  res.status(403).json({ error: "Solo el modo desarrollador puede administrar la Guía." });
  return false;
};

const leerArticulo = (body) => {
  const titulo = texto(body?.titulo, 180);
  const descripcion = texto(body?.descripcion, 500);
  const contenido = texto(body?.contenido, 30000);
  const imagenUrl = texto(body?.imagenUrl, 2048);
  const videoUrl = texto(body?.videoUrl, 2048);

  if (!titulo || !descripcion || !contenido) {
    return { error: "Completa el título, la descripción y la información del artículo." };
  }
  for (const [etiqueta, valor] of [["imagen", imagenUrl], ["video", videoUrl]]) {
    if (!valor) continue;
    try {
      const url = new URL(valor);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("protocolo");
    } catch {
      return { error: `El enlace de ${etiqueta} debe ser una URL válida que comience con http:// o https://.` };
    }
  }

  return { titulo, descripcion, contenido, imagenUrl: imagenUrl || null, videoUrl: videoUrl || null };
};

const listarArticulos = async (_req, res) => {
  try {
    await asegurarTabla();
    const [articulos] = await pool.query(
      `SELECT id, titulo, descripcion, contenido, imagen_url AS imagenUrl, video_url AS videoUrl,
        creado_en AS creadoEn, actualizado_en AS actualizadoEn
       FROM guia_articulos ORDER BY titulo ASC`,
    );
    return res.json(articulos);
  } catch (error) {
    console.error("Error al cargar artículos de la Guía:", error.message);
    return res.status(500).json({ error: "No se pudieron cargar los artículos de la Guía." });
  }
};

const crearArticulo = async (req, res) => {
  if (!exigirDesarrollador(req, res)) return;
  const articulo = leerArticulo(req.body);
  if (articulo.error) return res.status(400).json({ error: articulo.error });

  try {
    await asegurarTabla();
    const id = randomUUID();
    await pool.query(
      `INSERT INTO guia_articulos (id, titulo, descripcion, contenido, imagen_url, video_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl],
    );
    return res.status(201).json({ id });
  } catch (error) {
    console.error("Error al crear artículo de la Guía:", error.message);
    return res.status(500).json({ error: "No se pudo guardar el artículo." });
  }
};

const actualizarArticulo = async (req, res) => {
  if (!exigirDesarrollador(req, res)) return;
  const articulo = leerArticulo(req.body);
  if (articulo.error) return res.status(400).json({ error: articulo.error });

  try {
    await asegurarTabla();
    const [resultado] = await pool.query(
      `UPDATE guia_articulos SET titulo = ?, descripcion = ?, contenido = ?, imagen_url = ?, video_url = ?
       WHERE id = ?`,
      [articulo.titulo, articulo.descripcion, articulo.contenido, articulo.imagenUrl, articulo.videoUrl, req.params.id],
    );
    if (!resultado.affectedRows) return res.status(404).json({ error: "No se encontró ese artículo." });
    return res.json({ ok: true });
  } catch (error) {
    console.error("Error al actualizar artículo de la Guía:", error.message);
    return res.status(500).json({ error: "No se pudo actualizar el artículo." });
  }
};

const eliminarArticulo = async (req, res) => {
  if (!exigirDesarrollador(req, res)) return;
  try {
    await asegurarTabla();
    const [resultado] = await pool.query("DELETE FROM guia_articulos WHERE id = ?", [req.params.id]);
    if (!resultado.affectedRows) return res.status(404).json({ error: "No se encontró ese artículo." });
    return res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar artículo de la Guía:", error.message);
    return res.status(500).json({ error: "No se pudo eliminar el artículo." });
  }
};

module.exports = { listarArticulos, crearArticulo, actualizarArticulo, eliminarArticulo };
