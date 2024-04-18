import { Component } from 'react'
import { PropTypes } from 'prop-types'
import GLOBALCONFIG from 'globalConfig'
import {
  adEvents,
  contentEvents,
  mediaPlayerEvents,
  playerEvents,
  streamEvents
} from '../../../commons/types/events'
import {
  errorCodes, errorMessages, errorTypes, mediaPlayerTypes
} from '../../../commons/types'

const {
  AD_ERROR,
  IMA_ADS_MANAGER_CHANGED
} = adEvents

const { CONTENT_PROGRAM_CHANGE } = contentEvents
const { MEDIA_PLAYER_CHANGED } = mediaPlayerEvents
const {
  PLAYER_ERROR,
  PLAYER_ERROR_CONTENT_GEOBLOCKED,
  PLAYER_ERROR_FATAL,
  PLAYER_ERROR_PLAY,
  PLAYER_ERROR_STREAM_FALLBACK,
  PLAYER_RESET,
  PLAYER_START_REQUESTED
} = playerEvents
const { SUBTITLE_TRACK_CHANGED, AUDIO_TRACK_CHANGED, SUBTITLE_TRACKS } = streamEvents
const { ERROR_UNKNOWN } = errorTypes
const {
  DASH_JS, HLS_JS, HTML_VIDEO_ELEMENT, SHAKA_PLAYER
} = mediaPlayerTypes

