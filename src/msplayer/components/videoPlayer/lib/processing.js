import { errorTypes, processes } from '../../../commons/types'

const { 
  ERROR_AD_SLOT_START_TIMEOUT, 
  ERROR_ADS_START_TIMEOUT,
  ERROR_PLAYER_START_TIMEOUT,
  ERROR_RECOVERY_TIMEOUT
} = errorTypes
const { 
  AD_SLOT_START,
  ADS_START,
  PLAYER_START,
  RECOVERY_GENERIC_ERROR,
  RECOVERY_PLAY_ERROR
 } = processes

export function startProcessing(player) {
  return (processId, message, timeout = 60000) => {
    const { startPosition } = player.state

    player.setState({
      isProcessing: true,
      processingMessage: message
    }, () => {
      if(player.processingTimeout) window.clearTimeout(player.processingTimeout)

      player.processingTimeout = window.setTimeout(() => {
        switch(processId) {
          case AD_SLOT_START:
            if(player.adsInstance) {
              player.adsInstance.error({ type: ERROR_AD_SLOT_START_TIMEOUT })
              player.handleContentResumeRequestedFromAds()
            }
            break

          case ADS_START:
            if(player.adsInstance) {
              player.adsInstance.errorFatal({ type: ERROR_ADS_START_TIMEOUT })
              player.startContent(startPosition)
            }
            break

          case RECOVERY_GENERIC_ERROR:
          case RECOVERY_PLAY_ERROR:
            player.fatalError({ type: ERROR_RECOVERY_TIMEOUT })
            break

          case PLAYER_START:
            player.error({ type: ERROR_PLAYER_START_TIMEOUT })
            break
        }
      }, timeout)

      player.collector.addTimeout(player.processingTimeout)
      player.collector.addProperty('processingTimeout')
    })
  }
}

export function stopProcessing(player) {
  return () => {
    player.setState({
      isProcessing: false,
      processingMessage: undefined
    }, () => {
      if(player.processingTimeout) window.clearTimeout(player.processingTimeout)
    })
  }
}
