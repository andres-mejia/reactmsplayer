import { isUbuntu } from '../../../commons/userAgent'
import { mergeQueryStringParams, translateLanguage, waitFor } from '../../../commons/util'
import { errorTypes, keySystems, mediaPlayerTypes } from '../../../commons/types'
import { mediaPlayerEvents, streamEvents } from '../../../commons/types/events'

const { 
  ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED,
  ERROR_DRM_LICENSE_AUTHORIZATION_DENIED,
  ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS,
  ERROR_SHAKA,
  ERROR_SHAKA_INSTANCE_NOT_FOUND,
  ERROR_SHAKA_NOT_SUPPORTED,
  ERROR_SHAKA_SDK_TIMEOUT
 } = errorTypes

const { PLAY_READY } = keySystems
const { SHAKA_PLAYER } = mediaPlayerTypes 
const { MEDIA_PLAYER_CHANGED } = mediaPlayerEvents

const { 
  AUDIO_TRACKS, 
  AUDIO_TRACK_CHANGED 
} = streamEvents

class ShakaPlayer {
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
    this.licenseRenewalTimers = []

    this.handleError = this.handleError.bind(this)
    this.handleStreaming = this.handleStreaming.bind(this)
  }

  init(drm, contentId) {
    this.logger.info(`Inicializar player`)

    return new Promise((resolve, reject) => {
      if(window.shaka) {
        window.shaka.polyfill.installAll()

        if (window.shaka.Player.isBrowserSupported()) {
          this.logger.info(`Crear instancia de ShakaPlayer`)
          this.player = new window.shaka.Player(this.video)

          this.onMediaPlayerEvent(MEDIA_PLAYER_CHANGED, {
            player: this.player,
            type: SHAKA_PLAYER,
            videoUrl: '',
            videoElement: this.video
          })

          // License renewal (CSM)
          if(
            drm && drm.csmEnabled && drm.keySystem === PLAY_READY &&
            window.shaka.media && window.shaka.media.DrmEngine
          ) {
            this.addLicenseRenewalPolyfill()
          }

          let license = drm && drm.license
          if(contentId) {
            license = mergeQueryStringParams(license, { contentId })
          }
          
          let csmEnabled = drm && drm.csmEnabled
          if(typeof window !== 'undefined' && window.MSPlayer && typeof window.MSPlayer.csmEnabled !== 'undefined') {
            csmEnabled = window.MSPlayer.csmEnabled
          }
          
          let configuration = drm && {
            drm: {
              servers: {
                [drm.keySystem]: license
              },
              advanced: {
                [drm.keySystem]: {
                  audioRobustness: 'SW_SECURE_CRYPTO',
                  persistentStateRequired: !(isUbuntu()),
                  videoRobustness: 'SW_SECURE_CRYPTO'
                }
              }
            }
          }

          //..
          if(window.shakaConfig) {
            configuration = {
              ...configuration,
              ...window.shakaConfig
            }
          }
          //..test

          if(drm && drm.certificate) {
            // https://shaka-player-demo.appspot.com/docs/api/shaka.extern.html#.AdvancedDrmConfiguration
            // https://github.com/google/shaka-player/issues/810
            const requestType = window.shaka.net.NetworkingEngine.RequestType.APP
            const request = { uris: [ drm.certificate ] }
            const async = this.player.getNetworkingEngine().request(requestType, request)

            async.promise
            .then((response) => {
              const cert = new Uint8Array(response.data)

              configuration.drm.advanced = {
                ...configuration.drm.advanced,
                [drm.keySystem]: {
                  ...(configuration.drm.advanced && configuration.drm.advanced[drm.keySystem]),
                  serverCertificate: cert
                }
              }

              this.player.configure(configuration)

              resolve(this.player)

            })
            .catch((error) => {
              console.error(error)
              reject(error)
            })
          } else {
            this.logger.info(`Configuración`, configuration)
            this.player.configure(configuration)

            resolve(this.player)
          }

          if(drm) {
            this.player.getNetworkingEngine().registerRequestFilter((type, request) => {
              if (type === window.shaka.net.NetworkingEngine.RequestType.LICENSE) {
                if(drm.token) {
                  request.headers['Authorization'] = `Bearer ${drm.token}`
                }
              }
            })
          }

          if (this.player) {
            this.addEventListeners()
          } else {
            this.error({ type: ERROR_SHAKA_INSTANCE_NOT_FOUND })
          }
        } else {
          reject({ 
            type: ERROR_SHAKA_NOT_SUPPORTED,
            info: {
              ua: navigator.userAgent
            }
          })
        }
      } else {
        this.logger.error(`No se ha encontrado el SDK de ShakaPlayer (window.shaka). Esperando a que esté disponible...`)

        waitFor( () => window.shaka )
        .then(() => {
          this.logger.info(`Se ha detectado el SDK de ShakaPlayer`)
          this.init(drm, contentId)
          .then(() => resolve())
          .catch((error) => reject(error))
        })
        .catch(() => reject({ type: ERROR_SHAKA_SDK_TIMEOUT }))
      }
    })
  }

  // Basado en: https://mediaset.test.ott.irdeto.com/docs/cookbook/csm/csm_playready.html
  // Pero el ejemplo está muy obsoleto
  addLicenseRenewalPolyfill() {
    this.logger.info(`Extender funcionalidad de ShakaPlayer para gestionar control de concurrencia`)

    const self = this

    // Holds license renewal functions as shaka.util.Timers.
    self.licenseRenewalTimers = []

    // License renewal duration, every x seconds.
    let licenseDuration = 60
    // Previous value of License renewal duration.
    let isLicenseRenewalTimerTriggered = false

    // When the license response is received and heartbeat interval is set
    // This function will start license renewals.
    const manageLicenseRenewal = () => {
      if (licenseDuration <= 0) {
        self.logger.warn(`Se intenta añadir timer para renovar la licencia pero no hay una duración válida`)

        // Heartbeat Interval has not been set yet.
        return false
      }

      if (isLicenseRenewalTimerTriggered === false) {
        isLicenseRenewalTimerTriggered = true

        self.licenseRenewalTimers.forEach((timer) => {
          self.logger.info(`Añadir timer para renovar la licencia cada ${licenseDuration} segundos`)

          timer.tickEvery(licenseDuration)
        })
        return true
      }
      return false
    }

    window.shaka.media.DrmEngine.prototype.createOrLoad = function() {
      // Create temp sessions.
      const initDatas = this.currentDrmInfo_ ? this.currentDrmInfo_.initData : []
      initDatas.forEach((initDataOverride) => {
        const that = this
        
        // createTimersForRenewals
        const timerForSessionUpdate = new window.shaka.util.Timer(() => {
          self.logger.info('Crear nueva sesión de licencia temporal')
  
          that.createTemporarySession_(
            initDataOverride.initDataType,
            initDataOverride.initData
          )
        })
        self.licenseRenewalTimers.push(timerForSessionUpdate)

        self.logger.info('Crear sesión de licencia temporal')

        return this.createTemporarySession_(
          initDataOverride.initDataType,
          initDataOverride.initData
        )
      })

      // Load each session.
      this.offlineSessionIds_.forEach((sessionId) => {
        return this.loadOfflineSession_(sessionId);
      })

      // If we have no sessions, we need to resolve the promise right now or else
      // it will never get resolved.
      if (!initDatas.length && !this.offlineSessionIds_.length) {
        this.allSessionsLoaded_.resolve()
      }

      return this.allSessionsLoaded_
    }

    this.player.getNetworkingEngine().registerResponseFilter(function(type, response) {
      // MANIFEST: 0
      // SEGMENT: 1
      // LICENSE: 2
      // APP: 3
      // TIMING: 4
      if(type === window.shaka.net.NetworkingEngine.RequestType.LICENSE) {
        if(response.headers && response.headers['x-irdeto-renewal-duration']) {
          const duration = parseInt(response.headers['x-irdeto-renewal-duration'], 10)
          licenseDuration = !isNaN(duration) && duration > 0 ? duration : 60

          self.logger.info(`Se recibe cabecera x-irdeto-renewal-duration: ${duration}`)
        } else {
          self.logger.error(`No se ha recibido la cabecera x-irdeto-renewal-duration`)
        }

        manageLicenseRenewal()
      }
    })
  }

  setSrc({ src, start = -1, drm, contentId }) {
    if(!isNaN(start) || start === Infinity || start <= 0) start = -1

    const self = this

    return new Promise((resolve, reject) => {
      const init = () => {
        self.init(drm, contentId)
        .then(() => {
          if(self.player) {
            self.logger.info(`Cargar stream en Shaka Player...`)

            let resolved = false

            const doResolve = () => {
              if(!resolved) {
                resolve()
              }
              resolved = true
            }

            window.setTimeout(() => {
              if(!resolved) {
                self.logger.info(`No se ha resuelto la promesa del método 'shakaPlayer.load' después de 5 segundos, pero se permite iniciar la reproducción de todas formas`)
                doResolve()
              }
            }, 5000)

            self.player.load(src)
            .then(() => {
              self.logger.info(`El stream se ha cargado correctamente en la instancia de Shaka Player`)

              if(self.video) {
                self.video.addEventListener('canplay', function onCanPlay(e) {
                  self.video.removeEventListener('canplay', onCanPlay)
                  if(!resolved) {
                    self.logger.info(`Recibido evento 'canplay'. El player está preparado para iniciar la reproducción`)
                    doResolve()
                  } else {
                    self.logger.info(`Se ha recibido evento 'canplay' pero ya se ha pedido iniciar la reproducción`)
                  }
                })
              }
              window.setTimeout(() => {
                if(!resolved) {
                  self.logger.info(`No se ha recibido el evento 'canplay' después de 5 segundos, pero se permite iniciar la reproducción de todas formas`)
                  doResolve()
                }
              }, 5000)
            })
            .catch((error) => reject(error))
          } else {
            reject({ type: ERROR_SHAKA_INSTANCE_NOT_FOUND })
          }
        })
        .catch((error) => reject(error))
      }
      if(self.player) {
        self.logger.warn(`Ya hay un player ShakaPlayer en uso`)

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
        src = this.player.getManifestUri()
      } catch(error) {
        src = null

        this.logger.warn(`Se ha pedido recuperar la URL del stream a la instancia de Shaka Player pero se ha producido un error`, error)
      }
    }
    return src
  }

  getPlayer() {
    return this.player
  }

  getType() {
    return SHAKA_PLAYER
  }

  addEventListeners() {
    if(this.player){
      this.player.addEventListener('error', this.handleError)
      this.player.addEventListener('streaming', this.handleStreaming)
    }
  }

  removeEventListeners() {
    if(this.player){
      this.player.removeEventListener('error', this.handleError)
      this.player.removeEventListener('streaming', this.handleStreaming)
    }
  }

  handleStreaming(e) {
    if(this.player) {
      const languages = this.player.getAudioLanguages()

      if(languages.length) {
        const audioTracks = languages.map((lang, index) => ({
          index,
          label: translateLanguage(lang),
          language: lang
        }))
        this.onStreamEvent(AUDIO_TRACKS, { audioTracks })

        const variantTracks = this.player.getVariantTracks()

        for(let i = 0, l = variantTracks.length; i < l; i++) {
          if(variantTracks[i].active) {
            this.onStreamEvent(AUDIO_TRACK_CHANGED, {
              track: audioTracks.find((item) => item.language === variantTracks[i].language)
            })
            break
          }
        }
      }
    }
  }

  // https://shaka-player-demo.appspot.com/docs/api/shaka.util.Error.html
  handleError(e) {
    // detail.severity
    // RECOVERABLE	1	number	An error occurred, but the Player is attempting to recover from the error. If the Player cannot ultimately recover, it still may not throw a CRITICAL error. For example, retrying for a media segment will never result in a CRITICAL error (the Player will just retry forever).
    // CRITICAL	2	number	A critical error that the library cannot recover from. These usually cause the Player to stop loading or updating. A new manifest must be loaded to reset the library.

    // detail.category
    // NETWORK	1	number	Errors from the network stack.
    // TEXT	2	number	Errors parsing text streams.
    // MEDIA	3	number	Errors parsing or processing audio or video streams.
    // MANIFEST	4	number	Errors parsing the Manifest.
    // STREAMING	5	number	Errors related to streaming.
    // DRM	6	number	Errors related to DRM.
    // PLAYER	7	number	Miscellaneous errors from the player.
    // CAST	8	number	Errors related to cast.
    // STORAGE	9	number	Errors in the database storage (offline).

    if(e.detail) {
      // Shaka reporta la expiración de la licencia como error crítico pero se ha implementado un workaround que la renueva, por tanto, la reproducción debería continuar sin problema
      // EXPIRED	6014	number	The license has expired. This is triggered when all keys in the key status map have a status of 'expired'.
      if(e.detail.code === window.shaka.util.Error.Code.EXPIRED) {
        this.logger.warn(`La licencia DRM ha expirado`, {
          category: e.detail.category,
          code: e.detail.code,
          message: e.detail.message,
          severity: e.detail.severity
        })
        return
      }

      this.logger.error(`Error`, {
        category: e.detail.category,
        code: e.detail.code,
        message: e.detail.message,
        severity: e.detail.severity
      })

      if(e.detail.severity === window.shaka.util.Error.Severity.CRITICAL) {
        const irdetoMessageMatch = e.detail.message.match(/\\"code[\\]*":([0-9]+),/i)
        const irdetoCode = irdetoMessageMatch && irdetoMessageMatch[1]

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
                shaka: e.detail.code,
                irdeto: irdetoCode,
              },
              message: e.detail.message,
            },
          })

        // Concurrencia
        } else if((/too many concurrent streams/i).test(e.detail.message)) {
          this.error({
            type: ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS,
            info: {
              code: {
                shaka: e.detail.code,
                irdeto: irdetoCode,
              },
              message: e.detail.message,
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
                shaka: e.detail.code,
                irdeto: irdetoCode,
              },
              message: e.detail.message,
              ua: navigator.userAgent
            },
          })

        // Genérico
        } else {
          this.error({
            type: ERROR_SHAKA,
            info: {
              code: {
                shaka: e.detail.code
              },
              message: e.detail.message
            }
          })
        }
      }
    }
  }

  pause(mustStopLoad) {
    if(this.video) {
      this.video.pause()
    }
  }

  setAudioTrack(track) {
    if(this.player) {
      this.player.selectAudioLanguage(track.language)
      this.onStreamEvent(AUDIO_TRACK_CHANGED, { track })
    }
  }

  error(error) {
    this.logger.error(`Error`, error)

    this.destroy()
    this.onError(error)
  }

  reset() {
    this.removeEventListeners()

    if(this.licenseRenewalTimers) {
      this.licenseRenewalTimers.forEach((timer) => {
        timer.stop()
      })
    }
    if(this.player) {
      this.logger.info(`Resetear player en uso`)
      this.player.unload()
    }
  }

  destroy() {
    if(this.licenseRenewalTimers) {
      this.licenseRenewalTimers.forEach((timer) => {
        timer.stop()
      })
    }
    if(this.player) {
      this.removeEventListeners()
      this.player.unload()
      this.player.destroy()
      this.player = null
    }
    this.video = null
  }
}

export default ShakaPlayer
