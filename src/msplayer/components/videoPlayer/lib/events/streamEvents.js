import { isIos } from '../../../../commons/userAgent'
import {
  mergeAdTagQueryStringParams,
  mergeQueryStringParamsSmart,
  parseProgramChangeError
} from '../../../../commons/util'
import { errorTypes, genres, serviceNames } from '../../../../commons/types'
import { contentEvents, streamEvents } from '../../../../commons/types/events'

const { ERROR_CONTENT_GEOBLOCKED } = errorTypes
const { CONTENT } = genres
const {
  ADS, ANALYTICS, CONFIG, DELIVERY, PROGRAM
} = serviceNames
const { CONTENT_PLAYING, CONTENT_PROGRAM_CHANGE } = contentEvents
const {
  AUDIO_TRACK_CHANGED,
  AUDIO_TRACKS,
  LEVEL_SWITCHED,
  FRAG_DATA,
  FRAG_METADATA,
  STREAM_ERROR_NON_FATAL,
  SUBTITLE_TRACKS,
  SUBTITLE_TRACK_CHANGED
} = streamEvents

export function handleStreamEvent(player) {
  return (eventType, params) => {
    const {
      canPlayThrough,
      csai,
      genre,
      isPlaying,
      isProcessing,
      isProcessingProgramChange,
      liveEventId,
      subtitles
    } = player.state

    const logger = player.getLogger('event', 'stream_event')

    logger.info(`Manejar evento del stream: ${eventType}`, params)

    // eslint-disable-next-line default-case
    switch (eventType) {
      case AUDIO_TRACK_CHANGED:
        player.setState({
          currentAudioTrack: params.track
        }, player.propagateStreamEvent(eventType, params))
        break

      case AUDIO_TRACKS:
        player.setState({
          audioTracks: params.audioTracks
        })
        break
      case SUBTITLE_TRACKS:
        player.setState({
          subtitles: {
            ...subtitles,
            config: params.subtitleTracks,
            isAvailable: !!(Array.isArray(params.subtitleTracks) && params.subtitleTracks.length)
          }
        }, player.propagateStreamEvent(eventType,
          { isAvailable: !!(Array.isArray(params.subtitleTracks) && params.subtitleTracks.length) }))
        break
      case SUBTITLE_TRACK_CHANGED:
        player.propagateStreamEvent(eventType, params)
        break

      case LEVEL_SWITCHED:
        player.setState({
          currentBitrate: params.bitrate
        }, player.propagateStreamEvent(eventType, params))
        break

      case FRAG_DATA:
        player.setState({
          currentBitrate: params.bitrate,
          currentFps: params.fps,
          droppedFrames: player.state.droppedFrames + params.dropped
        })
        break

      case FRAG_METADATA: {
        const { type = null, data = null, timestamp = 0 } = params || {}
        switch (type) {
          case 'ID3': {
            const id3Tag = new TextDecoder('utf-8').decode(data)

            logger.info(`Recibido tag ID3: ${id3Tag}`)

            // CSAI event
            if (id3Tag.indexOf('TXXX') !== -1 && id3Tag.indexOf('admode') !== -1) {
              if (csai.isEnabled && isPlaying && !isProcessing && canPlayThrough) {
                player.handleCsaiEvent(id3Tag)
              }

            // DAI event
            } else if (id3Tag.indexOf('google') !== -1) {
              if (!csai.isEnabled && player.daiController) {
                player.daiController.processMetadata(type, data, timestamp)
              }

            // Program event
            } else if (id3Tag.indexOf('TXXX') !== -1 && id3Tag.indexOf('event') !== -1) {
              if (isPlaying && !isProcessing && !isProcessingProgramChange
                && !csai.isProcessing && canPlayThrough && genre === CONTENT) {
                const values = id3Tag.split('event')[1].split('_')
                const eventId = values[0].replace(/[^A-z0-9\.]/ig, '')
                const allowedLocales = values[1] ? values[1].replace(/[^A-z,]/ig, '').split(',') : ''
                const isDrm = values[2] && values[2].replace(/[^A-z0-9\.]/ig, '') === 'drm'

                if (eventId !== String(liveEventId)) {
                  player.setState({
                    liveEventId: eventId
                  }, () => {
                    player.handleProgramChange({
                      allowedLocales,
                      eventId,
                      isDrm
                    })
                  })
                }
              }
            }
            break
          }
          case 'SCTE35':
            // CSAI event
            logger.info(`Recibido tag SCTE35: ${data}`)
            if (/(EXT-X-CUE)/.test(data)) {
              if (csai.isEnabled && isPlaying && !isProcessing && canPlayThrough) {
                player.handleCsaiEvent(data)
              }
            }
            break
          default:
            break
        }
        break
      }

      case STREAM_ERROR_NON_FATAL:
        player.propagateStreamEvent(eventType, params)
        break
    }
  }
}

