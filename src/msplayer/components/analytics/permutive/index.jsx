/* eslint-disable class-methods-use-this */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { UAParser } from 'ua-parser-js'
import { genres } from '../../../commons/types'
import { waitFor } from '../../../commons/util'
import { contentEvents, adEvents } from '../../../commons/types/events'

// Helpers
import { getBrowserInfo } from '../../../commons/userAgent'
import { getScreenResolution } from '../../../commons/util'
import { accounts } from './helper'

// CONSTANTS
import LITERALS from '../../../../../../../app/commons/constants/literals'
import { getDeviceType } from '../../../../../../../app/commons/helpers/browser'

const { CONTENT } = genres
const {
  CONTENT_ENDED,
  CONTENT_PLAYING,
  CONTENT_TIME_UPDATED,
  PLAYBACK_ENDED
} = contentEvents

const {
  AD_COMPLETED,
  AD_STARTED,
  AD_FIRST_QUARTILE,
  AD_MIDPOINT,
  AD_THIRD_QUARTILE
} = adEvents

const { UNKNOWN } = LITERALS

const ACTION_PLAY = 'play'
const ACTION_END = 'end'
const QUARTILES = [0.25, 0.5, 0.75]

class Permutive extends Component {
  constructor(props) {
    super(props)

    // Streaming tag
    this.lastAction = undefined
    this.videoRef = props.getVideoRef()
    this.isInitialized = false
    this.isWaiting = false
    this.currentPosition = 0
    this.sentQuartiles = []
    this.queue = []
    this.adTitle = ''
    this.adId = ''
  }

  componentDidMount() {
    if (!this.isWaiting && !this.isInitialized) {
      const { logger } = this.props
      const self = this
      this.isWaiting = true
      logger.info('Esperando al SDK (window.permutive) para inicialializar Permutive')

      waitFor(() => window.permutive)
        .then(() => {
          logger.info('Se ha detectado el SDK de Permutive')
          self.isWaiting = false
          self.init()
        })
        .catch((error) => {
          if (error) {
            logger.error(error)
          } else {
            logger.error('No se ha encotrado el SDK de Permutive (window.permutive) después de esperar 1 min')
          }
        })
    }
  }

  async getUserRating() {
    const { user, videoValues: { jekyll }, logger } = this.props
    if (user.UID) {
      const signatureAndTimestamp = await accounts(user)
      const url = `${jekyll}${user.UID}/${user.profile.pid || user.UID}`
      const options = {
        headers: {
          'Content-Type': 'application/json',
          signatureTimestamp: signatureAndTimestamp.signatureTimestamp,
          uidSignature: signatureAndTimestamp.uidSignature
        },
        method: 'GET'
      }
      try {
        const resp = await fetch(url, options)
        const body = await resp.json()
        this.rating = body.rating
      } catch (error) {
        logger.error('Can\'t access to Jekyll : ', error)
      }
    }
  }

  getContentProperties() {
    const device = new UAParser(window.navigator.userAgent).getDevice()
    const { model, vendor, type: deviceType } = device
    const browserInfo = getBrowserInfo()
    const { geoInfo, ispInfo } = this.getDataEnrichers()
    const {
        isLive, videoValues: {
        title, genre
      } = {}
    } = this.props
    const { width, height } = getScreenResolution()
    return {
      isp_info: ispInfo,
      geo_info: geoInfo,
      genre,
      type: isLive ? 'live' : 'vod',
      title,
      device: {
        model: model || UNKNOWN,
        os: browserInfo?.os?.name || UNKNOWN,
        osvers: browserInfo?.os?.version || UNKNOWN,
        screenres: `${width}x${height}`,
        type: deviceType || getDeviceType(),
        vendor: vendor || UNKNOWN
      },
      content: {
        parental: this.rating
      },
      local_time: this.getLocalTime(),
      platform: window?.location?.hostname?.replace(/^www\./i, '') ?? undefined
    }
  }

  getDataEnrichers() {
    const { logger } = this.props
    let data = {
      geoInfo: {},
      ispInfo: {}
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const permutiveData = localStorage.getItem('permutive-data-enrichers')
        const parsedData = JSON.parse(permutiveData)
        const { geo_info: geoInfo = {}, isp_info: ispInfo = {} } = parsedData?.['enricher:geoip']?.data || {}
        data = { geoInfo, ispInfo }
      }
    } catch (error) {
      logger.warn('Can\'t access to DataEnrichers: ', error)
    }

