import { playerModes, preloadingTypes } from '../../../commons/types'
import { isIncognito, isPreloadAllowed, mustUseStarterSrc } from '../../../commons/userAgent'
import { isInViewport } from '../../../commons/util'
import DaiController from '../DaiController'
import { STARTER_SRC_URL } from '../model'

const { PREVIEW } = playerModes

export function initPlayer(player) {
  return () => {
    const { isAutoplay } = player.state

    player.initFullScreen()
    player.initWindow()
    player.initIncognito()
    player.initDai() 
    player.initSrc() 

    if(isAutoplay) {
      player.startPlayer()
    } else {
      player.initPreloading()
    }

    player.exposePlayer()
  }
}

export function initFullScreen(player) {
  return () => {
    const video = player.videoInstance && player.videoInstance.getRef()

    if(typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', player.handleFullScreenChange)
      document.addEventListener('mozfullscreenchange', player.handleFullScreenChange)
      document.addEventListener('webkitfullscreenchange', player.handleFullScreenChange)
      document.addEventListener('MSFullscreenChange', player.handleFullScreenChange)
    }
    if(video) {
      // https://developer.apple.com/library/content/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/ControllingMediaWithJavaScript/ControllingMediaWithJavaScript.html

      // https://developer.apple.com/library/content/samplecode/HTML5VideoEventFlow/Listings/events_js.html#//apple_ref/doc/uid/DTS40010085-events_js-DontLinkElementID_5
      video.addEventListener('webkitbeginfullscreen', player.handleFullScreenChange)
      video.addEventListener('webkitendfullscreen', player.handleFullScreenChange)
    }

    player.handleFullScreenChange()
  }
}

export function initWindow(player) {
  return () => {
    if(typeof window !== 'undefined') {
      window.addEventListener('click', player.handleWindowClick)
      window.addEventListener('resize', player.handleWindowResize)
    }
    player.handleWindowResize()
  }
}

export function initIncognito(player) {
  return () => {
    const { logger } = player.props

    try {
      isIncognito()
      .then((result) => player.setState({
        isIncognito: result
      }))
      .catch((error) => player.setState({
        isIncognito: false
      }))
    } catch(error) {
      logger.warn(`Error al averiguar si se está en incógnito/privado`, error)
    }
  }
}

export function initDai(player) {
  return () => {
    const { csai: { isEnabled }, isLive } = player.state

    if(isLive && !isEnabled){
      const logger = player.getLogger('dai')
      const video = player.videoInstance && player.videoInstance.getRef()
      const ads = player.adsInstance && player.adsInstance.getRef()

      if(video) {
        if(!player.daiController) {
          player.daiController = new DaiController()
        }
        player.daiController.init(video, ads, player.handleDaiStreamEvent)
        .then(() => null)
        .catch((error) => logger.error(`Error al inicializar el controlador de DAI`, error))
      } else {
        logger.error(`No se ha podido inicializar DAI porque no se ha encontrado ninguna instancia de <video> disponible`)
      }
    }
  }
}

export function initPreloading(player) {
  return () => {
    const {
      isPreloading,
      preloading: {
        isEnabled,
        type
      }
    } = player.state

    const { LAZY, ON_LOAD } = preloadingTypes

    if(!isPreloading && isEnabled && isPreloadAllowed()) {
      switch(type) {
        case LAZY:
          const handleScroll = (e) => {
            if(player.ref && isInViewport(player.ref)) {
              window.removeEventListener('scroll', handleScroll)
              player.preload()
            }
          }
          if(player.ref && isInViewport(player.ref)) {
            player.preload()
          } else if(typeof window !== 'undefined') {
            window.addEventListener('scroll', handleScroll)
          }
          break
        case ON_LOAD:
          player.preload()
          break
      }
    }
  }
}

export function initSrc(player) {
  return () => {
    const {
      isContentStarted,
      isMuted,
      mode,
      startSrc
    } = player.state

    if(player.videoInstance) {
      let src = null

      if(startSrc) {
        src = startSrc
      } else if(
        mustUseStarterSrc() && 
        !(isMuted && mode === PREVIEW) && 
        !isContentStarted
      ) {
        src = STARTER_SRC_URL
      }

      if(src) {
        player.videoInstance.setSrc(src)
      }
    }
  }
}
