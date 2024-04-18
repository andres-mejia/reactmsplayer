import { isEdge, isIE, isSafari, isStreamTypeSupported } from '../../../../commons/userAgent'
import { errorTypes, keySystems, serviceNames, streamTypes } from '../../../../commons/types'
import { streamEvents } from '../../../../commons/types/events'

const { ERROR_DELIVERY_RESPONSE_NO_LOCATIONS } = errorTypes
const { 
  CLEAR_KEY,
  FAIR_PLAY,
  PLAY_READY,
  PRIMETIME,
  WIDEVINE
 } = keySystems
 const { DELIVERY, GATEKEEPER, VIDEO_THUMBNAILS } = serviceNames
 const { DASH, HLS } = streamTypes
 const { SUBTITLE_TRACKS } = streamEvents

const STREAM_TYPES_PRIORITY = [
  DASH,
  HLS
]

const parseDrm = (drm) => {
  if(!drm || !Object.keys(drm).length) return undefined

  let parsedDrm = undefined

  if(isSafari() && drm.fairplay) {
    parsedDrm = {
      certificate: drm.fairplay.curl,
      keySystem: FAIR_PLAY,
      license: drm.fairplay.lurl
    }
  } else if((isIE() || isEdge()) && drm.playready) {
    parsedDrm = {
      keySystem: PLAY_READY,
      license: drm.playready.lurl
    }
  } else if(drm.widevine) {
    parsedDrm = {
      keySystem: WIDEVINE,
      license: drm.widevine.lurl
    }
  } else if(drm.clearkey) {
    parsedDrm = {
      keySystem: CLEAR_KEY,
      license: drm.clearkey.lurl
    }
  } else if(drm.primetime) {
    parsedDrm = {
      keySystem: PRIMETIME,
      license: drm.primetime.lurl
    }
  }
  return parsedDrm
}

const addParams = (url, isPodcast) => {
  if (isPodcast) {
    return url.includes('?') ? `${url}&filter=(type=="audio")` : `${url}?filter=(type=="audio")`
  }
  return url
}

const parseLocations = (locations, drm, isPodcast) => {
  const parsedLocations = locations.map( (location) => {
    if(
      isStreamTypeSupported(location.format, location.drm) && 
      (location.assetKey || location.stream)
    ) {
      return {
        assetKey: location.assetKey,
        baseUrl: addParams(location.stream.replace(/(vod|live)\.telecinco\.pro/, '$1.telecinco.es'), isPodcast),
        cdn: location.cdn,
        contentId: location.cid,
        drm: location.drm && Object.keys(drm).length > 0 ? drm : null,
        id: location.lid,
        priority: location.pri,
        type: location.format
      }
    } else {
      return null
    }
  })
  .filter( (location) => location !== null )
  .sort( (a, b) => (a.priority - b.priority) )

  return parsedLocations
}

const filterStreamTypes = (locations, drm, isPodcast) => {
  if(!Array.isArray(locations)) return []

  locations = [ ...locations ]

  let filtered = []

  STREAM_TYPES_PRIORITY.forEach( (streamType) => {
    filtered = filtered.concat(
      parseLocations(locations.filter((loc) => loc.format === streamType), drm, isPodcast)
    )
    locations = locations.filter((loc) => loc.format !== streamType)
  })

  while(locations.length) {
    filtered = filtered.concat(
      parseLocations(locations.filter((loc) => loc.format === locations[0].format), drm)
    )
    locations = locations.filter((loc) => loc.format !== locations[0].format)
  }

  return filtered
}

export function parseDls(player) {
  return (dls, drm) => {
    if(!Array.isArray(dls)) return []

    const { csai, isLive } = player.state
    const { isPodcast } = player.props

    let locations = []

    if(isLive) {
      if(csai.isEnabled) {
        locations = filterStreamTypes(
          dls.filter((location) => location.adtype === 'csai'),
          drm,
          isPodcast
        )
      } else {
        locations = filterStreamTypes(
          dls.filter((location) => location.adtype === 'ssai'),
          drm,
          isPodcast
        )
      }
      locations = locations.concat(filterStreamTypes(
        dls.filter((location) => location.adtype === 'linear'),
        drm,
        isPodcast
      ))
    } else {
      locations = filterStreamTypes(
        dls.filter((location) => location.adtype === 'default'),
        drm,
        isPodcast
      )
    }

    return locations
  }
}

export function storeDeliveryResponse(player) {
  return (response, url) => {
    return new Promise((resolve, reject) => {

      if(response.dls){
        const { 
          services: storedServices, 
          subtitles,
          isLive
        } = player.state
  
        const drm = parseDrm(response.drm)
        if(drm) {
          drm.csmEnabled = true
        }

        let thumbs = { ...storedServices[VIDEO_THUMBNAILS] }
        if(response.thumbs) {
          if(typeof response.thumbs === 'string') {
            thumbs.url = response.thumbs
          } else {
            thumbs.url = undefined
            thumbs.response = { ...response.thumbs }
          }
        }
  
        player.setState({
          bbx: response.bbx,
          currentLocationIndex: 0,
          locations: player.parseDls(response.dls, drm),
          services: {
            ...storedServices,
            [DELIVERY]: { url, response },
            [GATEKEEPER]: {
              ...storedServices[GATEKEEPER],
              url: response.cerbero
            },
            [VIDEO_THUMBNAILS]: { ...thumbs }
          },
          subtitles: {
            ...subtitles,
            config: response.subtitles,
            isAvailable: !!(Array.isArray(response.subtitles) && response.subtitles.length)
          }
        }, () => {
          if (!isLive) {
            player.propagateStreamEvent(SUBTITLE_TRACKS, {
              isAvailable: !!(Array.isArray(response.subtitles) && response.subtitles.length)
            })
          }
          resolve()
        })
      } else {
        reject({
          type: ERROR_DELIVERY_RESPONSE_NO_LOCATIONS,
          info: {
            response: JSON.stringify(response),
            url,
          }
        })
      }
    })
  }
}
