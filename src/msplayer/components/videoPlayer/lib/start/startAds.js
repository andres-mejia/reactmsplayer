import { adEvents } from '../../../../commons/types/events'
import { errorTypes, genres, processes, serviceNames, stages } from '../../../../commons/types'
import { preloadingLevels, preloadingTypes } from '../../../../commons/types'
import { isPreloadAllowed } from '../../../../commons/userAgent'

const { ADS_START_REQUESTED } = adEvents
const { 
  ERROR_ADS_INSTANCE_NOT_FOUND,
  ERROR_CONFIG_RESPONSE_ADS_NOT_FOUND,
  ERROR_CONFIG_UNKNOWN
 } = errorTypes
 const { ADS_START } = processes
 const { ADS, CONFIG } = serviceNames
 const { PLAYBACK } = stages

export function startAds(player) {
  return () => {
    const { logger } = player.props
    const { 
      isPreloading,
      preloading: {
        isEnabled,
        type
      }, 
      services, 
      startPosition 
    } = player.state

    const { CONTENT } = preloadingLevels
    const { ON_AD_STARTED } = preloadingTypes

    logger.info('Iniciar publicidad')

    const resolve = () => {
      if(player.adsInstance) {
        player.setState({
          stage: PLAYBACK
        }, () => player.adsInstance.startAds())
      } else {
        reject({ type: ERROR_ADS_INSTANCE_NOT_FOUND })
      }
      player.handleWindowResize()

      if(!isPreloading && isEnabled && isPreloadAllowed() && type === ON_AD_STARTED) {
        player.preload(CONTENT)
      }

    }

    const reject = (error) => {
      player.startAdsFailed()
      player.startContent(startPosition)
    }

    player.startAdsRequested()

    if(player.state.services[ADS].response){
      resolve()
    } else {
      player.getServicesInConfig()
      .then((services) => {
        if(services && services.ads){
          player.initService(ADS, services.ads, (ads) => {
            if(ads.success){
              resolve()
            } else {
              reject({
                type: player.findServiceErrorType(ads.error.type, ADS),
                info: {
                  ...ads.error.info,
                  url: services.ads
                }
              })
            }
          })
        } else {
          reject({ 
            type: ERROR_CONFIG_RESPONSE_ADS_NOT_FOUND,
            info: {
              response: JSON.stringify(services),
              url: services[CONFIG].url
            }
          })
        }
      })
      .catch((error) => {
        reject({
          ...error,
          type: error.type || ERROR_CONFIG_UNKNOWN,
          info: {
            ...error.info,
            url: services[CONFIG].url
          }
        })
      })
    }
  }
}

export function startAdsFailed(player) {
  return () => {
    player.stopProcessing()

    player.setState({
      allAdsCompleted: true,
      isAdsStartFailed: true
    })
  }
}

export function startAdsRequested(player) {
  return () => {
    player.startProcessing(ADS_START, 'Iniciando publicidad...')

    player.propagateAdEvent(ADS_START_REQUESTED)

    player.setState({
      genre: genres.ADS
    })
  }
}
