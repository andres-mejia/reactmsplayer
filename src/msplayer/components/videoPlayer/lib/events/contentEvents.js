import { isMobileAny } from '../../../../commons/userAgent'
import { contentEvents, globalEvents } from '../../../../commons/types/events'
import {
  genres, playerModes, processes, serviceNames, stages, themes
} from '../../../../commons/types'

const {
  CONTENT_BUFFERING,
  CONTENT_ENDED,
  CONTENT_ERROR,
  CONTENT_LOAD_START,
  CONTENT_MUTED_CHANGED,
  CONTENT_PAUSED,
  CONTENT_PLAY,
  CONTENT_PLAYING,
  CONTENT_PROGRAM_CHANGE,
  CONTENT_SEEKING,
  CONTENT_STOPPED,
  CONTENT_SEEKED,
  CONTENT_TIME_UPDATED,
  CONTENT_VOLUME_CHANGED,
  CONTENT_WAITING,
  PLAYBACK_ENDED
} = contentEvents
const { PLAYER_ENDED, PLAYER_PAUSED, PLAYER_FIRST_FRAME } = globalEvents
const { CONTENT } = genres
const { PREVIEW } = playerModes
const { WAITING } = processes
const { NEXT } = serviceNames
const { END } = stages
const { MOBILE } = themes

