import {
  shirtOutline,
  bedOutline,
  footstepsOutline,
  homeOutline,
  cubeOutline,
  colorFillOutline,
  bagHandleOutline,
  waterOutline,
  cutOutline,
  flashOutline
} from 'ionicons/icons'

interface ReglaIcono {
  palabras: string[]
  icono: string
}

const REGLAS: ReglaIcono[] = [
  {
    palabras: ['costureria', 'costura', 'costurero', 'costurera', 'bastilla', 'reparacion'],
    icono: cutOutline
  },
  {
    palabras: [
      'camisa', 'camisas', 'camiseta', 'camisetas', 'playera', 'playeras', 'polo', 'polos',
      'blusa', 'blusas', 'vestido', 'vestidos', 'chaqueta', 'chaquetas', 'saco', 'sacos',
      'sueter', 'sueteres', 'abrigo', 'abrigos', 'chumpa', 'chumpas', 'top', 'tops'
    ],
    icono: shirtOutline
  },
  {
    palabras: [
      'pantalon', 'pantalones', 'pantalo', 'jean', 'jeans', 'short', 'shorts', 'falda', 'faldas', 'mezclilla'
    ],
    icono: bagHandleOutline
  },
  {
    palabras: [
      'sabana', 'sabanas', 'edredon', 'edredones', 'cobija', 'cobijas', 'manta', 'mantas',
      'almohada', 'almohadas', 'funda', 'fundas', 'colcha', 'colchas', 'cortina', 'cortinas',
      'mantel', 'manteles', 'toalla', 'toallas'
    ],
    icono: bedOutline
  },
  {
    palabras: [
      'zapato', 'zapatos', 'tenis', 'sandalia', 'sandalias', 'bota', 'botas', 'calzado',
      'zapatilla', 'zapatillas'
    ],
    icono: footstepsOutline
  },
  {
    palabras: ['planchado', 'plancha', 'planchas'],
    icono: flashOutline
  },
  {
    palabras: ['tinte', 'tintoreria', 'lavado', 'lavar', 'secado', 'secar', 'seco'],
    icono: waterOutline
  },
  {
    palabras: ['alfombra', 'alfombras', 'tapete', 'tapetes', 'cojin', 'cojines', 'hogar'],
    icono: homeOutline
  },
  {
    palabras: ['mancha', 'manchas', 'tenido', 'color'],
    icono: colorFillOutline
  }
]

const ICONO_POR_DEFECTO = cubeOutline

export function obtenerIconoPorNombre(nombre: string): string {
  const texto = ` ${nombre
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `
  for (const regla of REGLAS) {
    if (regla.palabras.some((palabra) => texto.includes(` ${palabra} `))) {
      return regla.icono
    }
  }
  return ICONO_POR_DEFECTO
}