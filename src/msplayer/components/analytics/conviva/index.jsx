import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { waitFor } from '../../../commons/util'
import { isIos, isMobileAny } from '../../../commons/userAgent'
import { 
  adGenres, 
  errorCodes, 
  errorMessages, 
  errorTypes, 
  serviceNames 
} from '../../../commons/types'
import {
  adEvents,
  contentEvents,
  playerEvents,
  streamEvents
} from '../../../commons/types/events'
import { STARTER_SRC_URL } from '../../videoPlayer/model'
import {
  ConvivaClientMeasure,
  ConvivaHttp,
  ConvivaLogging,
  ConvivaMetadata,
  ConvivaStorage,
  ConvivaTime,
  ConvivaTimer
} from './api'

// https://community.conviva.com/site/global/platforms/other_platforms/sdks/javascript_sdk/tutorials/index.gsp

// 1. Initialize Conviva Client
// 2. Create Metadata Object
// 3. Manage Session
// 4. Implement Advanced Metadata and Events
// 5. Handle Ads

const MAX_CUSTOM_EVENT_VALUE = 255

class Conviva extends Component {
  constructor(props){
    super(props)

    this.queue = []

    this.isWaiting = false
    this.isInitialized = false

    this.isContentSessionOpened = false
    this.isPlaybackRequested = false
    this.isAdSessionOpened = false
    this.currentContentPlayerState = undefined
    this.currentAdPlayerState = undefined
    this.serviceInitStartTimes = {}

    this.isContentStarted = false
    this.adPodIndex = 1

    this.handleBeforeUnload = this.handleBeforeUnload.bind(this)
  }

  componentDidMount() {
    this.timeToFirstFrameStartTime = performance.now()

    if(!this.isWaiting && !this.isInitialized){
      const { logger } = this.props
      const self = this

      this.isWaiting = true

      logger.info(`Esperando al SDK (window.Conviva) para inicialializar Conviva`)

      waitFor( () => window.Conviva )
      .then(() => {
        logger.info(`Se ha detectado el SDK de Conviva`)

        self.isWaiting = false
        self.init()
      }).catch(() => logger.error(`No se ha encotrado el SDK de Conviva (window.Conviva) después de esperar 1 min. Puede haber habido algún problema en la descarga del SDK desde /dist/assets/conviva/conviva-core-sdk.min.js o puede que no se esté importando. (CON001)`))
    }
  }

  componentDidUpdate(prevProps) {
    if(this.isContentSessionOpened) {
      const {
        configAnalytics,
        currentFps,
        duration,
        isLive,
        src,
        viewerId
      } = this.props

      if(
        configAnalytics && !prevProps.configAnalytics ||
        currentFps && currentFps !== prevProps.currentFps ||
        !isLive &&
        duration && duration !== prevProps.duration ||
        src && src !== prevProps.src ||
        viewerId !== prevProps.viewerId
      ) {

        let metadata = new window.Conviva.ContentMetadata()

        // Required
        if(src && src.indexOf(STARTER_SRC_URL) === -1) {
          metadata.streamUrl = this.trimValues(src)

          metadata.custom = {
            streamUrl: this.trimValues(src)
          }
        }

        // Optional
        metadata.encodedFrameRate = !isNaN(currentFps) ? Math.round(currentFps) : 25
        if(!isLive && !isNaN(duration) && duration) {
          metadata.duration = Math.round(duration)
        }

        // Custom
        metadata.custom = {
          ...metadata.custom,
          ...this.findConfigCustomMetadata(this.props),
          viewerId: this.sanitizeValue(viewerId)          
        }

        this.client.updateContentMetadata(this.contentSessionKey, metadata)

        this.updateVideoResolution()
      }
    }
  }

  componentWillUnmount() {
    this.props.logger.info('Se desmontará el componente Conviva')

    this.closeSessions()

    window.removeEventListener('pagehide', this.handleBeforeUnload)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)

