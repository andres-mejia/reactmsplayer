import fetch from 'isomorphic-fetch'
import { stringToUint8Array, translateLanguage, uint8ArrayToString } from '../../../commons/util'
import { errorTypes, keySystems, mediaPlayerTypes } from '../../../commons/types'
import { mediaPlayerEvents, streamEvents } from '../../../commons/types/events'
import { STARTER_SRC_URL } from '../../videoPlayer/model'

const { 
  ERROR_DRM_CERTIFICATE_FETCH,
  ERROR_DRM_CERTIFICATE_URL_NOT_FOUND,
  ERROR_DRM_GENERIC,
  ERROR_DRM_INIT_DATA_NOT_FOUND,
  ERROR_DRM_KEY_SESSION,
  ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED,
  ERROR_DRM_LICENSE_AUTHORIZATION_DENIED,
  ERROR_DRM_LICENSE_FETCH,
  ERROR_DRM_LICENSE_NOT_FOUND,
  ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS,
  ERROR_VIDEO_INSTANCE_NOT_FOUND
 } = errorTypes

 const { FAIR_PLAY } = keySystems
 const { HTML_VIDEO_ELEMENT } = mediaPlayerTypes
 const { MEDIA_PLAYER_CHANGED } = mediaPlayerEvents

 const { 
  AUDIO_TRACKS,
  AUDIO_TRACK_CHANGED,
  FRAG_METADATA,
  SUBTITLE_TRACKS,
  SUBTITLE_TRACK_CHANGED
 } = streamEvents

class HtmlVideoElement {
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

    this.drm = {}
    this.isLicenseRequested = false
    this.licenseRenewalDuration = undefined
    this.licenseRenewalTimeout = undefined

    this.handleAddTextTrack = this.handleAddTextTrack.bind(this)
    this.textTrackChangeHandler = this.textTrackChangeHandler.bind(this)
    this.handleEncrypted = this.handleEncrypted.bind(this)

