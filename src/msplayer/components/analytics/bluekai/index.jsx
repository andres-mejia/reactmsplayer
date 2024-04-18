import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { getBrowserInfo } from '../../../commons/userAgent'
import {
  getCookie,
  getHour,
  getScreenResolution,
  getWeekday,
  waitFor
} from '../../../commons/util'
import { genres } from '../../../commons/types'
import { adEvents, contentEvents, playerEvents } from '../../../commons/types/events'

const { ADS, CONTENT } = genres
const { AD_CLICKED, AD_SKIPPED, AD_STARTED } = adEvents
const { CONTENT_PLAYING } = contentEvents
const { SHARE } = playerEvents

class Bluekai extends Component {
  constructor(props){
    super(props)

    this.isFirstContentPlayed = false

    // Init
    this.isWaiting = false
    this.isInitialized = false
    this.queue = []
  }

  componentDidMount() {
    if (!this.isWaiting && !this.isInitialized) {
      const { logger } = this.props
      const self = this

      this.isWaiting = true

      logger.info(`Esperando al SDK (window.bk_addPageCtx && window.BKTAG) para inicialializar Bluekai`)

      waitFor( () => window.bk_addPageCtx && window.BKTAG )
      .then(() => {
        logger.info(`Se ha detectado el SDK de Bluekai`)

        self.isWaiting = false
        self.init()
      })
      .catch(() => logger.error(`No se ha encotrado el SDK de Bluekai (window.bk_addPageCtx && window.BKTAG) después de esperar 1 min. Puede haber habido algún problema en la descarga del SDK o puede que no se esté importando. (BLU001)`))
    }
  }

  reset() {
    this.isFirstContentPlayed = false

    // Init
    this.isWaiting = false
    this.isInitialized = false
    this.queue = []
  }

  init() {
    this.isInitialized = true
    this.flush()
  }

  common() {
    const { config, uid } = this.props

    window.bk_addPageCtx('Id', uid || 'null')

    window.bk_addPageCtx('origin', config.origin || document.location.hostname.replace(/^www\./i, ''))

    const browserInfo = getBrowserInfo()
    if(browserInfo) {
      const { 
        os: { name: osName, version: osVersion }, 
        browser: { name: browserName, version: browserVersion },
        device: { type, vendor, model }
      } = browserInfo
      
      window.bk_addPageCtx('OS', osName)
      window.bk_addPageCtx('OSVer', osVersion)
      window.bk_addPageCtx('browser', browserName)
      window.bk_addPageCtx('browserVer', browserVersion)
      window.bk_addPageCtx('device', type || 'computer')
      window.bk_addPageCtx('device_vendor', vendor || 'unknown')
      window.bk_addPageCtx('device_model', model || 'unknown')
    }

    const currentTime = new Date().getTime()
    const startTime = Number(getCookie('ms_session_start'))
    if(!isNaN(currentTime) && !isNaN(startTime) && currentTime >= startTime) {
      const sessionTime = currentTime - startTime
      window.bk_addPageCtx('sessionTime', Math.round( (sessionTime / 1000) / 60 ))
    }

    window.bk_addPageCtx('weekday', getWeekday())
    window.bk_addPageCtx('hour', getHour())

    const screenResolution = getScreenResolution()
    if(screenResolution) {
      window.bk_addPageCtx('screenRes', `${screenResolution.width}x${screenResolution.height}`)
    }

    if(config.category) {
      window.bk_addPageCtx('Category', config.category)
    }
    if(config.msId) {
      window.bk_addPageCtx('ms_id', config.msId)
    }
  }

  getAdWrapperAdId(params) {
    return params && params.adWrapperAdIds && params.adWrapperAdIds.length > 0 ? params.adWrapperAdIds[params.adWrapperAdIds.length-1] : params.adId
  }

