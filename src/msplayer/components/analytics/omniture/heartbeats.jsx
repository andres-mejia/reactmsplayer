import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { waitFor, getCookie } from '../../../commons/util'
import {
  adEvents, contentEvents, playerEvents, streamEvents
} from '../../../commons/types/events'
import {
  accounts,
  evalConfigAttribute,
  getGenres,
  getNewVar31,
  hasJSCode,
  parseAdGenre,
  transformToCustomObject,
  getDaysFromPublicationDate,
  getEvar49,
  getEvar80,
  getEvar121,
  getEvar124,
  getEvar102
} from './helper'

const MEDIASET_ACCOUNT = 'mediasetglobal'
const OMNITURE_NA = 'No Aplica'

const ACTION_PLAY = 'play'
const ACTION_PAUSE = 'pause'
const ACTION_END = 'end'
const ACTION_TOGGLE_FULL_SCREEN = 'e2 - Pantalla completa'
const ACTION_USER_PAUSE = 'e58 - Pausa'

const {
  AD_COMPLETED, AD_ERROR, AD_SKIPPED, AD_SLOT_COMPLETED, AD_SLOT_STARTED, AD_STARTED
} = adEvents
const {
  CONTENT_ERROR, CONTENT_PAUSED, CONTENT_PLAYING, CONTENT_SEEKING, PLAYBACK_ENDED,
  CONTENT_TIME_UPDATED
} = contentEvents
const { PLAYER_TOGGLE_FULL_SCREEN_BT_CLICK } = playerEvents
const { LEVEL_SWITCHED } = streamEvents

class Heartbeats extends Component {
  constructor(props) {
    super(props)

    this.mediaHeartbeat = undefined

    this.isInAdBreak = false
    this.isPrevAdStarted = false
    this.isPrevAdSkipped = false
    this.isAdStarted = false
    this.adSlotPosition = 1
    this.isInitialized = false
    this.isSessionOpened = false
    this.isWaiting = false
    this.lastAction = undefined
    this.queue = []

    this.isFullScreenBtClicked = false
    this.startWithFullScreen = false
    this.isSticky = false

    this.canSetPlaySticky = true

    this.handleBeforeUnload = this.handleBeforeUnload.bind(this)
  }

  componentDidMount() {
    if (!this.isWaiting && !this.isInitialized) {
      const { logger, isFullScreen } = this.props
      const self = this

      this.isWaiting = true
      this.startWithFullScreen = isFullScreen

      logger.info('Esperando al SDK (window.s && window.ADB) para inicialializar Adobe Analytics Heartbeats')

      waitFor(() => window.s && window.ADB)
        .then(() => {
          logger.info('Se ha detectado el SDK de Heartbeats')

          self.isWaiting = false
          self.init()
        })
        .catch((error) => {
          if (error) {
            console.error(error)
          } else {
            logger.error('No se ha encotrado el SDK de Heartbeats (window.s && window.ADB) después de esperar 1 min')
          }
        })
    }
  }

  componentDidUpdate(prevProps) {
    const { isSticky } = this.props
    if (prevProps.isSticky !== this.isSticky) {
      this.isSticky = isSticky
    }
  }

  componentWillUnmount() {
    this.close()

    window.removeEventListener('pagehide', this.handleBeforeUnload)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  }

  handleEvent(eventType, params) {
    if (this.isInitialized) {
      const { type: adErrorType, error: { type: contentErrorType } = { type: undefined } } = params
      const { isPausedByUser, logger } = this.props
      switch (eventType) {
        case CONTENT_PLAYING:
          this.play()
          break
        case CONTENT_TIME_UPDATED:
          this.updatePlayHead(params)
          break
        case CONTENT_PAUSED:
          this.pause()

          if (isPausedByUser) {
            this.userPaused()
          }
          break

        case CONTENT_SEEKING:
          this.pause()
          break

        case PLAYBACK_ENDED:
          this.end()
          break

        case CONTENT_ERROR:
          this.error(contentErrorType)
          break

        case AD_ERROR:
          if (this.isAdStarted) {
            this.error(adErrorType)
          }
          break

        case AD_SLOT_STARTED:
          this.adBreakStart(params)
          this.adSlotPosition += 1
          this.isInAdBreak = true
          break

        case AD_STARTED:
          this.adStart(params)
          break

        case AD_SKIPPED:
          this.adSkipFlags()
          break

        case AD_COMPLETED:
          logger.info('Track event AD_COMPLETED')
          break

        case AD_SLOT_COMPLETED:
          if (this.isInAdBreak) {
            this.adBreakComplete(params)
            this.isInAdBreak = false
          }
          break

        case LEVEL_SWITCHED:
          this.bitrateChange(params)
          break

        case PLAYER_TOGGLE_FULL_SCREEN_BT_CLICK:
          if (!this.isFullScreenBtClicked) {
            this.toggleFullScreen()
          }
          this.toggleFullScreenState()
          break
        default: break
      }
    } else {
      this.queue.push({ eventType, params })
    }
  }