    this.onMediaPlayerEvent(MEDIA_PLAYER_CHANGED, {
      player: this.video,
      type: HTML_VIDEO_ELEMENT,
      videoUrl: this.video.src,
      videoElement: this.video
    })
  }

  setSrc({ src, start = 0, drm, audioTrack, subtitleTrack }) {
    if(isNaN(start) || start === Infinity || start < 0) start = 0
    return new Promise((resolve, reject) => {
      this.isLicenseRequested = false

      if(this.video) {
        if(!src) {
          this.video = ''
          return resolve()
        }

        this.video.src = src

        const self = this
        let resolved = false

        if(src.indexOf(STARTER_SRC_URL) === -1) {
          self.video.textTracks.removeEventListener('addtrack', this.handleAddTextTrack)
          self.video.textTracks.addEventListener('addtrack', this.handleAddTextTrack)
          self.video.textTracks.removeEventListener('change', this.textTrackChangeHandler)
          self.video.textTracks.addEventListener('change', this.textTrackChangeHandler)

          const updateAudioTracks = () => {
            const tracks = self.video.audioTracks

            if (tracks && tracks.length) {
              let audioTracks = []
              for (let i = 0, l = tracks.length; i < l; i++) {
                const track = {
                  index: i,
                  label: translateLanguage(tracks[i].language),
                  language: tracks[i].language
                }
                // Por defecto desactivamos cualquier audio que esté como activado
                tracks[i].enabled = false
                audioTracks.push({ ...track })
              }
              self.onStreamEvent(AUDIO_TRACKS, { audioTracks })

              // Si el usuario hace un cambio de audio lo activamos
              if (audioTrack !== null && tracks[audioTrack]) {
                tracks[audioTrack].enabled = true
                const trackObjSelected = {
                  index: audioTrack,
                  label: translateLanguage(tracks[audioTrack].language),
                  language: tracks[audioTrack].language
                }
                this.logger.info('El manifest detecta un cambio de audio a:', trackObjSelected)
              } else {
                // Si no se indica ningún audio por parte del usuario/player
                // activamos la primera pista existente
                tracks[0].enabled = true
                const trackObjSelected = {
                  index: audioTracks[0].index,
                  label: translateLanguage(tracks[0].language),
                  language: tracks[0].language
                }
                this.logger.info('El manifest detecta un cambio de audio a:', trackObjSelected)
              }
            }
          }

          const updateSubtitleTracks = () => {
            const tracks = self.video.textTracks
            if(tracks && tracks.length) {
              const subtitleTracks = []
              // Informamos de los subtítulos disponibles
              const { id = -1, language = 'none' } = subtitleTrack || {}
              for (let i = 0; i < tracks.length; i++) {
                if (tracks[i].kind === 'subtitles') {
                  const subtitleTrackObj = {
                    index: i,
                    label: tracks[i].label,
                    language: tracks[i].language
                  }
                  subtitleTracks.push({ ...subtitleTrackObj })
                  tracks[i].mode = 'disabled'
                  tracks[i].default = false
                  this.logger.info('El manifest detecta desactivar subtítulos:', { id: i, language: tracks[i].language })
                  if (tracks[i].language === language) {
                    tracks[i].mode = 'showing'
                    tracks[i].default = true
                    this.logger.info('El manifest detecta un cambio de subtítulos a:', { id, language })
                  }
                }
              }
              if(subtitleTracks.length) {
                self.onStreamEvent(SUBTITLE_TRACKS, {
                  subtitleTracks: subtitleTracks.map((track) => ({
                    name: translateLanguage(track.language),
                    language: track.language
                  }))
                })
              }
            }
          }

          self.video.addEventListener('loadedmetadata', function onLoadedMetadata() {
            self.video.removeEventListener('loadedmetadata', onLoadedMetadata)

            if(typeof start !== 'undefined') self.video.currentTime = start

            updateAudioTracks()
            updateSubtitleTracks()
          })
          self.video.addEventListener('loadeddata', function onLoadedData() {
            self.video.removeEventListener('loadeddata', onLoadedData)

            if(typeof start !== 'undefined') self.video.currentTime = start

            updateAudioTracks()
            updateSubtitleTracks()
          })
          self.video.addEventListener('canplay', function onCanPlay() {
            self.video.removeEventListener('canplay', onCanPlay)

            if(typeof start !== 'undefined') self.video.currentTime = start

            updateAudioTracks()
            updateSubtitleTracks()
          })

          if(drm) {
            this.drm = drm

            // Algunas versiones de Safari pueden no soportan 'encrypted':
            // https://caniuse.com/#search=encrypted
            // 'encrypted' devuelve e.initData como ArrayBuffer
            // 'webkitneedkey' devuelve e.initData como Uint8Array
            self.video.addEventListener('webkitneedkey', this.handleEncrypted)
          }

          // No es necesario ejecutar self.video.load() porque el play se encarga de gestionarlo
          // excepto en iOS 10
          // Forzar la carga siempre que no sea el starter-src
          // OJO con la precarga del starter-src por problemas de memory leaking en iphone
          self.video.load()
        }

        const handleCanPlay = (e) => {
          self.video.removeEventListener('canplay', handleCanPlay)

          resolved = true

          self.logger.info(`Recibido evento canplay. El player está preparado para iniciar la reproducción`)

          resolve()
        }

        window.setTimeout(() => {
          if(!resolved) {
            self.video.removeEventListener('canplay', handleCanPlay)

            self.logger.warn(`No se ha recibido el evento canplay después de 5 segundos, pero se permite iniciar la reproducción de todas formas`)

            resolve()
          }
        }, 5000)

        self.video.addEventListener('canplay', handleCanPlay)

      } else {
        reject({ type: ERROR_VIDEO_INSTANCE_NOT_FOUND })
      }
    })
  }

  getSrc() {
    if(this.video) {
      return this.video.src
    }
    return null
  }

  getPlayer() {
    return this.video
  }

  getType() {
    return HTML_VIDEO_ELEMENT
  }

  setAudioTrack(track) {
    // Cuando se cambia el audio desde el menú del player
    // se lanza este evento. Desactivamos todos los audios salvo el indicado
    if(this.video) {
      const tracks = this.video.audioTracks
      if(tracks && tracks[track.index]) {
        for(let i = 0, l = tracks.length; i < l; i++) {
          tracks[i].enabled = i === track.index
        }
        // Guardar el índice del audio seleccionado
        const selectedAudioTrackIndex = track.index
        this.video.audioTrack = selectedAudioTrackIndex
        this.onStreamEvent(AUDIO_TRACK_CHANGED, { track })
      }
    }
  }

  setSubtitleTrack(subtitleTrack) {
    if (this.video) {
      const tracks = Array.from(this.video.textTracks)
      if (this.video.textTracks && Array.isArray(tracks) && tracks.length) {
        for (let i = 0; i < this.video.textTracks.length; i++) {
          if (this.video.textTracks[i].kind === 'subtitles') {
            this.video.textTracks[i].mode = 'disabled'
            this.video.textTracks[i].default = false
            if (this.video.textTracks[i].language === subtitleTrack.language) {
              this.video.textTracks[i].mode = 'showing'
              this.video.textTracks[i].default = true
            }
          }
        }

        // Guardar el índice de la pista de subtítulos seleccionada
        const foundIndex = tracks.find((track) => track.language === subtitleTrack.language)
        const selectedSubtitleTrackIndex = Array.from(this.video.textTracks)
          .findIndex((track) => track === foundIndex)

        this.video.subtitleTrack = {
          id: selectedSubtitleTrackIndex,
          language: subtitleTrack.language
        }
        this.onStreamEvent(SUBTITLE_TRACK_CHANGED, { subtitleTrack })
      }
    }
  }

  // https://developers.google.com/web/fundamentals/media/eme

  // 'encrypted' devuelve e.initData como ArrayBuffer
  // 'webkitneedkey' devuelve e.initData como Uint8Array
  handleEncrypted(e) {
    this.logger.info(`Se recibe el evento 'webkitneedkeys'. Es un stream encriptado con DRM`)

    this.video.removeEventListener('webkitneedkey', this.handleEncrypted)

    if(
      this.drm.keySystem === FAIR_PLAY &&
      this.video.webkitSetMediaKeys &&
      window.WebKitMediaKeys
    ) {

      // if(!this.video.webkitKeys) {
        this.logger.info(`Se asigna el MediaKey ${this.drm.keySystem} al elemento video`)
        this.video.webkitSetMediaKeys(new window.WebKitMediaKeys(this.drm.keySystem));
      // }

      if(!this.video.webkitKeys) {
        this.onError({
          type: ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED,
          info: {
            keySystem: this.drm.keySystem,
            ua: navigator.userAgent
          }
        })
        return
      }

      if(this.drm.certificate) {
        this.logger.info(`Se pide el certificado de la licencia DRM: ${this.drm.certificate}`)

        fetch(this.drm.certificate)
        .then((response) => {
          if (response.ok) {
            this.logger.info(`Certificado de la licencia DRM recuperado correctamente`)
            return response.arrayBuffer()
          } else {
            throw {
              type: ERROR_DRM_CERTIFICATE_FETCH,
              info: {
                status: response.status,
                url: this.drm.certificate
              },
              message: response.statusText
            }
          }
        })
        .then((cert) => {
          this.createKeySession(e.initData, new Uint8Array(cert))
        })
        .catch((error) => {
          if(!error) error = {}
          if(!error.info) error.info = {}
          this.onError({
            type: ERROR_DRM_CERTIFICATE_FETCH,
            info: {
              ...error.info,
              message: error.message,
              url: this.drm.certificate
            }
          })
        })
      } else {
        this.onError({ 
          type: ERROR_DRM_CERTIFICATE_URL_NOT_FOUND,
          info: {
            response: JSON.stringify(this.drm)
          }
        })
      }
    } else {
      this.onError({
        type: ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED,
        info: {
          keySystem: this.drm.keySystem,
          ua: navigator.userAgent
        }
      })
    }
  }

  // Params: Uint8Array
  createKeySession(initData, cert) {
    if(initData) {
      const contentId = uint8ArrayToString(initData).split('skd://')[1]
      const data = this.concatInitDataIdAndCertificate(initData, contentId, cert)

      this.logger.info(`Se crea un MediaKeySession para esta licencia`)

      this.keySession = this.video.webkitKeys.createSession('video/mp4', data)

      this.keySession.addEventListener('webkitkeymessage', (e) => {
        this.logger.info(`Se recibe un mensaje de tipo 'webkitkeymessage`)

        this.addLicense({
          license: `https://${contentId}`,
          message: e.message
        })
      })

      this.keySession.addEventListener('webkitkeyerror', (e) => {
        this.logger.info(`Error de tipo 'webkitkeyerror'`)

        this.onError({
          type: ERROR_DRM_KEY_SESSION,
          info: {
            keySystem: this.drm.keySystem,
            message: this.keySession.error.message,
            ua: navigator.userAgent
          }
        })
      })

      this.keySession.addEventListener('webkitkeyadded', (e) => {
        this.logger.info(`La key se ha añadido correctamente: 'webkitkeyadded'`)
      });

    } else {
      this.onError({ type: ERROR_DRM_INIT_DATA_NOT_FOUND })
    }
  }

  addLicense(params) {
    const { license, message } = params

    if(license || this.drm.license) {
      let headers = {
        'Content-type': 'application/octet-stream'
      }
      if(this.drm.token) {
        headers['Authorization'] = `Bearer ${this.drm.token}`
      }
      if(this.drm.csmEnabled) {
        if(this.isLicenseRequested === false) {
          headers['X-Irdeto-Renewal-Request'] = '0'
        } else {
          headers['X-Irdeto-Renewal-Request'] = '1'
        }
      }

      let url = license
      if(!url) {
        url = this.drm.license
      }

      const init = {
        method: 'POST',
        headers,
        responseType: 'arraybuffer',
        body: message
      }

      this.logger.info(`Se pide la licencia al servidor de licencias: ${url}`)

      fetch(url, init)
      .then((response) => {
        if (response.ok) {
          this.logger.info(`Licencia recuperada correctamente`)

          this.isLicenseRequested = true

          const renewalDuration = response.headers['X-Irdeto-Renewal-Duration']

          if(renewalDuration) {
            try {
              this.licenseRenewalDuration = parseInt(renewalDuration, 10)
              this.logger.info(`Se recoge el tiempo de expiración de la licencia de la cabecera 'X-Irdeto-Renewal-Duration': ${this.licenseRenewalDuration}`)
            } catch(error) {
              this.logger.warn(`Error en CSM: No ha sido posible parsear el tiempo de expiración de la licencia en la cabecera 'X-Irdeto-Renewal-Duration': ${error.message}`)
            }

            if(!isNaN(this.licenseRenewalDuration)) {
              window.clearTimeout(this.licenseRenewalTimeout)

              this.licenseRenewalTimeout = setTimeout(
                () => {
                  this.logger.info(`Renovar licencia...`)
                  this.addLicense(params)
                },
                this.licenseRenewalDuration * 1000
              )
            }
          }
          return response.arrayBuffer()
        } else {
          throw response
        }
      })
      .then((license) => {
        this.logger.info(`Se actualiza la licencia en la MediaKeySession`)

        this.keySession.update(new Uint8Array(license))
      })
      .catch((error) => {
        if(error && error.json) {
          error.json()
          .then((json) => {
            this.logger.warn(`Error ${error.status} en la petición al servidor de licencias`, json)

            const irdetoCode = json.code
            const irdetoMessage = json.message

            // Permiso de licencia denegado
            // - 100200: Token inválido
            // - 100201: Token ausente
            // - 100202: Token expirado
            // - 100203: Token futuro
            if(irdetoCode && (/10020(0|1|2|3)/).test(irdetoCode)) {
              this.onError({
                type: ERROR_DRM_LICENSE_AUTHORIZATION_DENIED,
                info: {
                  code: {
                    irdeto: irdetoCode
                  },
                  message: irdetoMessage,
                  status: error.status
                },
              })

            // Concurrencia
            } else if(irdetoCode && (/130001/).test(irdetoCode) && (/too many concurrent streams/i).test(irdetoMessage)) {
              this.onError({
                type: ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS,
                info: {
                  code: {
                    irdeto: irdetoCode
                  },
                  message: irdetoMessage,
                  status: error.status
                },
              })

            // Incompatibilidad
            // - 180002: PlayReady
            // - 190121: Widevine
            // - 200001: FairPlay:
            // - 200004: FairPlay: SPC (Server Playback Context) not supported
            } else if(irdetoCode && (/(180002|190121|200001|200004)/).test(irdetoCode)) {
              this.onError({
                type: ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED,
                info: {
                  code: {
                    irdeto: irdetoCode
                  },
                  message: irdetoMessage,
                  status: error.status,
                  ua: navigator.userAgent
                },
              })

            // Genérico
            } else {
              this.onError({
                type: ERROR_DRM_GENERIC,
                info: {
                  code: {
                    irdeto: irdetoCode
                  },
                  message: irdetoMessage,
                  status: error.status
                },
              })
            }
          })
          .catch((e) => {
            this.onError({
              type: ERROR_DRM_LICENSE_FETCH,
              info: {
                status: error.status,
                url
              },
              message: e.message
            })
          })
        } else {
          if(!error) error = {}
          if(!error.info) error.info = {}
          this.onError({
            type: ERROR_DRM_LICENSE_FETCH,
            info: {
              ...error.info,
              message: error.message,
              url,
            }
          })
        }
      })
    } else {
      this.onError({ 
        type: ERROR_DRM_LICENSE_NOT_FOUND,
        info: {
          response: JSON.stringify(this.drm)
        }
      })
    }
  }

  // https://github.com/videojs/videojs-contrib-eme/blob/master/src/fairplay.js
  concatInitDataIdAndCertificate(initData, id, cert) {
    if(typeof id === 'string') {
      id = stringToUint8Array(id)
    }

    // [initData]
    // [4 byte: idLength]
    // [idLength byte: id]
    // [4 byte:certLength]
    // [certLength byte: cert]

    let offset = 0
    const buffer = new ArrayBuffer(initData.byteLength + 4 + id.byteLength + 4 + cert.byteLength)
    const dataView = new DataView(buffer)

    // Init data
    const initDataArray = new Uint8Array(buffer, offset, initData.byteLength)

    initDataArray.set(initData)
    offset += initData.byteLength

    dataView.setUint32(offset, id.byteLength, true)
    offset += 4

    // Id
    const idArray = new Uint16Array(buffer, offset, id.length)

    idArray.set(id)
    offset += idArray.byteLength

    dataView.setUint32(offset, cert.byteLength, true)
    offset += 4

    // Certificate
    const certArray = new Uint8Array(buffer, offset, cert.byteLength)

    certArray.set(cert)

    return new Uint8Array(buffer, 0, buffer.byteLength)
  }

  handleAddTextTrack(addTrackEvent) {
    const self = this

    const track = addTrackEvent.track

    if (track && track.kind === 'metadata' && this.video?.src.includes('fast.')) {
      // Importante! Si no está en mode 'hidden' no se recibe 'cuechange'
      track.mode = 'hidden'
      track.addEventListener('cuechange', (unusedEvent) => {
        let scte35Data = null
        let startTimeScte35 = null
        const nonActiveCues = Array.from(track.cues)
        const activeCues = Array.from(track.activeCues)
        const cue = activeCues
          .find(({ startTime, endTime, value }) => !isNaN(startTime) && !isNaN(endTime)
          && Math.floor(self.video.currentTime) >= Math.floor(startTime)
          && Math.floor(self.video.currentTime) <= Math.floor(endTime) && value.info === 'urn:scte:scte35:2013:bin@')
        if (cue) {
          const filteredCues = nonActiveCues.filter(({ startTime, endTime }) => {
            const currentTime = Math.floor(self.video.currentTime)
            return currentTime >= Math.floor(startTime) && currentTime <= Math.floor(endTime)
          })

          // Primero buscamos únicamente marcas SCTE35 de tipo SCTE35-IN
          const scte35IN = filteredCues.find(({ value }) => value.key === 'SCTE35-IN')
          if (scte35IN) {
            scte35Data = 'EXT-X-CUE-IN'
            startTimeScte35 = scte35IN.endTime
          } else {
            const scte35OUT = filteredCues.find(({ value }) => value.key === 'SCTE35-OUT')
            if (scte35OUT) {
              const plannedDuration = filteredCues.find(({ value }) => value.key === 'PLANNED-DURATION' && !isNaN(parseFloat(value.data)) && parseFloat(value.data) >= 10)
              // TODO: mientras no llegan bien las marcas
              if (!plannedDuration) {
                const { startTime = self.video.currentTime, value = {data: 120} } = plannedDuration || {}
                const duration = (parseFloat(value.data) * 1000).toFixed(2)
                scte35Data = `EXT-X-CUE-OUT=${duration}`
                startTimeScte35 = startTime
              }
            }
          }
        } else if (Math.floor(self.video.currentTime) === 0) {
          const cue = activeCues
            .find(({ startTime, value }) => !isNaN(startTime) && Math.floor(startTime) === 0 && value.key === 'SCTE35-OUT')
          if (cue) {
            const plannedDuration = activeCues.find(({ value }) => value.key === 'PLANNED-DURATION' && !isNaN(parseFloat(value.data)) && parseFloat(value.data) >= 10)
            if (plannedDuration) {
              const { startTime, value } = plannedDuration
              const duration = (parseFloat(value.data) * 1000).toFixed(2)
              scte35Data = `EXT-X-CUE-OUT=${duration}`
              startTimeScte35 = startTime
            }
          }
        }
        if (scte35Data !== null && startTimeScte35 !== null) {
          self.logger.info('Detectado cambio en uno de los cues del TextTrack', { data: scte35Data, timestamp: startTimeScte35, playerTime: self.video.currentTime })
          self.onStreamEvent(FRAG_METADATA, {
            data: scte35Data,
            timestamp: startTimeScte35,
            type: 'SCTE35'
          })
        }
      })
    } else if (!this.video?.src.includes('fast.')) {
      // Importante! Si no está en mode 'hidden' no se recibe 'cuechange'
      track.mode = 'hidden'
      track.addEventListener('cuechange', (cueChangeEvent) => {
        const textTrack = cueChangeEvent.currentTarget
        if(textTrack){
          const textTrackCueList = textTrack.activeCues
          if(textTrackCueList && textTrackCueList.length > 0) {
            for(let i = 0, l = textTrackCueList.length; i < l; i++) {
              const dataCue = textTrackCueList.item ? textTrackCueList.item(i) : textTrackCueList[i]
              self.logger.info(`Detectado cambio en uno de los cues del TextTrack`, { cue: dataCue })

              // Webkit
              if(dataCue && dataCue.type === 'org.id3') {
                if(dataCue.value && dataCue.value.key === 'TXXX') {

                  // http://id3.org/id3v2.4.0-structure
                  // https://helpx.adobe.com/adobe-media-server/dev/timed-metadata-hls-hds-streams.html

                  const textEncoder = new TextEncoder('utf-8')

                  // Header
                  const identifier = Array.from(textEncoder.encode('ID3')) // 'ID3' [73, 68, 51]
                  const version = [0x04, 0x00] // [4, 0]
                  const flags = [0] // [0]
                  const size = [0, 0, 0, 0] // Determinar luego [0, 0, 0, 28]

                  // Frame
                  const frameId = Array.from(textEncoder.encode(dataCue.value.key)) // 'TXXX' [84, 88, 88, 88]
                  const frameDataSize = [0, 0, 0, 0] // Determinar luego [0, 0, 18, 0, 0]
                  const frameFlags = [0x00, 0x00]
                  const frameTextEncoding = [0x03] // UTF-8
                  const xtra = [0] // ??
                  const fieldsInfo = dataCue.value.info ? dataCue.value.info : ''
                  const fieldsData = dataCue.value.data ? dataCue.value.data : ''
                  const frameFields = Array.from(textEncoder.encode(`${fieldsInfo}${fieldsData}`)) // p.e: 'google_7480883024894848999' [103, 111, 111, 103, 108, 101, 95, 55, 52, 56, 48, 56, 56, 51, 48, 50, 52, 56, 57, 52, 56, 52, 56, 57, 57, 57]; '1201254_all' [49, 50, 48, 49, 50, 53, 52, 95, 97, 108, 108]

                  let frame = frameId.concat(frameDataSize, frameFlags, frameTextEncoding, xtra, frameFields)
                  // Frame data size
                  frame[7] = frame.length - 10

                  let data = identifier.concat(version, flags, size, frame)
                  // Size
                  data[9] = data.length - 10

                  data = new Uint8Array(data)

                  self.onStreamEvent(FRAG_METADATA, {
                    type: 'ID3',
                    data,
                    timestamp: dataCue.startTime
                  })
                }

              // Microsoft (Edge)
              // https://jira.mediaset.es/browse/MLTSITE-1565
              } else if(dataCue && dataCue.data) {
                self.onStreamEvent(FRAG_METADATA, {
                  type: 'ID3',
                  data: dataCue.data,
                  timestamp: dataCue.startTime
                })
              }
            }
          }
        }
      })
    }
  }

  textTrackChangeHandler() {
    const metadataTrack = Array.from(this.video.textTracks).find((track) => track.kind === 'metadata')
    if (metadataTrack) {
      metadataTrack.mode = 'hidden'
    }
  }

  pause(mustStopLoad) {
    if(this.video) {
      this.video.pause()
    }
  }

  destroy() {
    if(this.keySession) {
      this.keySession.close()
    }
    if(this.video){
      this.video.textTracks.removeEventListener('addtrack', this.handleAddTextTrack)
      this.video.textTracks.removeEventListener('change', this.textTrackChangeHandler)
      this.video = ''
    }
  }
}

export default HtmlVideoElement
