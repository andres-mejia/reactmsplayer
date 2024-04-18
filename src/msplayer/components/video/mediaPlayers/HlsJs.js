import { translateLanguage, waitFor } from '../../../commons/util'
import { errorTypes, mediaPlayerTypes } from '../../../commons/types'
import { mediaEvents, mediaPlayerEvents, streamEvents } from '../../../commons/types/events'

/*
 * https://github.com/dailymotion/hls.js/
 */

const MAX_MEDIA_ERROR_RECOVERY_ATTEMPTS = 3

const {
  ERROR_HLSJS_INSTANCE_NOT_FOUND,
  ERROR_HLSJS_MEDIA,
  ERROR_HLSJS_NETWORK,
  ERROR_HLSJS_NOT_SUPPORTED,
  ERROR_HLSJS_OTHER_FATAL,
  ERROR_HLSJS_SDK_TIMEOUT
} = errorTypes

const { HLS_JS } = mediaPlayerTypes
const { ENDED } = mediaEvents
const { MEDIA_PLAYER_CHANGED } = mediaPlayerEvents

const {
  AUDIO_TRACKS,
  AUDIO_TRACK_CHANGED,
  FRAG_DATA,
  FRAG_METADATA,
  LEVEL_SWITCHED,
  STREAM_ERROR_NON_FATAL,
  SUBTITLE_TRACKS,
  SUBTITLE_TRACK_CHANGED
} = streamEvents

class HlsJs {
  constructor(params = {
    isLive: undefined,
    logger: () => null,
    onError: () => null,
    onMediaEvent: () => null,
    onMediaPlayerEvent: () => null,
    onStreamEvent: () => null,
    video: undefined
  }) {
    for (let key in params) {
      this[key] = params[key]
    }

    this.id3Queue = []
    this.scteQueue = []
    this.dataQueue = []
    this.fragErrorQueue = []
    this.networkErrorRecoveryAttempts = 0
    this.mediaErrorRecoveryAttempts = 0

    this.handleAudiotracksUpdated = this.handleAudiotracksUpdated.bind(this)
    this.handleAudioTrackSwitched = this.handleAudioTrackSwitched.bind(this)
    this.handleError = this.handleError.bind(this)
    this.handleFragParsingData = this.handleFragParsingData.bind(this)
    this.handleFragParsingMetadata = this.handleFragParsingMetadata.bind(this)
    this.handleLevelSwitched = this.handleLevelSwitched.bind(this)
    this.handleSubtitleTrackSwitched = this.handleSubtitleTrackSwitched.bind(this)
    this.handleSubtitleTrackUpdated = this.handleSubtitleTrackUpdated.bind(this)
    this.handleLevelUpdated = this.handleLevelUpdated.bind(this)
    this.handleFragChanged = this.handleFragChanged.bind(this)
  }

  init() {
    this.logger.info('Inicializar player')

    return new Promise((resolve, reject) => {
      if (window.Hls) {
        if (window.Hls.isSupported()) {
          if (this.player) {
            this.destroy()
          }

          this.id3Queue = []
          this.scteQueue = []
          this.dataQueue = []
          this.fragErrorQueue = []

          this.networkErrorRecoveryAttempts = 0
          this.mediaErrorRecoveryAttempts = 0

          // https://github.com/dailymotion/hls.js/blob/master/API.md

          const config = {
            // https://github.com/video-dev/hls.js/issues/741
            autoStartLoad: false,
            // debug: true,
            xhrSetup: (xhr) => {
              xhr.withCredentials = typeof MSPlayer.withCredentials !== 'undefined' ? MSPlayer.withCredentials : true // Do send cookies
            }
          }

          this.logger.info('Crear instancia de player Hls.js')

          this.player = new window.Hls(config)

          if (this.player) {
            this.addEventListeners()
            resolve()
          } else {
            reject({ type: ERROR_HLSJS_INSTANCE_NOT_FOUND })
          }

          this.onMediaPlayerEvent(MEDIA_PLAYER_CHANGED, {
            player: this.player,
            type: HLS_JS,
            videoUrl: this.player.url,
            videoElement: this.video
          })
        } else {
          reject({
            type: ERROR_HLSJS_NOT_SUPPORTED,
            info: {
              ua: navigator.userAgent
            }
          })
        }
      } else {
        this.logger.error('No se ha encotrado el SDK de Hls.js (window.Hls). Esperando a que esté disponible...')

        waitFor(() => window.Hls)
          .then(() => {
            this.logger.info('Se ha detectado el SDK de Hls.js')
            this.init()
              .then(() => resolve())
              .catch((error) => reject(error))
          })
          .catch(() => reject({ type: ERROR_HLSJS_SDK_TIMEOUT }))
      }
    })
  }

