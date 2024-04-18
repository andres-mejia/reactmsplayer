import {
  exitFullScreen as exitFullScreenElement,
  isEmpty
} from '../../../commons/util'
import { isIos } from '../../../commons/userAgent'
import { contentEvents, globalEvents } from '../../../commons/types/events'
import { actionFeedbacks, genres, playerModes, stages, themes } from '../../../commons/types'
import { STARTER_SRC_URL } from '../model'
import { loadAdPauseInfo, callAdPauseInfo } from './services/ads'

const { 
  CONTENT_ENDED,
  CONTENT_MUTED_CHANGED,
  CONTENT_PAUSED, 
  CONTENT_PLAYING, 
  CONTENT_SEEKING, 
  CONTENT_VOLUME_CHANGED 
} = contentEvents
const { CONTENT } = genres
const { PLAYER_EXIT_PLAYBACK, PLAYER_PLAY  } = globalEvents
const { MITELE_ARTICLE, PREVIEW } = playerModes
const { ERROR } = stages
const { MOBILE } = themes

export function exitPlayback(player) {
  return () => {
    const { isFullScreen, isFullWindow, mode } = player.state
    player.setState({
      showAdPause: false,
      adPauseInfo: {}
    })

    if(isFullScreen) {
      const element = isIos() ? player.videoInstance.getRef() : player.ref
      exitFullScreenElement(element)
    }

    player.pause()

    if(isFullWindow && mode === MITELE_ARTICLE) {      
      player.exitFullWindow()
      player.reset()
    }
    
    // Se llama a player.reset desde fuera
    player.propagateGlobalEvent(PLAYER_EXIT_PLAYBACK)
  }
}

export function canRenderControlBar(player) {
  return () => {
    const {
      mode,
      genre,
      isContentStarted,
      isContentEnded,
      isDialogShareVisible,
      isProcessingChannelChange,
      isProcessingStartOver,
      stage
    } = player.state

    return stage === ERROR && player.isMultichannelEnabled() && player.findMultichannelConfig() || (
      mode != PREVIEW &&
      (genre === CONTENT || stage === ERROR) && 
      (isContentStarted || stage === ERROR) && 
      !isContentEnded && 
      !isDialogShareVisible &&
      // !isProcessingChannelChange &&
      !isProcessingStartOver
    )
  }
}

export function pause(player) {
  return (mustStopLoad) => {
    if(player.videoInstance){
      // NOTA: Descomentar sólo si se detectan fallos en el envío de eventos nativos
      // player.handleContentEvent(CONTENT_PAUSED)
      player.videoInstance.pause(mustStopLoad)
    }
  }
}

export function play(player) {
  return (newSrc, start) => {
    const {
      currentLocationIndex,
      currentTime,
      isContentPreloaded,
      isContentRecoveryNeeded,
      isLive,
      isPlaybackAllowed,
      isRecoveryPlay,
      isStartOverPlayback,
      locations,
      src
    } = player.state

    player.setState({
      isRecoveryPlay: false,
      showAdPause: false,
      adPauseInfo: {}
    })

    if(isPlaybackAllowed) {
      player.applyPlaybackRequirements()

      const currentLocation = locations[currentLocationIndex]

      const resolve = (src) => {
        if(player.videoInstance){
          // NOTA: Descomentar sólo si se detectan fallos en el envío de eventos nativos
          // player.handleContentEvent(CONTENT_PLAYING)
          player.videoInstance.play(src, start)

          player.propagateGlobalEvent(PLAYER_PLAY, currentTime)
        }
      }

      if(newSrc) {
        resolve(newSrc)
      } else {
        start = typeof start !== 'undefined' ? start : currentTime

        if(!src || isContentRecoveryNeeded) {
          player.setState({
            isContentRecoveryNeeded: false
          }, () => player.startContent(start) )

        } else if(src.indexOf(STARTER_SRC_URL) !== -1) {
          player.playStarterSrc()
          .then( () => player.startContent(start) )
          .catch( () => player.startContent(start) )
          
        } else if(isLive && !isRecoveryPlay && !isStartOverPlayback && !isContentPreloaded && (currentLocation && !currentLocation.drm)) {
          player.startContent()

        } else {
          resolve()
        }
      }
    }
  }
}

