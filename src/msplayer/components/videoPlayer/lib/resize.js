const getSizeClassName = (playerW, playerH) => {
  // Columnas en 1024px (Sugeridas por ellos)
  //  - Cuatro columnas: 241px
  //  - Tres columnas: 328px
  //  - Dos columnas: 502px
  //  - Una columna: 1024px

  // Columnas en 960px
  //  - Cuatro columnas: 225px
  //  - Tres columnas: 307px
  //  - Dos columnas: 470px
  //  - Una columna: 768px

  const isMobile = playerH < 600 // Verificar si es un dispositivo móvil basado en la altura
  const isPortrait = playerH > playerW // Verificar si está en modo retrato basado en la relación de altura y anchura

  if (isMobile && isPortrait) {
    // Dispositivo móvil en modo retrato
    if (playerW < 307) {
      return 'xx-small player-350' // Anchura inferior a 307px en modo retrato
    } else if (playerW < 470) {
      return `x-small${playerW < 350 ? ' player-350' : ''}` // Anchura entre 307px y 470px en modo retrato
    } else {
      return 'small' // Anchura superior a 470px en modo retrato
    }
  }

  // XXS --> 307px <-- XS --> 470px <-- S --> 768px <-- M --> 1024px <-- L
  if (playerW < 307) {
    return 'xx-small player-350' // Anchura inferior a 307px en modo paisaje o no es un dispositivo móvil
  } else if (playerW < 470) {
    return `x-small${playerW < 350 ? ' player-350' : ''}` // Anchura entre 307px y 470px en modo paisaje o no es un dispositivo móvil
  } else if (playerW < 768) {
    return 'small' // Anchura entre 470px y 768px en modo paisaje o no es un dispositivo móvil
  } else if (playerW < 1024) {
    return 'medium' // Anchura entre 768px y 1024px en modo paisaje o no es un dispositivo móvil
  }

  return 'large' // Anchura superior a 1024px en modo paisaje o no es un dispositivo móvil
}

export function handleWindowResize(player){
  return () => {
    if(typeof window !== 'undefined' && player.ref){
      const bounds = player.ref.getBoundingClientRect()

      player.setState({
        playerSize: {
          width: bounds.width,
          height: bounds.height
        },
        sizeClassName: getSizeClassName(bounds.width, bounds.height)
      })
    }
  }
}