  // https://github.com/video-dev/hls.js/issues/741
  // http://streambox.fr/mse/hls.js-0.7.4/demo/

  setSrc({ src, start = -1, audioTrack, subtitleTrack }) {
    if (isNaN(start) || start === Infinity || start <= 0) start = -1

    const self = this

    return new Promise((resolve, reject) => {
      self.init()
        .then(() => {
          if (self.player) {
            self.logger.warn('Ya hay un player Hls.js en uso')

            self.player.on(window.Hls.Events.MANIFEST_PARSED, function onManifestParsed() {
              self.player.off(window.Hls.Events.MANIFEST_PARSED, onManifestParsed)

              self.logger.info(`Iniciar descarga del recurso desde el segundo ${start}`)
              self.player.startLoad(start)
              // Seteamos los subtítulos/audio si vienen por config
              // si no vienen los valores se desactivan los subtítulos (-1 o null para desactivar la pista de subtítulos)
              // y mantenemos la pista actual de audio
              self.player.subtitleTrack = subtitleTrack !== null ? subtitleTrack : -1
              self.player.subtitleDisplay = subtitleTrack !== null && subtitleTrack !== -1
              if (audioTrack && audioTrack !== self.player.audioTrack) {
                self.player.audioTrack = audioTrack
              }
              let resolved = false

              const handleCanPlay = (e) => {
                e.currentTarget.removeEventListener('canplay', handleCanPlay)

                resolved = true

                self.logger.info('Recibido evento canplay. El player está preparado para iniciar la reproducción')

                resolve()
              }

              window.setTimeout(() => {
                if (!resolved && self.video) {
                  self.video.removeEventListener('canplay', handleCanPlay)
                  self.logger.warn('No se ha recibido el evento canplay después de 5 segundos, pero se permite iniciar la reproducción de todas formas')

                  resolve()
                }
              }, 5000)

              self.video.removeEventListener('canplay', handleCanPlay)
              self.video.addEventListener('canplay', handleCanPlay)
            })

            self.logger.info(`Asignar nuevo recurso: ${src}`)

            self.player.loadSource(src)

            self.logger.info('Vincular instancia de <video>')

            self.player.attachMedia(self.video)
          } else {
            reject({ type: ERROR_HLSJS_INSTANCE_NOT_FOUND })
          }
        })
        .catch((error) => reject(error))
    })
  }

  getSrc() {
    if (this.player) {
      return this.player.url
    }
    return null
  }

  getPlayer() {
    return this.player
  }

  getType() {
    return HLS_JS
  }

  setAudioTrack(track) {
    if (this.player) {
      const tracks = this.player.audioTracks
      if (Array.isArray(tracks) && tracks[track.index] && this.player?.audioTrack !== track.index) {
        this.player.audioTrack = track.index
        this.onStreamEvent(AUDIO_TRACK_CHANGED, { track })
      }
    }
  }

  setSubtitleTrack(subtitleTrack) {
    if (this.player) {
      const tracks = this.player.subtitleTracks
      if (Array.isArray(tracks) && tracks.length) {
        const foundItem = tracks.find((item) => item.lang === subtitleTrack.language)
        const { id } = foundItem || { id: -1 }

        this.player.subtitleTrack = id
        this.player.subtitleDisplay = id !== -1
        this.onStreamEvent(SUBTITLE_TRACK_CHANGED, { subtitleTrack })
      }
    }
  }

  pause() {
    if (this.video) {
      this.video.pause()
    }

    // https://jira.mediaset.es/browse/MULTIES-768
    // Al hacer pause, hls.js continúa descargando fragmentos hasta rellenar el buffer
    // Esto provoca que se mezclen los TS al hacer resume y se produzca un error
    // https://github.com/video-dev/hls.js/issues/1719
    // https://github.com/video-dev/hls.js/pull/1740
    // https://github.com/video-dev/hls.js/issues/542
    // https://github.com/video-dev/hls.js/pull/1845
    if (this.isLive) {
      if (this.player) {
        this.player.stopLoad()
      }
    }
  }