    return data
  }

  getLocalTime = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const offset = date.getTimezoneOffset()
    const offsetHours = Math.abs(Math.floor(offset / 60)).toString().padStart(2, '0')
    const offsetMinutes = (offset % 60).toString().padStart(2, '0')
    const offsetSign = offset < 0 ? '+' : '-'

    const localTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`

    return localTime
  }

  init() {
    const { logger } = this.props
    window.permutive.ready(() => {
      this.isInitialized = true
      this.flush()
      this.getUserRating()
      logger.info('Permutive is ready')
    }, 'initialised')
  }

  flush() {
    this.queue.forEach((event) => this.handleEvent(event.eventType, event.params))
    this.queue = []
  }

  notifyContentProgress() {
    const { logger, duration, isLive } = this.props
    if (this.isInitialized && this.lastAction === ACTION_PLAY && !isLive) {
      QUARTILES.forEach((progress) => {
        const quartileTime = duration * progress
        if (
          this.currentPosition >= quartileTime
          && !this.sentQuartiles.includes(progress)
        ) {
          const { local_time: localTime, ...properties } = this.getContentProperties()
          window.permutive.track('VideoProgress', { ...properties, progress })
          this.sentQuartiles.push(progress)
          logger.info(`Video content Progress: ${progress} - VideoProgress`)
        }
      })
    }
  }

  notifyAdProgress(progress) {
    const { logger } = this.props
    if (this.isInitialized) {
      const videoProperties = this.getContentProperties()
      const { local_time: localTime, ...adProperties } = {
        ...videoProperties,
        video: {
          ad_title: this.adTitle,
          ad_id: this.adId
        },
        progress
      }
      window.permutive.track('VideoProgress', adProperties)
      logger.info(`Ad content Progress: ${progress} - VideoProgress`)
    }
  }

  notifyPlay() {
    const { logger } = this.props
    if (this.isInitialized && this.lastAction !== ACTION_PLAY) {
      const values = this.getContentProperties()
      window.permutive.track('Videoview', values)
      this.lastAction = ACTION_PLAY
      logger.info('Video content Start - Videoview')
    }
  }

  notifyEnd() {
    const { logger } = this.props
    if (this.isInitialized && this.lastAction !== ACTION_END) {
      const values = this.getContentProperties()
      window.permutive.track('VideoViewComplete', values)
      this.lastAction = ACTION_END
      logger.info('Video content End - VideoViewComplete')
    }
  }

  notifyAdStart(params) {
    const { logger } = this.props
    if (this.isInitialized) {
      const { adTitle = '', adId = '' } = params || {}
      const videoProperties = this.getContentProperties()
      const adProperties = {
        ...videoProperties,
        video: {
          ad_title: adTitle,
          ad_id: adId
        }
      }
      window.permutive.track('VideoView', adProperties)
      this.adTitle = adTitle
      this.adId = adId
      logger.info('Ad content Start - VideoView')
    }
  }

  notifyAdCompleted(params) {
    const { logger } = this.props
    if (this.isInitialized) {
      const { adTitle = '', adId = '' } = params || {}
      const videoProperties = this.getContentProperties()
      const adProperties = {
        ...videoProperties,
        video: {
          ad_title: adTitle,
          ad_id: adId
        }
      }
      window.permutive.track('VideoViewComplete', adProperties)
      this.adTitle = ''
      this.adId = ''
      logger.info('Ad content End - VideoViewComplete')
    }
  }

  streamPositionCallback() {
    this.currentPosition = Math.floor(this.videoRef.currentTime)
    return this.currentPosition
  }

  handleEvent(eventType, params) {
    const { genre } = this.props
    if (this.isInitialized) {
      switch (eventType) {
        case AD_STARTED:
          this.notifyAdStart(params)
          break
        case AD_COMPLETED:
          this.notifyAdCompleted(params)
          break
        case AD_FIRST_QUARTILE:
          this.notifyAdProgress(QUARTILES[0])
          break
        case AD_MIDPOINT:
          this.notifyAdProgress(QUARTILES[1])
          break
        case AD_THIRD_QUARTILE:
          this.notifyAdProgress(QUARTILES[2])
          break
        case CONTENT_PLAYING:
          if (genre === CONTENT) {
            this.notifyPlay()
          }
          break
        case CONTENT_ENDED:
        case PLAYBACK_ENDED:
          this.notifyEnd()
          break
        case CONTENT_TIME_UPDATED:
          this.currentPosition = this.streamPositionCallback()
          this.notifyContentProgress()
          break
        default:
          break
      }
    } else {
      this.queue.push({ eventType, params })
    }
  }

  reset() {
    const { logger } = this.props
    this.isInitialized = false
    this.currentPosition = 0
    this.sentQuartiles = []
    this.adTitle = ''
    this.adId = ''
    this.rating = ''
    logger.info('Reset component - reset')
  }

  render() {
    return null
  }
}

Permutive.propTypes = {
  duration: PropTypes.number.isRequired,
  genre: PropTypes.string,
  getVideoRef: PropTypes.func.isRequired,
  isLive: PropTypes.bool,
  logger: PropTypes.shape({
    log: PropTypes.func
  }),
  videoValues: PropTypes.shape({
    title: PropTypes.string,
    genre: PropTypes.string
  })
}

Permutive.defaultProps = {
  genre: '',
  isLive: false,
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) },
  videoValues: {}
}

export default Permutive
