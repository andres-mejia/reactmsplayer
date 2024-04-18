import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { waitFor } from '../../../commons/util'
import { genres } from '../../../commons/types'
import { contentEvents, mediaEvents, adEvents } from '../../../commons/types/events'

const { CONTENT } = genres
const {
  CONTENT_ENDED,
  CONTENT_ERROR,
  CONTENT_PAUSED,
  CONTENT_PLAYING,
  CONTENT_SEEKED,
  // CONTENT_SEEKING,
  CONTENT_TIME_UPDATED,
  CONTENT_WAITING
} = contentEvents

const {
  VOLUME_CHANGE
} = mediaEvents

const {
  IMA_ADS_MANAGER_CHANGED
} = adEvents

/**
 * Get c1 value and get c1 embed
 * @returns hostname (ej: mitele.es, telecinco.es, cuatro.com....)
 */

const getC1Value = () => {
  const urlHostname = window?.location?.hostname

  if (!urlHostname) {
    return ''
  }

  if (urlHostname && urlHostname.includes('http', 'https') && urlHostname.split('/').length >= 3) {
    return urlHostname.split('/')[2].replace('www.', '')
  }

  if (urlHostname) {
    return urlHostname.replace('www.', '')
  }
}

const getC1Embed = () => {
  const regex = /[^.]*.?(?:[^@/\n]+@)?([^:/?\n]+)/
  const urlHostname = document?.referrer ? new URL(document.referrer)?.hostname : ''

  if (!urlHostname) {
    return ''
  }

  if (urlHostname && regex.exec(urlHostname).length >= 2) {
    if (!urlHostname.includes('www')) {
      return regex.exec(urlHostname)[0]
    }
    return regex.exec(urlHostname)[1]
  }

  if (urlHostname) {
    return new URL(urlHostname)?.replace('www.', '')
  }
}

const getC2Value = (url) => {
  const restUrl = url.split('//')[1].split('/')[1]

  return restUrl.split('.')[0]
}

const getUTCDate = (dateString) => {
  const date = new Date(dateString)
  return date.toISOString()
}

const getStreamingInstance = (id) => {
  window.streamingTags = window?.streamingTags || []
  const tag = window.streamingTags.find((tags) => tags.id === id)
  return tag?.instance
}

class Gfk extends Component {
  constructor(props) {
    super(props)

    // Streaming tag
    this.videoRef = props.getVideoRef()
    this.streamingTag = undefined
    this.streamingTagMetadata = {}

    this.currentPosition = undefined
    this.seeked = false

    // Init SDK
    this.isWaiting = false
    this.isInitialized = false
    this.queue = []
    this.initializeSDK()
  }

  componentWillUnmount() {
    const { logger } = this.props
    logger.info('[GFK] Desmontando componente GFK y parando agent')

    if (this.streamingTag?.agent) {
      this.streamingTag.agent.stop() // It is necessary to stop the agent because metrics are still sent in the background when users close the player (mitele)
    }

    this.reset()
  }

  getDuration(duration) {
    return duration && duration >= 1000 ? duration / 1000 : ''
  }

  getVolume() {
    return this.videoRef.muted ? '0' : Math.round(this.videoRef.volume * 100).toString()
  }

  getCustomParams() {
    const {
      config,
      isLive,
      show
    } = this.props
    const { channelname, programmname, ns_st_cl: duration } = config

    const isEmbed = window.location.href.includes('embed')

    const customParams = {
      c1: isEmbed ? getC1Embed() : getC1Value(),
      c2: getC2Value(window.location.href),
      r: isEmbed && document.referrer,
      programmname: !isLive ? (programmname || '') : show,
      streamlength: !isLive ? this.getDuration(duration) : '',
      channelname: channelname || ''
    }
    return customParams
  }