export function handleCsaiEvent(player) {
  return (id3Tag) => {
    const { csai } = player.state

    const logger = player.getLogger('csai')

    if (id3Tag.includes('EXT-X-CUE-OUT') || (id3Tag.split('admode')[1] && id3Tag.split('admode')[1].indexOf('out') !== -1)) {
      const scte35Value = id3Tag.split('=')[1]
      const duration = isNaN(scte35Value) ? parseInt(id3Tag.split('admode')[1].split('_')[1]) : parseInt(scte35Value)
      // const duration = parseInt(id3Tag.split('admode')[1].split('_')[1])

      // Descartar bloque de publicidad basádose en la duración recibida
      // incluso si no se recibe el admodein
      if (player.csaiTimeout) window.clearTimeout(player.csaiTimeout)
      player.csaiTimeout = window.setTimeout(player.discardCsai, duration + 15000)

      player.collector.addTimeout(player.csaiTimeout)

      if (!isNaN(duration) && duration > 0) {
        if (!csai.isProcessing) {
          const {
            adPodIndex, genre, midrollIndex, services
          } = player.state

          if (genre === CONTENT) {
            const adsConfig = services.ads.response
            const adTagUrl = player.findAdTagUrl()

            if (adTagUrl) {
              if (player.adsInstance) {
                player.setState({
                  adPodIndex: adPodIndex + 1,
                  csai: {
                    ...player.state.csai,
                    duration,
                    isProcessing: true
                  },
                  midrollIndex: midrollIndex + 1
                }, () => {
                  // Construir nuevo ad-tag
                  let params = {
                    ad_rule: '0',
                    mridx: player.state.midrollIndex,
                    output: adsConfig.dfp.midroll && adsConfig.dfp.midroll.output || 'xml_vast4',
                    pmnd: '0',
                    pmxd: duration,
                    pod: player.state.adPodIndex,
                    vpos: adsConfig.dfp.midroll && adsConfig.dfp.midroll.vpos || 'midroll'
                  }
                  if (adsConfig.dfp.midroll && adsConfig.dfp.midroll.iu) {
                    params.iu = adsConfig.dfp.midroll.iu
                  }

                  params = {
                    ...adsConfig.dfp.midroll,
                    ...params
                  }

                  // Añadir el nuevo parametro pmad solamente para el casos de iOS
                  if (isIos()) {
                    params.pmad = adsConfig.dfp.midroll && typeof adsConfig.dfp.midroll.pmad !== 'undefined' ? adsConfig.dfp.midroll.pmad : 3
                  }

                  const newAdTagUrl = mergeAdTagQueryStringParams(adTagUrl, params)

                  // Request ads
                  player.adsInstance.freshStartAds(newAdTagUrl)
                })
              }
            }
          }
        }
      }
    } else if (id3Tag.includes('EXT-X-CUE-IN') || (id3Tag.split('admode')[1] && id3Tag.split('admode')[1].indexOf('in') !== -1)) {
      player.discardCsai()
    }
  }
}

export function discardCsai(player) {
  return () => {
    const { csai } = player.state

    const logger = player.getLogger('csai')

    logger.info('Descartar bloque de publicidad CSAI')

    if (csai.isProcessing) {
      player.discardAdBreak()
    }

    player.setState({
      csai: {
        ...player.state.csai,
        isProcessing: false
      }
    })
  }
}

export function handleProgramChange(player) {
  return ({ allowedLocales, eventId, isDrm }) => {
    const { onProgramChange, onStartOverPlaybackEnded } = player.props
    const {
      channel, id, isStartOverPlayback, locale, user
    } = player.state

    if (isStartOverPlayback && onStartOverPlaybackEnded) {
      player.pause()
      onStartOverPlaybackEnded()
      return
    }

    if (locale && allowedLocales.indexOf('all') === -1 && allowedLocales.indexOf(locale) === -1) {
      player.error({
        type: ERROR_CONTENT_GEOBLOCKED,
        info: {
          allowedLocales,
          code: {
            programChange: 'geoblocked'
          },
          locale
        }
      })
    } else {
      player.setState({
        isProcessingProgramChange: true
      }, () => {
        if (onProgramChange) {
          const reject = (reason) => {
            player.setState({
              isPlaybackAllowed: true
            })
            player.allowNewProgramChange()

            player.error({
              type: parseProgramChangeError(reason && reason.type),
              info: {
                code: {
                  programChange: 'not_allowed'
                },
                user: user && user.UID
              }
            })
          }

          player.setState({
            isPlaybackAllowed: false
          }, () => {
            onProgramChange({ channel, eventId, playerId: id })
              .then(
                (allowed) => {
                  if (allowed) {
                    player.switchProgram(eventId, isDrm)
                  } else {
                    reject()
                    player.setState({
                      channelError: eventId
                    })
                  }
                },
                (reason) => {
                  reject(reason)
                  player.setState({
                    channelError: eventId
                  })
                }
              )
              .catch((error) => {
                player.switchProgram(eventId, isDrm)
              })
          })
        } else {
          player.switchProgram(eventId, isDrm)
        }
      })
    }
  }
}

