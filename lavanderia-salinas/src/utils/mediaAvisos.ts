const obtenerUrlHttp = (valor: string) => {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

export const esUrlDrive = (valor: string): boolean => {
  const url = obtenerUrlHttp(valor)
  return url?.hostname.toLowerCase().replace(/^www\./, '') === 'drive.google.com'
}

export const obtenerUrlVideoIncrustado = (valor: string): string | null => {
  const url = obtenerUrlHttp(valor)
  if (!url) return null

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host === 'drive.google.com') {
    const videoId = url.pathname.match(/^\/file\/d\/([^/]+)/)?.[1]
      || url.searchParams.get('id')

    if (videoId && /^[\w-]+$/.test(videoId)) {
      return `https://drive.google.com/file/d/${videoId}/preview?mute=1&muted=1&rm=minimal`
    }
  }

  if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host) || host === 'youtu.be') {
    const videoId = host === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]

    if (videoId && /^[\w-]{11}$/.test(videoId)) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?mute=1&playsinline=1&rel=0`
    }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const videoId = url.pathname.match(/(?:^|\/)(\d+)(?:\/|$)/)?.[1]
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}?muted=1&playsinline=1`
    }
  }

  return null
}

export const obtenerUrlVideoDirecto = (valor: string): string | null => {
  const url = obtenerUrlHttp(valor)
  if (!url) return null

  return /\.(?:mp4|webm|ogg|mov|m4v|3gp)$/i.test(url.pathname) ? url.href : null
}

export const esUrlVideoDirecto = (valor: string): boolean => Boolean(obtenerUrlVideoDirecto(valor))

export const esUrlVideo = (valor: string): boolean =>
  Boolean(obtenerUrlVideoIncrustado(valor) || esUrlVideoDirecto(valor))