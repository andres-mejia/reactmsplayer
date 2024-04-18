import { fetchData } from '../../../../commons/util'
import { errorTypes, serviceNames } from '../../../../commons/types'
import { playerEvents } from '../../../../commons/types/events'

const {
  ERROR_SERVICE_FETCH,
  ERROR_ADS_FETCH,
  ERROR_SERVICE_INIT_UNKNOWN,
  ERROR_ADS_INIT_UNKNOWN,
  ERROR_SERVICE_URL_NOT_FOUND,
  ERROR_ADS_URL_NOT_FOUND,
  ERROR_CONFIG_FETCH,
  ERROR_CONFIG_INIT_UNKNOWN,
  ERROR_CONFIG_URL_NOT_FOUND,
  ERROR_DELIVERY_FETCH,
  ERROR_DELIVERY_INIT_UNKNOWN,
  ERROR_DELIVERY_URL_NOT_FOUND,
  ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND
} = errorTypes
const {
  ADS,
  ANALYTICS,
  CONFIG,
  DELIVERY,
  GATEKEEPER,
  GBX,
  GEOLOCATION,
  MULTICHANNEL,
  NEXT,
  PROGRAM,
  RELATED_VIDEOS,
  SHARE,
  SRC,
  VIDEO_THUMBNAILS,
  XDR
} = serviceNames
const { SERVICE_INIT_STARTED, SERVICE_INIT_ENDED, SERVICE_INIT_ERROR } = playerEvents

export function findServiceErrorType(player) {
  return (type, context) => {
    const model = {
      [ADS]: {
        [ERROR_SERVICE_FETCH]: ERROR_ADS_FETCH,
        [ERROR_SERVICE_INIT_UNKNOWN]: ERROR_ADS_INIT_UNKNOWN,
        [ERROR_SERVICE_URL_NOT_FOUND]: ERROR_ADS_URL_NOT_FOUND
      },
      [CONFIG]: {
        [ERROR_SERVICE_FETCH]: ERROR_CONFIG_FETCH,
        [ERROR_SERVICE_INIT_UNKNOWN]: ERROR_CONFIG_INIT_UNKNOWN,
        [ERROR_SERVICE_URL_NOT_FOUND]: ERROR_CONFIG_URL_NOT_FOUND
      },
      [DELIVERY]: {
        [ERROR_SERVICE_FETCH]: ERROR_DELIVERY_FETCH,
        [ERROR_SERVICE_INIT_UNKNOWN]: ERROR_DELIVERY_INIT_UNKNOWN,
        [ERROR_SERVICE_URL_NOT_FOUND]: ERROR_DELIVERY_URL_NOT_FOUND
      }
    }

    if (!model[context]) {
      return ERROR_SERVICE_INIT_UNKNOWN
    } if (!model[context][type]) {
      return model[context][ERROR_SERVICE_INIT_UNKNOWN]
    }
    return model[context][type]
  }
}

export function initService(player) {
  const MAX_ATTEMPTS = 3
  const ATTEMPT_INTERVAL_BASE = 1000

  return (
    serviceName,
    serviceUrl,
    onComplete = () => null,
    attempt = 1,
    storeResponse = true,
    init
  ) => {
    const logger = player.getLogger('services')

    const storedService = player.state.services[serviceName]

    const reject = (error) => {
      onComplete({
        error,
        name: serviceName,
        success: false
      })
    }

    const resolve = (response, url) => {
      const result = {
        name: serviceName,
        response,
        success: true,
        url
      }
      if (storeResponse) {
        player.storeServiceResponse({ ...result })
          .then(() => onComplete({ ...result }))
          .catch((error) => reject(error))
      } else {
        onComplete({ ...result })
      }
    }

    if (serviceUrl) {
      logger.info(`Recuperar datos del servicio ${serviceName}`, {
        attempt,
        url: serviceUrl
      }, serviceName)
    }

    if (storedService && storedService.response && storedService.url === serviceUrl) {
      logger.info(`El servicio ${serviceName} ya se había pedido, se devuelven los datos almacenados`)

      resolve(storedService.response, storedService.url)
    } else if (serviceUrl) {
      player.propagatePlayerEvent(SERVICE_INIT_STARTED, { serviceName })

      fetchData(serviceUrl, init)
        .then((result) => {
          player.propagatePlayerEvent(SERVICE_INIT_ENDED, { serviceName })

          resolve(result, serviceUrl)
        })
        .catch((error) => {
          player.propagatePlayerEvent(SERVICE_INIT_ERROR, { serviceName })

          if (attempt < MAX_ATTEMPTS) {
            player.collector.addTimeout(window.setTimeout(
              () => player.initService(serviceName, serviceUrl, onComplete, ++attempt, init),
              ATTEMPT_INTERVAL_BASE * attempt
            ))
          } else {
            reject({
              type: ERROR_SERVICE_FETCH,
              info: error.info,
              response: error.response
            })
          }
        })
    } else {
      reject({ type: ERROR_SERVICE_URL_NOT_FOUND })
    }
  }
}

