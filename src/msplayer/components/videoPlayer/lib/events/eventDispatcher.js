import { adEvents } from '../../../../commons/types/events'

const { AD_PROGRESS } = adEvents

export function propagateAdEvent(player) {
  return (eventType, params) => {
    if(player.analyticsInstance){
      player.analyticsInstance.handleAdEvent(eventType, params)
    }

    player.propagateGlobalEvent(eventType)
  }
}

export function propagateContentEvent(player) {
  return (eventType, params) => {
    if(player.analyticsInstance){
      player.analyticsInstance.handleContentEvent(eventType, params)
    }
    if(player.xdrInstance){
      player.xdrInstance.handleEvent(eventType, params)
    }
  }
}

export function propagateGlobalEvent(player) {
  return (eventType, params) => {
    if(typeof window === 'undefined') return

    const { id } = player.state

    const logger = player.getLogger('event')

    if(eventType !== AD_PROGRESS) {
      logger.info(`Emitir evento global '${eventType}'`, {
        id,
        params
      })
    }

    try {
      window.EventHandler.dispatchEvent(eventType, id, params)
    } catch(e) {
      logger.warn(`Error al propagar evento global '${eventType}'`, e)
    }
  }
}

export function propagateStreamEvent(player) {
  return (eventType, params) => {
    if(player.analyticsInstance){
      player.analyticsInstance.handleStreamEvent(eventType, params)
    }
  }
}

export function propagateMediaPlayerEvent(player) {
  return (eventType, params) => {
    if(player.analyticsInstance){
      player.analyticsInstance.handleMediaPlayerEvent(eventType, params)
    }
  }
}

export function propagatePlayerEvent(player) {
  return (eventType, params) => {
    if(player.analyticsInstance){
      player.analyticsInstance.handlePlayerEvent(eventType, params)
    }
  }
}
