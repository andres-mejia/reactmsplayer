import { adEvents, contentEvents, globalEvents } from '../../../../commons/types/events'
import { adGenres, genres, processes, stages } from '../../../../commons/types'
import { STARTER_SRC_URL } from '../../model'
import { isIos } from '../../../../commons/userAgent'

const { 
  AD_PROGRESS, 
  IMA_ADS_MANAGER_CHANGED, 
  AD_ERROR,
  AD_SLOT_STARTED,
  AD_LOADED,
  AD_STARTED,
  AD_BREAK_DISCARDED,
  AD_SLOT_COMPLETED,
  ALL_ADS_COMPLETED,
  CONTENT_PAUSE_REQUESTED,
  CONTENT_RESUME_REQUESTED
} = adEvents

const { CONTENT_PLAYING, CONTENT_ENDED } = contentEvents
const { PLAYER_AD_FINISHED, PLAYER_AD_STARTED } = globalEvents
const { PRE_ROLL, MID_ROLL } = adGenres
const { ADS, CONTENT } = genres
const { AD_SLOT_START } = processes
const { PLAYBACK } = stages

export function handleAdEvent(player){
  return (eventType, params = {}) => {
    if(player.state.stage === PLAYBACK) {
      const {
        csai,
        currentTime,
        editorialId,
        genre,
        isAdsEnabled,
        isContentEnded,
        isContentPreloaded,
        isFullScreen,
        isLive,
        isPlaying,
        seekTarget,
        src,
        srcBeforeAds,
        stage,
        startPosition,
        volume
      } = player.state

      const { onAdsEnd, onAdsStart } = player.props

      const logger = player.getLogger('event', 'ad_event')

      if(isAdsEnabled || (isLive && params.adGenre === MID_ROLL)) {
        if(eventType !== AD_PROGRESS && eventType !== IMA_ADS_MANAGER_CHANGED) {
          logger.info(`Manejar evento de publicidad: ${eventType}`, params)
        }

        switch(eventType){
          case AD_ERROR:
            if(genre === ADS) {
              player.propagateAdEvent(eventType, params)
            }
            break

          case AD_SLOT_STARTED:
            player.propagateAdEvent(eventType, params)

            player.startProcessing(AD_SLOT_START, 'Iniciando anuncios...')

            player.setState({
              // adPodIndex: adPodIndex + 1,
              genre: ADS
            })

            if(isIos() && isFullScreen) {
              player.toggleFullScreen()
            }

            // if(params.adGenre === MID_ROLL) {
            //   player.setState({
            //     midrollIndex: midrollIndex + 1
            //   })
            // }

            player.propagateGlobalEvent(PLAYER_AD_STARTED)
            break

          case AD_LOADED:
          case AD_STARTED:
            player.propagateAdEvent(eventType, params)

            player.stopProcessing()
            break

          case AD_BREAK_DISCARDED:
            player.propagateAdEvent(eventType, params)

            if (isPlaying && csai.isEnabled && isLive && params.adGenre === MID_ROLL) {
              player.propagateContentEvent(CONTENT_PLAYING)
            }
            break

          case AD_SLOT_COMPLETED:
            player.propagateAdEvent(eventType, params)
            player.stopProcessing()
            player.setState({
              genre: CONTENT
            })

            player.propagateGlobalEvent(PLAYER_AD_FINISHED)

            if (isPlaying && csai.isEnabled && isLive && params.adGenre === MID_ROLL){
              player.propagateContentEvent(CONTENT_PLAYING)
            }
            break

          case ALL_ADS_COMPLETED:
            player.setState({
              allAdsCompleted: true
            })
            break

          case CONTENT_PAUSE_REQUESTED: {
            player.applyPlaybackRequirements()

            if(onAdsStart) {
              onAdsStart(editorialId)
            }

            if(params.adGenre === MID_ROLL) {
              const videoElement = player.videoInstance && player.videoInstance.getRef()

              if(videoElement) {
                player.setState({
                  srcBeforeAds: src
                })

                if(isLive && csai.isEnabled) {
                  if(!isIos()) {
                    player.setState({
                      csai: {
                        ...player.state.csai,
                        previousVolume: volume
                      }
                    })
                    videoElement.volume = 0
                  
                  } else {
                    // Para el caso de iOS pausamos el directo
                    player.setState({
                      csai: {
                        ...player.state.csai
                      }
                    })
                    player.pause()
                  }
                }
              }
            } else {
              player.setState({
                srcBeforeAds: null
              })
            }

            if(params.adGenre !== MID_ROLL || !isLive || !csai.isEnabled) {
              player.pause()
            }

            player.propagateAdEvent(eventType, params)
            break
          }

          case CONTENT_RESUME_REQUESTED:
            player.propagateAdEvent(eventType, params)
            player.stopProcessing()

            if(onAdsEnd) {
              onAdsEnd(editorialId)
            }

            if(isContentEnded) {
              player.applyPlaybackRequirements()

              player.handleContentEvent(CONTENT_ENDED)
              player.setState({
                genre: CONTENT
              })
            } else if(stage === PLAYBACK){
              const videoElement = player.videoInstance && player.videoInstance.getRef()

              if(isLive && csai.isEnabled && typeof csai.previousVolume !== 'undefined') {
                if(videoElement) {
                  videoElement.volume = csai.previousVolume
                  player.setState({
                    csai: {
                      ...player.state.csai,
                      previousVolume: undefined
                    }
                  })
                }
              }

              if(isLive && csai.isEnabled && (isPlaying || params.adGenre === MID_ROLL)) {
                // No se hace nada porque el contenido sigue reproduciéndose en segundo plano
                // En caso de iOS reunudamos el stream en el punto de directo
                if(isIos()) {
                  player.startContent()
                }
              } else if(params.adGenre === PRE_ROLL && isContentPreloaded) {
                player.startContent(startPosition)
              } else if(src && src.indexOf(STARTER_SRC_URL) === -1 && src === srcBeforeAds) {
                player.play()
              } else {
                if(typeof seekTarget !== 'undefined') {
                  player.startContent(seekTarget)
                } else {
                  player.startContent(currentTime || startPosition)
                }
              }
            }
            break

          default:
            player.propagateAdEvent(eventType, params)
            break
        }
      }
    }
  }
}