export function initAllServices(player) {
  return (onServiceComplete = () => null) => {
    const { services, startSrc, user } = player.state
    const { url: configUrl } = services[CONFIG]

    const configFailed = (error) => onServiceComplete({
      error,
      name: CONFIG,
      success: false,
      url: configUrl
    })

    const resolveConfigResponse = (response) => {
      if (response.services) {
        // Ads
        player.initService(ADS, response.services.ads, onServiceComplete)

        if (startSrc || response.services.src) {
          // Src
          onServiceComplete({ name: SRC, success: true })
        } else {
          // Delivery
          const deliveryUrl = response.services.caronte || response.services.mmc

          player.initService(DELIVERY, deliveryUrl, (delivery) => {
            onServiceComplete(delivery)

            // Video thumbnails
            if (delivery.success && delivery.response.thumbs && typeof delivery.response.thumbs === 'string') {
              player.initService(VIDEO_THUMBNAILS, delivery.response.thumbs, onServiceComplete)
            }
          })
        }

        // Program info
        player.initService(PROGRAM, response.services.program, onServiceComplete)

        // Analytics
        player.initService(ANALYTICS, response.services.analytics, onServiceComplete)

        // Share
        player.initService(SHARE, response.services.share, onServiceComplete)

        // Related
        player.initService(RELATED_VIDEOS, response.services.related, onServiceComplete)

        // XDR
        if (user && user.UID) {
          player.initService(XDR, response.services.xdr, onServiceComplete)
        }

        // Next
        player.initService(NEXT, response.services.next, onServiceComplete)

        // Gbx
        player.initService(GBX, response.services.gbx, onServiceComplete)

        // Geo
        let headers
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const userId = window.localStorage.getItem('user_id')
            headers = userId ? { 'x-uid': userId } : undefined
          }
        } catch (error) {
          console.log('Error al acceder al localStorage:', error)
        }

        player.initService(
          GEOLOCATION,
          response.services.geo,
          onServiceComplete,
          undefined,
          undefined,
          headers
        )

        // Multi-channel
        player.initService(MULTICHANNEL, response.services.multichannel, onServiceComplete)
      } else {
        configFailed({
          type: ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND,
          info: {
            response: JSON.stringify(response),
            url: configUrl
          }
        })
      }
    }

    if (configUrl) {
      player.initService(CONFIG, configUrl, (config) => {
        if (config.success) {
          onServiceComplete(config)
          resolveConfigResponse(config.response)
        } else {
          configFailed({
            type: player.findServiceErrorType(config.error.type, CONFIG),
            info: {
              ...config.error.info,
              url: configUrl
            }
          })
        }
      })
    } else {
      configFailed({ type: ERROR_CONFIG_URL_NOT_FOUND })
    }
  }
}

export function storeServiceResponse(player) {
  return ({ name, response, url }) => new Promise((resolve, reject) => {
    const logger = player.getLogger('services')

    logger.info(`Almacenar datos del servicio ${name}`, {
      response,
      url
    }, name)

    switch (name) {
      case CONFIG:
        player.storeConfigResponse(response, url)
          .then(() => resolve())
          .catch((error) => reject(error))
        break

      case DELIVERY:
        player.storeDeliveryResponse(response, url)
          .then(() => resolve())
          .catch((error) => reject(error))
        break

      case GATEKEEPER:
        player.storeGatekeeperResponse(response, url)
          .then(() => resolve())
          .catch((error) => reject(error))
        break

      case GBX:
        player.storeGbxResponse(response, url)
          .then(() => resolve())
          .catch((error) => reject(error))
        break

      case GEOLOCATION:
        player.storeGeoResponse(response, url)
          .then(() => resolve())
          .catch((error) => reject(error))
        break

      case MULTICHANNEL:
        player.storeMultichannelResponse(response, url)
          .then(() => resolve())
          .catch((error) => reject(error))
        break

      case PROGRAM:
        player.storeProgramResponse(response, url)
          .then(() => resolve())
          .catch((error) => reject(error))
        break

      case SHARE:
        player.storeShareResponse(response, url)
          .then(() => resolve())
          .catch((error) => reject(error))
        break

      default: {
        const { services: storedServices } = player.state

        player.setState({
          services: {
            ...storedServices,
            [name]: { url, response }
          }
        }, () => resolve())
        break
      }
    }
  })
}
