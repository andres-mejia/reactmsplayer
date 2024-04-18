import { errorTypes, serviceNames } from '../../../../commons/types'
import { servicesModel } from '../../model'

const { ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND, ERROR_CONFIG_URL_NOT_FOUND } = errorTypes
const {
  ADS,
  ANALYTICS,
  CONFIG,
  GBX,
  GEOLOCATION,
  DELIVERY,
  MULTICHANNEL,
  NEXT,
  PROGRAM,
  RELATED_VIDEOS,
  SHARE,
  SRC,
  XDR
} = serviceNames

export function storeConfigResponse(player) {
  return (response, url) => {
    return new Promise((resolve, reject) => {
      const { description, services: storedServices, title, subtitle } = player.state
      const { info, isLive, poster, services, watermarks, formatType } = response

      let newServices = {
        ...( new servicesModel().toJS() ),
        [CONFIG]: { url, response }
      }
      let newState = {}

      // Services
      if(services) {
        // Respetar el orden
        const keys = [
          ['ads', ADS],
          ['analytics', ANALYTICS],
          ['gbx', GBX],
          ['geo', GEOLOCATION],
          ['caronte', DELIVERY],
          ['multichannel', MULTICHANNEL],
          ['next', NEXT],
          ['program', PROGRAM],
          ['related', RELATED_VIDEOS],
          ['share', SHARE],
          ['src', SRC],
          ['xdr', XDR]
        ]
        keys.forEach( (key) => {
          const serviceUrl = services[key[0]]
          if(serviceUrl){
            if(!newServices[key[1]]) newServices[key[1]] = {}
            newServices[key[1]].url = serviceUrl
            newServices[key[1]].response = storedServices[key[1]].response
          }
        })

        if(!newServices[RELATED_VIDEOS]) {
          newState = { ...newState, isRelatedEnabled: false }
        }
        if(!newServices[SHARE]) {
          newState = { ...newState, isShareEnabled: false }
        }
      }

      // Title
      if(info && info.title) {
        newState = { ...newState, title: info.title || title }
      }

      // Subtitle
      if(info && info.subtitle) {
        newState = { ...newState, subtitle: subtitle || info.subtitle }
      }

      // Description
      if(info && info.description) {
        newState = { ...newState, description: description || info.description }
      }

      // Live
      if(isLive !== undefined && isLive !== null && isLive !== '' && isLive !== player.state.isLive) {
        newState = { ...newState, isLive }
      }

      // Poster
      if(poster && poster.imageUrl && poster.imageUrl !== '' && poster.imageUrl !== player.state.poster){
        newState = { ...newState, poster: poster.imageUrl }
      }

      // Watermarks
      if(watermarks && Array.isArray(watermarks) && watermarks.length > 0) {
        newState = { ...newState, watermarks }
      }

      // formatType
      if(formatType !== undefined && formatType !== null && formatType !== '' && formatType !== player.state.formatType) {
        newState = { ...newState, formatType }
      }

      player.setState({
        ...newState,
        services: {
          ...storedServices,
          ...newServices
        }
      }, () => resolve())
    })
  }
}

export function getServicesInConfig(player) {
  return () => {
    return new Promise((resolve, reject) => {
      const { services } = player.state

      if(services[CONFIG].response) {
        if(services[CONFIG].response.services){
          resolve(services[CONFIG].response.services)
        } else {
          reject({ 
            type: ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND,
            info: {
              response: JSON.stringify(services[CONFIG].response)
            }
          })
        }
      } else if(services[CONFIG].url) {
        player.initService(CONFIG, services[CONFIG].url, (config) => {
          if(config.success){
            if(config.response && config.response.services){
              resolve(config.response.services)
            } else {
              reject({ 
                type: ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND,
                info: {
                  response: JSON.stringify(config.response),
                  url: services[CONFIG].url
                }
              })
            }
          } else {
            reject({
              type: player.findServiceErrorType(config.error.type, CONFIG),
              info: {
                ...config.error.info,
                url: services[CONFIG].url,
              }
            })
          }
        })
      } else {
        reject({ type: ERROR_CONFIG_URL_NOT_FOUND })
      }
    })
  }
}
