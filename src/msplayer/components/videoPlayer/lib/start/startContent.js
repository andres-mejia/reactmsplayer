import { concatSuffix } from '../../../../commons/util'
import { contentEvents } from '../../../../commons/types/events'
import {
  errorTypes,
  genres,
  serviceNames,
  stages,
  streamTypes,
  tokenTypes
} from '../../../../commons/types'

const { CONTENT_START_REQUESTED } = contentEvents
const {
  ERROR_DAI_CONTROLLER_NOT_FOUND,
  ERROR_GATEKEEPER_UNKNOWN,
  ERROR_LOCATION_NOT_FOUND,
  ERROR_DELIVERY_RESPONSE_NO_LOCATIONS,
  ERROR_CONFIG_RESPONSE_STREAM_NOT_FOUND,
  ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND,
  ERROR_CONFIG_UNKNOWN
} = errorTypes
const { CONTENT } = genres
const {
  CONFIG,
  DELIVERY,
  GATEKEEPER,
  GBX,
  SRC
} = serviceNames
const { PLAYBACK } = stages
const { HLS } = streamTypes
const { CDN, DRM } = tokenTypes

export function requestSrc(player) {
  return () => new Promise((resolve, reject) => {
    const {
      currentLocationIndex,
      locations,
      services,
      startSrc
    } = player.state

    const logger = player.getLogger('content')

    logger.info('Recuperar nueva URL tokenizada del stream')

    const currentLocation = locations[currentLocationIndex]

    const doResolve = (baseStreamUrl) => {
      const tokenCdn = player.findToken(
        currentLocation && currentLocation.id,
        CDN
      )
      const tokenDrm = player.findToken(
        currentLocation && currentLocation.id,
        DRM
      )
      if (currentLocation && currentLocation.drm && tokenDrm) {
        currentLocation.drm.token = tokenDrm
      }

      // DAI
      if (currentLocation && currentLocation.type === HLS && currentLocation.assetKey) {
        if (player.daiController) {
          player.daiController.requestUrl(currentLocation.assetKey, player.findAdTagUrl())
            .then((url) => {
              resolve(concatSuffix(url, tokenCdn))
            })
            .catch((error) => {
              doReject(error)
            })
        } else {
          doReject({ type: ERROR_DAI_CONTROLLER_NOT_FOUND })
        }

        // No DAI
      } else {
        resolve(concatSuffix(baseStreamUrl, tokenCdn))
      }
    }

    const doReject = (error) => {
      reject(error)
    }

    // Src
    if (startSrc || services[SRC].url) {
      doResolve(startSrc || services[SRC].url)

      // Delivery
    } else if (services[DELIVERY].response) {
      if (currentLocation) {
        const doResolveGatekeeper = () => {
          player.resolveGatekeeper()
            .then((response) => {
              player.storeServiceResponse({
                name: GATEKEEPER,
                response,
                url: services[GATEKEEPER].url
              })
                .then(() => doResolve(currentLocation.baseUrl))
                .catch((error) => doResolve(currentLocation.baseUrl))
            })
            .catch((error) => {
              doReject({
                type: error.type || ERROR_GATEKEEPER_UNKNOWN,
                info: error.info
              })
            })
        }
        if (!services[GBX].response && services[GBX].url) {
          player.initService(GBX, services[GBX].url, (gbx) => {
            doResolveGatekeeper()
          })
        } else {
          doResolveGatekeeper()
        }
      } else {
        doReject({ type: ERROR_LOCATION_NOT_FOUND })
      }

      // Pending Delivery...
    } else if (services[DELIVERY].url) {
      player.initService(DELIVERY, services[DELIVERY].url, (delivery) => {
        if (delivery.success) {
          if (
            delivery.response.dls
              || Array.isArray(delivery.response.locations) && delivery.response.locations.length > 0
          ) {
            player.requestSrc()
              .then((src) => resolve(src))
              .catch((error) => reject(error))
          } else {
            doReject({
              type: ERROR_DELIVERY_RESPONSE_NO_LOCATIONS,
              info: {
                response: JSON.stringify(delivery.response),
                url: services[DELIVERY].url
              }
            })
          }
        } else {
          doReject({
            type: player.findServiceErrorType(delivery.error.type, DELIVERY),
            info: {
              ...delivery.error.info,
              url: services[DELIVERY].url
            }
          })
        }
      })

      // Pending Config...
    } else {
      player.getServicesInConfig()
        .then((services) => {
          if (services) {
            if (services.src) {
              player.requestSrc()
                .then((src) => resolve(src))
                .catch((error) => reject(error))
            } else if (services.caronte || services.mmc) {
              player.requestSrc()
                .then((src) => resolve(src))
                .catch((error) => reject(error))
            } else {
              doReject({
                type: ERROR_CONFIG_RESPONSE_STREAM_NOT_FOUND,
                info: {
                  response: JSON.stringify(services),
                  url: services[CONFIG].url
                }
              })
            }
          } else {
            doReject({
              type: ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND,
              info: {
                url: services[CONFIG].url
              }
            })
          }
        })
        .catch((error) => {
          doReject({
            ...error,
            type: error.type || ERROR_CONFIG_UNKNOWN,
            info: {
              ...error.info,
              url: services[CONFIG].url
            }
          })
        })
    }
  })
}

export function startContent(player) {
  return (start = 0) => {
    const { logger, onSendRecommendEvent } = player.props
    const {
      concurrency,
      isContentPreloaded,
      stage,
      startPositionPreloaded,
      gad,
      locale
    } = player.state

    if (onSendRecommendEvent && gad && locale) {
      onSendRecommendEvent('WATCH', gad, locale)
    }
    logger.info(`Iniciar contenido en la posición ${start}`)

    const doStartContent = () => {
      player.startContentRequested()

      if (isContentPreloaded && start === startPositionPreloaded) {
        logger.info('Iniciar contenido precargado')

        player.play(null, start)
        player.setState({
          isContentPreloaded: false
        })
        if (concurrency.isEnabled) {
          player.startConcurrencyCheck()
        }
      } else {
        player.requestSrc()
          .then((src) => {
            player.play(src, start)
            if (concurrency.isEnabled) {
              player.startConcurrencyCheck()
            }
          })
          .catch((error) => player.error(error))
      }

      player.handleWindowResize()
    }

    if (stage !== PLAYBACK) {
      player.setState({
        stage: PLAYBACK,
        carouselType: undefined,
        selectedCardIndex: 0,
        isEnabled: false
      }, () => doStartContent())
    } else {
      player.setState({
        carouselType: undefined,
        selectedCardIndex: 0,
        isEnabled: false
      }, () => doStartContent())
    }
  }
}

export function startContentRequested(player) {
  return () => {
    player.startProcessing(null, 'Iniciando contenido...')

    player.propagateContentEvent(CONTENT_START_REQUESTED)

    player.setState({
      genre: CONTENT,
      isContentStarted: false
    })
  }
}
