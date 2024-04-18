import { isMobileAny } from '../../../../commons/userAgent'
import { adEvents } from '../../../../commons/types/events'
import { adGenres, errorTypes, genres } from '../../../../commons/types'

const { 
  AD_COMPLETED, 
  AD_ERROR,
  AD_FIRST_QUARTILE,
  AD_MIDPOINT,
  AD_PAUSED,
  AD_STARTED,
  AD_SLOT_COMPLETED,
  AD_SLOT_STARTED,
  AD_THIRD_QUARTILE
} = adEvents
const { MID_ROLL } = adGenres
const { ERROR_DAI_ADS } = errorTypes
const { ADS, CONTENT } = genres

export default function handleDaiStreamEvent(player){
  return (e) => {
    const { daiAdPaused, genre } = player.state
    const { Type } = window.google.ima.dai.api.StreamEvent

    const logger = player.getLogger('event', 'dai_event')

    logger.info(`Manejar evento DAI: ${e.type}`)

    const adBreakStarted = () => {
      player.propagateAdEvent(AD_SLOT_STARTED)

      player.setState({
        daiAdPaused: false,
        genre: ADS
      })

      // if(globalScope.adType !== 'dai'){
      //   adProperties.setAdType(globalScope, 'dai');
      // }
    }

    const end = () => {
      player.setState({
        genre: CONTENT
      })
    }

    const getAdDuration = (e) => {
      const streamData = e.getStreamData()
      if(streamData){
        const progressData = streamData.adProgressData
        if(progressData){
          return progressData.duration
        }
      }
      return null
    }

    switch (e.type) {
      case Type.STREAM_INITIALIZED:
        break

      case Type.AD_BREAK_STARTED:
        adBreakStarted()
        break

      case Type.AD_PROGRESS:
        if(!daiAdPaused) {
          if(genre !== ADS) {
            adBreakStarted()

            player.propagateAdEvent(AD_STARTED, {
              adDuration: getAdDuration(e),
              adGenre: MID_ROLL
            })
          }
        }
        break

      case Type.CLICK:
        if(isMobileAny()) {
          player.setState({
            daiAdPaused: true
          })

          player.propagateAdEvent(AD_PAUSED)

          player.pause()
        }
        break

      case Type.STARTED:
        if(genre !== ADS){
          adBreakStarted()
        }
        player.propagateAdEvent(AD_STARTED, {
          adDuration: getAdDuration(e),
          adGenre: MID_ROLL
        })
        break

      case Type.FIRST_QUARTILE:
        if(genre !== ADS){
          adBreakStarted()
          player.propagateAdEvent(AD_STARTED, {
            adDuration: getAdDuration(e),
            adGenre: MID_ROLL
          })
        }
        player.propagateAdEvent(AD_FIRST_QUARTILE)
        break

      case Type.MIDPOINT:
        if(genre !== ADS){
          adBreakStarted()
          player.propagateAdEvent(AD_STARTED, {
            adDuration: getAdDuration(e),
            adGenre: MID_ROLL
          })
        }
        player.propagateAdEvent(AD_MIDPOINT)
        break

      case Type.THIRD_QUARTILE:
        if(genre !== ADS){
          adBreakStarted()
          player.propagateAdEvent(AD_STARTED, {
            adDuration: getAdDuration(e),
            adGenre: MID_ROLL
          })
        }
        player.propagateAdEvent(AD_THIRD_QUARTILE)
        break

      case Type.COMPLETE:
        player.propagateAdEvent(AD_COMPLETED)
        break

      case Type.AD_BREAK_ENDED:
        player.propagateAdEvent(AD_SLOT_COMPLETED)
        end()
        break

      case Type.ERROR: {
        const streamData = e.getStreamData()
        let message = null

        if(streamData) {
          message = streamData.errorMessage
        }

        player.propagateAdEvent(AD_ERROR, {
          type: ERROR_DAI_ADS,
          message
        })
        end()
        break
      }
    }
  }
}
