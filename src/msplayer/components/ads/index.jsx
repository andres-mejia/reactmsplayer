import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { 
  getVisibilityChangeEvent, 
  isDocumentHidden, 
  mergeQueryStringParams, 
  parseQueryString, 
  replaceValuesInUrl, 
  waitFor 
} from '../../commons/util'
import { isAutoplayAllowed, isMobileAny, isMobilePhone, isIPhone } from '../../commons/userAgent'
import { adGenres, errorTypes, playerTypes } from '../../commons/types'
import { adEvents, adEventTypes } from '../../commons/types/events'
import HeaderBidding from './HeaderBidding'
import Moat from './Moat'
import ToggleBt from '../controls/controlBar/toggleBt'
import VolumeControl from '../controls/controlBar/volumeControl'
import styles from './ads.css'
import stylesAudio from '../controls/controlBar/controlBarAudio.css'
import stylesVideo from '../controls/controlBar/controlBarVideo.css'

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 360
const DEFAULT_OVERLAY_DURATION = 10000
const { AUDIO_PLAYER } = playerTypes
const TEST_TAG_URL = 'https://pubads.g.doubleclick.net/gampad/ads?env=vp&gdfp_req=1&unviewed_position_start=1&description_url=https%3A%2F%2Ftelecinco.rwd.pre.aws.tele5.int%3A8601%2F20n%2Fdirecto-rcv%2F&output=vmap&iu=%2F20370287687%2Fpruebas%2Fvideo&sz=640x480&ad_rule=1&vid=MDSVST20181113_0001&cmsid=2457003&cust_params=cf%3D%26embed%3D0%26videogaleria%3D0%26gad%3D09.0905%26amp%3Dfalse%26consent%3DBOmAaEqOo1hdpAHABBESCr-AAAArl7_____9_9______9uz_Ov_v_f__33e8__9v_l_7_-___u_-3zd4u_1vf99yfm1-7etr3tp_87ues2_Xur__79__3z3_9phP78k89r7337Ew-v-3o8LzBA&scp&npa=0&vpa=click&sdkv=h.3.347.1&osd=2&frm=0&vis=1&sdr=1&hl=en&afvsz=450x50%2C468x60%2C480x70&is_amp=0&u_so=l&adsid=ChEIgLX_7QUQlNKjnsHloqiCARJBAP5G5mju97vvtG2CfIykz3uwXqtja3e-vvSeUYcKFcJedK61YW44_zrdphNyMdrXFzkhfiuYqo81Zqvv170KoIY&jar=2019-11-4-15&sdki=44d&adk=3925761334&url=https%3A%2F%2Ftelecinco.rwd.pre.aws.tele5.int%3A8601%2F20n%2Fdirecto-rcv%2F&dlt=1572885669720&idt=41594&dt=1572885715412&cookie=ID%3D29c01186eec6f402%3AT%3D1567002662%3AS%3DALNI_MZYF1T_dTnWIA_XCHJGcLrCcpgbkw&correlator=820131579704468&scor=61344335340584&ged=ve4_td45_tt0_pd45_la45000_er383.10.539.310_vi133.0.831.667_vp100_eb24171'

class Ads extends Component {
  constructor(props) {
    super(props)

    this.adBreaksReady = []
    this.clickThroughUrl = undefined
    this.cuePoints = []
    this.isListeningVisibilityChange = false
    this.isAdDisplayContainerInitialized = false
    this.isInitialized = false
    this.isVpaid = false
    this.slotNumAdsCompleted = 0
    this.slotNumAdsError = 0
    this.slotNumAdsStarted = 0

    this.state = {
      adGenre: undefined,
      isAdBreakPlaying: false,
      isClicked: false,
      isNonLinear: undefined,
      isPaused: false,
      isMutedState: false,
      volumeState: 1,
      isCustomClickEnabled: isMobilePhone()
    }

    this.hadleAdEvent = this.hadleAdEvent.bind(this)
    this.handleAdError = this.handleAdError.bind(this)
    this.handleAdsLoaderError = this.handleAdsLoaderError.bind(this)
    this.handleAdsManagerError = this.handleAdsManagerError.bind(this)
    this.handleAdsManagerLoaded = this.handleAdsManagerLoaded.bind(this)
    this.handleContentEnded = this.handleContentEnded.bind(this)
    this.handleContentPauseRequested = this.handleContentPauseRequested.bind(this)
    this.handleContentResumeRequested = this.handleContentResumeRequested.bind(this)
    this.handleOverlayCompleted = this.handleOverlayCompleted.bind(this)
    this.handleResumeAd = this.handleResumeAd.bind(this)
    this.handleWindowResize = this.handleWindowResize.bind(this)
    this.handleOnToggleMute = this.handleOnToggleMute.bind(this)
    this.handleOnVolumeChange = this.handleOnVolumeChange.bind(this)
  }