  initializeSDK() {
    const { logger } = this.props

    logger.info('[GFK] Esperando al SDK (window.gfkS2sExtension) y configuración para inicialializar GFK')
    this.isWaiting = true
    waitFor(() => {
      const { config } = this.props
      return !!(window?.gfkS2sExtension && config)
    }).then(() => {
      this.isWaiting = false
      logger.info('[GFK] Se ha detectado el SDK')
      this.init(getStreamingInstance(this.videoRef?.id))
    }).catch((e) => logger.error(`[GFK] No se ha encotrado el SDK de GFK (window.gfkS2sExtension) después de esperar 1 min. Puede haber habido algún problema en la descarga del SDK o puede que no se esté importando. (GFK001) - ${e?.message || e}`))
  }

  streamPositionCallback() {
    this.currentPosition = Math.floor(this.videoRef.currentTime * 1000)
    return this.currentPosition
  }

  init(streamingInstance) {
    const { logger } = this.props
    const customParams = this.getCustomParams()

    if (streamingInstance) {
      logger.info('[GFK] - Instancia HTML5VODExtension encontrada, seteamos parámetros', customParams)
      streamingInstance.setParameter('default', customParams)
    }

    this.streamingTag = streamingInstance || this.newStreamingTag(customParams)
    this.isInitialized = true
    this.flush()
  }

  newStreamingTag(customParams) {
    const { logger, isLive } = this.props
    let instance = null

    if (isLive) {
      logger.info('[GFK] - Creando nueva instancia HTML5LiveExtension', customParams)
      instance = new window.gfkS2sExtension.HTML5LiveExtension(this.videoRef, window.gfkS2sConf, 'default', customParams)
    } else {
      logger.info('[GFK] - Creando nueva instancia HTML5VODExtension', customParams)
      instance = new window.gfkS2sExtension.HTML5VODExtension(this.videoRef, window.gfkS2sConf, 'default', customParams)
    }

    window.streamingTags = [...window.streamingTags, {
      id: this.videoRef.id,
      instance
    }]
    return instance
  }

  setGoogleImaSupport(adsManager) {
    const { logger } = this.props
    logger.info('[GFK] - Google Ima Support - setear adsManager')
    this.streamingTag.activateGoogleIMASupport(adsManager);
  }

  notifyPlay() {
    const { logger } = this.props
    logger.info('[GFK] Play de contenido - notifyPlay')
    if (this.seeked) {
      this.seeked = false
    }
  }

  notifyPause() {
    const { logger } = this.props
    logger.info('[GFK] Pause de contenido - notifyPause')
  }

  notifySeekEnd() {
    const { logger } = this.props
    logger.info('[GFK] Pause de contenido - notifySeekEnd')

    if (!this.videoRef.paused) {
      this.seeked = true
    }
  }

  notifyEnd() {
    const { logger } = this.props
    logger.info('[GFK] End de contenido - notifyEnd')
  }

  handleEvent(eventType, params) {
    const { genre } = this.props

    if (this.isInitialized) {
      switch (eventType) {
        case CONTENT_PLAYING:
          if (genre === CONTENT) {
            this.notifyPlay()
          }
          break
        case CONTENT_PAUSED:
          this.notifyPause()
          break
        case CONTENT_ENDED:
          this.notifyEnd()
          break
        case CONTENT_ERROR:
          this.notifyEnd()
          break
        case CONTENT_SEEKED:
          this.notifySeekEnd()
          break
        case CONTENT_TIME_UPDATED:
          this.currentPosition = this.streamPositionCallback()
          break
        case CONTENT_WAITING:
          break
        case VOLUME_CHANGE:
          break
        case IMA_ADS_MANAGER_CHANGED:
          this.setGoogleImaSupport(params.adsManager)
          break;
        default: break
      }
    } else {
      this.queue.push({ eventType, params })
    }
  }

  flush() {
    this.queue.forEach((event) => this.handleEvent(event.eventType, event.params))
    this.queue = []
  }

  reset() {
    this.streamingTag = undefined
    this.isWaiting = false
    this.isInitialized = false
  }

  render() {
    return null
  }
}

Gfk.propTypes = {
  // id: PropTypes.string,
  isLive: PropTypes.bool,
  logger: PropTypes.oneOf(PropTypes.object)
}

Gfk.defaultProps = {
  // id: '',
  isLive: false,
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default Gfk
