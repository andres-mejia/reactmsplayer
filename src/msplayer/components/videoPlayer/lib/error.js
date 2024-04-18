import { isAutoplayAllowed } from '../../../commons/userAgent'
import { contentEvents, globalEvents, playerEvents } from '../../../commons/types/events'
import { 
  actionFeedbacks, 
  errorCodes, 
  errorMessages, 
  errorTypes, 
  processes,
  stages,
} from '../../../commons/types'

const { CONTENT_ERROR, CONTENT_PAUSED } = contentEvents
const { PLAYER_ERROR: PLAYER_ERROR_GLOBAL } = globalEvents
const { 
  PLAYER_ERROR: PLAYER_ERROR_PLAYER, 
  PLAYER_ERROR_CONTENT_GEOBLOCKED, 
  PLAYER_ERROR_FATAL, 
  PLAYER_ERROR_PLAY 
} = playerEvents

const { ACTION_PAUSE } = actionFeedbacks
const { 
  ERROR_CONFIG_FETCH,
  ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND,
  ERROR_CONFIG_RESPONSE_STREAM_NOT_FOUND,
  ERROR_CONFIG_UNKNOWN,
  ERROR_CONFIG_URL_NOT_FOUND,
  ERROR_CONTENT_GEOBLOCKED,
  ERROR_CONTENT_MULTICHANNEL_GEOBLOCKED,
  ERROR_CONTENT_NOT_ALLOWED,
  ERROR_DAI_INIT,
  ERROR_DAI_REQUEST_STREAM,
  ERROR_DAI_STREAM_NOT_FOUND,
  ERROR_DAI_REQUEST_STREAM_UNKNOWN_EVENT,
  ERROR_DAI_SDK_TIMEOUT,
  ERROR_DAI_CONTROLLER_NOT_FOUND,
  ERROR_DASHJS_SDK_TIMEOUT,
  ERROR_DASHJS,
  ERROR_DASHJS_NOT_SUPPORTED,
  ERROR_DELIVERY_FETCH,
  ERROR_DELIVERY_URL_NOT_FOUND,
  ERROR_DELIVERY_RESPONSE_NO_LOCATIONS,
  ERROR_DRM_CERTIFICATE_FETCH,
  ERROR_DRM_CERTIFICATE_URL_NOT_FOUND,
  ERROR_DRM_GENERIC,
  ERROR_DRM_INIT_DATA_NOT_FOUND,
  ERROR_DRM_KEY_SESSION,
  ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED,
  ERROR_DRM_LICENSE_AUTHORIZATION_DENIED,
  ERROR_DRM_LICENSE_FETCH,
  ERROR_DRM_LICENSE_NOT_FOUND,
  ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS,
  ERROR_CONTENT_NOT_OFFERS_REGION,
  ERROR_CERBERO_FETCH,
  ERROR_CERBERO_SCHEMA,
  ERROR_GATEKEEPER_FETCH,
  ERROR_GATEKEEPER_SCHEMA,
  ERROR_GATEKEEPER_UNKNOWN,
  ERROR_HLSJS_SDK_TIMEOUT,
  ERROR_HLSJS_NOT_SUPPORTED,
  ERROR_HLSJS_INSTANCE_NOT_FOUND,
  ERROR_HLSJS_MEDIA,
  ERROR_HLSJS_NETWORK,
  ERROR_LOCATION_NOT_FOUND,
  ERROR_USER_MAX_SESSIONS_REACHED,
  ERROR_MEDIA_ABORTED,
  ERROR_MEDIA_NETWORK,
  ERROR_MEDIA_DECODE,
  ERROR_MEDIA_SRC_NOT_SUPPORTED,
  ERROR_MEDIA_PLAY_ABORT,
  ERROR_MEDIA_PLAY_NOT_ALLOWED,
  ERROR_MEDIA_PLAY_NOT_SUPPORTED,
  ERROR_MEDIA_PLAY_UNKNOWN,
  ERROR_MEDIA_SUSPEND,
  ERROR_MEDIA_UNKNOWN,
  ERROR_MEDIA_PLAYER_NOT_CREATED,
  ERROR_HLSJS_OTHER_FATAL,
  ERROR_PLAYER_START_TIMEOUT,
  ERROR_RECOVERY_TIMEOUT,
  ERROR_CONFIG_INIT_UNKNOWN,
  ERROR_DELIVERY_INIT_UNKNOWN,
  ERROR_SERVICE_INIT_UNKNOWN,
  ERROR_SERVICES_INIT,
  ERROR_SHAKA_SDK_TIMEOUT,
  ERROR_SHAKA_INSTANCE_NOT_FOUND,
  ERROR_SHAKA_NOT_SUPPORTED,
  ERROR_SHAKA,
  ERROR_STARTER_SRC_NOT_SET,
  ERROR_STARTER_SRC_PLAYBACK,
  ERROR_STARTER_SRC_VIDEO_INSTANCE_NOT_FOUND,
  ERROR_USER_CHECK_PRIVILEGES,
  ERROR_USER_NO_PRIVILEGES,
  ERROR_USER_NOT_LOGGED,
  ERROR_USER_NOT_VALID,
  ERROR_VIDEO_INSTANCE_NOT_FOUND
} = errorTypes
const { RECOVERY_GENERIC_ERROR, RECOVERY_PLAY_ERROR } = processes
const { ERROR } = stages