  addEventListeners() {
    if (this.player) {
      this.player.on(window.Hls.Events.AUDIO_TRACKS_UPDATED, this.handleAudiotracksUpdated)
      this.player.on(window.Hls.Events.AUDIO_TRACK_SWITCHED, this.handleAudioTrackSwitched)
      this.player.on(window.Hls.Events.SUBTITLE_TRACK_SWITCH, this.handleSubtitleTrackSwitched)
      this.player.on(window.Hls.Events.SUBTITLE_TRACKS_UPDATED, this.handleSubtitleTrackUpdated)
      this.player.on(window.Hls.Events.ERROR, this.handleError)
      this.player.on(window.Hls.Events.FRAG_PARSING_DATA, this.handleFragParsingData)
      this.player.on(window.Hls.Events.FRAG_PARSING_METADATA, this.handleFragParsingMetadata)
      this.player.on(window.Hls.Events.LEVEL_SWITCHED, this.handleLevelSwitched)
      this.player.on(window.Hls.Events.LEVEL_UPDATED, this.handleLevelUpdated)
      this.player.on(window.Hls.Events.FRAG_CHANGED, this.handleFragChanged)
    }
  }

  removeEventListeners() {
    if (this.player) {
      this.player.off(window.Hls.Events.AUDIO_TRACKS_UPDATED, this.handleAudiotracksUpdated)
      this.player.off(window.Hls.Events.AUDIO_TRACK_SWITCHED, this.handleAudioTrackSwitched)
      this.player.off(window.Hls.Events.SUBTITLE_TRACK_SWITCH, this.handleSubtitleTrackSwitched)
      this.player.off(window.Hls.Events.ERROR, this.handleError)
      this.player.off(window.Hls.Events.FRAG_PARSING_DATA, this.handleFragParsingData)
      this.player.off(window.Hls.Events.FRAG_PARSING_METADATA, this.handleFragParsingMetadata)
      this.player.off(window.Hls.Events.LEVEL_SWITCHED, this.handleLevelSwitched)
      this.player.off(window.Hls.Events.SUBTITLE_TRACKS_UPDATED, this.handleSubtitleTrackUpdated)
      this.player.off(window.Hls.Events.LEVEL_UPDATED, this.handleLevelUpdated)
      this.player.off(window.Hls.Events.FRAG_CHANGED, this.handleFragChanged)
    }
  }

  handleAudiotracksUpdated(e) {
    if (this.player) {
      const tracks = this.player.audioTracks

      if (Array.isArray(tracks) && tracks.length) {
        this.onStreamEvent(AUDIO_TRACKS, {
          audioTracks: tracks.map((track, index) => ({
            index: index,
            label: translateLanguage(track.lang),
            language: track.lang
          }))
        })
      }
    }
  }

  handleAudioTrackSwitched(e) {
    if (this.player) {
      const tracks = this.player.audioTracks
      const currentTrackId = this.player.audioTrack

      if (Array.isArray(tracks) && (currentTrackId || currentTrackId === 0)) {
        let index = null
        for (let i = 0, l = tracks.length; i < l; i++) {
          if (tracks[i].id === currentTrackId) {
            index = i
            break
          }
        }
        if (index !== null) {
          this.logger.info(`El manifest detecta un cambio de audio a: ${tracks[index].lang}`)
          /*
          this.onStreamEvent(AUDIO_TRACK_CHANGED, {
            track: {
              index: index,
              label: translateLanguage(tracks[index].lang),
              language: tracks[index].lang
            }
          })
          */
        }
      }
    }
  }

  handleSubtitleTrackUpdated(e) {
    if (this.player) {
      const tracks = this.player.subtitleTracks

      if (Array.isArray(tracks) && tracks.length) {
        this.onStreamEvent(SUBTITLE_TRACKS, {
          subtitleTracks: tracks.map((track) => ({
            name: translateLanguage(track.lang),
            language: track.lang
          }))
        })
      }
    }
  }

  // Evento que se llama cuando cambia el subtítulo seleccionado
  handleSubtitleTrackSwitched(e, data) {
    if (this.player) {
      this.logger.info('El manifest detecta un cambio de subtítulos a:', data)
    }
  }

  handleLevelSwitched(e, data) {
    this.onStreamEvent(
      LEVEL_SWITCHED,
      {
        bitrate: this.player && this.player.levels[this.player.currentLevel] && this.player.levels[this.player.currentLevel].bitrate,
        level: data.level
      }
    )
  }