  initMediaHeartbeat() {
    const { Media, MediaConfig } = window.ADB
    const mediaConfig = new MediaConfig()

    if (window.ADB) {
      const { customConfig, logger } = this.props
      let { config: { heartbeats } } = this.props

      if (heartbeats?.config) {
        if (customConfig?.heartbeats?.config) {
          heartbeats = {
            ...heartbeats,
            config: {
              ...heartbeats.config,
              ...customConfig.heartbeats.config
            }
          }
        }

        Object.keys(heartbeats.config).forEach((key) => {
          mediaConfig[key] = evalConfigAttribute(heartbeats.config[key])
        })

        logger.info('Crear MediaHeartbeatConfig', mediaConfig)

        mediaConfig.trackingServer = 'mediaset.hb-api.omtrdc.net'
        mediaConfig.debugLogging = true
        mediaConfig.appVersion = 'MediaSDK for JavaScript version: 3.0.2'
      }

      logger.info('Crear nuevo MediaHeartbeat')
      Media.configure(mediaConfig, window.s)
      this.mediaHeartbeat = Media.getInstance()
    }
  }

  init() {
    const { logger } = this.props
    logger.info('Inicializar Heartbeats')

    this.initMediaHeartbeat()

    this.isInitialized = true

    this.open()

    this.flush()

    window.addEventListener('pagehide', this.handleBeforeUnload)
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  }

  handleBeforeUnload() {
    this.close()
  }

  flush() {
    this.queue.forEach((event) => this.handleEvent(event.eventType, event.params))
    this.queue = []
  }

  safeDuration() {
    const {
      config: { heartbeats },
      customConfig,
      isLive
    } = this.props

    let { duration } = this.props

    let length = heartbeats && heartbeats.media && heartbeats.media.duration

    if (
      customConfig
      && customConfig.heartbeats
      && customConfig.heartbeats.media
      && typeof customConfig.heartbeats.media.duration !== 'undefined'
    ) {
      length = customConfig.heartbeats.media.duration
    }

    if (isLive) {
      duration = 0
    } else {
      duration = evalConfigAttribute(length) || duration || 0
    }

    if (!Number.isNaN(duration)) {
      duration = Math.round(duration)
    } else {
      duration = 0
    }

    return duration
  }

  safeCurrentTime(currentTime) {
    const { currentTimeProp } = this.props
    let newCurrentTime = currentTime === undefined ? currentTimeProp : currentTime

    if (!Number.isNaN(newCurrentTime)) {
      newCurrentTime = Math.round(newCurrentTime)
    } else {
      newCurrentTime = 0
    }

    return newCurrentTime
  }