export function seek(player) {
  return (seekTarget) => {
    if(player.videoInstance){
      const { currentTime, duration } = player.state

      // El evento seeking del <video> no es fiable, por eso se lanza desde aquí
      player.handleContentEvent(CONTENT_SEEKING, {
        currentTime: currentTime,
        seekTarget
      })

      // Seek al final del vídeo
      if(Math.ceil(seekTarget) >= duration) {
        player.handleContentEvent(CONTENT_ENDED)
        player.videoInstance.pause()

      // Seek a cualquier punto que no sea el final del vídeo
      } else {
        player.videoInstance.seek(seekTarget)
      }
    }
  }
}

export function setVolume(player) {
  return (volume) => {
    if(player.videoInstance){
      // NOTA: Descomentar sólo si se detectan fallos en el envío de eventos nativos
      // player.handleContentEvent(CONTENT_VOLUME_CHANGED, { volume })
      player.videoInstance.setMuted(false)
      player.videoInstance.setVolume(volume)
    }
  }
}

export function showActionFeedback(player) {
  return (action) => {
    const { theme } = player.state

    if(theme !== MOBILE) {
      if(player.actionFeedbackInstance) {
        player.actionFeedbackInstance.showFeedback(action)
      }
    }
  }
}

export async function handleGetAdPauseInfo(player) {
  const { adPauseUrl, logger } = player.props
  if (!adPauseUrl) return
  const { adPauseInfo } = player.state

  if (adPauseInfo && isEmpty(adPauseInfo) && callAdPauseInfo(player)) {
    const data = await loadAdPauseInfo(adPauseUrl, logger)
    if (data && data.src) {
      player.setState({
        adPauseInfo: data
      })
    }
  }
}

export function standBy(player) {
  player.setState({
    showAdPause: false,
    adPauseInfo: {}
  })
  return () => player.pause()
}

export function toggleMuted(player) {
  return () => {
    if(player.videoInstance){
      const { isMuted } = player.state

      // El <video> no lanza evento de cambio de mute
      // por eso se lanza desde aquí
      player.handleContentEvent(CONTENT_MUTED_CHANGED, { muted: !isMuted })
      player.videoInstance.setMuted(!isMuted)
    }
  }
}

export function togglePlay(player) {
  return () => {
    const { isPlaying, isProcessingChannelChange } = player.state

    if(!isProcessingChannelChange) {
      if(isPlaying) {
        player.showActionFeedback(actionFeedbacks.ACTION_PAUSE)
        player.pause()
        handleGetAdPauseInfo(player)
        player.setState({
          isPausedByUser: true,
          showAdPause: callAdPauseInfo(player)
        })
      } else {
        player.showActionFeedback(actionFeedbacks.ACTION_PLAY)
        player.play()
        player.setState({
          isPausedByUser: false,
          showAdPause: false,
          adPauseInfo: {}
        })
      }
    }
  }
}

export function toggleStartOver(player) {
  return () => {
    const { isStartOverPlayback } = player.state

    if(isStartOverPlayback) {
      player.startOver(false)
    } else {
      player.startOver(true)
    }
  }
}

export function watchFrozenPlayback(player) {
  return () => {
    // if(player.realPlayingTimeout) {
    //   window.clearTimeout(player.realPlayingTimeout)
    // }
    // player.realPlayingTimeout = window.setTimeout(() => {
    //   const { currentTime: previousTime } = player.state

    //   player.realPlayingTimeout = window.setTimeout(() => {
    //     const { isPlaying } = player.state

    //     if(isPlaying) {
    //       if(Math.floor(previousTime) >= Math.floor(player.state.currentTime)) {
    //         if(player.videoInstance) {
    //           player.videoInstance.setSrc(null)
    //           player.setState({
    //             src: null
    //           }, () => player.play(null, previousTime))
    //         }
    //       }
    //     }
    //   }, 5000)
    // }, 5000)

    // player.collector.addTimeout(player.realPlayingTimeout)
    // player.collector.addProperty('realPlayingTimeout')
  }
}