export function allowNewProgramChange(player) {
  return () => {
    if (player.isProcessingProgramChangeTimeout) {
      window.clearTimeout(player.isProcessingProgramChangeTimeout)
    }
    player.isProcessingProgramChangeTimeout = window.setTimeout(
      () => player.setState({
        isProcessingProgramChange: false
      }),
      30000
    )
  }
}

export function switchProgram(player) {
  return (eventId, mustUpdateDelivery) => {
    const { services, locale } = player.state
    const { onSendRecommendEvent } = player.props

    player.props.logger.info(`Actualizar datos del evento ${eventId || 'actual'}`)

    player.setState({
      isPlaybackAllowed: true
    })

    // Update config
    const updateConfigPromise = new Promise((resolve, reject) => {
      const url = mergeQueryStringParamsSmart(
        services[CONFIG].url,
        { event: eventId }
      )
      player.initService(CONFIG, url, (result) => {
        if (result.success && result.response) {
          let newState = {}

          // Title
          if (result.response.info && result.response.info.title) {
            newState = { ...newState, title: result.response.info.title }
          }

          // Subtitle
          if (result.response.info && result.response.info.subtitle) {
            newState = { ...newState, subtitle: result.response.info.subtitle }
          }

          // Description
          if (result.response.info && result.response.info.description) {
            newState = { ...newState, description: result.response.info.description }
          }

          // Poster
          if (result.response.poster && result.response.poster.imageUrl && result.response.poster.imageUrl !== '') {
            newState = { ...newState, poster: result.response.poster.imageUrl }
          }

          // Watermarks
          if (result.response.watermarks && Array.isArray(result.response.watermarks) && result.response.watermarks.length > 0) {
            newState = { ...newState, watermarks: result.response.watermarks }
          }

          player.setState({ ...newState })
        }

        // Update program info
        const programUrl = mergeQueryStringParamsSmart(
          services[PROGRAM].url,
          { event: eventId }
        )
        player.initService(PROGRAM, programUrl, (result) => {
          if (result.success && result.response) {
            if (result.response.name) {
              player.setState({
                title: result.response.name
              })
            }
            if (result.response.gad && onSendRecommendEvent && locale) {
              onSendRecommendEvent('WATCH', result.response.gad, locale)
            }
            player.handleContentEvent(CONTENT_PROGRAM_CHANGE, result.response)
          }
          resolve(result.success)
        })
      }, 1, false)
    })

    // Update analytics
    const updateAnalyticsPromise = new Promise((resolve, reject) => {
      const url = mergeQueryStringParamsSmart(
        services[ANALYTICS].url,
        { event: eventId }
      )
      player.initService(ANALYTICS, url, (result) => {
        resolve(result.success)
      })
    })

    // Update ads
    const updateAdsPromise = new Promise((resolve, reject) => {
      const url = mergeQueryStringParamsSmart(
        services[ADS].url,
        { event: eventId }
      )
      player.initService(ADS, url, (result) => {
        resolve(result.success)
      })
    })

    // Update Delivery
    let updateDeliveryPromise = null
    if (mustUpdateDelivery) {
      updateDeliveryPromise = new Promise((resolve, reject) => {
        const url = mergeQueryStringParamsSmart(
          services[DELIVERY].url,
          { event: eventId }
        )
        player.initService(DELIVERY, url, (result) => {
          resolve(result.success)
        })
      })
    }

    let iterable = [
      updateConfigPromise,
      updateAnalyticsPromise,
      updateAdsPromise
    ]
    if (updateDeliveryPromise) iterable.push(updateDeliveryPromise)

    Promise.all(iterable)
      .then((values) => {
        const resume = () => {
          const { isPlaying } = player.state

          if (
          // Ads
            values[2] && player.daiController
          // Delivery
          || values[3]
          ) {
            player.startContent()
          } else {
            if (!isPlaying) {
              player.play()
            } else {
              player.handleContentEvent(CONTENT_PLAYING)
            }
          }
        }

        // Analytics
        if (values[1]) {
          player.setState({
            keyAnalytics: Math.round(Math.random() * 1000000)
          }, () => {
            resume()
          })
        } else {
          resume()
        }

        player.allowNewProgramChange()
      })
      .catch((error) => {
        console.error(error)

        player.allowNewProgramChange()
      })
  }
}