export function handleContentEvent(player) {
  return (eventType, params) => {
    const {
      allAdsCompleted,
      cmsId,
      currentTime,
      daiAdPaused,
      genre,
      // id: playerId,
      isAdsEnabled,
      isFirstFramePlayed,
      isFullScreen,
      isLoopEnabled,
      isProcessing,
      isSeeking,
      isVideoGallery,
      mode,
      next,
      playStartTimestamp,
      playedTime,
      services,
      theme
    } = player.state

    const {
      onControlBarVisibleChange, onEnded, onMuteChange, onPause, onPlay
    } = player.props
    const { editorialId } = player.state
    const logger = player.getLogger('event', 'content')

    if (genre === CONTENT) {
      if (eventType !== CONTENT_BUFFERING && eventType !== CONTENT_TIME_UPDATED) {
        logger.info(`Manejar evento de contenido: ${eventType}`, params)
      }

      switch (eventType) {
        case CONTENT_BUFFERING:
          player.setState({
            buffered: params.buffered
          }, () => player.propagateContentEvent(eventType))
          break

        case CONTENT_ENDED:
          if (onEnded) {
            onEnded(editorialId)
          }
          if (isLoopEnabled && mode === PREVIEW) {
            player.seek(0)
          } else {
            // Se envían mediciones pero se espera al contentResumeRequested de los postrolls, si los hubiera
            player.propagateContentEvent(eventType)

            // Si no hay postrolls se da por terminado
            if (allAdsCompleted
              || !isAdsEnabled
              || !player.adsInstance
              || !player.adsInstance.postrollAvaliable()) {
              player.propagateContentEvent(PLAYBACK_ENDED)

              player.clearConcurrencyTimeout()

              if (services[NEXT].response && !!(next && next.isEnabled)) {
                player.playNextVideo()
              } else {
                player.setState({
                  allAdsCompleted: true,
                  isContentEnded: true,
                  isCursorVisible: true,
                  isPlaying: false,
                  isProcessing: false,
                  stage: END
                }, () => {
                  if (isLoopEnabled) {
                    player.seeAgain()
                  } else {
                    if (player.videoInstance) {
                      player.videoInstance.pause()
                    }
                    if ((cmsId === 'mitele' || isMobileAny()) && isFullScreen && !player.isRelatedAutoplayEnabled() && !isVideoGallery) {
                      player.toggleFullScreen()
                    }
                    player.propagateGlobalEvent(PLAYER_ENDED)
                  }
                })
              }
            } else {
              player.setState({
                // Después del post-roll, adEvents.ALL_ADS_COMPLETED
                // se dispara después de adEvents.CONTENT_RESUME_REQUESTED
                allAdsCompleted: true,
                isContentEnded: true
              }, () => (player.adsInstance ? player.adsInstance.handleContentEnded() : null))
            }
          }
          break

        case CONTENT_ERROR:
          player.propagateContentEvent(eventType, params)
          break

        case CONTENT_LOAD_START:
          player.setState({
            canPlayThrough: false
          })
          break

        case CONTENT_MUTED_CHANGED:
          player.setState({ isMuted: params.muted })

          if (onMuteChange) {
            onMuteChange(editorialId, params.muted)
          }
          break

        case CONTENT_PAUSED:
          player.stopProcessing()

          if (onPause) {
            onPause(editorialId)
          }

          player.setState({
            isButtonVisible: true,
            isControlBarVisible: true,
            isPlaying: false
          }, () => {
            if (onControlBarVisibleChange) onControlBarVisibleChange(true)
            player.propagateContentEvent(eventType)
            player.propagateGlobalEvent(PLAYER_PAUSED, currentTime)
          })

          if (theme === MOBILE) {
            player.startHideControlsTimeout()
          }
          break
        
        case CONTENT_PROGRAM_CHANGE:
          player.propagateContentEvent(eventType, params)
          break

        case CONTENT_PLAY:
          player.stopProcessing()
          player.applyPlaybackRequirements()

          if (onPlay) {
            onPlay(editorialId)
          }
          break

        case CONTENT_PLAYING:
          // player.watchFrozenPlayback()
          player.propagateContentEvent(eventType)
          player.stopProcessing()

          player.applyPlaybackRequirements()

          if (isSeeking) {
            player.handleContentEvent(CONTENT_SEEKED)
          }

          if (daiAdPaused) {
            player.setState({
              daiAdPaused: false,
              genre: CONTENT
            })
          }
          player.setState({
            isContentStarted: true,
            isPlaying: true,
            playStartTimestamp: Date.now(),
            recoveryAttempts: 0
          })

          // browserWinMessaging.broadcast({
          //   action: browserWinMessaging.PLAY,
          //   playerId: globalScope.msPlayerId
          // });

          player.startHideControlsTimeout()
          break

        case CONTENT_SEEKING:
          player.setState({
            isPlaying: true,
            isSeeking: true,
            scrubbingPosition: params.seekTarget,
            seekTarget: params.seekTarget
          })
          player.propagateContentEvent(eventType, { ...params })
          break

        case CONTENT_STOPPED:
          player.propagateContentEvent(eventType)
          break

        case CONTENT_SEEKED:
          player.setState({
            isSeeking: false,
            seekTarget: undefined
          }, () => {
            if (player.xdrInstance) {
              player.xdrInstance.storePosition()
            }
          })
          player.propagateContentEvent(eventType)
          break

        case CONTENT_TIME_UPDATED:
          player.setState({
            currentTime: params.currentTime,
            isContentStarted: true,
            isFirstFramePlayed: params.currentTime > 0,
            playedTime: playStartTimestamp
              ? playedTime + (Date.now() - playStartTimestamp) / 1000
              : playedTime,
            playStartTimestamp: Date.now(),
            seekTarget: undefined
          })

          if (!isFirstFramePlayed) {
            player.propagateGlobalEvent(PLAYER_FIRST_FRAME, params.currentTime)
          }
          player.propagateContentEvent(eventType, params)

          if (isProcessing) {
            player.stopProcessing()
          }
          break

        case CONTENT_VOLUME_CHANGED: {
          const { volume } = params

          if (volume <= 0) {
            player.handleContentEvent(CONTENT_MUTED_CHANGED, { muted: true })
          } else {
            player.handleContentEvent(CONTENT_MUTED_CHANGED, { muted: false })

            player.setState({
              volume
            })
          }
          break
        }

        case CONTENT_WAITING:
          player.propagateContentEvent(eventType)
          player.startProcessing(WAITING, 'Esperando...', 300000)
          break

        default:
          break
      }
    }
  }
}

export function handleScrubbingChange(player) {
  return (isScrubbing) => {
    const newState = { isScrubbing }

    if (isScrubbing) {
      newState.isControBarVisible = true
    } else {
      player.startHideControlsTimeout()
    }
    player.setState({ ...newState })
  }
}

export function handleScrubbingPositionChange(player) {
  return (scrubbingPosition) => player.setState({ scrubbingPosition })
}

export function handleSrcChange(player) {
  return (src) => player.setState({ src })
}
