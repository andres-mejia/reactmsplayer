import { isUbuntu } from '../../../commons/userAgent'
import { mergeQueryStringParams, translateLanguage, waitFor } from '../../../commons/util'
import { errorTypes, mediaPlayerTypes } from '../../../commons/types'
import { mediaPlayerEvents, streamEvents } from '../../../commons/types/events'

const {
  ERROR_DASHJS,
  ERROR_DASHJS_SDK_TIMEOUT,
  ERROR_DRM_GENERIC,
  ERROR_DRM_KEY_SYSTEM_ACCESS_DENIED,
  ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED,
  ERROR_DRM_LICENSE_AUTHORIZATION_DENIED,
  ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS
} = errorTypes

const { DASH_JS } = mediaPlayerTypes
const { MEDIA_PLAYER_CHANGED } = mediaPlayerEvents

const {
  AUDIO_TRACKS,
  AUDIO_TRACK_CHANGED,
  LEVEL_SWITCHED
} = streamEvents

class DashJs {
  constructor(params = {
    logger: () => null,
    onError: () => null,
    onMediaPlayerEvent: () => null,
    onStreamEvent: () => null,
    video: undefined
  }) {
    for(let key in params) {
      this[key] = params[key]
    }

    this.player = undefined

    this.handleError = this.handleError.bind(this)
    this.handleQualityChangeRendered = this.handleQualityChangeRendered.bind(this)
    this.handleStreamInitialized = this.handleStreamInitialized.bind(this)
  }

  init(src, drm, contentId, start) {
    this.logger.info(`Inicializar player`)

    return new Promise((resolve, reject) => {
      if(window.dashjs) {
        this.logger.info(`Crear player Dash.js`)

        this.player = window.dashjs.MediaPlayer().create()

        this.onMediaPlayerEvent(mediaPlayerEvents.MEDIA_PLAYER_CHANGED, {
          player: this.player,
          type: DASH_JS,
          videoUrl: src,
          videoElement: this.video
        })

        const settings = {
          streaming: {
            fastSwitchEnabled: true,
            scheduleWhilePaused: false
          }
        }

        this.logger.info(`Actualizar settings`, settings)

        this.player.updateSettings(settings)

        if(drm) {
          this.logger.info(`Es un contenido con DRM`, drm)

          //..
          if(typeof window !== 'undefined' && window.MSPlayer && window.MSPlayer.contentId) {
            contentId = window.MSPlayer.contentId
          }
          //..
          let license = drm.license
          if(contentId && contentId !== 'none') {
            license = mergeQueryStringParams(license, { contentId })
          }

          let protData = window.protectionData || {
            [drm.keySystem]: {
              audioRobustness: 'SW_SECURE_CRYPTO',
              persistentState: isUbuntu() ? 'optional' : 'required',
              // https://github.com/Dash-Industry-Forum/dash.js/issues/3148
              priority: 0,
              serverURL: license,
              // https://github.com/Dash-Industry-Forum/dash.js/pull/2451
              // sessionType: drm.csmEnabled ? 'persistent-license' : undefined,
              withCredentials: false,
              videoRobustness: 'SW_SECURE_CRYPTO'
            }
          }

          let headers = {}
          if(drm.token) {
            headers['Authorization'] = `Bearer ${drm.token}`
          }
          if(headers && Object.keys(headers).length) {
            protData[drm.keySystem].httpRequestHeaders = headers
          }

          this.logger.info(`Asignar protection data`, protData)

          this.player.setProtectionData(protData)
        }

        this.addEventListeners()

        const self = this
        let resolved = false

        const handleCanPlay = (e) => {
          self.player.off(window.dashjs.MediaPlayer.events.CAN_PLAY, handleCanPlay)
          self.logger.info(`Recibido evento CAN_PLAY. El player está preparado para iniciar la reproducción`)
          resolved = true
          resolve()
        }
        window.setTimeout(() => {
          if(!resolved) {
            self.player.off(window.dashjs.MediaPlayer.events.CAN_PLAY, handleCanPlay)
            self.logger.info(`No se ha recibido el evento CAN_PLAY después de ${this.canPlayTimeout || 2000} ms, pero se permite iniciar la reproducción de todas formas`)
            resolve()
          }
        }, this.canPlayTimeout || 2000)
        this.player.on( window.dashjs.MediaPlayer.events.CAN_PLAY, handleCanPlay)

        this.logger.info(`Inicializar MediaPlayer y asignar src. Esperando evento CAN_PLAY para iniciar la reproducción...`)

        // video, src, autoplay
        this.player.initialize(this.video, src, false)
        let hasStarted = false
        this.player.on(window.dashjs.MediaPlayer.events.PLAYBACK_PLAYING, function onManifestLoaded() {
          self.player.off(window.dashjs.MediaPlayer.events.PLAYBACK_PLAYING, onManifestLoaded)
          if (start >= 0 && !hasStarted) {
            hasStarted = true
            self.logger.info(`Iniciar el recurso en el segundo ${start}`)
            self.player.seek(start)
          }
        })
      } else {
        this.logger.error(`No se ha encotrado el SDK de Dash.js (window.dashjs). Esperando a que esté disponible...`)

        waitFor( () => window.dashjs )
        .then(() => {
          this.logger.info(`Se ha detectado el SDK de Dash.js`)
          this.init(src, drm, contentId, start)
          .then(() => resolve())
          .catch((error) => reject(error))
        })
        .catch(() => reject({ type: ERROR_DASHJS_SDK_TIMEOUT }))
      }
    })
  }

