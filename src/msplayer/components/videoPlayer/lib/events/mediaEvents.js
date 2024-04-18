import { getIosVersion, mustUseHlsJs } from '../../../../commons/userAgent'
import { mediaEvents, contentEvents } from '../../../../commons/types/events'
import { errorTypes, genres, stages } from '../../../../commons/types'
import { STARTER_SRC_URL } from '../../model'

const { 
  CAN_PLAY,
  CAN_PLAY_THROUGH,
  DURATION_CHANGE,
  ENDED,
  ERROR,
  LOAD_START,
  PAUSE,
  PLAY,
  PLAYING,
  PROGRESS,
  SEEKED,
  SEEKING,
  STOPPED,
  SUSPEND,
  TIME_UPDATE,
  VOLUME_CHANGE,
  WAITING
 } = mediaEvents
 const { 
  CONTENT_BUFFERING, 
  CONTENT_ENDED, 
  CONTENT_LOAD_START, 
  CONTENT_PAUSED, 
  CONTENT_PLAY,
  CONTENT_PLAYING,
  CONTENT_STOPPED,
  CONTENT_SEEKED,
  CONTENT_TIME_UPDATED,
  CONTENT_VOLUME_CHANGED,
  CONTENT_WAITING
} = contentEvents
const { ERROR_LIVE_ENDED, ERROR_MEDIA_SUSPEND } = errorTypes
const { ADS } = genres
const { PRE_PLAYER } = stages

export default function handleMediaEvent(player){
  return (eventType, params) => {
    const {
      currentTime,
      duration,
      genre,
      isContentEnded,
      isLive,
      isPlaying,
      stage,
      mediaEventsHistory,
      volume
    } = player.state

    const logger = player.getLogger('event', 'media_event')

    if(genre !== ADS && player.videoInstance && player.videoInstance.getSrc() !== STARTER_SRC_URL) {
      if(eventType !== PROGRESS && eventType !== TIME_UPDATE){
        if(!isLive || eventType !== DURATION_CHANGE) {
          logger.info(`Manejar evento multimedia: ${eventType}`, params)

          if(eventType === CAN_PLAY) {
            player.setState({
              mediaEventsHistory: mediaEventsHistory.concat(eventType)
            })
          }
        }
      }

      switch(eventType){
        case CAN_PLAY_THROUGH:
          player.setState({
            canPlayThrough: true
          })
          break

        case DURATION_CHANGE: {
          const { duration } = params

          if(!isNaN(duration) && duration > 0 && duration !== Infinity) {
            player.setState({ duration })
          }
          break
        }

        case ENDED:
          if(!isLive){
            // Se comprueba el currentTime para evitar falsos positivos
            if(currentTime >= duration - 5){
              player.handleContentEvent(CONTENT_ENDED)
            }
          } else {
            const error = {
              type: ERROR_LIVE_ENDED
            }
            player.sendKibanaLog({ error })
          }
          break

        case ERROR:
          if(stage !== PRE_PLAYER) {
            player.error({ ...params })
          }
          break

        case LOAD_START:
          player.handleContentEvent(CONTENT_LOAD_START)
          break

        case PAUSE:
          if(!isContentEnded) {
            player.handleContentEvent(CONTENT_PAUSED)
          }
          break

        case PLAY: {
          player.handleContentEvent(CONTENT_PLAY)
          break
        }

        case PLAYING: {
          if(!params || params.isPlaying && !params.isAdPlaying) {
            const videoRef = player.videoInstance && player.videoInstance.getRef()
            if(videoRef && videoRef.currentTime > 0 && !videoRef.seeking) {
              player.handleContentEvent(CONTENT_PLAYING)
            }
          }
          break
        }

        case PROGRESS:
          player.handleContentEvent(CONTENT_BUFFERING, {
            buffered: params.buffered
          })
          break

        case SEEKING:
          // El evento seeking del <video> no es fiable, por tanto, se lanza desde player.seek
          break

        case SEEKED:
          player.handleContentEvent(CONTENT_SEEKED)
          break

        case STOPPED:
          player.handleContentEvent(CONTENT_STOPPED)
          break

        case SUSPEND:
          if(!mustUseHlsJs(isLive)) {
            const playIndex = mediaEventsHistory.lastIndexOf(PLAY)
            const pauseIndex = mediaEventsHistory.lastIndexOf(PAUSE)
            const endedIndex = mediaEventsHistory.lastIndexOf(ENDED)
            const errorIndex = mediaEventsHistory.lastIndexOf(ERROR)

            if(playIndex > pauseIndex && playIndex > endedIndex) {
              const iosVersion = getIosVersion()[0]

              if(mediaEventsHistory.includes(CAN_PLAY)) {
                if(errorIndex !== -1 && errorIndex > pauseIndex && errorIndex > endedIndex && playIndex > errorIndex) {

                  player.setState({
                    isPlaying: true
                  }, () => player.error({ 
                    type: ERROR_MEDIA_SUSPEND,
                    info: {
                      ua: navigator.userAgent
                    }
                  }))
                } else if(iosVersion === 10) {
                  player.play()
                }
              } else if(iosVersion === 10) {
                player.pause()

                player.setState({
                  isPlaying: false
                }, () => player.error({ 
                  type: ERROR_MEDIA_SUSPEND,
                  info: {
                    ua: navigator.userAgent
                  }
                }))
              }
            }
          }
          break

        case TIME_UPDATE: {
          const videoRef = player.videoInstance && player.videoInstance.getRef()
          if(
            !isPlaying && 
            videoRef && !videoRef.seeking && 
            params && params.currentTime > 1 &&
            currentTime > 1 && params.currentTime > currentTime
          ) {
            logger.info(`Propagar ContentEvent.CONTENT_PLAYING desde MediaEvent.TIME_UPDATE`)
            player.handleContentEvent(CONTENT_PLAYING)
          }

          player.handleContentEvent(CONTENT_TIME_UPDATED, {
            currentTime: params.currentTime
          })
          break
        }

        case VOLUME_CHANGE:
          if(params.volume !== volume) {
            player.handleContentEvent(CONTENT_VOLUME_CHANGED, {
              volume: params.volume
            })
          }
          break

        case WAITING:
          player.handleContentEvent(CONTENT_WAITING)
          break
      }
    }
  }
}
