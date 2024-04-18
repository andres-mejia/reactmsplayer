import { isAutoplayAllowed, mustUseStarterSrc } from '../../../../commons/userAgent'
import { errorTypes, genres } from '../../../../commons/types'
import { playerEvents } from '../../../../commons/types/events'
import { STARTER_SRC_URL } from '../../model'

const {
  ERROR_STARTER_SRC_PLAYBACK,
  ERROR_STARTER_SRC_NOT_SET,
  ERROR_STARTER_SRC_VIDEO_INSTANCE_NOT_FOUND
} = errorTypes
const { ADS, CONTENT } = genres

export function startMmcPlayer(player) {
  return () => {
    const { 
      isContentPreloaded, 
      isContentStarted, 
      isMuted, 
      startPosition, 
      startSrc 
    } = player.state

    let startingGenre = undefined
    let canPlay = !!(isAutoplayAllowed() || isMuted || isContentStarted || startSrc || isContentPreloaded)

    const startPlayback = () => {
      if(!canPlay) return

      switch(startingGenre) {
        case ADS:
          player.startAds()
          break

        case CONTENT:
          player.startAdsFailed()
          player.startContent(startPosition)
          break
      }
    }

    if(!canPlay || mustUseStarterSrc()) {
      player.playStarterSrc()
      .then(() => {
        canPlay = true
        startPlayback()
      })
      .catch((error) => {
        canPlay = true
        startPlayback()
      })
    }

    if(player.adsInstance && !player.adsInstance.isInitialized) {
      player.adsInstance.init(true)
    }

    player.startData()
    .then((genre) => {
      startingGenre = genre
      startPlayback()
    })
    .catch((error) => player.error(error))
  }
}

export function playStarterSrc(player) {
  return () => {
    const logger = player.getLogger('starter')

    player.propagatePlayerEvent(playerEvents.STARTER_SRC_PLAYBACK_STARTED)

    logger.info(`Play starter src`)

    return new Promise((resolve, reject) => {
      if(player.videoInstance) {
        const src = player.videoInstance.getSrc()
        const videoRef = player.videoInstance.getRef()

        // La URL del starter src debe setearse al montar el player la primera vez
        // para que exista en el momento en el usuario lo arranque
        if(src && src.indexOf(STARTER_SRC_URL) !== -1 && videoRef) {

          const onEnded = () => {
            videoRef.removeEventListener('ended', onEnded)
            videoRef.removeEventListener('error', onError)

            logger.info(`Se ha completado la reproducción del starter src`)

            videoRef.pause()

            player.propagatePlayerEvent(playerEvents.STARTER_SRC_PLAYBACK_ENDED)

            resolve()
          }

          const onError = (e) => {
            videoRef.removeEventListener('ended', onEnded)
            videoRef.removeEventListener('error', onError)

            logger.warn(`Ha habido un error en la reproducción del starter src`, e)

            videoRef.pause()

            player.propagatePlayerEvent(playerEvents.ERROR_STARTER_SRC_PLAYBACK)

            reject({ 
              type: ERROR_STARTER_SRC_PLAYBACK,
              info: {
                code: {
                  media: e && e.target && e.target.error && e.target.error.code
                },
                message: e && e.target && e.target.error && e.target.error.message
              }
            })
          }

          videoRef.addEventListener('ended', onEnded)
          videoRef.addEventListener('error', onError)

          const playPromise = player.videoInstance.getRef().play()
          if(playPromise) {
            playPromise
            .then(() => null)
            .catch((error) => {
              videoRef.removeEventListener('ended', onEnded)
              videoRef.removeEventListener('error', onError)

              reject({ 
                type: ERROR_STARTER_SRC_PLAYBACK,
                info: {
                  code: {
                    media: typeof error === 'string' ? error : error.name
                  },
                  message: typeof error === 'string' ? null : error.message
                }
              })
            })
          }

        } else {
          player.propagatePlayerEvent(playerEvents.STARTER_SRC_PLAYBACK_ERROR)

          player.propagatePlayerEvent(playerEvents.ERROR_STARTER_SRC_PLAYBACK)

          reject({
            type: ERROR_STARTER_SRC_NOT_SET,
            info: { src }
          })
        }
      } else {
        logger.warn(`No se ha podido reproducir el starter src porque no se ha encontrado ninguna instancia de Video`)

        player.propagatePlayerEvent(playerEvents.ERROR_STARTER_SRC_PLAYBACK)

        reject({ type: ERROR_STARTER_SRC_VIDEO_INSTANCE_NOT_FOUND })
      }
    })
  }
}