  open() {
    if (window.ADB) {
      const {
        ampVars,
        carouselType,
        carouselIndexClicked,
        customConfig,
        isLive,
        isNextBottonVisible,
        isNextVideoPlayback,
        isNextVideo,
        topVideo,
        isStartOverPlayback,
        logger,
        previousVideoTitle,
        title,
        user,
        v48,
        jekyllCookie
      } = this.props
      let { config: { heartbeats } } = this.props
      const { isVideoGallery } = this.props

      if (heartbeats?.media && this.mediaHeartbeat) {
        if (customConfig?.heartbeats?.media) {
          heartbeats = {
            ...heartbeats,
            media: {
              ...heartbeats.media,
              ...customConfig.heartbeats.media
            }
          }
        }

        if (!customConfig.heartbeats.videoCustomMetadata.v86) {
          customConfig.heartbeats.videoCustomMetadata.v86 = OMNITURE_NA
        }

        if (customConfig?.heartbeats?.videoCustomMetadata) {
          heartbeats = {
            ...heartbeats,
            videoCustomMetadata: {
              ...heartbeats.videoCustomMetadata,
              ...customConfig.heartbeats.videoCustomMetadata
            }
          }
        }
        const videoCustomMetadata = heartbeats.videoCustomMetadata || {}

        const videoMetadataKeys = window.ADB.Media.VideoMetadataKeys
        const mediaObject = window.ADB.Media.createMediaObject(
          heartbeats.media.name,
          heartbeats.media.id,
          this.safeDuration(),
          isLive ? window.ADB.Media.StreamType.Live : window.ADB.Media.StreamType.VOD
        )

        if (ampVars) {
          if (hasJSCode(videoCustomMetadata.v26)) {
            videoCustomMetadata.v26 = ampVars.eVar8
          }
          if (hasJSCode(videoCustomMetadata.v27)) {
            videoCustomMetadata.v27 = ampVars.eVar9
          }
          if (hasJSCode(videoCustomMetadata.v39)) {
            videoCustomMetadata.v39 = ampVars.eVar7 ? ampVars.eVar7 : `${ampVars.eVar6} ${ampVars.eVar3}`
          }
        }
        const vCkeys = Object.keys(videoCustomMetadata)

        vCkeys.forEach((key) => {
          videoCustomMetadata[key] = evalConfigAttribute(videoCustomMetadata[key])
        })

        const var31 = videoCustomMetadata.v31
        if (var31.indexOf('fbclid=') !== -1) {
          videoCustomMetadata.v31 = getNewVar31(videoCustomMetadata.v31)
        }

        (
          user?.UID ? accounts(user)
            .then((data) => {
              videoCustomMetadata.v50 = user.isSubscribed ? 'suscrito' : 'logged'
              videoCustomMetadata.v51 = user.UID

              if (user?.profile?.pid) {
                const url = `${customConfig.multiProfile.config.baseUrl}${customConfig.multiProfile.config.service.PROFILE.PATH}${user.UID}`

                const options = {
                  headers: {
                    'Content-Type': 'application/json',
                    signatureTimestamp: data.signatureTimestamp,
                    uidSignature: data.uidSignature
                  },
                  method: 'GET'
                }
                const cookie = getCookie(jekyllCookie) || {}
                const { dataProfiles = [], UID = null } = typeof cookie === 'string' && cookie.trim() !== ''
                  ? JSON.parse(atob(cookie))
                  : {}
                logger.info(`Me llega este valor: ${dataProfiles} ${UID}`)

                const dataCookieResponse = (dataCookie) => ({
                  ok: true,
                  status: 200,
                  statusText: 'cookie profile data',
                  json: async () => dataCookie
                })

                const getProfiles = (urlRequest, optionsRequest) => fetch(urlRequest, optionsRequest)

                const profilesPromise = (dataProfiles.length && (UID === user.UID)
                && dataProfiles.some(({ pid }) => pid === user.profile.pid))
                  ? Promise.resolve(dataCookieResponse({ profiles: dataProfiles }))
                  : getProfiles(url, options)
                profilesPromise
                  .then((response) => {
                    if (response.ok) return response.json()
                    throw new Error(`GET ${url} ${response.status} ${response.statusText}`)
                  })
                  .then((json) => {
                    if (json?.profiles) {
                      const listProfiles = json.profiles
                      const order = 1
                         + listProfiles.findIndex(({ pid }) => pid === user.profile.pid)
                      videoCustomMetadata.v115 = order === 1 ? 'Perfil Máster' : `Perfil ${order}`
                      videoCustomMetadata.v117 = listProfiles.length
                    }
                  })
              }
              return Promise.resolve()
            })
            .catch((error) => {
              logger.info(`Error al en la petición de los perfiles ${error.message}`)
            })
            : Promise
              .resolve()
              .then(() => {
                videoCustomMetadata.v50 = 'Not Logged'
                videoCustomMetadata.v51 = 'No Aplica'
                videoCustomMetadata.v115 = 'No Aplica'
                videoCustomMetadata.v117 = 'No Aplica'
              })
        ).then(() => {
          videoCustomMetadata.v22 = isLive ? 'No Aplica' : getDaysFromPublicationDate(videoCustomMetadata.v21)
          videoCustomMetadata.v34 = this.startWithFullScreen ? 'SI' : 'NO'

          if (isStartOverPlayback) {
            videoCustomMetadata.v40 = 'Start Over'
          }

          videoCustomMetadata.v114 = window
              && window.s
              && window.s.visitor
              && window.s.visitor.getMarketingCloudVisitorID()

          videoCustomMetadata.v48 = v48 || 'No Aplica'

          videoCustomMetadata.v118 = isVideoGallery ? 'Videogaleria' : videoCustomMetadata.v118 || 'No aplica'

          if (isLive) {
            videoCustomMetadata.v41 = videoCustomMetadata.v41 || title
          }
          const totalVideosWatched = sessionStorage.getItem('totalVideosWatched')
          videoCustomMetadata.v49 = isLive ? 'No aplica' : getEvar49(isNextVideo, isNextVideoPlayback, carouselType, topVideo)
          videoCustomMetadata.v80 = isLive ? 'No aplica' : getEvar80(isNextVideo)
          videoCustomMetadata.v102 = isLive ? 'No aplica' : getEvar102(videoCustomMetadata.v49, !isLive && isNextBottonVisible)
          videoCustomMetadata.v120 = !isLive && previousVideoTitle ? previousVideoTitle : 'No aplica'
          videoCustomMetadata.v121 = isLive ? 'No aplica' : getEvar121(carouselType, carouselIndexClicked, isNextVideo, isNextVideoPlayback, topVideo)
          videoCustomMetadata.v124 = isLive ? 'No aplica' : getEvar124(totalVideosWatched)

          const { l3 } = videoCustomMetadata
          videoCustomMetadata[videoMetadataKeys.Genre] = getGenres(l3)

          logger.info('Track session start', {
            mediaObject,
            videoCustomMetadata
          })

          this.mediaHeartbeat.trackSessionStart(mediaObject, videoCustomMetadata)

          this.isSessionOpened = true
        })
      }
    }
  }