  setSrc({ src, start = -1, drm, contentId }) {
    if(isNaN(start) || start === Infinity || start <= 0) start = -1

    const self = this

    return new Promise((resolve, reject) => {
      const init = () => {
        self.init(src, drm, contentId, start)
        .then(() => resolve())
        .catch((error) => reject(error))
      }

      if(self.player) {
        self.logger.warn(`Ya hay un player Dash.js en uso`)

        self.reset()

        if(self.video) {
          self.logger.warn(`Hay una instancia de <video> en uso. No se inicializará el nuevo player hasta que se reciba el evento 'emptied' de esa instancia o pasen 2 segundos`)

          const video = self.video
          const onEmptied = (e) => {
            window.clearTimeout(self.setSrcTimeout)
            self.video.removeEventListener('emptied', onEmptied)
            self.logger.info(`Recibido evento 'emptied' de la instancia de <video> en uso`)
            init()
          }
          self.video.addEventListener('emptied', onEmptied)
          self.setSrcTimeout = window.setTimeout(() => {
            self.video.removeEventListener('emptied', onEmptied)
            self.logger.warn(`Han pasado 2 segundos de espera para recibir el evento 'emptied' de la instancia de <video> en uso`)
            init()
          }, 2000)

        } else {
          window.setTimeout(() => init(), 500)
        }
      } else {
        init()
      }
    })
  }

  getSrc() {
    let src = null

    if(this.player) {
      try {
        src = this.player.getSource()
      } catch(error) {
        src = null

        this.logger.warn(`Se ha pedido recuperar la URL del stream a la instancia de Dash.js pero se ha producido un error`, error)
      }
    }
    return src
  }

  addEventListeners() {
    if(this.player) {
      if(typeof window !== 'undefined' && window.MSPlayer && window.MSPlayer.dashLogEnabled) {
        this.player.on(
          window.dashjs.MediaPlayer.events.LOG,
          (e) => console.log('Dash.js log:', e)
        )
      }

      this.player.on(
        window.dashjs.MediaPlayer.events.ERROR,
        this.handleError
      )
      this.player.on(
        window.dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED,
        this.handleQualityChangeRendered
      )
      this.player.on(
        window.dashjs.MediaPlayer.events.STREAM_INITIALIZED,
        this.handleStreamInitialized
      )
    }
  }

  removeEventListeners() {
    if(this.player) {
      this.player.off(
        window.dashjs.MediaPlayer.events.ERROR,
        this.handleError
      )
      this.player.off(
        window.dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED,
        this.handleQualityChangeRendered
      )
      this.player.off(
        window.dashjs.MediaPlayer.events.STREAM_INITIALIZED,
        this.handleStreamInitialized
      )
    }
  }

  handleStreamInitialized(e) {
    if(this.player) {
      const tracks = this.player.getTracksFor('audio')

      if(tracks.length) {
        this.onStreamEvent(AUDIO_TRACKS, {
          audioTracks: tracks.map((track, index) => ({
            index,
            label: translateLanguage(track.lang),
            language: track.lang
          }))
        })

        const currentTrack = this.player.getCurrentTrackFor('audio')

        for(let i = 0, l = tracks.length; i < l; i++) {
          if(tracks[i].index === currentTrack.index){
            this.onStreamEvent(AUDIO_TRACK_CHANGED, {
              track: {
                index: i,
                label: translateLanguage(currentTrack.lang),
                language: currentTrack.lang
              }
            })
            break
          }
        }
      }
    }
  }