export function error(player) {
  return (error = { type: errorTypes.ERROR_UNKNOWN }) => {
    const { recoveryAttempts } = player.state

    player.props.logger.warn(` Error ${errorCodes[error.type]} - ${errorMessages[error.type]}`, error)

    player.handleContentEvent(CONTENT_ERROR, { error, recoveryAttempts })

    player.propagatePlayerEvent(PLAYER_ERROR_PLAYER, { error, recoveryAttempts })

    switch(error.type) {
      case ERROR_CONFIG_FETCH: 
        player.genericRecovery(error)
        break

      case ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND:
      case ERROR_CONFIG_RESPONSE_STREAM_NOT_FOUND:
        player.fatalError(error)
        break

      case ERROR_CONFIG_UNKNOWN:
        player.fatalError(error)
        break

      case ERROR_CONFIG_URL_NOT_FOUND:
        player.fatalError(error)
        break

      case ERROR_CONTENT_GEOBLOCKED:
      case ERROR_CONTENT_MULTICHANNEL_GEOBLOCKED:
        player.fatalError(error)
        break

      case ERROR_CONTENT_NOT_ALLOWED:
        player.fatalError(error)
        break

      case ERROR_DAI_INIT:
      case ERROR_DAI_REQUEST_STREAM:
      case ERROR_DAI_STREAM_NOT_FOUND:
      case ERROR_DAI_REQUEST_STREAM_UNKNOWN_EVENT:
      case ERROR_DAI_SDK_TIMEOUT:
      case ERROR_DAI_CONTROLLER_NOT_FOUND:
        player.mediaErrorRecovery(error)
        break

      case ERROR_DASHJS_SDK_TIMEOUT:
        player.mediaErrorRecovery(error)
        break

      case ERROR_DASHJS:
        player.mediaErrorRecovery(error)
        break

      case ERROR_DASHJS_NOT_SUPPORTED:
        player.fatalError(error)
        break

      case ERROR_DELIVERY_FETCH:
        player.genericRecovery(error)
        break
  
      case ERROR_DELIVERY_URL_NOT_FOUND:
        player.fatalError(error)
        break

      case ERROR_DELIVERY_RESPONSE_NO_LOCATIONS:
        player.fatalError(error)
        break

      case ERROR_DRM_CERTIFICATE_FETCH:
          player.fatalError(error)
          break

      case ERROR_DRM_CERTIFICATE_URL_NOT_FOUND:
        player.fatalError(error)
        break

      case ERROR_DRM_GENERIC:
        player.fatalError(error)
        break
      
      case ERROR_DRM_INIT_DATA_NOT_FOUND:
        player.fatalError(error)
        break

      case ERROR_DRM_KEY_SESSION:
        player.fatalError(error)
        break

      case ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED:
        player.fatalError(error)
        break

      case ERROR_DRM_LICENSE_AUTHORIZATION_DENIED:
        player.fatalError(error)
        break

      case ERROR_DRM_LICENSE_FETCH:
        player.fatalError(error)
        break

      case ERROR_DRM_LICENSE_NOT_FOUND:
        player.fatalError(error)
        break

      case ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS:
        player.fatalError(error)
        break

      case ERROR_CONTENT_NOT_OFFERS_REGION:
        player.fatalError(error)
        break

      case ERROR_CERBERO_FETCH:
        player.fatalError(error)
        break

      case ERROR_CERBERO_SCHEMA:
          player.fatalError(error)
          break

      case ERROR_GATEKEEPER_FETCH:
        player.genericRecovery(error)
        break

      case ERROR_GATEKEEPER_SCHEMA:
        player.fatalError(error)
        break

      case ERROR_GATEKEEPER_UNKNOWN:
        player.fatalError(error)
        break

      case ERROR_HLSJS_SDK_TIMEOUT:
        player.fatalError(error)
        break

      case ERROR_HLSJS_NOT_SUPPORTED:
        player.fatalError(error)
        break

      case ERROR_HLSJS_INSTANCE_NOT_FOUND:
        player.fatalError(error)
        break

      case ERROR_HLSJS_MEDIA:
        player.mediaErrorRecovery(error)
        break

      case ERROR_HLSJS_NETWORK:
        player.genericRecovery(error)
        break

      case ERROR_LOCATION_NOT_FOUND:
        player.genericRecovery(error)
        break

      case ERROR_USER_MAX_SESSIONS_REACHED:
        player.fatalError(error)
        break

      case ERROR_MEDIA_ABORTED:
        player.playbackRecovery(error)
        break

      case ERROR_MEDIA_NETWORK:
        player.genericRecovery(error)
        break

      case ERROR_MEDIA_DECODE:
        player.playbackRecovery(error)
        break

      case ERROR_MEDIA_SRC_NOT_SUPPORTED:
        player.mediaErrorRecovery(error)
        break

      case ERROR_MEDIA_PLAY_ABORT:
      case ERROR_MEDIA_PLAY_NOT_ALLOWED:
      case ERROR_MEDIA_PLAY_NOT_SUPPORTED:
      case ERROR_MEDIA_PLAY_UNKNOWN:
        player.actionPlayRecovery(error)
        break

      case ERROR_MEDIA_SUSPEND:
        player.playbackRecovery(error)
        break

      case ERROR_MEDIA_UNKNOWN:
        player.mediaErrorRecovery(error)
        break

      case ERROR_MEDIA_PLAYER_NOT_CREATED:
        player.fatalError()
        break      

      case ERROR_HLSJS_OTHER_FATAL:
        player.mediaErrorRecovery(error)
        break

      case ERROR_PLAYER_START_TIMEOUT:
        player.fatalError(error)
        break

      case ERROR_RECOVERY_TIMEOUT:
        player.fatalError(error)
        break

      case ERROR_CONFIG_INIT_UNKNOWN:
      case ERROR_DELIVERY_INIT_UNKNOWN:
      case ERROR_SERVICE_INIT_UNKNOWN:
          player.genericRecovery(error)
          break

      case ERROR_SERVICES_INIT:
        player.genericRecovery(error)
        break

      case ERROR_SHAKA_SDK_TIMEOUT:
        player.fatalError(error)
        break

      case ERROR_SHAKA_INSTANCE_NOT_FOUND:
        player.fatalError(error)
        break

      case ERROR_SHAKA_NOT_SUPPORTED:
        player.fatalError(error)
        break

      case ERROR_SHAKA:
        player.mediaErrorRecovery(error)
        break

      case ERROR_STARTER_SRC_NOT_SET:
        // No se hace nada, pero de momento no se elimina este caso (2018-01-23)
        break

      case ERROR_STARTER_SRC_PLAYBACK:
        // No se hace nada, pero de momento no se elimina este caso (2018-01-23)
        break

      case ERROR_STARTER_SRC_VIDEO_INSTANCE_NOT_FOUND:
        // No se hace nada, pero de momento no se elimina este caso (2018-03-14)
        break

      case ERROR_USER_CHECK_PRIVILEGES:
      case ERROR_USER_NO_PRIVILEGES:
      case ERROR_USER_NOT_LOGGED:
      case ERROR_USER_NOT_VALID:
        player.fatalError(error)
        break

      case ERROR_VIDEO_INSTANCE_NOT_FOUND:
        player.fatalError(error)
        break

      default:
        player.genericRecovery(error)
        break
    }
  }
}

