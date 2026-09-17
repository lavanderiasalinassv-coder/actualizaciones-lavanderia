import {
  shirtOutline,
  bedOutline,
  footstepsOutline,
  homeOutline,
  cubeOutline,
  colorFillOutline,
  bagHandleOutline,
  waterOutline
} from 'ionicons/icons'

interface ReglaIcono {
  palabras: string[]
  icono: string
}

const REGLAS: ReglaIcono[] = [
  {
    palabras: [
      'camisa', 'camiseta', 'playera', 'polo', 'blusa', 'vestido',
      'chaqueta', 'saco', 'suéter', 'sueter', 'abrigo', 'chumpa', 'top'
    ],
    icono: shirtOutline
  },
  {
    palabras: ['pantalon', 'pantalón', 'jean', 'jeans', 'short', 'falda', 'mezclilla'],
    icono: bagHandleOutline
  },
  {
    palabras: [
      'sabana', 'sábana', 'edredon', 'edredón', 'cobija', 'manta', 'almohada',
      'funda', 'colcha', 'cortina', 'mantel', 'toalla'
    ],
    icono: bedOutline
  },
  {
    palabras: ['zapato', 'tenis', 'sandalia', 'bota', 'calzado', 'zapatilla'],
    icono: footstepsOutline
  },
  {
    palabras: ['tinte', 'tintoreria', 'tintorería', 'planchado', 'lavado', 'seco'],
    icono: waterOutline
  },
  {
    palabras: ['alfombra', 'tapete', 'cojin', 'cojín', 'hogar'],
    icono: homeOutline
  },
  {
    palabras: ['mancha', 'teñido', 'tenido', 'color'],
    icono: colorFillOutline
  }
]

const ICONO_POR_DEFECTO = cubeOutline

export function obtenerIconoPorNombre(nombre: string): string {
  const texto = nombre.toLowerCase()
  for (const regla of REGLAS) {
    if (regla.palabras.some((palabra) => texto.includes(palabra))) {
      return regla.icono
    }
  }
  return ICONO_POR_DEFECTO
}