  play() {
    if (!this.isSessionOpened) {
      this.open()
    }

    if (this.isSticky && this.canSetPlaySticky) {
      const stickyPlay = window.ADB.Media
        .createStateObject(window.ADB.Media.PlayerState.PictureInPicture)
      this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.StateStart, stickyPlay)
      this.canSetPlaySticky = false
    }

    if (this.mediaHeartbeat && this.lastAction !== ACTION_PLAY) {
      const { logger } = this.props
      logger.info('Track play')

      this.mediaHeartbeat.trackPlay()
      this.lastAction = ACTION_PLAY
    }
  }

  updatePlayHead(params) {
    if (this.mediaHeartbeat && this.isSessionOpened) {
      const { currentTime } = params
      this.mediaHeartbeat.updatePlayhead(currentTime)
    }
  }

  pause() {
    if (this.mediaHeartbeat && this.isSessionOpened && this.lastAction !== ACTION_PAUSE) {
      const { logger } = this.props
      logger.info('Track pause')

      this.mediaHeartbeat.trackPause()

      this.lastAction = ACTION_PAUSE
    }
  }

  end() {
    if (this.mediaHeartbeat && this.isSessionOpened && this.lastAction !== ACTION_END) {
      const { logger } = this.props
      logger.info('Track complete')

      this.mediaHeartbeat.trackComplete()
      this.close()

      this.lastAction = ACTION_END
    }
  }

  error(type) {
    if (this.mediaHeartbeat && this.isSessionOpened) {
      const { logger } = this.props
      logger.info(`Track error: ${type}`)
    }
    this.isAdStarted = false
  }

  adBreakStart(params) {
    if (!this.isSessionOpened) {
      this.open()
    }

    if (this.mediaHeartbeat) {
      const { currentTime, logger } = this.props

      const adBreakObject = window.ADB.Media.createAdBreakObject(
        parseAdGenre(params.adGenre),
        this.adSlotPosition,
        currentTime
      )

      logger.info(`Track event ${window.ADB.Media.Event.AdBreakStart}`, adBreakObject)

      this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.AdBreakStart, adBreakObject)
    }
  }

  adStart(params) {
    if (!this.isSessionOpened) {
      this.open()
    }

    if (this.mediaHeartbeat) {
      const { logger } = this.props

      // For every incoming ad this performs the complete/skip event logic
      // before the new one starts (except for the last one which is done
      // in adbreakcomplete)
      switch (true) {
        case this.isPrevAdStarted:
          // Perform action for ad complete event if the previous one
          // hasn't been informed as completed
          this.adComplete()
          break
        case this.isPrevAdSkipped:
          // Perform action for ad skip event if if the previous one
          // hasn't been informed as skipped
          this.adSkipEvent()
          break
        default:
          // A different case if needed
          break
      }

      const adObject = window.ADB.Media.createAdObject(
        params.adTitle,
        params.adId,
        !Number.isNaN(parseInt(params.adPosition, 10)) ? parseInt(params.adPosition, 10) : 1,
        !Number.isNaN(parseInt(params.adDuration, 10)) ? parseInt(params.adDuration, 10) : null
      )

      const adCustomMetadata = {
        [window.ADB.Media.AdMetadataKeys.CreativeId]: params.adCreativeId,
        [window.ADB.Media.AdMetadataKeys.CreativeUrl]: params.adMediaUrl
      }

      logger.info(`Track event ${window.ADB.Media.Event.AdStart}`, {
        adObject,
        adCustomMetadata
      })

      this.mediaHeartbeat.trackEvent(
        window.ADB.Media.Event.AdStart,
        adObject,
        adCustomMetadata
      )

      this.isPrevAdStarted = true
      this.isAdStarted = true
    }
  }

  adSkipFlags() {
    this.isPrevAdSkipped = true
    this.isPrevAdStarted = false
    this.isAdStarted = false
  }

  adSkipEvent() {
    if (this.mediaHeartbeat && this.isSessionOpened) {
      const { logger } = this.props
      logger.info(`Track event ${window.ADB.Media.Event.AdSkip}`)
      this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.AdSkip)
    }
    this.isPrevAdSkipped = false
  }

  adComplete() {
    if (this.mediaHeartbeat && this.isSessionOpened) {
      const { logger } = this.props
      logger.info(`Track event ${window.ADB.Media.Event.AdComplete}`)
      this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.AdComplete)
    }
    this.isAdStarted = false
  }

  adBreakComplete() {
    if (this.mediaHeartbeat && this.isSessionOpened) {
      const { logger } = this.props

      if (this.isPrevAdStarted || this.isPrevAdSkipped) {
        // Preventing autofiring of content start event after adbreakcomplete
        // by using bufferstart event
        logger.info(`Track event ${window.ADB.Media.Event.BufferStart}`)
        this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.BufferStart)
        // The last ad hasn't been reported as completed/skipped yet
        // because we need to fire a bufferstart (according to adobe) before
        // firing those states
        switch (true) {
          case this.isPrevAdStarted:
            this.adComplete()
            break
          case this.isPrevAdSkipped:
            this.adSkipEvent()
            break
          default:
            // A different case if needed
            break
        }
      }

      logger.info(`Track event ${window.ADB.Media.Event.AdBreakComplete}`)
      this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.AdBreakComplete)
    }
    this.isPrevAdStarted = false
    this.isPrevAdSkipped = false
    this.isAdStarted = false
  }

  bitrateChange(params) {
    if (this.mediaHeartbeat && this.isSessionOpened) {
      const {
        droppedFrames, logger, getVideoRef
      } = this.props
      let { currentFps } = this.props

      if (currentFps < 0) {
        currentFps = 1
      }

      this.mediaHeartbeat.updatePlayhead(getVideoRef.playhead)
      const qoeObject = window.ADB.Media.createQoEObject(
        params.bitrate || 0,
        this.safeCurrentTime() || 0,
        currentFps || 1,
        droppedFrames || 0
      )
      logger.info(`Track event ${window.ADB.Media.Event.BitrateChange}`, qoeObject)

      this.mediaHeartbeat.updateQoEObject(qoeObject)
      this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.BitrateChange, null, null)
    }
  }

  toggleFullScreenState() {
    const { isFullScreen } = this.props
    const stateObject = window.ADB.Media.createStateObject(window.ADB.Media.PlayerState.FullScreen)
    if (!isFullScreen) {
      this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.StateStart, stateObject)
    } else {
      this.mediaHeartbeat.trackEvent(window.ADB.Media.Event.StateEnd, stateObject)
    }
  }

  toggleFullScreen() {
    const { config, logger } = this.props

    if (window?.s_gi) {
      logger.info('Track toggle full-screen')

      const sGi = window.s_gi(MEDIASET_ACCOUNT)
      sGi.linkTrackVars = 'events,eVar20,eVar23,eVar25,eVar41'
      sGi.linkTrackEvents = 'event2'
      sGi.eVar20 = config.eVar20 || OMNITURE_NA
      sGi.eVar23 = config.eVar23 || OMNITURE_NA
      sGi.eVar25 = config.eVar25 || OMNITURE_NA
      sGi.eVar41 = config.eVar41 || OMNITURE_NA
      sGi.events = 'event2'
      sGi.tl(this, 'o', ACTION_TOGGLE_FULL_SCREEN)

      this.isFullScreenBtClicked = true
    }
  }

  userPaused() {
    const {
      customConfig,
      isLive,
      isNextVideoPlayback,
      isStartOverPlayback,
      logger,
      user
    } = this.props
    const { config: { heartbeats } } = this.props

    if (window?.s_gi) {
      logger.info('Track user pause')

      const videoCustomMetadata = heartbeats?.videoCustomMetadata
      const config = transformToCustomObject(videoCustomMetadata)
      const customConfigMetadata = customConfig?.heartbeats?.videoCustomMetadata

      const sGi = window.s_gi(MEDIASET_ACCOUNT)
      sGi.linkTrackVars = 'events,l2,eVar14,eVar19,eVar20,eVar21,eVar22,eVar23,eVar24,eVar25,eVar26,eVar27,eVar28,eVar29,eVar30,eVar31,eVar32,eVar33,eVar34,eVar36,eVar37,eVar39,eVar40,eVar41,eVar42,eVar43,eVar45,eVar46,eVar47,eVar49,eVar50,eVar51,eVar59,eVar63,eVar66,eVar68,eVar82'
      sGi.linkTrackEvents = 'event58'

      if (user?.UID) {
        config.eVar50 = user.isSubscribed ? 'suscrito' : 'logged'
        config.eVar51 = user.UID
      } else {
        config.eVar50 = 'Not Logged'
        config.eVar51 = 'No Aplica'
      }

      if (isStartOverPlayback) {
        config.eVar40 = 'Start Over'
      }

      if (isNextVideoPlayback) {
        config.eVar49 = 'Siguiente capitulo'
      }

      config.eVar34 = this.startWithFullScreen ? 'SI' : 'NO'
      config.eVar22 = isLive ? 'No Aplica' : getDaysFromPublicationDate(config.eVar21)
      config.eVar14 = document?.referrer || 'No informado'
      config.eVar63 = customConfigMetadata?.v63 || OMNITURE_NA
      config.eVar19 = customConfigMetadata?.v19 || OMNITURE_NA
      config.eVar20 = heartbeats?.media?.name || OMNITURE_NA

      config.events = 'event58'
      sGi.tl(this, 'o', ACTION_USER_PAUSE, config)
    }
  }

  close() {
    if (this.mediaHeartbeat && this.isSessionOpened) {
      const { logger } = this.props
      logger.info('Track session end')

      this.mediaHeartbeat.trackSessionEnd()
      this.isSessionOpened = false
      this.startWithFullScreen = false
      this.isInAdBreak = false
    }
  }

  reset() {
    this.isSessionOpened = false
    this.adSlotPosition = 1
    this.startWithFullScreen = false
    this.isInAdBreak = false
  }

  render() {
    return null
  }
}