export function fatalError(player) {
  return (error) => {
    const { logger, onError } = player.props
    const { recoveryAttempts } = player.state

    if(error && error.type === errorTypes.ERROR_CONTENT_GEOBLOCKED) {
      logger.warn(`Contenido geobloqueado`, error)
      player.propagatePlayerEvent(PLAYER_ERROR_CONTENT_GEOBLOCKED, { error, recoveryAttempts })
    } else {
      logger.error(`Error fatal`, { error, recoveryAttempts })
      player.propagatePlayerEvent(PLAYER_ERROR_FATAL, { error, recoveryAttempts })
    }

    player.stopProcessing()

    player.setState({
      error,
      isQosAnalyticsEnabled: false,
      stage: ERROR
    }, () =>  {
      player.propagateGlobalEvent(PLAYER_ERROR_GLOBAL)
    })

    if(onError) onError(error)

    player.handleWindowResize()

    player.sendKibanaLog({ error })

    player.clearConcurrencyTimeout()
  }
}

export function genericRecovery(player) {
  const MAX_ATTEMPTS = 3

  return (error) => {
    const { currentTime, isFullWindow } = player.state

    player.stopProcessing()

    // if(player.state.recoveryAttempts < MAX_ATTEMPTS) {
    //   // let recoveryRemainingTime = player.state.recoveryRemainingTime / 1000

    //   // const interval = window.setInterval( () => {
    //   //   player.setState({
    //   //     processingMessage: `Esperando para volver a intentar en ${Math.round(--recoveryRemainingTime)}s`
    //   //   })
    //   // }, 1000)

    //   // const timeout = window.setTimeout(
    //   //   () => {
    //   //     clearInterval(interval)
    //       player.reset({
    //         isAutoplay: false,
    //         isFullWindow,
    //         recoveryAttempts: player.state.recoveryAttempts + 1,
    //         // recoveryRemainingTime: player.state.recoveryRemainingTime * 2,
    //         startPosition: currentTime && currentTime >= 0 ? currentTime : 0
    //       })
    //   //   },
    //   //   player.state.recoveryRemainingTime
    //   // )

    //   // player.collector.addInterval(interval)
    //   // player.collector.addTimeout(timeout)

    //   // player.startProcessing(RECOVERY_GENERIC_ERROR, '', 300000)

    //   // player.setState({
    //   //   stage: ERROR
    //   // })

    // } else {
      player.fatalError(error)
    // }
  }
}