  // fired when fragment matching with current video position is changing
  handleFragChanged(e, data) {
    // Con este evento capturamos con la mayor exactitud posible
    // cuando recibimos una marca CUE-IN/OUT con la que lanzamos la
    // petición para publicidad.
    // Cuando entramos por primera vez a la emisión usamos el evento LEVEL_LOADED
    // para determinar si ya estamos en publicidad y enviar el metadato correspondiente.
    // Este evento no recibe de nuevo las marcas SCTE35 en el fragment que estamos reproduciendo
    // por lo que solo la recibimos una única vez.
    // La url de los fastChannels empieza siempre por fast. y estos
    // contendrán marcas SCTE35 por lo que los procesamos con este evento
    if (data && this.player?.url.includes('fast.')) {
      const { frag: fragment } = data
      const prevScteQueueLength = this.scteQueue.length
      const {
        tagList, startPTS, start
      } = fragment
      const flatTagList = tagList.flat()
      let scte35Data = null
      // this.logger.info('FLATLIST-FRAG', flatTagList)
      // Primero buscamos únicamente marcas SCTE35 de tipo CUE-IN
      const scte35InTag = flatTagList.find((tag) => tag.includes('EXT-X-CUE-IN'))
      if (scte35InTag) {
        scte35Data = 'EXT-X-CUE-IN'
      } else {
        // Si no hay marcas SCTE35 de tipo CUE-IN buscamos únicamente marcas SCTE35 de tipo CUE-OUT
        const extCueOutIndex = flatTagList.findIndex((tag, index) => {
          if (tag.includes('EXT-X-CUE-OUT')) {
            const nextTag = flatTagList[index + 1]
            return nextTag && !isNaN(parseFloat(nextTag)) && parseFloat(nextTag) >= 10
          }
          return false
        })

        // Si la encontramos y cumple con la condición que el PLANNED-DURATION sea mayor
        // a 10 segundos lo procesamos. Los tiempos se envían en milisegundos
        if (extCueOutIndex !== -1) {
          const extCueOutData = flatTagList[extCueOutIndex]
          const duration = (parseFloat(flatTagList[extCueOutIndex + 1]) * 1000).toFixed(2)
          scte35Data = `${extCueOutData}=${duration}`
        }
      }

      if (scte35Data && (startPTS ?? start) !== null) {
        // this.logger.info('FRAG-SCTE35', scte35Data)
        this.scteQueue.push({
          data: scte35Data,
          timestamp: startPTS || start,
          type: 'SCTE35'
        })
      }
      if (this.scteQueue.length !== prevScteQueueLength) {
        this.scteQueue.sort((a, b) => a.timestamp - b.timestamp)
      }
    }
  }

  // fired when a level's details have been updated based on previous details, after it has been loaded
  handleLevelUpdated(e, data) {
    // Usamos el evento de actualización de levels para simular el comportamiento
    // de cuenta regresiva que tenemos para los admode y la publicidad.
    // La actualización de levels se recibe cada 8 segundos y contiene los
    // metadatos de todo el manifest.
    // También lo usamos para detectar si ya nos encontramos en publicidad
    // al entrar en un directo que ya está dentro de un bloque publicitario.
    // La url de los fastChannels empieza siempre por fast. y estos
    // contendrán marcas SCTE35 por lo que los procesamos con este evento
    if (data && this.player?.url.includes('fast.')) {
      const { details: { fragments, startSN } } = data
      const prevScteQueueLength = this.scteQueue.length

      // Método para extraer la duración de de SCTE35-OUT
      const extractDuration = (tag) => {
        const durationRegex = /(?:DURATION|PLANNED-DURATION)=([0-9]+(?:\.[0-9]+)?)/
        const match = tag.match(durationRegex)
        return match ? (match[1] * 1000).toFixed(2) : null
      }

      // Método para extraer el id del evento en emisión
      const extractID = (tag) => {
        const idRegex = /ID="([^"]+)"/
        const match = tag.match(idRegex)
        return match ? match[1] : null
      }

