import { errorTypes, playerModes, processes } from '../../../../commons/types'
import { playerEvents } from '../../../../commons/types/events'
import { sparrow } from '../sparrow'

const { ERROR_CONFIG_URL_NOT_FOUND } = errorTypes
const { PREVIEW } = playerModes
const { PLAYER_START } = processes
const { PLAYER_RESET, PLAYER_START_REQUESTED } = playerEvents

export function startPlayer(player) {
  return (newState) => {
    const { logger, onScreenChange } = player.props
    const {
      id,
      mode,
      services,
      sessionId,
      startSrc,
      isLive,
      isNextVideo,
      nextVideoTitle,
      mediaName,
      episodeName
    } = player.state

    logger.info('Iniciar player', newState)

    const next = () => {
      const configUrl = services.config.url

      player.propagateGlobalEvent('playerPlay', 0)

      if (!window.MSPlayer) window.MSPlayer = {}
      if (window.MSPlayer.activeSessionId && window.MSPlayer.activeSessionId !== sessionId) {
        if (window.MSPlayer.activePlayerId && window.MSPlayer.activePlayerId !== id) {
          // No se propaga desde el método reset porque sólo interesa medir este caso
          window.MSPlayer[window.MSPlayer.activePlayerId].propagatePlayerEvent(PLAYER_RESET)
          window.MSPlayer[window.MSPlayer.activePlayerId].reset()
        }
      }
      window.MSPlayer.activePlayerId = id
      window.MSPlayer.activeSessionId = sessionId

      player.startPlayerRequested()

      player.updateConsents(() => {
        if (startSrc && mode === PREVIEW) {
          player.startContent()
        } else if (configUrl) {
          player.startMmcPlayer(newState)
        } else {
          player.error({ type: ERROR_CONFIG_URL_NOT_FOUND })
        }
        player.handleWindowResize()
      })

      sparrow(player)
    }

    window.EventHandler.addListener('_DIDOMI_Event_Consent_Embed', () => {
      player.updateConsents(() => {})
    })
    
    if (onScreenChange) {
      onScreenChange('none')
    }

    const totalVideosWatched = sessionStorage.getItem('totalVideosWatched')
    if (!totalVideosWatched && !isLive) {
      sessionStorage.setItem('totalVideosWatched', '1')
    } else if (!isLive && !isNextVideo) {
      sessionStorage.setItem('totalVideosWatched', (+totalVideosWatched + 1).toString())
    }

    if (newState) {
      player.setState({
        ...newState,
        currentVideoId: id,
        isVideoPlaying: true,
        isToggleOn: false,
        nextVideoTitle: nextVideoTitle || mediaName || episodeName,
        startPlayerAttr: { ...newState }
      }, () => next())
    } else {
      player.setState({
        currentVideoId: id,
        isToggleOn: false,
        nextVideoTitle: nextVideoTitle || mediaName || episodeName,
        isVideoPlaying: true
      }, () => next())
    }
  }
}

export function startPlayerRequested(player) {
  return () => {
    const { mustStartFullScreen } = player.state

    player.propagatePlayerEvent(PLAYER_START_REQUESTED)

    player.startProcessing(PLAYER_START, 'Inicializando player...')

    player.setState({
      isPreloading: false,
      isStartPlayerRequested: true
    })

    if (mustStartFullScreen) {
      player.enterFullScreen()
    } else {
      player.applyPlaybackRequirements()
    }
  }
}