    this.flush()
  }

  handleBeforeUnload() {
    this.closeSessions()
  }

  findConfigCustomMetadata(props = this.props) {
    const { configAnalytics } = props

    let mandatory = {
      channel: 'no_analytics',
      contentId: 'no_analytics',
      contentType: 'no_analytics',
      drmApplied: 'no_analytics',
      episodeName: 'no_analytics',
      episodeNumber: 'no_analytics',
      gad: 'no_analytics',
      geoblocked: 'no_analytics',
      pubDate: 'no_analytics',
      season: 'no_analytics',
      show: 'no_analytics',
      site: 'no_analytics',
      source: 'no_analytics'
    }

    if(configAnalytics) {
      for(let key in mandatory) {
        mandatory[key] = 'no_analytics_conviva'
      }

      if(configAnalytics.conviva) {
        for(let key in mandatory) {
          mandatory[key] = 'no_analytics_conviva_customMetadata'
        }

        if(configAnalytics.conviva.customMetadata) {
          for(let key in mandatory) {
            mandatory[key] = undefined
          }

          let customMetadata = {
            ...mandatory,
            ...configAnalytics.conviva.customMetadata
          }
  
          for(let key in customMetadata) {
            customMetadata[key] = this.sanitizeValue(customMetadata[key])
          }

          return customMetadata
        }
      }
    }
    return mandatory
  }

  init() {
    const {
      allowUncaughtExceptions,
      customerKey,
      gatewayUrl,
      logger,
      logLevel
    } = this.props

    if(customerKey) {
      logger.info(`Inicializar Conviva`)

      const systemInterface = new window.Conviva.SystemInterface(
        new ConvivaTime(),
        new ConvivaTimer(),
        new ConvivaHttp(),
        new ConvivaStorage(),
        new ConvivaMetadata(),
        new ConvivaLogging()
      )

      let systemSettings = new window.Conviva.SystemSettings()
      systemSettings.allowUncaughtExceptions = allowUncaughtExceptions
      if(logLevel === 'debug') {
        systemSettings.logLevel = window.Conviva.SystemSettings.LogLevel.DEBUG
      }

      this.systemFactory = new window.Conviva.SystemFactory(systemInterface, systemSettings)

      let clientSettings = new window.Conviva.ClientSettings(customerKey)
      if(gatewayUrl) {
        clientSettings.gatewayUrl = gatewayUrl
      }

      logger.info(`Crear nuevo Client`)

      this.client = new window.Conviva.Client(clientSettings, this.systemFactory)

      this.isInitialized = true

      this.startSession()

      window.addEventListener('pagehide', this.handleBeforeUnload)
      window.addEventListener('beforeunload', this.handleBeforeUnload)
    } else {
      logger.info(`Se ha pedido inicializar Conviva pero no se ha encontrado el customerKey necesario. (CON002)`)
    }
  }

  trimValues(obj, max = MAX_CUSTOM_EVENT_VALUE) {
    if(!obj) return ''
    if(typeof obj === 'string') return obj.substring(0, max - 1)

    let trimmed = {}

    for(let key in obj) {
      let value = obj[key]
      if(typeof value !== 'string') {
        value = typeof value === 'function' || typeof value === 'undefined' ? `${obj[key]}` : JSON.stringify(obj[key])
      }
      trimmed[key] = value.substring(0, max - 1)
    }
    return trimmed
  }

  sanitizeValue(value) {
    if(typeof value === 'undefined') return 'is_undefined'
    if(value === null) return 'is_null'
    if(value === '') return 'is_empty'

    return `${value}`
  }

  reportCustomEvent(id, params, sessionKey = this.contentSessionKey) {
    if(sessionKey !== undefined) {
      params = this.trimValues(params)

      this.props.logger.info(`Reportar CustomEvent`, { id, params })

      this.client.sendCustomEvent(sessionKey, id, params)
    }
  }

  reportCustomDelay(id, startTime, params = {}) {
    if(this.isContentSessionOpened && startTime) {
      const delay = `${(performance.now() - startTime) / 1000}`

      this.props.logger.info(`${id}: ${delay}`)
      
      this.reportCustomEvent(id, { ...this.trimValues(params), delay: Math.round(delay) })
    }
  }

  handleEvent(eventType, params) {
    // this.props.logger.info(`Evento ${eventType}`, params)

    // La petición del config se hace antes del init de este componente
    if(this.isInitialized || ( eventType === playerEvents.SERVICE_INIT_STARTED && params.serviceName === serviceNames.CONFIG )) {
      switch(eventType){
        case playerEvents.SERVICE_INIT_STARTED:
          this.serviceInitStartTimes[params.serviceName] = performance.now()
          break

        case playerEvents.SERVICE_INIT_ENDED:
          this.reportCustomDelay('SERVICE_INIT_DELAY', this.serviceInitStartTimes[params.serviceName], params)
          this.serviceInitStartTimes[params.serviceName] = null
          break

        case playerEvents.SERVICE_INIT_ERROR:
          if(this.isContentSessionOpened) {
            this.props.logger.info(`Reportar CustomEvent: SERVICE_INIT_ERROR`, params)
            this.reportCustomEvent('SERVICE_INIT_ERROR', params)
          }
          break

        case contentEvents.CONTENT_PLAYING:
          this.play()

          if(this.timeToFirstFrameStartTime) {
            this.reportCustomDelay('TIME_TO_FIRST_FRAME_CONTENT', this.timeToFirstFrameStartTime)
            this.reportCustomDelay('TIME_TO_FIRST_FRAME', this.timeToFirstFrameStartTime, { genre: 'content' })
            this.timeToFirstFrameStartTime = null
          }
          break

        case contentEvents.CONTENT_TIME_UPDATED:
          this.timeUpdated()
          break

        case contentEvents.CONTENT_PAUSED:
          this.pause()
          break

        case contentEvents.CONTENT_WAITING:
          this.waiting()
          break

        case streamEvents.LEVEL_SWITCHED:
          this.bitrateChange(params)
          this.updateVideoResolution()
          break

        case contentEvents.CONTENT_SEEKING:
          this.seeking(params)
          break

        case contentEvents.CONTENT_SEEKED:
          this.seeked()
          break

        case contentEvents.CONTENT_STOPPED:
          this.stopped()
          break

        case contentEvents.CONTENT_ENDED:
          this.contentEnded()
          break

        case contentEvents.CONTENT_PROGRAM_CHANGE_FAKE:
          this.reportCustomEvent(eventType, params)
          break

        case adEvents.HEADER_BIDDING_FETCH_STARTED:
          this.headerBiddingFetchStartTime = performance.now()
          break

        case adEvents.HEADER_BIDDING_FETCH_ENDED:
          this.reportCustomDelay('HEADER_BIDDING_FETCH_DELAY', this.headerBiddingFetchStartTime)
          this.headerBiddingFetchStartTime = null
          break

        case adEvents.IMA_REQUEST_ADS_STARTED:
          this.imaRequestAdsStartTime = performance.now()
          break

        case adEvents.IMA_REQUEST_ADS_ENDED:
          this.reportCustomDelay('IMA_REQUEST_ADS_DELAY', this.imaRequestAdsStartTime)
          this.imaRequestAdsStartTime = null
          break

        case adEvents.IMA_START_ADS_REQUESTED:
          this.adBreakStart(params)
          this.imaStartAdsRequestedStartTime = performance.now()
          break

        case adEvents.IMA_START_ADS_STARTED:
          this.imaStartAdsStartTime = performance.now()
          break

        case adEvents.IMA_START_ADS_ENDED:
          this.reportCustomDelay('IMA_START_ADS_DELAY', this.imaStartAdsStartTime)
          this.imaStartAdsStartTime = null
          break

        case adEvents.AD_SLOT_STARTED:
          this.adSlotPosition++

          this.adSlotStartedStartTime = performance.now()
          break

        case adEvents.AD_BUFFERING:
          this.adBuffering()
          break

        case adEvents.AD_STARTED:
          this.adStart(params)

          if(this.timeToFirstFrameStartTime) {
            this.reportCustomDelay('TIME_TO_FIRST_FRAME', this.timeToFirstFrameStartTime, { genre: 'ads' })
            this.timeToFirstFrameStartTime = null
          }
          if(this.imaStartAdsRequestedStartTime) {
            this.reportCustomDelay('TIME_TO_FIRST_FRAME_IMA', this.imaStartAdsRequestedStartTime)
            this.imaStartAdsRequestedStartTime = null
          }
          if(this.adSlotStartedStartTime) {
            this.reportCustomDelay('TIME_TO_FIRST_AD', this.adSlotStartedStartTime, params)
            this.adSlotStartedStartTime = null
          }
          if(this.adFinishedStartTime) {
            this.reportCustomDelay('TIME_TO_NEXT_AD', this.adFinishedStartTime, params)
            this.adFinishedStartTime = null
          }
          break

        case adEvents.AD_PROGRESS:
          this.adProgress()
          break

        case adEvents.AD_PAUSED:
          this.adPaused()
          break

        case adEvents.AD_RESUMED:
          this.adResumed(params)
          break

        case adEvents.AD_COMPLETED:
        case adEvents.OVERLAY_ENDED:
          this.adCompleted(params)

          this.adFinishedStartTime = performance.now()
          break

        case adEvents.AD_SKIPPED:
          this.adSkipped(params)

          this.adFinishedStartTime = performance.now()
          break

        case adEvents.AD_BREAK_DISCARDED:
          this.adBreakDiscarded(params)
          break

        case adEvents.AD_ERROR:
          this.adError(params)

          this.adFinishedStartTime = performance.now()

          if(this.imaRequestAdsStartTime) {
            this.reportCustomDelay('IMA_REQUEST_ADS_ERROR_DELAY', this.imaRequestAdsStartTime)
            this.imaRequestAdsStartTime = null
          }
          if(this.imaStartAdsRequestedStartTime) {
            this.reportCustomDelay('TIME_TO_ERROR_IMA', this.imaStartAdsRequestedStartTime)
            this.imaStartAdsRequestedStartTime = null
          }
          break

        case adEvents.AD_SLOT_COMPLETED:
          this.adFinishedStartTime = null

          this.adBreakComplete(params)
          if(params.adGenre === adGenres.PRE_ROLL) {
            if(!this.isPlaybackRequested) {
              this.requestPlayback()
            }
          }
          break

        case playerEvents.PLAYER_ERROR_FATAL:
          this.error({ ...(params && params.error), fatal: true })
          break

        case playerEvents.PLAYER_ERROR_CONTENT_GEOBLOCKED:
          this.error({ ...(params && params.error), fatal: true })
          break

        case playerEvents.PLAYER_ERROR_PLAY:
          this.error({ ...(params && params.error), fatal: false, play: true })
          break
  

        case playerEvents.PLAYER_ERROR_STREAM_FALLBACK:
          this.error({ ...(params && params.error), fatal: false })
          break

        case playerEvents.PLAYER_ERROR:
          this.error({ ...(params && params.error), fatal: false })
          break

        case contentEvents.PLAYBACK_ENDED:
          this.playbackEnded()
          break
      }
    } else {
      this.queue.push({ eventType, params })
    }
  }

  findPlayerName() {
    return isMobileAny() ? isIos() ? 'Player Web iOS' : 'Player Web Android' : 'Player Web Desktop'
  }

  findAssetName() {
    const {
      editorialId,
      episodeName,
      isLive,
      show,
      title
    } = this.props

    const liveId = episodeName || editorialId || 'no_id'
    const liveName = show || title || 'no_name'
    const vodId = editorialId || 'no_id'
    const vodName = episodeName || title || 'no_name'

    if(isLive) {
      return `[${liveId}] ${liveName}`
    } else {
      return `[${vodId}] ${vodName}`
    }
  }

  findeFormatStream() {
    const { src } = this.props 
    
    if(!src) return ''

    if(src.indexOf('.m3u8') !== -1) {
      return 'HLS'
    } else if(src.indexOf('.mpd') !== -1) {
      return 'DASH'
    } else {
      return ''
    }
  }

  startSession() {
    if(this.isInitialized) {
      const {
        currentFps,
        defaultResource,
        duration,
        isContentStarted,
        isLive,
        isStartOverPlayback,
        logger,
        playerVersion,
        preloading,
        src,
        user,
        viewerId
      } = this.props

      // Each monitoring session is associated with one and only one ContentMetadata instance
      let contentMetadata = new window.Conviva.ContentMetadata()

      // Required
      contentMetadata.applicationName = 'MSPlayer'
      contentMetadata.assetName = this.findAssetName()
      contentMetadata.isLive = isLive ? `${true}` : `${false}`
      contentMetadata.playerName = this.findPlayerName()
      contentMetadata.streamType = isLive ? window.Conviva.ContentMetadata.StreamType.LIVE : window.Conviva.ContentMetadata.StreamType.VOD
      if(src && src.indexOf(STARTER_SRC_URL) === -1) {
        contentMetadata.streamUrl = this.trimValues(src)

        contentMetadata.custom = {
          streamUrl: this.trimValues(src)
        }
      }
      if(viewerId) {
        contentMetadata.viewerId = viewerId
      }

      // Optional
      contentMetadata.defaultResource = defaultResource
      if(!isLive && !isNaN(duration) && duration > 0) {
        contentMetadata.duration = Math.round(duration)
      }
      contentMetadata.encodedFrameRate = !isNaN(currentFps) ? Math.round(currentFps) : 25

      // Custom
      contentMetadata.custom = {
        ...contentMetadata.custom,
        ...this.findConfigCustomMetadata(),
        accessType: user && user.UID ? user.isSubscribed ? 'Subscribed' : 'Registered' : 'Anonymous',
        appVersion: `MSPlayer v${playerVersion}`,
        href: window.location.href,
        playerVersion: `MSPlayer v${playerVersion}`,
        startOver: `${isStartOverPlayback === true}`,
        streamFormat: this.findeFormatStream(),
        viewerId: this.sanitizeValue(viewerId)
      }
      if(preloading && preloading.isEnabled) {
        contentMetadata.custom.preloading = `enabled__${preloading.level}__${preloading.type}`
      } else {
        contentMetadata.custom.preloading = 'disabled'
      }

      logger.info(`Iniciar sesión de contenido`, contentMetadata)

      // Create a Conviva monitoring session.
      this.contentSessionKey = this.client.createSession(contentMetadata)

      if(this.contentSessionKey !== window.Conviva.Client.NO_SESSION_KEY) {
        this.isContentSessionOpened = true
      }

      logger.info(`Id de sesión de contenido: ${this.contentSessionKey}`)

      if(isLive && isContentStarted) {
        this.play()
      }

      this.flush()
    }
  }

  requestPlayback() {
    const { logger } = this.props

    if(this.isContentSessionOpened) {
      const { currentBitrate, playerApi, playerVersion } = this.props

      logger.info(`Iniciar reproducción de contenido`)

      if(!this.client.isPlayerAttached(this.contentSessionKey)) {
        this.contentPlayerStateManager = this.client.getPlayerStateManager()
        this.contentPlayerStateManager.setClientMeasureInterface(new ConvivaClientMeasure(playerApi))
        if(!isNaN(currentBitrate)) {
          this.contentPlayerStateManager.setBitrateKbps(Math.round(currentBitrate / 1000))
        }
        this.contentPlayerStateManager.setPlayerVersion(`MSPlayer v${playerVersion}`)

        this.updateVideoResolution()

        logger.info(`Vincular player a la sesión de contenido ${this.contentSessionKey}`)

        this.client.attachPlayer(this.contentSessionKey, this.contentPlayerStateManager)

      } else {
        logger.info(`Se recupera el player vinculado a la sesión de contenido ${this.contentSessionKey}`)

        this.contentPlayerStateManager = this.client.getAttachedPlayer(this.contentSessionKey)
      }

      this.isPlaybackRequested = true

    } else {
      logger.info(`Se ha pedido iniciar la reproducción de contenido pero la sesión todavía no se ha creado`)
    }
  }

  reportContentPlayerState(newState) {
    if(this.contentPlayerStateManager) {
      if(this.currentContentPlayerState !== newState) {
        this.props.logger.info(`Actualizar PlayerState: ${newState}`)

        this.currentContentPlayerState = newState

        this.contentPlayerStateManager.setPlayerState(newState);
      }
    }
  }

  play() {
    if(!this.isPlaybackRequested) {
      this.requestPlayback()
    }

    this.isContentStarted = true

    this.reportContentPlayerState(window.Conviva.PlayerStateManager.PlayerState.PLAYING)
  }

  timeUpdated() {
    if(this.currentContentPlayerState === window.Conviva.PlayerStateManager.PlayerState.BUFFERING) {
      this.reportContentPlayerState(window.Conviva.PlayerStateManager.PlayerState.PLAYING)
    }
  }

  pause() {
    if(this.currentContentPlayerState !== window.Conviva.PlayerStateManager.PlayerState.STOPPED) {
      this.reportContentPlayerState(window.Conviva.PlayerStateManager.PlayerState.PAUSED)
    }
  }

  seeking({ seekTarget }) {
    if(this.contentPlayerStateManager) {
      const t = Math.round(seekTarget)
      this.props.logger.info(`Reportar inicio de seek: ${t}`)
      this.contentPlayerStateManager.setPlayerSeekStart(t)
    }
  }

  seeked() {
    if(this.contentPlayerStateManager) {
      this.props.logger.info(`Reportar fin de seek`)
      this.contentPlayerStateManager.setPlayerSeekEnd()
    }
  }

  waiting() {
    if(this.currentContentPlayerState !== window.Conviva.PlayerStateManager.PlayerState.STOPPED) {
      this.reportContentPlayerState(window.Conviva.PlayerStateManager.PlayerState.BUFFERING)
    }
  }

  stopped() {
    this.reportContentPlayerState(window.Conviva.PlayerStateManager.PlayerState.STOPPED)
  }

  bitrateChange(params) {
    if(this.contentPlayerStateManager) {
      if(params && !isNaN(params.bitrate)) {
        const bitrate = Math.round(params.bitrate / 1000)
        this.props.logger.info(`Actualizar bitrate (Kbps): ${bitrate}`)
        this.contentPlayerStateManager.setBitrateKbps(bitrate)
      }
    }
  }

  updateVideoResolution() {
    if(this.contentPlayerStateManager) {
      const { logger, playerApi } = this.props

      const videoRef = playerApi && playerApi.videoInstance && playerApi.videoInstance.getRef()

      if(videoRef) {
        const videoWidth = videoRef.videoWidth
        const videoHeight = videoRef.videoHeight

        if(!isNaN(videoWidth) && videoWidth > 0 && !isNaN(videoHeight) && videoHeight > 0) {
          const w = Math.round(videoWidth)
          const h = Math.round(videoHeight)

          logger.info(`Actualizar resolución del vídeo: ${w}x${h}`)

          this.contentPlayerStateManager.setVideoResolutionWidth(w)
          this.contentPlayerStateManager.setVideoResolutionHeight(h)
        }
      }
    }
  }

  contentEnded() {
    this.stopped()
  }

  playbackEnded() {
    this.closeSessions()
  }

  error(params) {
    if(this.isContentSessionOpened) {
      const { logger } = this.props

      let code = errorCodes[errorTypes.ERROR_UNKNOWN]
      let msg = errorMessages[errorTypes.ERROR_UNKNOWN]
      if(params && params.type) {
        code = errorCodes[params.type]
        msg = errorMessages[params.type]
      }
      let details = []
      if(params && params.info) {
        if(params.info.code) {
          for(let key in params.info.code) {
            details.push(`${key}:${params.info.code[key]}`)
          }
        }
        if(typeof params.info.status !== 'undefined') {
          details.push(`status:${params.info.status}`)
        }
      }

      const message = `${code}: ${msg}${details.length ? ` (${details.join(',')})` : ''}`

      this.reportCustomEvent(message, { ...this.trimValues(params && params.info), fatal: `${params.fatal}` })

      if(!this.contentPlayerStateManager || !this.isContentStarted) {
        if(params && params.fatal) {
          logger.info(`Reportar error (VSF)`, params)
          
        } else if(params && params.play) {
          // Si se da un error de play o algún otro que necesite recovery
          // el player se queda parado y el VST aumenta falsamente
          this.handleEvent(contentEvents.CONTENT_PLAYING)
          this.handleEvent(contentEvents.CONTENT_PAUSED)
        }

        this.client.reportError(
          this.contentSessionKey,
          message,
          params && params.fatal ? window.Conviva.Client.ErrorSeverity.FATAL : window.Conviva.Client.ErrorSeverity.WARNING
        )

      } else {
        if(params && params.fatal) {
          logger.info(`Reportar error (VPF)`, params)
        }

        this.contentPlayerStateManager.sendError(
          message,
          params && params.fatal ? window.Conviva.Client.ErrorSeverity.FATAL : window.Conviva.Client.ErrorSeverity.WARNING
        )
      }

      if(params && params.fatal) {
        this.closeSessions()
      }
    }
  }

  closeContentSession() {
    if(this.isContentSessionOpened) {
      this.props.logger.info(`Cerrar sesión de contenido ${this.contentSessionKey}`)

      // Terminate the existing Conviva monitoring session represented by contentSessionKey
      this.client.cleanupSession(this.contentSessionKey)

      // If you no longer need that PlayerStateManager, release it.
      this.client.releasePlayerStateManager(this.contentPlayerStateManager)
      this.contentPlayerStateManager = null

      this.isContentSessionOpened = false
    } else {
      this.props.logger.warn('Se ha solicitado cerrar la sesión de contenido pero no se ha encontrado ninguna activa')
    }
  }

  findPodPosition(adGenre) {
    switch(adGenre) {
      case adGenres.PRE_ROLL:
        return 'Pre-roll'
        break
      case adGenres.MID_ROLL:
        return 'Mid-roll'
        break
      case adGenres.POST_ROLL:
        return 'Post-roll'
        break
    }
    return null
  }

  findAdPosition(adGenre) {
    switch(adGenre) {
      case adGenres.PRE_ROLL:
      default:
        return window.Conviva.Client.AdPosition.PREROLL
        break
      case adGenres.MID_ROLL:
        return window.Conviva.Client.AdPosition.MIDROLL
        break
      case adGenres.POST_ROLL:
        return window.Conviva.Client.AdPosition.POSTROLL
        break
    }
    return null
  }

  adBreakStart(params) {
    if(this.isContentSessionOpened) {
      const { isEnabledAds, logger } = this.props

      logger.info(`Reportar inicio de bloque de publicidad`, params)

      this.reportCustomEvent('Conviva.PodStart', {
        absoluteIndex: `${params && params.adPodIndex || this.adPodIndex}`,
        podIndex: `${this.adPodIndex}`,
        podDuration: `${params && params.adPodDuration}`,
        podPosition: this.findPodPosition(params && params.adGenre)
      })

      this.client.adStart(
        this.contentSessionKey,
        window.Conviva.Client.AdStream.SEPARATE,
        window.Conviva.Client.AdPlayer.SEPARATE,
        this.findAdPosition(params.adGenre)
      )

      if(isEnabledAds) {
        if(this.client.isPlayerAttached(this.contentSessionKey)) {
          logger.info(`Desvincular player a sesión de contenido: ${this.contentSessionKey}`)
          this.client.detachPlayer(this.contentSessionKey)
        }
      }
    }
  }

  reportAdPlayerState(newState) {
    if(this.adPlayerStateManager) {
      if(this.currentAdPlayerState !== newState) {
        this.props.logger.info(`Actualizar PlayerState: ${newState}`)

        this.currentAdPlayerState = newState

        this.adPlayerStateManager.setPlayerState(newState);
      }
    }
  }

  adBuffering() {
    if(this.props.isEnabledAds) {
      this.reportAdPlayerState(window.Conviva.PlayerStateManager.PlayerState.BUFFERING)
    }
  }

  adStart(params) {
    if(this.props.isEnabledAds) {
      if(this.isContentSessionOpened) {
        const { isLive, logger, playerVersion, viewerId } = this.props

        let adMetadata = new window.Conviva.ContentMetadata()

        // Required
        adMetadata.assetName = params.adTitle || 'NA'
        adMetadata.isLive = isLive ? `${true}` : `${false}`
        adMetadata.playerName = this.findPlayerName()
        if(viewerId) {
          adMetadata.viewerId = viewerId
        }
        if(!isNaN(params.adDuration) && params.adDuration > 0) {
          adMetadata.duration = Math.round(params.adDuration)
        }
        adMetadata.streamType = isLive ? window.Conviva.ContentMetadata.StreamType.LIVE : window.Conviva.ContentMetadata.StreamType.VOD

        // Optional
        adMetadata.applicationName = 'MSPlayer'
        adMetadata.streamUrl = params.adMediaUrl

        adMetadata.custom = {
          appVersion: `MSPlayer v${playerVersion}`,
          playerVersion: `MSPlayer v${playerVersion}`,
          streamUrl: params.adMediaUrl,

          // Required
          'c3.ad.firstAdId': `${params.adWrapperAdIds && Array.isArray(params.adWrapperAdIds) && params.adWrapperAdIds.length ? params.adWrapperAdIds[params.adWrapperAdIds.length - 1] : params.adId}`,
          'c3.ad.firstAdSystem': `${params.adWrapperAdSystems && Array.isArray(params.adWrapperAdSystems) && params.adWrapperAdSystems.length ? params.adWrapperAdSystems[params.adWrapperAdSystems.length - 1] : params.adSystem}`,
          'c3.ad.firstCreativeId': `${params.adWrapperCreativeIds && Array.isArray(params.adWrapperCreativeIds) && params.adWrapperCreativeIds.length ? params.adWrapperCreativeIds[params.adWrapperCreativeIds.length - 1] : params.adCreativeId}`,
          'c3.ad.id' : `${params.adId || 'NA'}`,
          'c3.ad.mediaFileApiFramework' : `${params.adApiFramework || 'NA'}`,
          'c3.ad.position' : `${this.findAdPosition(params.adGenre) || 'NA'}`,
          'c3.ad.system' : `${params.adSystem || 'NA'}`,
          'c3.ad.technology' : 'Client Side',
          'c3.ad.type' : `${params.adApiFramework && params.adApiFramework.toLowerCase() === 'vpaid' ? window.Conviva.Client.AdType.VPAID : window.Conviva.Client.AdType.REGULAR}`,

          // Optional
          'c3.ad.adManagerName' : 'Google IMA SDK',
          'c3.ad.adManagerVersion' : `${window.google && window.google.ima && window.google.ima.VERSION}`,
          'c3.ad.adStitcher': 'NA',
          'c3.ad.advertiser' : `${params.adAdvertiserName || 'NA'}`,
          'c3.ad.advertiserName' : `${params.adAdvertiserName || 'NA'}`,
          'c3.ad.advertiserCategory': 'NA',
          'c3.ad.advertiserId': `${params.adId || 'NA'}`,
          'c3.ad.breakId': 'NA',
          'c3.ad.campaignName': 'NA',
          'c3.ad.category': 'NA',
          'c3.ad.classification': 'NA',
          'c3.ad.creativeId' : `${params.adCreativeId || 'NA'}`,
          'c3.ad.creativeName': `${params.adTitle || 'NA'}`,
          'c3.ad.dayPart': 'NA',
          'c3.ad.isSlate': 'false',
          'c3.ad.sequence' : `${params.adPosition || 'NA'}`,
          'c3.ad.sessionStartEvent': 'start',
          'c3.ad.unitName': 'NA'
        }

        logger.info(`Crear sesión de publicidad`, adMetadata)

        this.adSessionKey = this.client.createAdSession(this.contentSessionKey, adMetadata)

        logger.info(`Id de sesión de publicidad: ${this.adSessionKey}`)

        if(this.adSessionKey !== window.Conviva.Client.NO_SESSION_KEY) {
          this.isAdSessionOpened = true

          this.adPlayerStateManager = this.client.getPlayerStateManager()
          if(params.adMediaBitrate) {
            this.adPlayerStateManager.setBitrateKbps(params.adMediaBitrate)
          }
          this.adPlayerStateManager.setVideoResolutionHeight(params.adMediaHeight)
          this.adPlayerStateManager.setVideoResolutionWidth(params.adMediaWidth)

          logger.info(`Vincular player a la sesión de publicidad ${this.adSessionKey}`)

          this.client.attachPlayer(this.adSessionKey, this.adPlayerStateManager)

          this.reportAdPlayerState(window.Conviva.PlayerStateManager.PlayerState.PLAYING)
        }
      }
    }
  }

  adProgress() {
    if(this.props.isEnabledAds) {
      this.reportAdPlayerState(window.Conviva.PlayerStateManager.PlayerState.PLAYING)
    }
  }

  adPaused() {
    if(this.props.isEnabledAds) {
      this.reportAdPlayerState(window.Conviva.PlayerStateManager.PlayerState.PAUSED)
    }
  }

  adResumed() {
    if(this.props.isEnabledAds) {
      this.reportAdPlayerState(window.Conviva.PlayerStateManager.PlayerState.PLAYING)
    }
  }

  closeAdSession() {
    if(this.props.isEnabledAds) {
      if(this.isAdSessionOpened) {
        this.props.logger.info(`Cerrar sesión de publicidad ${this.adSessionKey}`)

        this.client.cleanupSession(this.adSessionKey)

        this.client.releasePlayerStateManager(this.adPlayerStateManager)
        this.adPlayerStateManager = null

        this.isAdSessionOpened = false
      } else {
        this.props.logger.warn('Se ha solicitado cerrar la sesión de publicidad pero no se ha encontrado ninguna activa')
      }
    }
  }

  adCompleted() {
    if(this.props.isEnabledAds) {
      this.reportAdPlayerState(window.Conviva.PlayerStateManager.PlayerState.STOPPED)

      this.closeAdSession()
    }
  }

  adSkipped() {
    if(this.props.isEnabledAds) {
      this.reportAdPlayerState(window.Conviva.PlayerStateManager.PlayerState.STOPPED)

      this.closeAdSession()
    }
  }

  adBreakDiscarded() {
    if(this.props.isEnabledAds) {
      this.reportAdPlayerState(window.Conviva.PlayerStateManager.PlayerState.STOPPED)

      this.closeAdSession()
    }
    this.adBreakComplete()
  }

  adError(params) {
    if(this.props.isEnabledAds) {
      if(this.isContentSessionOpened) {
        const { logger } = this.props

        if(params.stage === 'ads') {
          if(!this.isAdSessionOpened) {
            let adMetadata = new window.Conviva.ContentMetadata()
            adMetadata.assetName = adEvents.AD_ERROR

            logger.info(`Crear sesión de publicidad: ${adMetadata}`)

            this.adSessionKey = this.client.createAdSession(
              this.contentSessionKey,
              adMetadata
            )

            logger.info(`Id de sesión de publicidad: ${this.adSessionKey}`)

            if(this.adSessionKey !== window.Conviva.Client.NO_SESSION_KEY) {
              this.isAdSessionOpened = true

              logger.info(`Reportar error de publicidad`, params)

              this.adError(params)
            }

          } else {
            logger.info(`Reportar error de publicidad`, { ...params, severity: window.Conviva.Client.ErrorSeverity.FATAL })

            this.client.reportError(
              this.adSessionKey,
              JSON.stringify(params),
              window.Conviva.Client.ErrorSeverity.FATAL
            )
            this.closeAdSession()
          }

        } else {
          logger.info(`Reportar error de publicidad`, params)
          this.reportCustomEvent(adEvents.AD_ERROR, params)
        }
      }
    }
  }

  adBreakComplete(params) {
    const { isEnabledAds, logger } = this.props

    this.client.adEnd(this.contentSessionKey)

    if(isEnabledAds) {
      logger.info(`Reportar fin de bloque de publicidad`, params)

      this.reportCustomEvent('Conviva.PodEnd', {
        absoluteIndex: `${params && params.adPodIndex || this.adPodIndex}`,
        podIndex: `${this.adPodIndex}`,
        podDuration: `${params && params.adPodDuration}`,
        podPosition: this.findPodPosition(params && params.adGenre)
      })

      if(this.contentPlayerStateManager) {
        if(!this.client.isPlayerAttached(this.contentSessionKey)) {
          logger.info(`Vincular player a sesión de contenido: ${this.contentSessionKey}`)
          this.client.attachPlayer(this.contentSessionKey, this.contentPlayerStateManager)
        }
      }

      this.adPodIndex++
    }
  }

  closeSessions() {
    this.closeContentSession()
    this.closeAdSession()
  }

  reset() {
    this.closeSessions()

    this.queue = []

    this.client.release()
    this.client = null

    this.systemFactory.release()
    this.sytemFactory = null

    this.isWaiting = false
    this.isInitialized = false

    this.isContentSessionOpened = false
    this.isPlaybackRequested = false
    this.isAdSessionOpened = false
    this.currentContentPlayerState = undefined
    this.currentAdPlayerState = undefined

    this.isContentStarted = false
    this.adPodIndex = 1
  }

  flush(){
    const { logger } = this.props

    if(this.isContentSessionOpened) {
      logger.info(`Flush`, [ ...this.queue ])

      this.queue.forEach( (event) => {
        this.handleEvent(event.eventType, event.params)
      })
      this.queue = []
    } else {
      logger.warn(`Se solicita flush pero no se ha detectado ninguna sesión de contenido abierta`)
    }
  }

  render() {
    return null
  }
}

Conviva.propTypes = {
  allowUncaughtExceptions: PropTypes.bool,
  configAnalytics: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.object,
    PropTypes.string
  ])),
  currentBitrate: PropTypes.number,
  currentFps: PropTypes.number,
  customerKey: PropTypes.string,
  defaultResource: PropTypes.string,
  duration: PropTypes.number,
  gatewayUrl: PropTypes.string,
  genre: PropTypes.string,
  isContentStarted: PropTypes.bool,
  isEnabledAds: PropTypes.bool,
  isLive: PropTypes.bool,
  isStartOverPlayback: PropTypes.bool,
  logger: PropTypes.object,
  logLevel: PropTypes.string,
  playerApi: PropTypes.object,
  playerId: PropTypes.string,
  playerVersion: PropTypes.string,
  preloading: PropTypes.shape({
    isEnabled: PropTypes.bool,
    level: PropTypes.string,
    limit: PropTypes.limit,
    type: PropTypes.string
  }),
  src: PropTypes.string,
  title: PropTypes.string,
  viewerId: PropTypes.string
}

Conviva.defaultProps = {
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default Conviva
