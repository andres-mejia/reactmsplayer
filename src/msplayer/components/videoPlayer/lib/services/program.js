import { timestampToHhmm } from '../../../../commons/util'
import { serviceNames } from '../../../../commons/types'
import { contentEvents } from '../../../../commons/types/events'

const { PROGRAM } = serviceNames
const { CONTENT_PROGRAM_CHANGE_FAKE } = contentEvents

export function storeProgramResponse(player) {
  return (response, url) => {
    return new Promise((resolve, reject) => {
      const { onStartOverRequested } = player.props 
      const { gad, isLive, isStartOverEnabled, liveEventId, services, subtitle, title } = player.state

      player.props.logger.info(`Almacenar datos del servicio Program`, {
        currentGad: response.gad,
        currentEvent: response.event,
        prevGad: gad,
        prevEvent: liveEventId
      })

      if(typeof gad !== 'undefined' && typeof liveEventId !== 'undefined') {
        if(liveEventId !== response.event && gad === response.gad) {
          player.propagateContentEvent(CONTENT_PROGRAM_CHANGE_FAKE, { 
            event: response.event, 
            gad, 
            prevEvent: liveEventId 
          })
        }
      }

      player.setState(
        {
          channel: response.channel,
          gad: response.gad,
          isStartOverAvailable: !!(response.startover === true && isStartOverEnabled && isLive && onStartOverRequested),
          liveEventId: response.event,
          services: {
            ...services,
            [PROGRAM]: {
              url,
              response
            }
          },
          subtitle: response.init && response.end ? `${timestampToHhmm(response.init)} - ${timestampToHhmm(response.end)}` : subtitle,
          title: response.name || title
        },
        () => resolve()
      )
    })
  }
}