export function mediaErrorRecovery(player) {
  return (error) => {
    const { logger } = player.props
    const {
      currentLocationIndex,
      currentTime,
      isFullWindow,
      isLive,
      locations
    } = player.state
    const currentLocation = locations[currentLocationIndex]

    player.stopProcessing()

    if(isLive && currentLocation && currentLocation.drm) {
      logger.info(` Al ser un directo con DRM se interpreta que ha habido un cambio de programa`)
      player.switchProgram(undefined, true)
    } else {
      if(locations && locations.length) {
        if(locations.length > currentLocationIndex + 1) {
          logger.info(`Se intenta reproducir la siguiente localización disponible`, locations[currentLocationIndex + 1])

          player.reset({
            currentLocationIndex: currentLocationIndex + 1,
            isAutoplay: isAutoplayAllowed(),
            isFullWindow,
            isQosAnalyticsEnabled: false,
            recoveryAttempts: player.state.recoveryAttempts + 1,
            startPosition: currentTime && currentTime >= 0 ? currentTime : 0
          })
        } else {
          logger.info(` No hay más localizaciones disponibles`)
          player.genericRecovery(error)
        }

      } else {
        logger.info(` No hay localizaciones disponibles`)
        player.fatalError(error)
      }
    }
  }
}

export function playbackRecovery(player) {
  return (error) => {
    const { logger } = player.props

    player.stopProcessing()

    if(player.videoInstance) {
      const { currentTime, isPlaying, recoveryAttempts } = player.state

      if(isPlaying) {
        if(recoveryAttempts < 3) {
          logger.info(` Se intenta volver a iniciar el contenido (${recoveryAttempts})`)
          player.startContent(currentTime)

        } else if(recoveryAttempts < 6) {
          logger.error(` Se ha intentado volver a iniciar el contenido ${recoveryAttempts} veces sin éxito. Se pausa el vídeo para que el usuario lo intente de manera manual`)
          // player.videoInstance.setSrc(null).then(
          //   () => {
          //     // player.showActionFeedback(ACTION_PAUSE)
          //     player.handleContentEvent(CONTENT_PAUSED)

          //     player.setState({
          //       recoveryAttempts: player.state.recoveryAttempts + 1
          //     })

          //     console.error(error.message || `In order to recover from ${error.type}, the user should try to play again`)
          //   },
          //   (error) => player.mediaErrorRecovery(error)
          // )

          player.setState({
            isContentRecoveryNeeded: true,
            recoveryAttempts: recoveryAttempts + 1
          }, () => {
            player.showActionFeedback(ACTION_PAUSE)
            player.handleContentEvent(CONTENT_PAUSED)
          })
        } else {
          logger.warn(` Se han agotado los intentos para recuperar el contenido (${recoveryAttempts})`)
          player.mediaErrorRecovery(error)
        }
      } else if(recoveryAttempts < 6) {
        logger.error(` Se ha intentado volver a iniciar el contenido ${recoveryAttempts} veces sin éxito. Se pausa el vídeo para que el usuario lo intente de manera manual`)

        player.setState({
          isContentRecoveryNeeded: true,
          recoveryAttempts: recoveryAttempts + 1
        }, () => player.handleContentEvent(CONTENT_PAUSED) )
      } else {
        logger.warn(` Se han agotado los intentos para recuperar el contenido (${recoveryAttempts})`)
        player.mediaErrorRecovery(error)
      }
    } else {
      logger.warn(` No se encuentra la instancia de <video>`)
      player.fatalError(error)
    }
  }
}