  play() {
    if(window.bk_addPageCtx && window.BKTAG) {
      if (!this.isFirstContentPlayed) {
        const { config, genre, isLive, logger, siteCode, title } = this.props
        const { title: configTitle } = config

        this.common()

        const attr = {
          'Action': 'Video',
          'Title': configTitle || title,
          'Type': genre === ADS ? 'Ad' : isLive ? 'Live' : 'VOD'
        }

        for(let key in attr) {
          window.bk_addPageCtx(key, attr[key])
        }

        logger.info(`Play`, attr)

        window.BKTAG.doTag(siteCode, 4)

        this.isFirstContentPlayed = true
      }
    }
  }

  adStarted() {
    if(window.bk_addPageCtx && window.BKTAG) {
      const { config, logger, siteCode, title } = this.props
      const { title: configTitle } = config

      this.common()

      const attr = {
        'Action': 'Video',
        'Title': configTitle || title,
        'Type': 'Ad'
      }

      for(let key in attr) {
        window.bk_addPageCtx(key, attr[key])
      }

      logger.info(`Ad started`, attr)

      window.BKTAG.doTag(siteCode, 4)
    }
  }

  adClicked(params) {
    if(window.bk_addPageCtx && window.BKTAG) {
      const { config, logger, siteCode, title } = this.props
      const { title: configTitle } = config

      this.common()

      const attr = {
        'Action': 'gotoadvertiser',
        'Title': configTitle || title,
        'Type': 'Ad',
        'ad_id': this.getAdWrapperAdId(params)
      }

      for(let key in attr) {
        window.bk_addPageCtx(key, attr[key])
      }

      logger.info(`Ad clicked`, attr)

      window.BKTAG.doTag(siteCode, 4)
    }
  }

  adSkipped(params) {
    if(window.bk_addPageCtx && window.BKTAG) {
      const { config, logger, siteCode, title } = this.props
      const { title: configTitle } = config
     
      this.common()

      const attr = {
        'Action': 'skip',
        'Title': configTitle || title,
        'Type': 'Ad',
        'ad_id': this.getAdWrapperAdId(params)
      }

      for(let key in attr) {
        window.bk_addPageCtx(key, attr[key])
      }

      logger.info(`Ad skipped`, attr)

      window.BKTAG.doTag(siteCode, 4)
    }
  }

  share(media) {
    if(window.bk_addPageCtx && window.BKTAG) {
      const { config, isLive, logger, siteCode, title } = this.props
      const { title: configTitle } = config

      this.common()

      const attr = {
        'Action': 'share',
        // facebook|twitter|other
        'Media': media,
        'Title': configTitle || title,
        'Type': isLive ? 'Live' : 'VOD'
      }

      for(let key in attr) {
        window.bk_addPageCtx(key, attr[key])
      }

      logger.info(`Share`, attr)

      window.BKTAG.doTag(siteCode, 4)
    }
  }

  handleEvent(eventType, params){
    const { genre } = this.props

    if(this.isInitialized){
      switch(eventType){
        case CONTENT_PLAYING:
          if(genre === CONTENT){
            this.play()
          }
          break

        case AD_STARTED:
          this.adStarted()
          break

        case AD_CLICKED:
          this.adClicked(params)
          break

        case AD_SKIPPED:
          this.adSkipped(params)
          break

        case SHARE: {
          let media = params && params.target
          if(
            media !== 'whatsapp' &&
            media !== 'facebook' &&
            media !== 'twitter'
          ) {
            media = 'other'
          }
          this.share(media)
          break
        }
      }
    } else {
      this.queue.push({ eventType, params })
    }
  }

  flush(){
    this.queue.forEach( (event) => this.handleEvent(event.eventType, event.params) )
    this.queue = []
  }

  render(){
    return null
  }
}

Bluekai.propTypes = {
  config: PropTypes.object,
  genre: PropTypes.string,
  isLive: PropTypes.bool,
  logger: PropTypes.object,
  siteCode: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  title: PropTypes.string,
  uid: PropTypes.string
}

Bluekai.defaultProps = {
  config: {},
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default Bluekai
