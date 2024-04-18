import { serviceNames } from '../../../commons/types'
import { parseQueryString, toQueryString } from '../../../commons/util'

export function discardAdBreak(player) {
  return () => {
    if(player.adsInstance) {
      player.adsInstance.discardAdBreak()
    }
  }
}

const { ADS } = serviceNames

const getIUparam = (iu, externalSites) => {
  const isEmbed = (window?.parent !== window)
  if (!externalSites || externalSites.length === 0 || !isEmbed) return iu
  const docReferrer = document?.referrer
  const url = docReferrer ? new URL(docReferrer)?.hostname : null
  if (!url) return iu
  const filteredExternalSites = externalSites.filter((site) => url.includes(site.domain))
  const externalSite = filteredExternalSites?.length ? filteredExternalSites[0] : null
  if (!externalSite) return iu
  const adUnit = iu && iu.split('/')[1]
  return adUnit ? iu.replace(adUnit, `${adUnit},${externalSite.id}`) : iu
}

const mergeVars = (adTagUrl, variables, externalSites) => {
  if (variables && variables.adTagUrl) {
    return variables.adTagUrl

  } else if(adTagUrl && variables) {
    var queryString = adTagUrl.indexOf('?') !== -1 ? adTagUrl.split('?')[1] : null
    var queryStringVars = parseQueryString(queryString)

    if(queryStringVars) {

      // Merge cust_params
      if(variables.custParams) {
        let custParams = parseQueryString(decodeURIComponent(queryStringVars.cust_params))
        if(!custParams) custParams = {}

        for(let key in variables.custParams) {
          const cp = variables.custParams[key]

          if(typeof cp !== 'undefined') {
            if(typeof cp === 'object' && cp !== null && typeof cp.value !== 'undefined') {
              if(cp.merge === true && custParams[key]) {
                const prevList = `${custParams[key]}`.split(',')
                const nextList = `${cp.value}`.split(',');

                custParams[key] = [ ...new Set([ ...prevList, ...nextList ]) ].join(',')
                
              } else {
                custParams[key] = cp.value
              }
            } else {
              custParams[key] = cp
            }
          }
        }
        queryStringVars.cust_params = encodeURIComponent(toQueryString(custParams))
      }

    } else {
      queryStringVars = {}

      if(variables.custParams) {
        queryStringVars.cust_params = encodeURIComponent(toQueryString(variables.custParams))
      }
    }

    // Override description_url
    if (variables.descriptionUrl) {
      queryStringVars.description_url = variables.descriptionUrl
    }

    // Override iu
    const adUnit = queryStringVars.iu || variables.iu
    queryStringVars.iu = getIUparam(adUnit, externalSites)

    adTagUrl = `${adTagUrl.split('?')[0]}?${toQueryString(queryStringVars)}`
  }

  return adTagUrl
}

export function findAdTagUrl(player) {
  return () => {
    const { isAmp, isVideoGallery, dfp, services } = player.state
    const { externalSites } = player.props
    
    let serviceAdTagUrl = services[ADS].response && services[ADS].response.dfp && services[ADS].response.dfp.adTagUrl

    if(serviceAdTagUrl) {
      serviceAdTagUrl = serviceAdTagUrl.replace('%7BdurationZapping%7D', '0')
      serviceAdTagUrl = serviceAdTagUrl.replace('%7Bzappeos%7D', '0')

      if(isAmp && isVideoGallery) {
        serviceAdTagUrl = serviceAdTagUrl.replace('videogaleria%3D0', 'videogaleria%3D1')
      }

      return mergeVars(serviceAdTagUrl, dfp, externalSites)

    } else if(dfp.adTagUrl) {
      return dfp.adTagUrl
    }
    return null
  }
}

export function findIsLongForm(player) {
  return () => {
    const { 
      dfp: {
        isLongForm
      }, 
      services 
    } = player.state

    if(typeof isLongForm !== 'undefined') {
      return !!isLongForm
    } else {
      return !!(services[ADS].response && services[ADS].response.dfp && services[ADS].response.dfp.isLongForm)
    }
  }
}