  handleError(e) {
    this.logger.warn(`Error`, e)

    if(e && !e.event && e.error) {
      switch (e.error.code) {

        // MediaPlayer errors

        // Error code returned when a manifest parsing error occurs
        case window.dashjs.MediaPlayer.errors.MANIFEST_LOADER_PARSING_FAILURE_ERROR_CODE:
        // Error code returned when a manifest loading error occurs
        case window.dashjs.MediaPlayer.errors.MANIFEST_LOADER_LOADING_FAILURE_ERROR_CODE:
        // Error code returned when a xlink loading error occurs
        // case window.dashjs.MediaPlayer.errors.XLINK_LOADER_LOADING_FAILURE_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.SEGMENTS_UPDATE_FAILED_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.SEGMENTS_UNAVAILABLE_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.SEGMENT_BASE_LOADER_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        case window.dashjs.MediaPlayer.errors.TIME_SYNC_FAILED_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.FRAGMENT_LOADER_LOADING_FAILURE_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.FRAGMENT_LOADER_NULL_REQUEST_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.URL_RESOLUTION_FAILED_GENERIC_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.APPEND_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.REMOVE_ERROR_CODE:
        // Error code returned when the update of segments list has failed
        // case window.dashjs.MediaPlayer.errors.DATA_UPDATE_FAILED_ERROR_CODE:
        // Error code returned when MediaSource is not supported by the browser
        case window.dashjs.MediaPlayer.errors.CAPABILITY_MEDIASOURCE_ERROR_CODE:
        // Error code returned when Protected contents are not supported
        case window.dashjs.MediaPlayer.errors.CAPABILITY_MEDIAKEYS_ERROR_CODE:
        // ?
        case window.dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_MANIFEST_CODE:
        // ?
        // case window.dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_SIDX_CODE:
        // ?
        // case window.dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_CONTENT_CODE:
        // ?
        // case window.dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_INITIALIZATION_CODE:
        // ?
        // case window.dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_XLINK_CODE:
        // ?
        // case window.dashjs.MediaPlayer.errors.MANIFEST_ERROR_ID_CODEC_CODE:
        // ?
        // case window.dashjs.MediaPlayer.errors.MANIFEST_ERROR_ID_PARSE_CODE:
        // Error code returned when no stream (period) has been detected in the manifest
        case window.dashjs.MediaPlayer.errors.MANIFEST_ERROR_ID_NOSTREAMS_CODE:
        // Error code returned when something wrong has append during subtitles parsing (TTML or VTT)
        // case window.dashjs.MediaPlayer.errors.TIMED_TEXT_ERROR_ID_PARSE_CODE:
        // Error code returned when a 'muxed' media type has been detected in the manifest. This type is not supported
        case window.dashjs.MediaPlayer.errors.MANIFEST_ERROR_ID_MULTIPLEXED_CODE:
        // Error code returned when a media source type is not supported
        case window.dashjs.MediaPlayer.errors.MEDIASOURCE_TYPE_UNSUPPORTED_CODE:
          this.error({
            type: ERROR_DASHJS,
            info: {
              code: {
                dash: e.error.code
              },
              message: e.error.message,
            }
          })
          break

        // Protection errors

        // Generid key Error code
        case window.dashjs.Protection.errors.MEDIA_KEYERR_CODE:
        // An unspecified error occurred. This value is used for errors that don't match any of the other codes
        case window.dashjs.Protection.errors.MEDIA_KEYERR_UNKNOWN_CODE:
        // The Key System could not be installed or updated
        case window.dashjs.Protection.errors.MEDIA_KEYERR_CLIENT_CODE:
        // The message passed into update indicated an error from the license service
        case window.dashjs.Protection.errors.MEDIA_KEYERR_SERVICE_CODE:
        // There is no available output device with the required characteristics for the content protection system
        case window.dashjs.Protection.errors.MEDIA_KEYERR_OUTPUT_CODE:
        // A hardware configuration change caused a content protection error
        case window.dashjs.Protection.errors.MEDIA_KEYERR_HARDWARECHANGE_CODE:
        // An error occurred in a multi-device domain licensing configuration. The most common error is a failure to join the domain
        case window.dashjs.Protection.errors.MEDIA_KEYERR_DOMAIN_CODE:
        // Multiple key sessions were created with a user-agent that does not support sessionIDs!! Unpredictable behavior ahead!
        case window.dashjs.Protection.errors.MEDIA_KEY_MESSAGE_ERROR_CODE:
        // Error code returned when challenge is invalid in keymessage event (event triggered by CDM). Empty key message
        case window.dashjs.Protection.errors.MEDIA_KEY_MESSAGE_NO_CHALLENGE_ERROR_CODE:
        // Error code returned when License server certificate has not been successfully updated
        case window.dashjs.Protection.errors.SERVER_CERTIFICATE_UPDATED_ERROR_CODE:
        // Error code returned when license validity has expired
        case window.dashjs.Protection.errors.KEY_STATUS_CHANGED_EXPIRED_ERROR_CODE:
        // Error code returned when no licenser url is defined
        case window.dashjs.Protection.errors.MEDIA_KEY_MESSAGE_NO_LICENSE_SERVER_URL_ERROR_CODE:
        // Error code returned when key session has not been successfully created
        case window.dashjs.Protection.errors.KEY_SESSION_CREATED_ERROR_CODE:
        // Error code returned when license request failed after a keymessage event has been triggered
        case window.dashjs.Protection.errors.MEDIA_KEY_MESSAGE_LICENSER_ERROR_CODE:
          if(e.error.message && typeof e.error.message === 'string') {
            const messageMatch = e.error.message.match(/"code":([0-9]+),/i)
            const irdetoCode = messageMatch && messageMatch[1]

            // https://docs.google.com/spreadsheets/d/18Pgzn9dUQ63k0ZzShTDTXX5szx-zb7E3unQ3bxsjQ3c/edit#gid=0

            // Permiso de licencia denegado
            // - 100200: Token inválido
            // - 100201: Token ausente
            // - 100202: Token expirado
            // - 100203: Token futuro
            if(irdetoCode && (/10020(0|1|2|3)/).test(irdetoCode)) {
              this.error({
                type: ERROR_DRM_LICENSE_AUTHORIZATION_DENIED,
                info: {
                  code: {
                    dash: e.error.code,
                    irdeto: irdetoCode,
                  },
                  message: e.error.message,
                },
              })

            // Concurrencia
            } else if((/too many concurrent streams/i).test(e.error.message)) {
              this.error({
                type: ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS,
                info: {
                  code: {
                    dash: e.error.code,
                    irdeto: irdetoCode,
                  },
                  message: e.error.message,
                },
              })

            // Incompatibilidad
            // - 180002: PlayReady
            // - 190121: Widevine
            // - 200001: FairPlay:
            // - 200004: FairPlay: SPC (Server Playback Context) not supported
            } else if(irdetoCode && (/(180002|190121|200001|200004)/).test(irdetoCode)) {
              this.error({
                type: ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED,
                info: {
                  code: {
                    dash: e.error.code,
                    irdeto: irdetoCode,
                  },
                  message: e.error.message,
                  ua: navigator.userAgent
                },
              })

            // Genérico
            } else {
              this.error({
                type: ERROR_DRM_GENERIC,
                info: {
                  code: {
                    dash: e.error.code,
                    irdeto: irdetoCode,
                  },
                  message: e.error.message,
                },
              })
            }
          } else {
            // Genérico
            this.error({
              type: ERROR_DRM_GENERIC,
              info: {
                code: {
                  dash: e.error.code,
                },
                message: e.error.message,
              },
            })
          }
          break

        // Error code returned when key system access is denied
        case window.dashjs.Protection.errors.KEY_SYSTEM_ACCESS_DENIED_ERROR_CODE:
          this.error({
            type: ERROR_DRM_KEY_SYSTEM_ACCESS_DENIED,
            info: {
              code: {
                dash: e.error.code,
              },
              message: e.error.message,
            },
          })
          break
      }
    }
  }

