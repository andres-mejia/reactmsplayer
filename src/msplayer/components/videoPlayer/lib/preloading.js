import { isAutoplayAllowed } from '../../../commons/userAgent'
import { preloadingLevels, serviceNames } from '../../../commons/types'

const { 
  CONTENT, 
  IMA, 
  PREROLL, 
  SERVICES, 
  SERVICES_IMA, 
  SERVICES_IMA_CONTENT, 
  SERVICES_PREROLL, 
  SERVICES_PREROLL_CONTENT 
} = preloadingLevels
const { ADS, DELIVERY, CONFIG } = serviceNames

export function preload(player) {
  return (level) => {
    const { onError } = player.props
    const { isAdsEnabled, isContentPreloaded, preloading, services, startPosition } = player.state

    const logger = player.getLogger('preloading')

    player.setState({
      isPreloading: true,
      startPositionPreloaded: startPosition
    })

    logger.info(`Precargar módulos de nivel ${preloading.level}`)

    const checkIsStartPlayerRequested = (process) => {
      if(player.state.isStartPlayerRequested) {
        logger.warn(`Se interrumpe la precarga de nivel ${preloading.level} porque el usuario ha solicitado el inicio de la reproducción. Proceso interrumpido: ${process}`)

        return true
      }
      return false
    }

    const preloadAdsService = () => {
      return new Promise((resolve, reject) => {
        logger.info(`Precargar servicio Ads...`)

        if(isAdsEnabled) {
          if(!checkIsStartPlayerRequested('initAdsService')) {
            const adsServiceUrl = services[ADS].url
    
            if(adsServiceUrl) {
              player.initService(ADS, adsServiceUrl, (result) => {
                if(result.success) {
                  logger.info(`Se ha recuperado el servicio Ads correctamente`)
                  resolve()
                } else {
                  logger.warn(`No se ha podido precargar el servicio Ads porque ha habido un error al inicializarlo`, result)
                  reject()
                }
              })
            } else {
              logger.warn(`No se ha podido precargar el servicio Ads porque no se ha encontrado su URL`)
              reject()
            }
          } else {
            reject()
          }
        } else {
          logger.warn(`No se ha precargado el servicio Ads porque no está habilitada la publicidad`)
          reject()
        }
      })
    }

    const preloadAds = (preloadPreroll = false) => {
      logger.info(`Precargar publicidad...`)

      if(isAdsEnabled) {
        if(!checkIsStartPlayerRequested('preloadAds')) {
          if(player.adsInstance) {
            if(isAutoplayAllowed()) {
              logger.info(`Se inicializa el AdDisplayContainer de IMA`)
              player.adsInstance.initAdDisplayContainer()
            }
            if(preloadPreroll) {
              player.adsInstance.startAds(undefined, true)
            } else {
              logger.info(`Se recuperan los anuncios de DFP a través de IMA`)
              player.adsInstance.requestAds()
            }
          } else {
            logger.warn(`No se ha podido precargar la publicidad porque no se ha encontrado la instancia del componente Ads`)
          }
        }
      } else {
        logger.warn(`No se ha precargado la publicidad porque no está habilitada`)
      }
    }

    const preloadContent = () => {
      if(!isContentPreloaded) {
        logger.info(`Precargar contenido...`)

        if(!checkIsStartPlayerRequested('requestSrc')) {
          logger.info(`Recuperar URL del stream...`)

          player.requestSrc()
          .then((src) => {
            if(!checkIsStartPlayerRequested('setSrc')) {
              if(player.videoInstance) {
                logger.info(`Precargar el stream...`)

                player.videoInstance.setSrc(src, startPosition)
                .then(() => {
                  logger.info(`El stream se ha precargado correctamente: ${src}`)

                  player.setState({
                    isContentPreloaded: true
                  }, () => {
                    if(!checkIsStartPlayerRequested('pause')) {
                      player.pause(false)
                    } else {
                      player.startPlayer()
                    }
                  })
                })
                .catch((error) => {
                  logger.warn(`No se ha podido precargar el contenido porque ha habido un error al asignar el stream ${src}`, error)

                  player.setState({
                    isContentPreloaded: false
                  })
                })
              } else {
                logger.warn(`No se ha podido precargar el contenido porque no se ha encontrado la instancia del componente Video`)
              }
            }
          })
          .catch((error) => {
            if(onError) onError(error)

            logger.warn(`No se ha podido precargar el contenido porque ha habido un error al recuperar la URL del stream`, error)
          })
        }
      } else {
        if(player.videoInstance && player.videoInstance.getRef()) {
          logger.info('Se ejecuta Video.load()')
          player.videoInstance.getRef().load()
        }
      }
    }

    const preloadServicesAnd = (modules = {}) => {
      logger.info(`Precargar servicios de datos...`)

      player.initAllServices((result) => {
        logger.info(`Se precarga el servicio ${result.name}: ${result.success}`)

        if(!checkIsStartPlayerRequested(`handleInitAllServices: ${result.name}`)) {
          if(result.name === CONFIG && !result.success) {
            logger.warn(`No se ha podido continuar con la precarga porque ha habido un error al inicializar el servicio Config`, result)

          } else if(modules.ads && result.name === ADS) {
            if(!checkIsStartPlayerRequested('handleInitAdsService')) {
              if(result.success) {
                preloadAds(modules.preroll)
              } else {
                logger.warn(`No se ha podido precargar la publicidad porque ha habido un error al inicializar el servicio Ads`, result)
              }
            }
          } else if(modules.content && result.name === DELIVERY) {
            if(result.success) {
              preloadContent()
            } else {
              logger.warn(`No se ha podido precargar el contenido porque ha habido un error al inicializar el servicio de delivery`, result)
            }
          }
        }
      })
    }

    switch(level || preloading.level) {
      case CONTENT:
        preloadServicesAnd({ content: true })
        break

      case IMA:
      case PREROLL:
        preloadAdsService().then(
          () => preloadAds(preloading.level === PREROLL)
        )
        break

      case SERVICES:
        preloadServicesAnd()
        break

      case SERVICES_IMA:
      case preloadingLevels.SERVICES_PREROLL:
        preloadServicesAnd({ ads: true, preroll: preloading.level === SERVICES_PREROLL })
        break

      case SERVICES_IMA_CONTENT:
      case SERVICES_PREROLL_CONTENT:
        preloadServicesAnd({ ads: true, content: true, preroll: preloading.level === SERVICES_PREROLL_CONTENT })
        break
    }
  }
}