      // Método para extraer la fecha y hora que arranca la marca SCTE35-OUT
      const extractStartDate = (tag) => {
        const startDateRegex = /START-DATE="([^"]+)"/
        const match = tag.match(startDateRegex)
        return match ? match[1] : null
      }

      // Iterar sobre cada fragmento
      fragments.forEach((fragment) => {
        const {
          tagList, startPTS, start, sn, programDateTime
        } = fragment
        const flatTagList = tagList.flat()
        let scte35Data = null
        // Verificamos si el fragmento en el que estamos iterando corresponde
        // con el que vamos a reproducir
        if (startSN !== sn) {
          return
        }
        // this.logger.info('FLATLIST-LEVEL', flatTagList)
        // Buscamos marcas SCTE35-IN pero que a su vez no exista una marca CUE-IN
        // ya que estas últimas las detectamos y procesamos con FRAG_CHANGED con exactitud de tiempo
        const scte35InTag = flatTagList.find((tag) => tag.includes('SCTE35-IN'))
        if (scte35InTag && !flatTagList.some((tag) => tag.includes('EXT-X-CUE-IN'))) {
          scte35Data = 'EXT-X-CUE-IN'
        } else {
          // Si no encontramos SCTE35-IN buscamos marcas SCTE35-OUT pero que a su vez no exista una marca CUE-OUT
          // ya que estas últimas las detectamos y procesamos con FRAG_CHANGED con exactitud de tiempo
          const scte35OutData = flatTagList.find((tag) => tag.includes('SCTE35-OUT') && extractDuration(tag) >= 10000)
          // Si encontramos la marca y a su vez el PLANNED-DURATION es mayor a 10 segundos extraemos los datos para
          // determinar cuanto tiempo de publicidad queda por emitir
          if (scte35OutData && !flatTagList.some((tag) => tag.includes('EXT-X-CUE-OUT'))) {
            const startDateString = extractStartDate(scte35OutData)
            const plannedDurationString = extractDuration(scte35OutData)
            const startDate = new Date(startDateString).getTime()
            const plannedDuration = parseFloat(plannedDurationString)
            // Si sabemos a la hora que termina aproximadamente la Publi (START-DATE + PLANNED-DURATION)
            // y le restamos el momento temporal en el que nos encontremos (#EXT-X-PROGRAM-DATE-TIME),
            // tendriamos lo que queda de publicidad.
            const remaining = (startDate + plannedDuration) - programDateTime
            // Si lo que resta de publicidad es mayor a 0 segundos lo informamos en milisegundos
            scte35Data = remaining > 0 ? `EXT-X-CUE-OUT=${remaining}` : null
          }
        }
        if (scte35Data && (startPTS ?? start) !== null) {
          // this.logger.info('LEVEL-SCTE35', scte35Data)
          this.scteQueue.push({
            data: scte35Data,
            timestamp: startPTS || start,
            type: 'SCTE35'
          })
        }
      })
      if (this.scteQueue.length !== prevScteQueueLength) {
        this.scteQueue.sort((a, b) => a.timestamp - b.timestamp)
      }
    }
  }

  // https://jira.mediaset.es/browse/MULTIES-1958
  // https://github.com/video-dev/hls.js/issues/1004
  // https://github.com/video-dev/hls.js/issues/686
  handleFragParsingMetadata(e, data) {
    // El evento se lanza cuando se parsea el fragmento, no cuando se reproduce
    // Está asociado a fragCurrent en vez  a fragPlaying
    // fragCurrent es el último fragmento que se ha pedido
    // que estará probablemente en buffer no en reproducción

    // La url de los fastChannels empieza siempre por fast. y estos
    // no contendrán marcas ID3 por lo que no los procesamos con este evento
    if (data && !this.player?.url.includes('fast.')) {
      const prevQueueLength = this.id3Queue.length
      // For each ID3 tag in our metadata, we pass in the type - ID3, the
      // tag data (a byte array), and the presentation timestamp (PTS).
      data.samples.forEach((sample) => {
        const id3Tag = new TextDecoder('utf-8').decode(sample.data)

        if (id3Tag.indexOf('TXXX') !== -1) {
          this.id3Queue.push({
            data: sample.data,
            timestamp: sample.pts,
            type: 'ID3'
          })
        }
      })

      if (this.id3Queue.length !== prevQueueLength) {
        this.id3Queue.sort((a, b) => a.timestamp - b.timestamp)
      }
    }
  }

  handleFragParsingData(e, data) {
    if (data) {
      const prevQueueLength = this.dataQueue.length

      if (data.type === 'video') {
        this.dataQueue.push({
          dropped: data.dropped,
          // https://github.com/video-dev/hls.js/issues/480
          fps: data.nb / (data.endPTS - data.startPTS),
          startPTS: data.startPTS
        })
      }

      if (this.dataQueue.length !== prevQueueLength) {
        this.dataQueue.sort((a, b) => a.startPTS - b.startPTS)
      }
    }
  }

  handleTimeUpdate(e = {}) {
    let currentTime = e.currentTime
    if (!currentTime) currentTime = this.player && this.player.media ? this.player.media.currentTime : -1

    if (!isNaN(currentTime) && currentTime >= 0) {
      // Data
      while (
        this.dataQueue.length &&
        !isNaN(this.dataQueue[0].startPTS) &&
        currentTime >= this.dataQueue[0].startPTS
      ) {
        this.onStreamEvent(FRAG_DATA, {
          ...this.dataQueue.splice(0, 1)[0],
          bitrate: this.player && this.player.levels[this.player.currentLevel] && this.player.levels[this.player.currentLevel].bitrate
        })
      }

      // Metadata (ID3)
      while (
        this.id3Queue.length &&
        !isNaN(this.id3Queue[0].timestamp) &&
        currentTime >= this.id3Queue[0].timestamp
      ) {
        this.onStreamEvent(FRAG_METADATA, this.id3Queue.splice(0, 1)[0])
      }

      // Metadata (SCTE35)
      while (
        this.scteQueue.length &&
        !isNaN(this.scteQueue[0].timestamp) &&
        currentTime >= this.scteQueue[0].timestamp
      ) {
        this.onStreamEvent(FRAG_METADATA, this.scteQueue.splice(0, 1)[0])
      }

      // Fragment error
      // https://jira.mediaset.es/browse/PLAYER-438
      while (
        this.fragErrorQueue.length &&
        !isNaN(this.fragErrorQueue[0].start) &&
        Math.ceil(currentTime) >= Math.floor(this.fragErrorQueue[0].start)
      ) {
        if (!this.isLive && this.fragErrorQueue[0].start >= this.player.media.duration - 10) {
          this.onMediaEvent({ type: ENDED })
        } else {
          // this.error(this.fragErrorQueue[0].error)
        }
        this.fragErrorQueue.splice(0, 1)
      }
    }
  }

  handleError(e, data) {
    if (data.fatal) {
      const info = {
        code: {
          hls: data.details
        }
      }
      if (data.response && data.response.code) info.status = data.response.code
      if (data.reason) info.reason = data.reason
      if (data.url) info.url = data.url

      switch (data.type) {
        case window.Hls.ErrorTypes.NETWORK_ERROR:
          // https://jira.mediaset.es/browse/PLAYER-438
          switch (data.details) {
            case window.Hls.ErrorDetails.FRAG_LOAD_ERROR:
            case window.Hls.ErrorDetails.FRAG_LOAD_TIMEOUT:
              this.fragErrorQueue.push({
                error: {
                  type: ERROR_HLSJS_NETWORK,
                  info
                },
                start: data.frag && data.frag.start
              })
              this.handleTimeUpdate()
              break
            default:
              this.error({
                type: ERROR_HLSJS_NETWORK,
                info
              })
              break
          }
          break

        case window.Hls.ErrorTypes.MEDIA_ERROR:
          if (this.mediaErrorRecoveryAttempts <= MAX_MEDIA_ERROR_RECOVERY_ATTEMPTS) {
            this.logger.info(`Media Error. Se hace intento de recuperación ${this.mediaErrorRecoveryAttempts}`, data)
            this.mediaErrorRecoveryAttempts++
            this.player.recoverMediaError()
          } else {
            // https://jira.mediaset.es/browse/PLAYER-438
            if (data.details === window.Hls.ErrorDetails.BUFFER_STALLED_ERROR && this.player.media.currentTime >= this.player.media.duration - 10) {
              this.onMediaEvent({ type: ENDED })
            } else {
              this.error({
                type: ERROR_HLSJS_MEDIA,
                info
              })
            }
          }
          break

        default:
          this.error({
            type: ERROR_HLSJS_OTHER_FATAL,
            info
          })
          break
      }
    } else if (data) {
      this.logger.warn('Error no fatal', {
        details: data.details,
        fatal: data.fatal,
        type: data.type
      })

      // https://jira.mediaset.es/browse/PLAYER-438
      if (!this.isLive && data.details === window.Hls.ErrorDetails.BUFFER_STALLED_ERROR && this.player.media.currentTime >= this.player.media.duration - 10) {
        this.onMediaEvent({ type: ENDED })
      }

      this.onStreamEvent({ type: STREAM_ERROR_NON_FATAL, data })
    } else {
      this.logger.warn('Error desconocido no fatal')
    }
  }

  error(error) {
    this.logger.error('Error', error)
    this.destroy()
    this.onError(error)
  }

  destroy() {
    if (this.player) {
      this.removeEventListeners()
      this.player.destroy()
      if (this.player.bufferTimer) {
        clearInterval(this.player.bufferTimer)
        this.player.bufferTimer = undefined
      }
      this.player = null
    }
    this.video = null
  }
}

export default HlsJs