Heartbeats.propTypes = {
  config: PropTypes.shape({
    heartbeats: PropTypes.shape({
      config: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string
      ])),
      media: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string
      ])),
      videoCustomMetadata: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string
      ]))
    })
  }).isRequired,
  currentFps: PropTypes.number,
  currentTime: PropTypes.number,
  customConfig: PropTypes.shape({
    heartbeats: PropTypes.shape({
      config: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string
      ])),
      media: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string
      ])),
      videoCustomMetadata: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string
      ]))
    })
  }),
  droppedFrames: PropTypes.number,
  duration: PropTypes.number,
  getVideoRef: PropTypes.func.isRequired,
  isLive: PropTypes.bool,
  isNextVideoPlayback: PropTypes.bool,
  isStartOverPlayback: PropTypes.bool,
  isSticky: PropTypes.bool,
  jekyllCookie: PropTypes.string,
  logger: PropTypes.shape({
    log: PropTypes.func
  }),
  user: PropTypes.shape({
    firstName: PropTypes.string,
    gender: PropTypes.string,
    isSubscribed: PropTypes.bool,
    lastName: PropTypes.string,
    photoURL: PropTypes.string,
    signatureTimestamp: PropTypes.string,
    thumbnailURL: PropTypes.string,
    UID: PropTypes.string,
    UIDSignature: PropTypes.string,
    profile: PropTypes.shape({
      pid: PropTypes.string,
      name: PropTypes.string,
      channels: PropTypes.shape({
        id: PropTypes.string,
        color: PropTypes.string
      }),
      images: PropTypes.shape({
        id: PropTypes.string,
        src: PropTypes.string
      })
    })
  })
}

Heartbeats.defaultProps = {
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) },
  currentFps: 0,
  currentTime: 0,
  customConfig: {},
  droppedFrames: 0,
  duration: 0,
  isLive: false,
  isNextVideoPlayback: false,
  isStartOverPlayback: false,
  isSticky: false,
  jekyllCookie: null,
  user: {}
}

export default Heartbeats