class Npaw extends Component {
  constructor(props) {
    super(props)
    if (typeof window !== 'undefined') {
      const { npaw: { accountId = 'mediasetspadev'} } = this.props
      import('npaw-plugin').then((NpawPlugin) => {
        this.npawPlugin = new NpawPlugin.default(accountId)
      })
    }
    this.state = {
      isAvailable: false,
      subtituleTrackChanged: null,
      audioTrackChanged: null
    }
    this.analyticsOptions = {
      'content.subtitles': 'Desactivado',
      'content.language': 'Desactivado'
    }
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this)
  }

  componentDidMount() {
    this.initListeners()
  }

  componentDidUpdate(prevProps, prevState) {
    const { config, src, drm } = this.props
    const { isAvailable, subtituleTrackChanged, audioTrackChanged } = this.state

    if (config && config.npaw && Object.keys(config.npaw).length > 0) {
      if (config !== prevProps.config || src !== prevProps.src) {
        this.initAnalyticsPlugin()
      }
    }

    if (drm !== prevProps.drm) {
      this.analyticsOptions['content.drm'] = drm
      this.npawPlugin.setAnalyticsOptions(this.analyticsOptions)
    }

    if (isAvailable !== prevState.isAvailable) {
      if (typeof window !== 'undefined' && this.npawPlugin && !isAvailable) this.npawPlugin.setAnalyticsOptions({ 'content.subtitles': 'No disponible' })
    }

    if (subtituleTrackChanged !== prevState.subtituleTrackChanged) {
      let name
      if (subtituleTrackChanged.name === 'Ninguno') {
        name = 'Desactivado'
      } else {
        name = subtituleTrackChanged.name
      }
      this.analyticsOptions['content.subtitles'] = name
      this.npawPlugin.setAnalyticsOptions(this.analyticsOptions)
    }

    if (audioTrackChanged !== prevState.audioTrackChanged) {
      let label
      if (audioTrackChanged.label === 'Ninguno') {
        label = 'Desactivado'
      } else {
        label = audioTrackChanged.label
      }
      this.analyticsOptions['content.language'] = label
      this.npawPlugin.setAnalyticsOptions(this.analyticsOptions)
    }
  }

  componentWillUnmount() {
    this.reset()
  }

  async setContentAdapter(player, type, videoUrl, videoElement) {
    const { src, logger, npaw: { hls, html5, dash, shaka } } = this.props
    const { ASSETS_PATH } = GLOBALCONFIG

    logger.info(`Asignar adapter de contenido: ${type}, ${src}`)
    switch (type) {
      case DASH_JS:
        this.npawPlugin.registerAdapter(player, `${ASSETS_PATH}/npawAdapters/${dash}`, null, null, () => { player.initialize(videoElement, videoUrl) })
        break
      case HLS_JS:
        this.npawPlugin.registerAdapter(player, `${ASSETS_PATH}/npawAdapters/${hls}`, null, null, () => { player.attachMedia(videoElement) })
        break
      case HTML_VIDEO_ELEMENT: {
        if (!this.npawPlugin.getAdapter()) {
          this.npawPlugin.setManifestResource(src)
          this.npawPlugin.registerAdapter(player, `${ASSETS_PATH}/npawAdapters/${html5}`)
        }
        break
      }
      case SHAKA_PLAYER:
        this.npawPlugin.registerAdapter(player, `${ASSETS_PATH}/npawAdapters/${shaka}`)
        break
    }
  }

  handleBeforeUnload() {
    this.reset()
  }

  initListeners() {
    window.addEventListener('pagehide', this.handleBeforeUnload)
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  }

  initAnalyticsPlugin() {
    const {
      config, userId, src, cdn, user
    } = this.props
    const {
      isLive,
      title,
      duration,
      program,
      tvShow,
      season,
      type,
      genre,
      site,
      geoblocked,
      contentId,
      channel
    } = config.npaw

    this.analyticsOptions = {
      ...this.analyticsOptions,
      enabled: true,
      'user.name': userId,
      'content.isLive': isLive,
      'content.title': title,
      'content.program': program,
      'content.duration': duration,
      'content.tvShow': tvShow,
      'content.season': season,
      'content.type': type,
      'content.genre': genre,
      'content.channel': channel,
      'content.id': this.findAssetName(),
      'content.resource': src || null,
      'content.cdn': cdn,
      'device.id': userId,
      'app.name': 'msplayer',
      'app.releaseVersion': '0.1-beta',
      'content.customDimension.1': geoblocked,
      'content.customDimension.2': window.location.href,
      'content.customDimension.3': site,
      'content.customDimension.4': contentId,
      'content.customDimension.5': user && user.UID ? user.isSubscribed ? 'Subscribed' : 'Registered' : 'Anonymous'
    }
    if (typeof window !== 'undefined' && this.npawPlugin) {
      this.npawPlugin.setAnalyticsOptions(this.analyticsOptions)
    }
  }

  findAssetName() {
    const { config, episodeName } = this.props
    const {
      contentId,
      title,
      isLive,
      tvShow
    } = config.npaw

    const liveId = episodeName || contentId || 'no_id'
    const liveName = tvShow || title || 'no_name'
    const vodId = contentId || 'no_id'
    const vodName = episodeName || title || 'no_name'

    if (isLive) {
      return `[${liveId}] ${liveName}`
    }

    return `[${vodId}] ${vodName}`
  }

  handleEvent(eventType, params) {
    const { logger, config, npaw: { ima } } = this.props
    const { ASSETS_PATH } = GLOBALCONFIG

    switch (eventType) {
      case PLAYER_START_REQUESTED:
        logger.info(`Se recibe el evento ${eventType}`)
        // if (typeof window !== 'undefined' && this.npawPlugin) {
        // this.npawPlugin.registerDefaultAdapter()
        // this.npawPlugin.getAdapter().fireStart()
        // this.npawPlugin.setAnalyticsOptions(this.analyticsOptions)
        // }
        break
      case IMA_ADS_MANAGER_CHANGED: {
        logger.info(`Se recibe el evento ${eventType}`)
        if (typeof window !== 'undefined' && this.npawPlugin) {
          this.adsManager = params.adsManager
          this.npawPlugin.registerAdsAdapter(this.adsManager, `${ASSETS_PATH}/npawAdapters/${ima}`)
        }
        break
      }
      case AD_ERROR:
        logger.info(`Se recibe el evento ${eventType}`)
        break
      case MEDIA_PLAYER_CHANGED:
        logger.info(`Se recibe el evento ${eventType}`, params.type)
        this.setContentAdapter(params.player, params.type, params.videoUrl, params.videoElement)
        break
      case CONTENT_PROGRAM_CHANGE:
        logger.info(`Se recibe el evento ${eventType}`, params)
        this.analyticsOptions['content.title'] = config.npaw.title
        this.analyticsOptions['content.program'] = config.npaw.program
        this.analyticsOptions['content.id'] = this.findAssetName()
        this.npawPlugin.setAnalyticsOptions(this.analyticsOptions)
        break
      case PLAYER_RESET:
        logger.info(`Se recibe el evento ${eventType}`)
        this.reset()
        break
      case PLAYER_ERROR_FATAL:
        this.reportError({ ...(params && params.error) })
        break
      case PLAYER_ERROR_CONTENT_GEOBLOCKED:
        this.reportError({ ...(params && params.error) })
        break
      case PLAYER_ERROR_PLAY:
        this.reportError({ ...(params && params.error) })
        break
      case PLAYER_ERROR_STREAM_FALLBACK:
        this.reportError({ ...(params && params.error) })
        break
      case PLAYER_ERROR:
        this.reportError({ ...(params && params.error) })
        break
      case SUBTITLE_TRACK_CHANGED:
        logger.info(`Se recibe el evento ${eventType}`, params)
        this.setState({
          subtituleTrackChanged: params.subtitleTrack ? params.subtitleTrack : params
        })
        break
      case SUBTITLE_TRACKS:
        logger.info(`Se recibe el evento ${eventType}`, params)
        this.setState({
          isAvailable: params.isAvailable
        })
        break
      case AUDIO_TRACK_CHANGED:
        logger.info(`Se recibe el evento ${eventType}`, params)
        this.setState({
          audioTrackChanged: params.track ? params.track : params
        })
        break
    }
  }

  reportError(params) {
    const { logger } = this.props

    if (typeof window !== 'undefined' && this.npawPlugin && this.npawPlugin.getAdapter()) {
      let code = errorCodes[ERROR_UNKNOWN]
      let msg = errorMessages[ERROR_UNKNOWN]

      if (params && params.type) {
        code = errorCodes[params.type]
        msg = errorMessages[params.type]
      }
      const details = []
      if (params && params.info) {
        if (params.info.code) {
          for (let key in params.info.code) {
            details.push(`${key}:${params.info.code[key]}`)
          }
        }
        if (typeof params.info.status !== 'undefined') {
          details.push(`status:${params.info.status}`)
        }
      }

      const message = `${msg}${details.length ? ` (${details.join(',')})` : ''}`
      code = `${code}`

      logger.info('Se reporta error personalizado', { code, message })
      this.npawPlugin.getAdapter().fireError(code, message)
    } else {
      logger.warn('Se ha pedido reportar un error personalizado pero no es posible porque no se ha encotrado una instancia del plugin válida')
    }
  }

  reset() {
    if (typeof window !== 'undefined' && this.npawPlugin) {
      window.removeEventListener('pagehide', this.handleBeforeUnload)
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
      if (this.adsManager) {
        this.npawPlugin.removeAdsAdapter()
        this.adsManager = undefined
      }
      this.npawPlugin.destroy()
      this.analyticsOptions = {}
    }
  }

  render() {
    return null
  }
}

Npaw.propTypes = {
  config: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.object,
    PropTypes.string
  ])),
  drm: PropTypes.shape({
    certificate: PropTypes.string,
    keySystem: PropTypes.string,
    license: PropTypes.string
  }),
  duration: PropTypes.number,
  isAdsEnabled: PropTypes.bool,
  isLive: PropTypes.bool,
  isStartOverPlayback: PropTypes.bool,
  logger: PropTypes.object,
  playerVersion: PropTypes.string,
  preloading: PropTypes.shape({
    isEnabled: PropTypes.bool,
    level: PropTypes.string,
    limit: PropTypes.limit,
    type: PropTypes.string
  }),
  src: PropTypes.string,
  title: PropTypes.string,
  userId: PropTypes.string,
  npaw: PropTypes.shape({
    accountId: PropTypes.string,
    active: PropTypes.bool,
    dash: PropTypes.string,
    hls: PropTypes.string,
    html5: PropTypes.string,
    ima: PropTypes.string,
    shaka: PropTypes.string
  })
}

Npaw.defaultProps = {
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default Npaw
