export function isFullScreen(element) {
  return !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement || (element && element.webkitDisplayingFullscreen))
}

export function enterFullScreen(element) {
  if(element){
    let success = true

    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
    } else if (element.webkitEnterFullscreen) {
      element.webkitEnterFullscreen()
    } else {
      success = false
    }
    return success
  }
  return false
}

export function exitFullScreen(element) {
  if(typeof document === 'undefined') return false

  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (element && element.webkitExitFullscreen) {
    // Esta comprobación es debido a un caso particular en iPad con el aspa de cierre
    // https://jira.mediaset.es/browse/PLAYER-751
    // Entra aqui pero el metodo element.webkitExitFullscreen() no hace nada
    // Se cambiarmos el orden con document.webkitExitFullscreen() el player en algunos casos en iPad no 
    // sale de fullScreen al finalizar el contenido. De esta forma garantizamos que funciona para todos los casos
    element.webkitExitFullscreen() || (document.webkitExitFullscreen && document.webkitExitFullscreen())
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else {
    return false
  }
  return true
}

export function toggleFullScreen(element) {
  if(typeof document === 'undefined') return false
  
  // Es mas fiable usar esta comprobación en vez de state.isFullScreen
  // porque puede haber habido algún problema al lanzar o salir de pantalla completa,
  // y el estado no haberse enterado.
  // Se podría, además, escuchar el evento "fullscreenchange" (+ prefijos)
  // y actualizar el estado si hay alguna divergencia (sólo si vemos que hace falta).

  if(isFullScreen(element)) {
    exitFullScreen(element)
  } else{
    return enterFullScreen(element)
  }
  return false
}