  handleQualityChangeRendered(e) {
    if(e.mediaType === 'video') {
      const infoList = this.player.getBitrateInfoListFor(e.mediaType)
      if(Array.isArray(infoList) && infoList.length) {
        const bitrateInfo = infoList[e.newQuality]

        if(bitrateInfo) {
          this.onStreamEvent(
            LEVEL_SWITCHED,
            {
              bitrate: bitrateInfo.bitrate,
              level: e.newQuality
            }
          )
        }
      }
    }
  }

  play() {
    if(this.player) {
      try {
        this.player.play()
      } catch(e) {
        console.warn(e)
      }
    }
  }

  pause(mustStopLoad) {
    if(this.player) {
      try {
        this.player.pause()
      } catch(e) {
        console.warn(e)
      }
    }
  }

  getPlayer() {
    return this.player
  }

  getType() {
    return DASH_JS
  }

  setAudioTrack(track) {
    if(this.player) {
      const tracks = this.player.getTracksFor('audio')
      if(Array.isArray(tracks) && tracks[track.index]) {
        this.player.setCurrentTrack(tracks[track.index])
      }

      this.onStreamEvent(AUDIO_TRACK_CHANGED, { track })
    }
  }

  error(error) {
    this.logger.error(`Error fatal`, error)

    if(this.player) {
      this.player.reset()
    }
    this.onError(error)
  }

  reset() {
    this.removeEventListeners()

    if(this.player) {
      this.logger.info(`Resetear player en uso`)
      this.player.reset()
    }
  }

  destroy() {
    this.removeEventListeners()

    if(this.player) {
      this.player.reset()
    }
  }
}

export default DashJs