  componentDidMount() {
    const { logger } = this.props
    logger.info('Montado el componente Ads')

    window.addEventListener('resize', this.handleWindowResize)
    this.handleWindowResize()

    if(isAutoplayAllowed()) {
      this.init()
    }
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.playedTime !== this.props.playedTime) {
      this.shouldStartAdBreak(nextProps.playedTime)
    }
  }

  shouldComponentUpdate(nextProps, nextState){
    return (
      this.props.paddingBottom !== nextProps.paddingBottom ||
      this.props.playedTime !== nextProps.playedTime ||
      this.state.isClicked !== nextState.isClicked ||
      this.state.isNonLinear !== nextState.isNonLinear ||
      this.state.isPaused !== nextState.isPaused ||
      this.state.adGenre !== nextState.adGenre ||
      this.state.isAdBreakPlaying !== nextState.isAdBreakPlaying ||
      this.state.isMutedState !== nextState.isMutedState ||
      this.state.volumeState !== nextState.volumeState
    )
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(prevProps.playedTime !== this.props.playedTime) {
      this.shouldStartAdBreak(this.props.playedTime)
    }
    if(prevProps.paddingBottom !== this.props.paddingBottom) {
      this.handleWindowResize()
    }
  }

  componentWillUnmount() {
    const { logger } = this.props
    logger.info('Se desmontará el componente Ads.')

    window.removeEventListener('resize', this.handleWindowResize)

    if(window.google){
      const { ima } = window.google
      const { AD_ERROR } = ima.AdErrorEvent.Type
      const { ADS_MANAGER_LOADED } = ima.AdsManagerLoadedEvent.Type

      if (this.adsLoader) {
        this.adsLoader.removeEventListener(ADS_MANAGER_LOADED, this.handleAdsManagerLoaded, false)
        this.adsLoader.removeEventListener(AD_ERROR, this.handleAdsLoaderError, false)

        this.adsLoader.destroy()
      }

      this.contentEnded = false

      if (this.videoContent) {
        this.videoContent.removeEventListener('ended', this.handleContentEnded)
      }

      if (this.adsManager) {
        this.removeAdsManagerListeners()

        this.adsManager.destroy()
      }

      if(this.adDisplayContainer) {
        this.adDisplayContainer.destroy()
      }
    }
  }

  getAdTagUrl() {
    const { adTagUrl } = this.props

    let url = this.requestedAdTagUrl || adTagUrl

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const ppid = window.localStorage.getItem('ppid')
        if (ppid) {
          const index = url.indexOf('ads?')
          url = `${url.substring(0, index)}ads?ppid=${ppid}&${url.substring(index + 4)}`
        }
      }
    } catch (error) {
      logger.info('Error al acceder al localStorage:', error)
    }

    return url;
  }

  handleWindowResize(){
    if(this.isInitialized){
      const { getVideoRef, paddingBottom = 0 } = this.props
      const videoRef = getVideoRef()

      try {
        window.requestAnimationFrame(()=> {
          if(videoRef && this.adsManager) {
            this.adsManager.resize(
              videoRef.clientWidth,
              videoRef.clientHeight - paddingBottom,
              window.google.ima.ViewMode.NORMAL
            )
          }
        })
      } catch(e) {}
    }
  }

  init(mustInitAdDisplayContainer = false) {
    const { onAdEvent, logger } = this.props

    if(!this.isInitialized){
      logger.info(`Esperando al SDK (window.google) para inicialializar IMA`)

      onAdEvent(adEvents.IMA_WAIT_SDK_STARTED)

      waitFor( () => (window.google) ).then(
        () => {
          logger.info(`Se ha detectado el SDK de IMA`)

          onAdEvent(adEvents.IMA_WAIT_SDK_ENDED)

          this.initIma(mustInitAdDisplayContainer)
        },
        () => this.errorFatal({ type: errorTypes.ERROR_ADS_IMA_SDK_TIMEOUT })
      )
    } else {
      logger.error(`Se está intentando inicializar el componente Ads, pero ya había sido inicializado`)
    }
  }

  initIma(mustInitAdDisplayContainer = false) {
    const { getVideoRef, onAdEvent, logger } = this.props
    const videoRef = getVideoRef()

    logger.info(`Inicializar IMA`)

    if(videoRef && this.ref) {
      onAdEvent(adEvents.IMA_INIT_STARTED)

      const { AdDisplayContainer, ImaSdkSettings, settings } = window.google.ima
      const { disableCustomPlaybackForIOS10Plus } = this.props
      const { isCustomClickEnabled } = this.state

      settings.setLocale('es')
      settings.setVpaidMode(ImaSdkSettings.VpaidMode.ENABLED)
      settings.setDisableCustomPlaybackForIOS10Plus(disableCustomPlaybackForIOS10Plus)
      settings.setFeatureFlags({ enableOmidBeta: true });
      // settings.setDisableFlashAds(false)

      logger.info('IMA settings', {
        locale: 'es',
        vpaidMode: ImaSdkSettings.VpaidMode.ENABLED,
        disableCustomPlaybackForIOS10Plus
      })
      logger.info(`Crear AdDisplayContainer`)

      this.videoContent = videoRef
      
      this.adDisplayContainer = new AdDisplayContainer(
        this.ref,
        this.videoContent,
        isCustomClickEnabled ? this.customClickInstance : null
      ) 

      if(mustInitAdDisplayContainer) {
        this.initAdDisplayContainer()
      }

      this.isInitialized = true

      onAdEvent(adEvents.IMA_INIT_ENDED)

      if(this.requestAdsCalled || this.startAdsCalled){
        this.requestAds()
      }

    } else if(this.startAdsCalled) {
      this.errorFatal({ type: errorTypes.ERROR_ADS_VIDEO_INSTANCE_NOT_FOUND })
    }
  }

  initAdDisplayContainer() {
    const { logger } = this.props

    if(!this.adDisplayContainer) {
      logger.warn(`Se ha pedido inicializar AdDisplayContainer pero no existe la instancia, por tanto, se cancela la acción`)
      return
    }

    logger.info(`Inicializar AdDisplayContainer`)

    // Must be done as the result of a user action on mobile
    this.adDisplayContainer.initialize()

    this.isAdDisplayContainerInitialized = true
  }

  initAdsLoader(adDisplayContainer) {
    const { ima } = window.google
    const { AdsLoader } = ima
    const { AD_ERROR } = ima.AdErrorEvent.Type
    const { ADS_MANAGER_LOADED } = ima.AdsManagerLoadedEvent.Type

    const { isCustomAdBreakEnabled, onAdEvent, logger } = this.props

    onAdEvent(adEvents.IMA_INIT_ADS_LOADER_STARTED)

    logger.info(`Crear AdsLoader`)

    this.adsLoader = new AdsLoader(adDisplayContainer)

    if(isCustomAdBreakEnabled) {
      logger.info(`Activar control manual de los cortes de publicidad`)

      // https://developers.google.com/interactive-media-ads/docs/sdks/html5/ad-rules#manualAdBreaks
      this.adsLoader.getSettings().setAutoPlayAdBreaks(false)
    }

    this.adsLoader.addEventListener(ADS_MANAGER_LOADED, this.handleAdsManagerLoaded, false)
    this.adsLoader.addEventListener(AD_ERROR, this.handleAdsLoaderError, false)

    onAdEvent(adEvents.IMA_INIT_ADS_LOADER_ENDED)

    return this.adsLoader
  }

  requestAds(adTagUrl = this.getAdTagUrl()) {
    const { logger } = this.props

    this.requestAdsCalled = true
    this.requestedAdTagUrl = adTagUrl

    if(!this.isInitialized) {
      logger.warn(`Se pide recuperar los anuncios pero todavía no se ha inicializado IMA para poder hacerlo, por tanto, se cancela la petición`)

      return
    }

    if(adTagUrl) {
      const { headerBidding, isLive, isLongForm, isHeaderBiddingEnabled, onAdEvent } = this.props
      const { adGenre } = this.state

      const reqAds = (url) => {
        const videoRef = this.props.getVideoRef()
        const { AdsRequest } = window.google.ima
        const { enablePreloading, isAutoplay, isConsented } = this.props

        onAdEvent(adEvents.HEADER_BIDDING_FETCH_ENDED)
        onAdEvent(adEvents.IMA_REQUEST_ADS_STARTED)

        let ppid
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            ppid = window.localStorage.getItem('ppid')
            const replacements = {}
            replacements.puid = window.localStorage.getItem('permutive-id')
            replacements.ptime = Date.now().toString()
            replacements.prmtvvid = window?.permutive?.config?.viewId
            replacements.prmtvwid = window?.permutive?.config?.workspaceId
            replacements.taxonomy = window?.permutive?.context?.watson?.taxonomy
            const permutiveArray = JSON.parse(window.localStorage.getItem('_pdfps'))
            replacements.permutive = Array.isArray(permutiveArray) ? permutiveArray.join(',') : null
            url = replaceValuesInUrl(url, replacements)
          }
        } catch (error) {
          logger.info('Error al acceder al localStorage:', error)
        }

        const toMerge = {
          npa: isConsented ? '0' : '1',
        }

        if (ppid){
          toMerge.ppid = ppid
        }

        if(typeof window !== 'undefined' && window.videoEmbedConsent && window.videoEmbedConsent.consentString) {
          toMerge.gdpr = '1',
          toMerge.gdpr_consent = window.videoEmbedConsent.consentString
        }

        url = mergeQueryStringParams(url, toMerge)

        const parsed = new URL(url)
        const preCustParams = parsed.searchParams.get("cust_params")
        parsed.searchParams.set("cust_params",
        preCustParams && `${preCustParams}&tad=${isConsented ? '0' : '1'}`)

        let adsRequest = new AdsRequest()
        adsRequest.adTagUrl = parsed.toString()
        adsRequest.linearAdSlotWidth = videoRef ? videoRef.clientWidth : DEFAULT_WIDTH
        adsRequest.linearAdSlotHeight = videoRef ? videoRef.clientHeight : DEFAULT_HEIGHT
        adsRequest.nonLinearAdSlotWidth = videoRef ? videoRef.clientWidth : DEFAULT_WIDTH
        adsRequest.nonLinearAdSlotHeight = 150

        // Habilitar OMID Access Mode en IMA SDK
        // omidVerificationVendor
        // https://jira.mediaset.es/browse/PLAYER-1000
        adsRequest.omidAccessModeRules = {}
        adsRequest.omidAccessModeRules[window.google.ima.OmidVerificationVendor.MOAT] = window.google.ima.OmidAccessMode.FULL
        adsRequest.omidAccessModeRules[window.google.ima.OmidVerificationVendor.OTHER] = window.google.ima.OmidAccessMode.FULL
        adsRequest.omidAccessModeRules[window.google.ima.OmidVerificationVendor.DOUBLEVERIFY] = window.google.ima.OmidAccessMode.FULL
        adsRequest.omidAccessModeRules[window.google.ima.OmidVerificationVendor.INTEGRAL_AD_SCIENCE] = window.google.ima.OmidAccessMode.FULL
        adsRequest.omidAccessModeRules[window.google.ima.OmidVerificationVendor.PIXELATE] = window.google.ima.OmidAccessMode.FULL
        adsRequest.omidAccessModeRules[window.google.ima.OmidVerificationVendor.NIELSEN] = window.google.ima.OmidAccessMode.FULL
        adsRequest.omidAccessModeRules[window.google.ima.OmidVerificationVendor.MEETRICS] = window.google.ima.OmidAccessMode.FULL
        adsRequest.omidAccessModeRules[window.google.ima.OmidVerificationVendor.GOOGLE] = window.google.ima.OmidAccessMode.FULL

        adsRequest.setAdWillAutoPlay(isAutoplay || enablePreloading)

        if(!this.adsLoader) {
          this.initAdsLoader(this.adDisplayContainer)
        }

        logger.info(`Recuperar anuncios`, adsRequest)

        this.adsLoader.requestAds(adsRequest)
      }

      if(isHeaderBiddingEnabled) {
        const domain = document.location.hostname
        const adTagVars = parseQueryString(adTagUrl)
        const iu = adTagVars && adTagVars.iu
        const options = headerBidding && headerBidding.sibbo && headerBidding.sibbo.options

        let apstagVideoSlots = []

        if(adGenre === adGenres.MID_ROLL) {
          apstagVideoSlots = [{
            slotID: 'midroll',
            mediaType: 'video'
          }]

        } else if(isLive) {
          apstagVideoSlots = [{
            slotID: 'preroll',
            mediaType: 'video'
          }]

        } else if(isLongForm){
          apstagVideoSlots = [{
            slotID: 'preroll',
            mediaType: 'video'
          }, {
            slotID: 'midroll',
            mediaType: 'video'
          }, {
            slotID: 'postroll',
            mediaType: 'video'
          }]

        } else {
          apstagVideoSlots = [{
            slotID: 'preroll',
            mediaType: 'video'
          }, {
            slotID: 'postroll',
            mediaType: 'video'
          }]
        }

        onAdEvent(adEvents.HEADER_BIDDING_FETCH_STARTED)

        logger.info(`Pedir bids`, apstagVideoSlots)
 
        HeaderBidding.getBids(apstagVideoSlots, domain, iu, options)
        .then((encodedVideoTargeting) => {
          logger.info(`Bids recuperados: '${encodedVideoTargeting}'`)
          const decodedVideoTargeting = decodeURIComponent(encodedVideoTargeting)
          const parsed = new URL(adTagUrl)

          const preCustParams = parsed.searchParams.get("cust_params")
          parsed.searchParams.set("cust_params",
          preCustParams
          ?  `${preCustParams}&${decodedVideoTargeting}`
          : decodedVideoTargeting)
          adTagUrl = parsed.toString()
          reqAds(adTagUrl)
        })
        .catch((error) => {
          logger.warn(`Error al recuperar bids: ${error && error.message}`)

          reqAds(adTagUrl)
        })
        
      } else {
        reqAds(adTagUrl)
      }

    } else {
      this.errorFatal({ 
        type: errorTypes.ERROR_AD_TAG_URL_NOT_FOUND
      })
    }
  }

  handleAdsManagerLoaded(adsManagerLoadedEvent) {
    const { AdsRenderingSettings, UiElements, ViewMode } = window.google.ima
    const {
      enablePreloading,
      isLive,
      isMoatConsented,
      moat,
      onAdEvent,
      logger,
      useStyledNonLinearAds
    } = this.props
    const { adGenre } = this.state

    onAdEvent(adEvents.IMA_REQUEST_ADS_ENDED)

    logger.info(`AdsManager loaded`)

    if(!this.adsManager) {
      let adsRenderingSettings = new AdsRenderingSettings()
      adsRenderingSettings.enablePreloading = enablePreloading
      adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = false
      // https://jira.mediaset.es/browse/PLAYER-449
      if(isLive && adGenre === adGenres.MID_ROLL) {
        adsRenderingSettings.uiElements = []
      } else {
        adsRenderingSettings.uiElements = [
          UiElements.COUNTDOWN,
          UiElements.AD_ATTRIBUTION
        ]
      }
      
      adsRenderingSettings.useStyledNonLinearAds = useStyledNonLinearAds

      logger.info(`Recuperar AdsManager`)
      logger.info(`AdsRendering settings`, adsRenderingSettings)

      this.adsManager = adsManagerLoadedEvent.getAdsManager(
        this.videoContent,
        adsRenderingSettings
      )

      onAdEvent(adEvents.IMA_ADS_MANAGER_CHANGED, { adsManager: this.adsManager })

      const cuePoints = this.adsManager.getCuePoints()

      if(cuePoints && cuePoints.length) {
        this.cuePoints = cuePoints.filter( (position) => position > 0 ).sort( (a, b) => a - b )
        logger.info(`Cue-points recuperados de IMA`, cuePoints)
      } else {
        logger.info(`IMA no devuelve cue-points`)
      }

      if(moat && moat.isEnabled && moat.partnerCode && isMoatConsented) {
        Moat.initMoat(this.adsManager, {
          partnerCode: moat.partnerCode,
          viewMode: ViewMode.NORMAL
        }, this.ref, logger)
      }
  
      this.addAdsManagerListeners()
    }

    if(this.startAdsCalled){
      this.startAds()
    }
  }

  postrollAvaliable() {
    if(!this.adsManager) return false
    const cuePoints = this.adsManager.getCuePoints()

    return cuePoints && cuePoints.length ? cuePoints.indexOf(-1) !== -1 : false
  }

  startAds(adTagUrl) {
    const { getVideoRef, onAdEvent, logger } = this.props

    onAdEvent(adEvents.IMA_START_ADS_REQUESTED)

    this.startAdsCalled = true

    if(!this.isInitialized) {
      logger.warn(`Se pide iniciar anuncios pero todavía no se ha inicializado IMA para poder hacerlo, por tanto, se cancela la acción`)

      return
    }

    logger.info(`Se pide iniciar anuncios`)

    if(!this.isAdDisplayContainerInitialized) {
      logger.info(`No se ha inicializado AdDisplayContainer`)

      this.initAdDisplayContainer()
    }

    if(!this.adsManager || adTagUrl){
      if(!this.adsManager) logger.info(`No existe AdsManager. Se recogerá del evento AdsManagerLoaded que lanza AdsLoader después de llamar a AdsLoader.requestAds`)
      if(adTagUrl) logger.info(`Se pide recuperar anuncios con el ad-tag: ${adTagUrl}`)

      this.requestAds(adTagUrl)
      return
    }

    const videoRef = getVideoRef()

    onAdEvent(adEvents.IMA_START_ADS_STARTED)

    try {
      logger.info(`Inicializar AdsManager`)

      // Initialize the ads manager. Ad rules playlist will start at this time.
      this.adsManager.init(
        videoRef ? videoRef.clientWidth : DEFAULT_WIDTH,
        videoRef ? videoRef.clientHeight : DEFAULT_HEIGHT,
        window.google.ima.ViewMode.NORMAL
      )

      logger.info(`Iniciar anuncios`)

      // Call start to show ads. Single video and overlay ads will
      // start at this time; this call will be ignored for ad rules, as ad rules
      // ads start when the adsManager is initialized.
      this.adsManager.start()

    } catch (error) {
      // An error may be thrown if there was a problem with the VAST response.
      this.errorFatal({
        type: errorTypes.ERROR_ADS_START,
        info: {
          message: error.message
        }
      })
    }
  }

  freshStartAds(adTagUrl) {
    const { logger } = this.props
    logger.info(`Reiniciar anuncios con el ad-tag: ${adTagUrl}`)

    if (this.adsManager) {
      this.removeAdsManagerListeners()
      this.adsManager.destroy()
      this.adsManager = null
    }

    this.setState({
      adGenre: adGenres.MID_ROLL,
      isClicked: false,
      isPaused: false
    }, () => this.startAds(adTagUrl))
  }

  shouldStartAdBreak(playedTime = this.props.playedTime) {
    const { isCustomAdBreakEnabled, isLive, logger } = this.props

    if(!isLive && isCustomAdBreakEnabled) {
      if(this.adBreaksReady.length && playedTime >= this.adBreaksReady[0].adBreakTime) {
        logger.info(`Iniciar bloque de anuncios manual en el cue-point '${this.adBreaksReady[0].adBreakTime}' después de reproducir ${playedTime} segundos de contenido`)

        this.adBreaksReady.shift()

        this.adsManager.start()

      } else if(this.contentEnded) {
        logger.info(`Iniciar bloque de post-rolls manual`)

        this.adsManager.start()
      }
    }
  }

  hadleAdEvent(adEvent) {
    // v. https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdEvent.Type

    const event = window.google.ima.AdEvent.Type

    const { onAdEvent, logger } = this.props
    const { adGenre, isCustomClickEnabled, isMutedState } = this.state

    const ad = adEvent.getAd()
    const adData = adEvent.getAdData()

    if(adEvent.type !== event.AD_PROGRESS) {
      logger.info(`AdEvent.${adEvent.type}`, adData)
    }

    switch (adEvent.type) {
      // For non-auto ad breaks, listen for ad break ready
      case event.AD_BREAK_READY: {
        // Once we're ready to play ads. To skip this ad break, simply return
        // from this handler without calling adsManager.start()
        if(adData && adData.adBreakTime) {
          this.adBreaksReady.push({ ...adData })
          this.adBreaksReady.sort( (a, b) => a.adBreakTime - b.adBreakTime )
        }
        this.shouldStartAdBreak()
        break
      }

      // Fired when a non-fatal error is encountered. The user need not take any action since the SDK will continue with the same or next ad playback depending on the error situation.
      case event.LOG: {
        if(adData && adData['adError']) {
          onAdEvent(adEvents.AD_ERROR, {
            code: adData['adError'].getErrorCode(),
            message: adData['adError'].getMessage(),
            stage: 'ads',
            type: adData['adError'].getType(),
            vastErrorCode: adData['adError'].getVastErrorCode()
          })
          logger.warn(`(${adData['adError'].getType()}:${adData['adError'].getErrorCode()}) ${adData['adError'].getMessage()}`)
        }
        break
      }

      // Fired when ad data is available.
      case event.LOADED: {
        const isNonLinear = ad.isLinear() === false

        this.adsManager.setVolume(isMutedState === true ? 0 : this.adsManager.getVolume())
        this.setState({ isMutedState, volumeState: isMutedState === true ? 0 : this.adsManager.getVolume() })

        if(isDocumentHidden() && this.isListeningVisibilityChange) {
          this.adsManager.setVolume(0)
          this.setState({ isMutedState: true, volumeState: 0 })
        }

        this.clickThroughUrl = adData && adData.clickThroughUrl
        this.isVpaid = adData && adData.apiFramework && typeof adData.apiFramework === 'string' ? /vpaid/i.test(adData.apiFramework) : false

        this.setState({
          isClicked: false,
          isNonLinear
        }, () => this.handleWindowResize() )

        onAdEvent(adEvents.AD_LOADED, {
          adDuration: ad.getDuration(),
          adTitle: ad.getTitle()
        })

        if(isNonLinear) {
          const duration = parseInt(ad.getMinSuggestedDuration())
          window.setTimeout( this.handleOverlayCompleted, !isNaN(duration) && duration > 0 ? duration * 1000 : DEFAULT_OVERLAY_DURATION  )
        }
        break
      }

      // Fired when the ad starts playing.
      case event.STARTED: {
        const adPodInfo = ad ? ad.getAdPodInfo() : null

        this.slotNumAdsStarted++

        const isCustomClickTrackingUsed = this.adsManager.isCustomClickTrackingUsed()

        logger.info(`isCustomClickTrackingUsed: ${isCustomClickTrackingUsed}`)

        this.setState({
          isClicked: false,
          isCustomClickEnabled: isCustomClickTrackingUsed
        })

        onAdEvent(adEvents.AD_STARTED, {
          adAdvertiserName: ad.getAdvertiserName(),
          adApiFramework: ad.getApiFramework(),
          adCreativeId: ad.getCreativeId(),
          adContentType: ad.getContentType(),
          adDuration: ad.getDuration(),
          adGenre,
          adId: ad.getAdId(),
          adMediaBitrate: ad.getVastMediaBitrate(),
          adMediaHeight: ad.getVastMediaHeight(),
          adMediaUrl: ad.getMediaUrl(),
          adMediaWidth: ad.getVastMediaWidth(),
          adPosition: adPodInfo && adPodInfo.getAdPosition(),
          adRemainingTimeCallback: this.adsManager ? () => this.adsManager.getRemainingTime() : null,
          adSrc: ad.getMediaUrl(),
          adSystem: ad.getAdSystem(),
          adTitle: ad.getTitle(),
          adWrapperAdIds: ad.getWrapperAdIds(),
          adWrapperAdSystems: ad.getWrapperAdSystems(),
          adWrapperCreativeIds: ad.getWrapperCreativeIds()
        })
        break
      }

      // Fired when the ad playhead crosses first quartile.
      case event.FIRST_QUARTILE:
        onAdEvent(adEvents.AD_FIRST_QUARTILE)
        break

      // Fired when the ad playhead crosses midpoint.
      case event.MIDPOINT:
        onAdEvent(adEvents.AD_MIDPOINT)
        break

      // Fired when the ad playhead crosses third quartile.
      case event.THIRD_QUARTILE:
        onAdEvent(adEvents.AD_THIRD_QUARTILE)
        break

      // Fired when the ad completes playing.
      case event.COMPLETE:
        this.slotNumAdsCompleted++

        onAdEvent(adEvents.AD_COMPLETED)

        this.handleOverlayCompleted()
        break

      // Fired when the ad is paused.
      case event.PAUSED:
        this.setState({
          isPaused: true
        })
        onAdEvent(adEvents.AD_PAUSED)
        break
      // Fired when the ad is resumed.
      case event.RESUMED:
        this.setState({
          isClicked: false,
          isPaused: false
        })
        onAdEvent(adEvents.AD_RESUMED, {
          adDuration: ad.getDuration()
        })
        break

      // Fired when the ad is skipped by the user.
      case event.SKIPPED:
        onAdEvent(adEvents.AD_SKIPPED, {
          adId: ad.getAdId(),
          adWrapperAdIds: ad.getWrapperAdIds()
        })
        this.handleOverlayCompleted()
        break

      // Fired when the ad is closed by the user.
      case event.USER_CLOSE:
        this.handleOverlayCompleted()
        break

      // Fired when the ad is clicked.
      case event.CLICK: {
        if(isCustomClickEnabled) {
          if (this.clickThroughUrl && !this.isVpaid) {
            logger.info(`Lanzar click-through manualmente`)

            window.open(this.clickThroughUrl, '_blank')
          }
        }

        this.setState({
          isClicked: true
        })

        if(isMobileAny()) {
          this.adsManager.pause()
        } else {
          const visibilityChangeEvent = getVisibilityChangeEvent()
          if(visibilityChangeEvent) {
            const self = this
            this.adsManager.setVolume(0)
            this.isListeningVisibilityChange = true
            document.addEventListener(visibilityChangeEvent, function onVisibilityChange() {
              if(self.adsManager) {
                if(!isDocumentHidden()) {
                  document.removeEventListener(visibilityChangeEvent, onVisibilityChange)
                  self.adsManager.setVolume(1)
                  self.isListeningVisibilityChange = false
                }
              } else {
                document.removeEventListener(visibilityChangeEvent, onVisibilityChange)
              }
            })
          }
        }

        onAdEvent(adEvents.AD_CLICKED, {
          adId: ad.getAdId(),
          adWrapperAdIds: ad.getWrapperAdIds()
        })
        break
      }

      // Fired when the ads manager is done playing all the ads.
      case event.ALL_ADS_COMPLETED:
        this.allAdsCompleted = true
        onAdEvent(adEvents.ALL_ADS_COMPLETED)

        // Si todos los anuncios dan error no fatal (event.LOG), no se emite event.CONTENT_RESUME_REQUESTED
        if(this.contentEnded) {
          this.handleContentResumeRequested()
        }

        this.handleOverlayCompleted()
        break

      case event.AD_BUFFERING:
        onAdEvent(adEvents.AD_BUFFERING)
        break

      case event.AD_PROGRESS:
        onAdEvent(adEvents.AD_PROGRESS)
        break

    }
  }

  handleOverlayCompleted() {
    const { onAdEvent, logger } = this.props
    const { isNonLinear } = this.state

    if(isNonLinear) {
      logger.info(`Overlay completed`)

      this.setState({
        isNonLinear: null
      }, () => {
        if(this.adsManager) {
          this.adsManager.stop()
        }
        this.handleWindowResize()

        onAdEvent(adEvents.OVERLAY_ENDED)
      })
    }
  }

  handleResumeAd() {
    const { logger } = this.props
    const { isPaused } = this.state

    if (isPaused) {
      logger.info(`Resume ad`)
      this.adsManager.resume()
    } else {
      logger.info(`Pause ad`)
      this.adsManager.pause()
    }
  }

  // Fired when content should be paused. This usually happens right before an ad is about to cover the content.
  handleContentPauseRequested(adEvent) {
    const { onAdEvent, logger } = this.props
    const { adGenre } = this.state
    let { currentTime } = this.props

    logger.info(`Se solicita pausar el contenido para reproducir un bloque de publicidad`)

    this.slotNumAdsCompleted = 0
    this.slotNumAdsError = 0
    this.slotNumAdsStarted = 0

    if(this.videoContent) {
      this.videoContent.removeEventListener('ended', this.handleContentEnded)
    }

    // Ajustar currentTime
    // if (Math.floor(currentTime) > 0) {
    //   currentTime = Math.floor(currentTime / 8) * 8
    // }

    const next = () => {
      this.isListeningVisibilityChange = false

      const { adGenre } = this.state
      const ad = adEvent && adEvent.getAd()
      const adPodInfo = ad && ad.getAdPodInfo()

      onAdEvent(adEvents.CONTENT_PAUSE_REQUESTED, { 
        adGenre 
      })
      onAdEvent(adEvents.IMA_START_ADS_ENDED)
      onAdEvent(adEvents.AD_SLOT_STARTED, {
        adGenre,
        adPodDuration: adPodInfo && adPodInfo.getMaxDuration(),
        adPodIndex: adPodInfo && adPodInfo.getPodIndex()
      })
    }

    if (adGenre !== adGenres.POST_ROLL) {
      if (currentTime > 0) {
        this.setState({
          isAdBreakPlaying: true,
          adGenre: adGenres.MID_ROLL
        }, next)
      } else {
        this.setState({
          isAdBreakPlaying: true,
          adGenre: adGenres.PRE_ROLL
        }, next)
      }
    } else {
      this.setState({
        isAdBreakPlaying: true,
        adGenre: adGenres.POST_ROLL
      }, next)
    }
  }

  discardAdBreak() {
    const { logger, onAdEvent } = this.props
    const { adGenre } = this.state

    logger.info(`Discard ad break`)

    this.setState({
      isClicked: false,
      isPaused: false
    })

    if(this.adsManager) {
      this.adsManager.stop()
      this.adsManager.discardAdBreak()
    }

    onAdEvent(adEvents.AD_BREAK_DISCARDED, { adGenre })
  }

  // Fired when content should be resumed. This usually happens when an ad finishes or collapses.
  handleContentResumeRequested(adEvent) {
    const { onAdEvent } = this.props
    const { adGenre } = this.state

    this.setState({
      isAdBreakPlaying: false,
      isCustomClickEnabled: false
    })

    onAdEvent(adEvents.AD_SLOT_COMPLETED, { adGenre })

    this.resumeContent()
  }

  resumeContent(){
    const { logger, onAdEvent } = this.props
    const { adGenre } = this.state

    logger.info(`Se devuelve el control al player para que reanude el contenido`)

    onAdEvent(adEvents.AD_SLOT_SUMMARY, {
      adGenre,
      adsCompleted: this.slotNumAdsCompleted,
      adsError: this.slotNumAdsError,
      adsStarted: this.slotNumAdsStarted
    })

    if (!this.contentEnded && this.videoContent) {
      this.videoContent.addEventListener('ended', this.handleContentEnded)
    }

    onAdEvent(adEvents.CONTENT_RESUME_REQUESTED, { adGenre })
  }

  handleContentEnded() {
    const { onAdEvent } = this.props

    if (this.videoContent) {
      this.videoContent.removeEventListener('ended', this.handleContentEnded)
    }

    this.contentEnded = true

    if(!this.allAdsCompleted){
      this.setState({
        adGenre: adGenres.POST_ROLL
      }, () => this.adsLoader.contentComplete())
    } else {
      onAdEvent(adEvents.CONTENT_RESUME_REQUESTED)
    }
  }

  handleAdError(adErrorEvent, info = {}) {
    const { ErrorCode: code } = window.google.ima.AdError
    const adError = adErrorEvent.getError()
    const errorInfo = {
      ...info,
      code: adError.getErrorCode(),
      message: adError.getMessage(),
      type: adError.getType(),
      vastErrorCode: adError.getVastErrorCode()
    }

    let fatal = false

    this.slotNumAdsError++

    // v. https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdError

    switch(adError.getErrorCode()){
      // There was a problem requesting ads from the server. IMA Error code 1012
      case code.ADS_REQUEST_NETWORK_ERROR:

      // There was a problem requesting ads from the server. IMA Error code 1005
      case code.FAILED_TO_REQUEST_ADS:

      // The ad tag url specified was invalid. It needs to be properly encoded. IMA Error code 1013
      case code.INVALID_AD_TAG:

      // Invalid arguments were provided to SDK methods. IMA Error code 1101
      case code.INVALID_ARGUMENTS:

        fatal = true
        break

      // There was an error with asset fallback. IMA Error code 1021
      case code.ASSET_FALLBACK_FAILED:

      // The browser prevented playback initiated without user interaction. IMA Error code 1205
      case code.AUTOPLAY_DISALLOWED:

      // A companion ad failed to load or render. VAST error code 603
      case code.COMPANION_AD_LOADING_FAILED:

      // Unable to display one or more required companions. The master ad is discarded since the required companions could not be displayed. VAST error code 602
      case code.COMPANION_REQUIRED_ERROR:

      // Unable to display NonLinear ad because creative dimensions do not align with creative display area (i.e. creative dimension too large). VAST error code 501
      case code.NONLINEAR_DIMENSIONS_ERROR:

      // An overlay ad failed to load. VAST error code 502
      case code.OVERLAY_AD_LOADING_FAILED:

      // An overlay ad failed to render. VAST error code 500
      case code.OVERLAY_AD_PLAYING_FAILED:

      // There was an error with stream initialization during server side ad insertion. IMA Error code 1020
      case code.STREAM_INITIALIZATION_FAILED:

      // The ad response was not understood and cannot be parsed. IMA Error code 1010
      case code.UNKNOWN_AD_RESPONSE:

      // An unexpected error occurred and the cause is not known. Refer to the inner error for more information. VAST error code 900
      case code.UNKNOWN_ERROR:

      // Locale specified for the SDK is not supported. IMA Error code 1011
      case code.UNSUPPORTED_LOCALE:

      // No assets were found in the VAST ad response. IMA Error code 1007
      case code.VAST_ASSET_NOT_FOUND:

      // Empty VAST response. IMA Error code 1009
      case code.VAST_EMPTY_RESPONSE:

      // Assets were found in the VAST ad response for linear ad, but none of them matched the video player's capabilities. VAST error code 403
      case code.VAST_LINEAR_ASSET_MISMATCH:

      // The VAST URI provided, or a VAST URI provided in a subsequent wrapper element, was either unavailable or reached a timeout, as defined by the video player. The timeout is 5 seconds for initial VAST requests and each subsequent wrapper. VAST error code 301
      case code.VAST_LOAD_TIMEOUT:

      // The ad response was not recognized as a valid VAST ad. VAST error code 100
      case code.VAST_MALFORMED_RESPONSE:

      // Failed to load media assets from a VAST response. The default timeout for media loading is 8 seconds. VAST error code 402
      case code.VAST_MEDIA_LOAD_TIMEOUT:

      // No Ads VAST response after one or more wrappers. VAST error code 303
      case code.VAST_NO_ADS_AFTER_WRAPPER:

      // Assets were found in the VAST ad response for nonlinear ad, but none of them matched the video player's capabilities. VAST error code 503
      case code.VAST_NONLINEAR_ASSET_MISMATCH:

      // Problem displaying MediaFile. Currently used if video playback is stopped due to poor playback quality. VAST error code 405
      case code.VAST_PROBLEM_DISPLAYING_MEDIA_FILE:

      // VAST schema validation error. VAST error code 101
      case code.VAST_SCHEMA_VALIDATION_ERROR:

      // The maximum number of VAST wrapper redirects has been reached. VAST error code 302
      case code.VAST_TOO_MANY_REDIRECTS:

      // Trafficking error. Video player received an ad type that it was not expecting and/or cannot display. VAST error code 200
      case code.VAST_TRAFFICKING_ERROR:

      // VAST duration is different from the actual media file duration. VAST error code 202
      case code.VAST_UNEXPECTED_DURATION_ERROR:

      // Ad linearity is different from what the video player is expecting. VAST error code 201
      case code.VAST_UNEXPECTED_LINEARITY:

      // The ad response contained an unsupported VAST version. VAST error code 102
      case code.VAST_UNSUPPORTED_VERSION:

      // General VAST wrapper error. VAST error code 300
      case code.VAST_WRAPPER_ERROR:

      // There was an error playing the video ad. VAST error code 400
      case code.VIDEO_PLAY_ERROR:

      // A VPAID error occurred. Refer to the inner error for more information. VAST error code 901
      case code.VPAID_ERROR:

        fatal = false
        break
    }

    if(fatal) {
      this.errorFatal({ ...errorInfo, fatal: true })
    } else {
      this.error(errorInfo)
    }
  }

  handleAdsLoaderError(e) {
    this.handleAdError(e, { stage: 'init' })
  }

  handleAdsManagerError(e) {
    this.handleAdError(e, { stage: 'ads' })
  }

  error(errorInfo){
    const { logger, onAdEvent } = this.props

    logger.error(`Se ha detectado un error no fatal. Se descartará el bloque de publicidad en curso y se devolverá el control al player para que reanude el contenido`, errorInfo)

    onAdEvent(adEvents.AD_ERROR, { ...errorInfo })

    this.discardAdBreak()
    this.resumeContent()
  }

  errorFatal(errorInfo) {
    const { logger, onErrorFatal } = this.props

    this.error(errorInfo)

    logger.error(`Se ha detectado un error fatal. Se destruirá y desactivará el módulo de publicidad`, errorInfo)

    if (this.adsManager) {
      this.adsManager.destroy()
    }
    onErrorFatal()
  }

  addAdsManagerListeners() {
    const event = window.google.ima.AdEvent.Type
    const { AD_ERROR } = window.google.ima.AdErrorEvent.Type

    this.adsManager.addEventListener(event.CONTENT_PAUSE_REQUESTED, this.handleContentPauseRequested)
    this.adsManager.addEventListener(event.CONTENT_RESUME_REQUESTED, this.handleContentResumeRequested)

    for(let key in event) {
      for(let i = 0; i < adEventTypes.length; ++i) {
        if(event[key] === adEventTypes[i]) {
          this.adsManager.addEventListener(event[key], this.hadleAdEvent)
        }
      }
    }

    this.adsManager.addEventListener(AD_ERROR, this.handleAdsManagerError)
  }

  removeAdsManagerListeners() {
    const event = window.google.ima.AdEvent.Type
    const { AD_ERROR } = window.google.ima.AdErrorEvent.Type

    this.adsManager.removeEventListener(event.CONTENT_PAUSE_REQUESTED, this.handleContentPauseRequested)
    this.adsManager.removeEventListener(event.CONTENT_RESUME_REQUESTED, this.handleContentResumeRequested)

    for(let key in event) {
      for(let i = 0; i < adEventTypes.length; ++i) {
        if(event[key] === adEventTypes[i]) {
          this.adsManager.removeEventListener(event[key], this.hadleAdEvent)
        }   
      }
    }

    this.adsManager.removeEventListener(AD_ERROR, this.handleAdsManagerError)
  }

  saveRef(ref, name){
    if(ref){
      this[name || 'ref'] = ref
    }
  }

  getRef() {
    return this.ref
  }

  handleOnToggleMute() {
    const { isMutedState, volumeState } = this.state
    const isMuted = !isMutedState
    if (this.adsManager) {
      this.adsManager.setVolume(isMuted ? 0 : volumeState)
      this.setState({ isMutedState: isMuted })
    }
  }

  handleOnVolumeChange(newVolume) {
    if (this.adsManager) {
      this.adsManager.setVolume(newVolume)
      this.setState({ volumeState: newVolume })
    }
  }

  renderVolumeBar() {
    const {
      isVolumeEnabled,
      playerType
    } = this.props
    const { isMutedState, volumeState } = this.state

    /*
    if (isMobileAny() || isVolumeEnabled === false) {
      return null
    } */
    return (
      <VolumeControl
        isMuted={ isMutedState }
        playerType={ playerType }
        volume={ volumeState }
        onToggleMute={ () => this.handleOnToggleMute() }
        onVolumeChange={ (newVolume) => this.handleOnVolumeChange(newVolume) }
      />
    )
  }

  renderPlayButton() {
    const { isPaused = false } = this.state

    return (
      <ToggleBt
        description={ !isPaused ? 'playerPauseButton' : 'playerPlayButton' }
        state={ !isPaused }
        iconNameInitial={ 'player_icon_play' }
        iconNameToggled={ 'player_icon_pause' }
        onToggle={ () => this.handleResumeAd() }
      />
    )
  }

  render() {
    const { isLive, playerType, platform } = this.props
    const { 
      adGenre, 
      isAdBreakPlaying, 
      isClicked, 
      isNonLinear, 
      isPaused, 
      isCustomClickEnabled 
    } = this.state
    const allowedIphoneLandscape = platform === 'mtweb' && isIPhone() && !isLive
    const stylesControlbar = playerType === AUDIO_PLAYER ? stylesAudio : stylesVideo
    const playButtonTag = this.renderPlayButton()
    const volumeBarTag = this.renderVolumeBar()

    const controlBarClasses = !allowedIphoneLandscape
      ? `${stylesControlbar.wrapper} ${stylesControlbar.wrapper_ads}`
      : `${stylesControlbar.wrapper_iphone} ${stylesControlbar.wrapper_ads}`

    const controlBarTag = (
      <div className={ controlBarClasses }>
        <div className={ `${stylesControlbar.container}` }>
          <div className={ stylesControlbar.controlsContainer }>
            <div className={ stylesControlbar.controlsWrapper }>
              <div className={ stylesControlbar.controls }>
                {playButtonTag}
                {volumeBarTag}
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <div className={styles.container}>
        { isCustomClickEnabled &&
          <div className={ styles.customClick } ref={ (ref) => this.saveRef(ref, 'customClickInstance') } />
        }
        <div className={[styles.adsContainer, isNonLinear ? styles.isNonLinear : ''].join(' ')} ref={(ref) => this.saveRef(ref)} />
        { isAdBreakPlaying && isLive && adGenre === adGenres.MID_ROLL &&
          <div className={ styles.adLive }>{ 'El canal que estás viendo en directo se encuentra en estos momentos en publicidad' }</div>
        }
        { isClicked && isPaused &&
          <div className={ styles.playIcon } onClick={ this.handleResumeAd } />
        }
        { isAdBreakPlaying && controlBarTag }
      </div>
    )
  }
}

Ads.propTypes = {
  adTagUrl: PropTypes.string,
  currentTime: PropTypes.number,
  disableCustomPlaybackForIOS10Plus: PropTypes.bool,
  enablePreloading: PropTypes.bool,
  getVideoRef: PropTypes.func.isRequired,
  isAutoplay: PropTypes.bool,
  isConsented: PropTypes.bool,
  isCustomAdBreakEnabled: PropTypes.bool,
  isLive: PropTypes.bool,
  isLongForm: PropTypes.bool,
  isMoatConsented: PropTypes.bool,
  isMuted: PropTypes.bool,
  isHeaderBiddingEnabled: PropTypes.bool,
  logger: PropTypes.object,
  moat: PropTypes.shape({
    isEnabled: PropTypes.bool,
    partnerCode: PropTypes.string
  }),
  onAdEvent: PropTypes.func.isRequired,
  onErrorFatal: PropTypes.func.isRequired,
  paddingBottom: PropTypes.number,
  platform: PropTypes.string,
  playedTime: PropTypes.number,
  playerType: PropTypes.string,
  useStyledNonLinearAds: PropTypes.bool,
  volume: PropTypes.number
}

Ads.defaultProps = {
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default Ads