export function actionPlayRecovery(player) {
  return (error) => {
    const { recoveryAttempts, startPosition } = player.state

    const logger = player.getLogger('recovery')
    
    logger.error(`No se ha podido completar el inicio de reproducción (${recoveryAttempts})`)

    player.propagatePlayerEvent(PLAYER_ERROR_PLAY, { error, recoveryAttempts })

    const retry = () => {
      if(recoveryAttempts < 5) {
        player.startProcessing(RECOVERY_PLAY_ERROR, 'Recuperando vídeo...')

        player.setState({
          recoveryAttempts: recoveryAttempts + 1
        }, () => {
          try {
            window.setTimeout(() => actionPlayRecovery(error), player.state.recoveryAttempts * player.state.recoveryAttempts * 1000)
          } catch(e) {
            fatalError(error)
          }
        })
      } else {
        fatalError(error)
      }
    }

    player.pause()

    if(recoveryAttempts === 0) {
      logger.warn(`Se requiere acción del usuario para reproducir el vídeo`)

      player.stopProcessing()

      player.setState({
        isContentStarted: true,
        isRecoveryPlay: true,
        recoveryAttempts: recoveryAttempts + 1
      }, () => {
        player.handleContentEvent(CONTENT_PAUSED)
      })

    } else {
      player.requestSrc()
      .then((src) => {
        if(player.videoInstance) {
          logger.info(`Precargar el stream...`)

          player.videoInstance.setSrc(src, startPosition)
          .then(() => {
            logger.info(`El stream se ha precargado correctamente: ${src}`)

            player.stopProcessing()

            player.setState({
              // isContentRecoveryNeeded: !!(recoveryAttempts > 1),
              isContentStarted: true,
              isRecoveryPlay: true,
              recoveryAttempts: recoveryAttempts + 1
            }, () => {
              player.pause(false)
              // player.showActionFeedback(ACTION_PAUSE)
              player.handleContentEvent(CONTENT_PAUSED)
            })
          })
          .catch((error) => {
            logger.error(`No se ha podido precargar el contenido porque ha habido un error al asignar el stream ${src}`, error)

            retry()
          })
        }
      })
      .catch((error) => {
        logger.warn(`No se ha podido precargar el contenido porque ha habido un error al recuperar la URL del stream`, error)

        retry()
      })
    }
  }
}
