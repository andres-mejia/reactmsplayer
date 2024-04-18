import { generateGuid } from '../../../../commons/util'
import { errorTypes, genres, serviceNames } from '../../../../commons/types'

const { ERROR_SERVICES_INIT } = errorTypes
const { ADS, ANALYTICS, DELIVERY, GBX, SRC, VIDEO_THUMBNAILS, } = serviceNames

export function startData(player) {
  let activeThreadId = null

  return (servicesUrls, genre) => {
    return new Promise((resolve, reject) => {
      const { services: storedServices } = player.state

      const currentThreadId = generateGuid()
      activeThreadId = currentThreadId

      let newServices = {}

      if(servicesUrls) {
        if(servicesUrls[serviceNames.CONFIG]) {
          for(let key in storedServices) {
            newServices[key] = { 
              url: undefined, 
              response: undefined 
            }
          }
        } else if(servicesUrls[DELIVERY]) {
          newServices[VIDEO_THUMBNAILS] = { 
            url: undefined, 
            response: undefined 
          }
        }
        
        for(let key in servicesUrls) {
          newServices[key] = { 
            url: servicesUrls[key], 
            response: undefined 
          }
        }
      }

      player.setState({ 
        services: {
          ...storedServices,
          ...newServices
        }
      }, () => {
        const { isAdsEnabled } = player.state
  
        let pending = [DELIVERY, GBX, ANALYTICS]
        if(isAdsEnabled) pending.push(ADS)
    
        let succeeded = []
        let resolved = false
    
        const tryResolve = () => {
          if(!resolved) {
            if(isAdsEnabled && succeeded.includes(ADS) && genre !== genres.CONTENT) {
              pending = []
              resolved = true

              resolve(genres.ADS)
    
            } else if(
              succeeded.includes(DELIVERY) &&
              !pending.includes(ADS) &&
              !pending.includes(ANALYTICS) &&
              !pending.includes(GBX)
            ) {
              pending = []
              resolved = true

              resolve(genres.CONTENT)
    
            } else if(pending.length === 0) {
              resolved = true

              reject({ type: ERROR_SERVICES_INIT })
            }
          }
        }
    
        player.initAllServices( (serviceResult) => {
          if(currentThreadId === activeThreadId) {
            const { error, success, url } = serviceResult
            let { name } = serviceResult
      
            if(name === SRC) {
              name = DELIVERY
            }
      
            const index = pending.indexOf(name)
            if(index !== -1) {
              pending.splice(index, 1)
            }
      
            if (success) {
              succeeded.push(name)
      
              tryResolve()
      
            } else if(name === serviceNames.CONFIG) {
              pending = []
      
              reject({
                type: error.type,
                info: {
                  ...error.info,
                  url
                }
              })
      
            } else {
              tryResolve()
            }
          }
        })
      })
    })
  }
}
