import { waitFor } from '../../../commons/util'
import { playerModes } from '../../../commons/types'
import { createInitialState } from '../model'
import { playerEvents } from '../../../commons/types/events'

const { PREVIEW } = playerModes
const { PLAYER_RESET } = playerEvents

export function playNewVideo(player) {
  return (attributes = {}, canPlay = false) => {
    const { logger } = player.props
    const {
      isAdsEnabled,
      isContentStarted,
      isFullScreen,
      isFullWindow,
      isMuted,
      sessionId,
      volume
    } = player.state
    
    logger.info(`Reproducir un nuevo vídeo`, attributes)

    attributes = {
      ...attributes,
      isNextVideoPlayback: attributes.isNextVideoPlayback === undefined ? false : attributes.isNextVideoPlayback,
      startPosition: attributes.startPosition === undefined ? 0 : attributes.startPosition
    }

    player.reset({
      ...attributes,
      isAdsEnabled,
      isAutoplay: canPlay,
      isContentStarted,
      isFullScreen,
      isFullWindow,
      isMuted,
      sessionId,
      volume
    })
  }
}

export function reset(player) {
  return (attributes = {}) => {
    const { logger } = player.props
    const { isAdsEnabled, sessionId } = player.state

    logger.info(`Resetear player`, attributes)

    player.propagatePlayerEvent(PLAYER_RESET, { ...attributes })

    attributes.sessionId = attributes.sessionId || sessionId

    const merge = function(obj1, obj2) {
      let merged = { ...obj1 }

      for(let key in obj2) {
        const value = obj2[key]

        if(typeof value === 'object' && obj1[key]) {
          merged[key] = merge(obj1[key], value)
        } else{
          merged[key] = value
        }
      }
      return merged
    }

    const initialState = createInitialState(merge(player.initialParsedProps, attributes))

    if(player.videoInstance) {
      player.videoInstance.reset()
    }
    if(player.sparrow) {
      logger.error(`Se cierra la conexión abierta de Sparrow`)

      try {
        player.sparrow.close()
        player.sparrow = null
      }catch(e) {
        logger.error(`Error al cerrar Sparrow`, e)
      }
    }

    player.collector.garbageAll()

    player.setState({
      ...initialState,
      isNextBottonVisible: player.isNextBottonVisible(),
      keyAll: Math.round(Math.random() * 1000000),
      keyAnalytics: Math.round(Math.random() * 1000000)
    },
    () => {
      if(attributes.isAutoplay) {
        waitFor( 
          () => (player.videoInstance && ( player.state.mode === PREVIEW || player.adsInstance || !attributes.isAdsEnabled || !isAdsEnabled ) ) 
        )
        .then(() => player.startPlayer(attributes))
        .catch((error) => logger.error(`No se ha podido iniciar el player porque no se ha encontrado la instancia del componente Video ni la del componente Ads (si aplica)`))
      } else {
        player.initPreloading()
      }
    })
  }
}

export function seeAgain(player) {
  return () => {
    player.playNewVideo({}, true)
  }
}
