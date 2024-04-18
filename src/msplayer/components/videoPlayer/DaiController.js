import { parseQueryString, waitFor } from '../../commons/util'
import { errorTypes } from '../../commons/types'

export default class DaiController {
  constructor() {
    this.streamManager = undefined
    this.initError = undefined
  }

  init(videoElement, clickElement, onDaiStreamEvent) {
    return new Promise( (resolve, reject) => {
      this.initError = undefined

      waitFor( () => (window.google && window.google.ima && window.google.ima.dai) )
      .then(() => {
        const { StreamEvent: { Type }, StreamManager } = window.google.ima.dai.api

        this.streamManager = new StreamManager(videoElement)

        if(this.streamManager) {
          this.streamManager.setClickElement(clickElement)

          this.streamManager.addEventListener(
            [
              Type.STREAM_INITIALIZED,
              Type.AD_BREAK_STARTED,
              Type.AD_PROGRESS,
              Type.CLICK,
              Type.STARTED,
              Type.FIRST_QUARTILE,
              Type.MIDPOINT,
              Type.THIRD_QUARTILE,
              Type.COMPLETE,
              Type.AD_BREAK_ENDED,
              Type.ERROR
            ],
            onDaiStreamEvent,
            false
          )
          resolve(this.streamManager)
        } else {
          this.initError = { type: errorTypes.ERROR_DAI_INIT }
          reject(this.initError)
        }
      })
      .catch(() => {
        this.initError = { type: errorTypes.ERROR_DAI_SDK_TIMEOUT }
        reject(this.initError)
      })
    })
  }

  requestUrl(assetKey, adTag = null, apiKey = null) {
    const self = this

    return new Promise( (resolve, reject) => {
      if(this.initError){
        reject(this.initError)
      } else {
        waitFor( () => (window.google && window.google.ima && window.google.ima.dai) )
        .then(() => {
          const { StreamEvent: { Type }, LiveStreamRequest } = window.google.ima.dai.api

          let streamRequest = new LiveStreamRequest()
          streamRequest.assetKey = assetKey
          streamRequest.apiKey = apiKey

          if(adTag) {
            const queryString = adTag.split('?')[1]

            if(queryString) {
              const params = parseQueryString(queryString)
              streamRequest.adTagParameters = { ...params }
            }
          }

          this.streamManager.addEventListener([Type.LOADED, Type.ERROR],
            function onEvent(e) {

              self.streamManager.removeEventListener([Type.LOADED, Type.ERROR], onEvent)

              switch (e.type) {
                case Type.LOADED: {
                  const streamUrl = e.getStreamData().url

                  if(streamUrl){
                    resolve(streamUrl)
                  } else {
                    reject({ 
                      type: errorTypes.ERROR_DAI_STREAM_NOT_FOUND,
                      info: {
                        assetKey
                      }
                    })
                  }
                  break
                }

                case Type.ERROR:
                  reject({
                    type: errorTypes.ERROR_DAI_REQUEST_STREAM,
                    info: {
                      message: e.getStreamData().errorMessage
                    }
                  })
                  break

                default:
                  reject({ 
                    type: errorTypes.ERROR_DAI_REQUEST_STREAM_UNKNOWN_EVENT,
                    info: {
                      code: {
                        dai: e.type
                      }
                    }
                  })
                  break
              }
            },
            false
          )

          this.streamManager.requestStream(streamRequest)
        })
        .catch(() => {
          reject({ type: errorTypes.ERROR_DAI_SDK_TIMEOUT })
        })
      }
    })
  }

  processMetadata(type, data, timestamp) {
    this.streamManager.processMetadata(type, data, timestamp)
  }
}
