import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import CommonPropTypes from 'helpers/CommonPropTypes'
import { isAutoplayAllowed, isFacebookMobile, isInstagramMobile, isIos, isMobileAny, isMobilePhone } from './commons/userAgent'
import { createLocalUrl, Logger, waitFor } from './commons/util'
import { playerModes, playerTypes, scaleFits, themes } from './commons/types'
import {
  createInitialState as createVideoPlayerInitialState
} from './components/videoPlayer/model'
import VideoPlayer from './components/videoPlayer'
import styles from './msplayer.css'

const VERSION = '2.2.1'

const {
  MITELE,
  MITELE_ARTICLE,
  MOBILE_FULL_SCREEN,
  PREVIEW
} = playerModes

const {
  AUDIO_PLAYER,
  VIDEO_PLAYER
} = playerTypes

const { COVER } = scaleFits
const {
  DESKTOP,
  MOBILE
} = themes

class MSPlayer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dfpCustParams: undefined,
      height: 0,
      omnitureVars: undefined,
      width: 0,
      isShrinked: false,
    }

    this.logger = new Logger()

    this.handleResize = this.handleResize.bind(this)
  }

  componentDidMount() {
    if(this.logger) this.logger.reset()

    this.aspectRatio = this.props.aspectRatio

    if(!window.MSPlayer) window.MSPlayer = {}
    window.MSPlayer.version = VERSION

    if(this.aspectRatio) {
      window.addEventListener('resize', this.handleResize)
      this.handleResize()
    }

    this.logger.info(`Se instancia MSPlayer v${VERSION}`)

    // waitFor( () => window.io )
    // .then(() => {
    //   this.logger.info(`Se ha detectado el SDK de Socket.io`)

    //   this.socket = io('https://msplayert.rwd.int.aws.tele5.int')
    //   this.socket.on('sparrow-message', (msg) => {
    //     window.alert(`[${new Date(Date.now()).toISOString()}] Recibido sparrow-message "${msg}"`)
    //   })
    // })
    // .catch(() => logger.error('No se ha encontrado el SDK de Socket.io'))
  }

  componentDidUpdate(prevProps){
    const { fixedOpening } = this.props
    if(prevProps.fixedOpening !== fixedOpening){
      this.setState({isShrinked: false})
    }
  }

  componentWillUnmount() {
    if(this.aspectRatio) {
      window.removeEventListener('resize', this.handleResize)
    }

    // if(this.eventDispatcher) {
    //   this.eventDispatcher.removeAllEventListeners()
    // }
  }

  handleResize(){
    const bounds = this.ref.getBoundingClientRect()

    // Cuando se ejecuta esta función mientras el video está en fullscreen this.props.aspectRatio
    // daba undefined, por eso guardamos su valor en this.aspectRatio durante el did mount
    const [w, h] = this.aspectRatio

    // TODO: window.innerHeight - 52 solo sirve en videogalerias.
    // Proporcionarle el alto del contenedor
    const containerHeight = window.innerHeight - 52

    let width
    let height = Math.ceil(bounds.width * h/w)

    if(height > containerHeight) {
      height = containerHeight
      width = Math.ceil(containerHeight * w/h)
    } else {
      width = 0
    }

    this.setState({ width, height })
  }

  playNewVideo(attr, canPlay = false) {
    if(this.videoPlayerInstance) {
      this.videoPlayerInstance.playNewVideo(attr, canPlay)
      return true
    }
    return false
  }

  getInstance() {
    if(this.videoPlayerInstance) {
      return this.videoPlayerInstance
    }
    return null
  }

  saveRef(ref, name = 'ref') {
    if(ref){
      this[name] = ref

      if(name === 'videoPlayerInstance') {
        const { onReady } = this.props

        if(onReady) {
          onReady({ instance: this[name] })
        }
      }
    }
  }

  onShrink(onShrinkSticky, isShrinked) {
    if(onShrinkSticky){
      this.setState({ isShrinked: !isShrinked })
      const { onShrinkSticky } = this.props
      if(onShrinkSticky) {
        onShrinkSticky({ onShrinkSticky })
      }
    }
  }

  onClose(onCloseSticky) {
    if(onCloseSticky){
      this.setState({ isShrinked: false })
      const { onCloseSticky } = this.props
      if(onCloseSticky) {
        onCloseSticky({ onCloseSticky })
      }
    }
  }

  onToggleCarousel(isToggled) {
    const { onToggleCarousel } = this.props
    if (onToggleCarousel) {
      onToggleCarousel(isToggled)
    }
  }
  
  parseProps(props) {
    props = { ...props }

    const { isAmp, isVideoGallery } = props

    props.mustSelfSize = isVideoGallery !== true
    props.theme = isMobileAny() ? MOBILE : DESKTOP

    if (isVideoGallery && isAmp) {
      props.mustSelfSize = true
    }

    switch(props.mode) {
      case MITELE:
        props.exitPlaybackBt = { position: 'TL', type: 'arrow' }
        props.isExitFullWindowEnabled = false
        props.mustPlayFullWindow = true
        props.mustSelfSize = false
        props.mustStartFullScreen = props.theme === MOBILE && !isIos()
        break

      case MITELE_ARTICLE:
        props.exitPlaybackBt = { position: 'TL', type: 'arrow' }
        props.isExitFullWindowEnabled = false
        props.mustPlayFullWindow = true
        props.mustStartFullScreen = props.theme === MOBILE && !isIos()
        break

      case MOBILE_FULL_SCREEN:
        props.isExitFullWindowEnabled = true
        props.mustPlayFullScreen = !isIos() && !isFacebookMobile() && !isInstagramMobile()
        props.mustPlayFullWindow = isIos() || isFacebookMobile() || isInstagramMobile()
        break

      case PREVIEW:
        props.isLoopEnabled = true
        props.isMuted = true
        props.isPreplayerPlayInsetVisible = false
        props.mustPlayFullWindow = false
        props.videoScaleFit = COVER
        break
    }

    return props
  }

  render() {
    let {
      toggleAdShape,
      ampVars,
      aspectRatio = [],
      autoplay,
      bluekai,
      isPodcast,
      cerberoCookie,
      jekyllCookie,
      chatComponent,
      cmsId,
      concurrency,
      config,
      configChatButton,
      consent,
      contentUrl,
      conviva,
      csai,
      customAnalytics,
      customServices,
      debug,
      delegateFullScreen = false,
      description,
      dfp,
      downloadUrl,
      editorialId,
      episodeName,
      mediaName,
      exitPlaybackBt,
      fingerprint,
      headerBidding,
      id,
      isAmp,
      isExitFullWindowEnabled,
      isLive,
      isLoopEnabled,
      isMultichannelEnabled,
      isMuted,
      isPreplayerPlayInsetVisible,
      isRelatedEnabled = false,
      isStartOverEnabled,
      isVideoGallery = false,
      kibana,
      mediaId,
      mediaPlayerDash,
      moat,
      mode,
      mustPlayFullScreen,
      mustPlayFullWindow,
      mustSelfSize = true,
      mustStartFullScreen,
      next,
      contentTitle,
      onAdsEnd,
      onAdsStart,
      onChatButtonChange,
      onControlBarVisibleChange,
      onEnded,
      onError,
      onMaxSessionReached,
      onMuteChange,
      onNextVideo,
      onPause,
      onPlay,
      onPreviousVideo,
      onProgramChange,
      onScreenChange,
      onStartOverPlaybackEnded,
      onStartOverRequested,
      permutive,
      platform,
      positionNextPrev,
      poster,
      posterBackup,
      posterImagizerType,
      preloading,
      rating,
      services,
      servicesPing,
      shareDisabled,
      show,
      siteCreated,
      sitePublished,
      soundWaveUrl,
      sparrow,
      src,
      startPosition,
      subtitle,
      subtitles,
      theme,
      totalVideogallery,
      title,
      titleId,
      type: playerType = VIDEO_PLAYER,
      user,
      videoScaleFit,
      volume,
      waveImage,
      fixedOpening,
      isSindicacionPlayer,
      onSendRecommendEvent,
      npaw
    } = this.parseProps(this.props)
    const { adPauseUrl, adShapeStyle, externalSites, v48, isAdShapeVisible, topVideo } = this.props    

    const {
      dfpCustParams,
      height,
      omnitureVars,
      width,
      isShrinked
    } = this.state

    const nextRelatedAutoplayEnabled = typeof window !== 'undefined' ? !isVideoGallery && isRelatedEnabled : undefined
    const relatedEnabled = typeof window !== 'undefined' ? !isVideoGallery && isRelatedEnabled : undefined
    const npawAccountId = npaw ? npaw.accountId : undefined

    if(omnitureVars && customAnalytics) {
      if(
        customAnalytics.omniture &&
        customAnalytics.omniture.heartbeats &&
        customAnalytics.omniture.heartbeats.videoCustomMetadata
      ) {
        customAnalytics.omniture.heartbeats.videoCustomMetadata = {
          ...customAnalytics.omniture.heartbeats.videoCustomMetadata,
          ...omnitureVars
        }
        customAnalytics.omniture.multiProfile = {
          ...customAnalytics.omniture.multiProfile,
          ...omnitureVars
        }
      }
    } else if(omnitureVars) {
      customAnalytics = {
        ...customAnalytics,
        omniture: {
          heartbeats: {
            videoCustomMetadata: { ...omnitureVars }
          },
          multiProfile: customAnalytics.omniture.multiProfile

        }
      }
    }

    let { className = '', style } = this.props

    if(aspectRatio.length) {
      style = {}

      if(width) {
        style.width = `${width}px`
      }
      if(height) {
        style.height = `${height}px`
      }
    }

    let bkId = undefined
    if(typeof window !== 'undefined' && window.mspage && window.mspage.servicesConfig && window.mspage.servicesConfig.bluekai && window.mspage.servicesConfig.bluekai.bluekaiId) {

      const { desktop, responsive } = window.mspage.servicesConfig.bluekai.bluekaiId
      bkId = isMobilePhone() ? responsive : desktop
    }

    const parsedProps = {
      ampVars,
      bluekai: {
        isEnabled: bluekai && (bluekai.isEnabled === true || bluekai.active === true),
        siteCode: bluekai ? bluekai.bluekaiId : bkId,
      },
      isPodcast,
      cerberoCookie,
      jekyllCookie,
      chatComponent,
      cmsId,
      concurrency,
      configChatButton,
      configUrl: customServices && createLocalUrl(customServices.config) || config,
      contentTitle,
      contentUrl,
      conviva,
      csai,
      currentVideoId: id,
      customAnalytics,
      customServices,
      debug,
      description,
      dfp: {
        adTagUrl: dfp && dfp.adTagUrl ? dfp.adTagUrl : undefined,
        custParams: dfp && typeof dfp.custParams !== 'undefined' ? (typeof dfpCustParams !== 'undefined' ? { ...dfpCustParams, ...dfp.custParams } : dfp.custParams) : dfpCustParams,
        descriptionUrl: dfp && dfp.descriptionUrl,
        disableCustomPlaybackForIOS10Plus: dfp && dfp.disableCustomPlaybackForIOS10Plus === true ? true : undefined,
        enablePreloading: dfp && dfp.enablePreloading === true ? true : undefined,
        isCustomAdBreakEnabled: dfp && dfp.isCustomAdBreakEnabled === true ? true : undefined,
        iu: dfp && dfp.iu ? dfp.iu : undefined,
        useStyledNonLinearAds: dfp && typeof dfp.useStyledNonLinearAds !== 'undefined' ? dfp.useStyledNonLinearAds : undefined
      },
      downloadUrl,
      editorialId,
      episodeName,
      mediaName,
      exitPlaybackBt: exitPlaybackBt ? { ...exitPlaybackBt, isEnabled: true } : undefined,
      fingerprint: {
        duration: fingerprint && fingerprint.duration,
        interval: fingerprint && fingerprint.interval,
        isEnabled: fingerprint && fingerprint.active === true
      },
      mediaId,

      // OJO: Si se genera aquí, se pierde funcionalidad acoplada con el id de entrada como ocultar el título sobrepuesto
      id,

      isAdsEnabled: mode && mode === PREVIEW ? false : shareDisabled && shareDisabled === 'fb' ? false : undefined,
      isAmp,
      isAutoHideControlBarEnabled: playerType !== AUDIO_PLAYER,
      isAutoplay: (isAutoplayAllowed() || isMuted || isSindicacionPlayer) && autoplay === true,
      isControlBarVisible: playerType === AUDIO_PLAYER,
      isExitFullWindowEnabled,
      isFullScreenDelegated: delegateFullScreen,
      isFullScreenEnabled: playerType === AUDIO_PLAYER ? false : undefined,
      isHeartbeatsEnabled: true,
      isLive,
      isLoopEnabled: isLoopEnabled === true,
      isMultichannelEnabled,
      isMuted: isMuted === true,
      isHeaderBiddingEnabled: headerBidding && headerBidding.isEnabled === true,
      isPreplayerPlayInsetVisible,
      isRelatedAutoplayEnabled: nextRelatedAutoplayEnabled,
      isRelatedEnabled: relatedEnabled,
      isSeekInsetEnabled: true,
      isStartOverEnabled,
      isVideoGallery: isVideoGallery,
      isVideoPlaying: false,
      kibana,
      mediaPlayerDash,
      moat: {
        isEnabled: moat && moat.isEnabled === true && moat.partnerCode ? true : false,
        partnerCode: moat && moat.partnerCode
      },
      mode,
      mustPlayFullScreen,
      mustPlayFullWindow,
      mustStartFullScreen,
      next,
      omniture: {
        vars: omnitureVars
      },
      permutive: {
        isEnabled: permutive && (permutive.isEnabled === true || permutive.active === true),
        jekyll: permutive && permutive.jekyll
      },
      platform,
      positionNextPrev,
      poster,
      posterBackup,
      posterImagizerType,
      preloading: {
        isEnabled: preloading && preloading.isEnabled === true,
        level: preloading && preloading.level,
        limit: preloading && preloading.limit,
        type: preloading && preloading.type
      },
      rating,
      services: {
        ads: {
          url: services && services.ads ? services.ads : undefined
        }
      },
      servicesPing: {
        interval: servicesPing && servicesPing.interval,
        isEnabled: servicesPing && servicesPing.active === true,
        url: servicesPing && servicesPing.url
      },
      show,
      siteCreated,
      sitePublished,
      soundWaveUrl: soundWaveUrl,
      sparrow,
      startPosition,
      startSrc: src,
      subtitle,
      subtitles,
      theme,
      totalVideogallery,
      title,
      type: playerType,
      user,
      version: VERSION,
      videoScaleFit,
      volume,
      npaw: {
        accountId: npawAccountId,
        active: npaw && npaw.active,
        dash: npaw && npaw.dash,
        hls: npaw && npaw.hls,
        html5: npaw && npaw.html5,
        ima: npaw && npaw.ima,
        shaka: npaw && npaw.shaka
      },
      waveImage,
      isSticky: fixedOpening,
      isShrinked
    }
    
    const videoPlayerInitialState = createVideoPlayerInitialState(parsedProps)

    let children = []

    switch (playerType) {
      case AUDIO_PLAYER:
      case VIDEO_PLAYER:
      default:
        children.push(
          <VideoPlayer
            toggleAdShape={ toggleAdShape }
            adShapeStyle={ adShapeStyle }
            consent={ consent }
            entryProps={ this.props }
            initialParsedProps={ parsedProps }
            initialState={ videoPlayerInitialState }
            key={ 'videoPlayer' }
            logger={ this.logger }
            onChatButtonChange={ onChatButtonChange }
            onControlBarVisibleChange={ onControlBarVisibleChange }
            onEnded={ onEnded }
            onError={ onError }
            onMaxSessionReached={ onMaxSessionReached }
            onAdsEnd={ onAdsEnd }
            onAdsStart={ onAdsStart }
            onMuteChange={ onMuteChange }
            onNextVideo={ onNextVideo }
            onPause={ onPause }
            onPlay={ onPlay }
            onPreviousVideo={ onPreviousVideo }
            onProgramChange={ onProgramChange }
            onScreenChange={ onScreenChange }
            onStartOverPlaybackEnded={ onStartOverPlaybackEnded }
            onStartOverRequested={ onStartOverRequested }
            ref={ (ref) => this.saveRef(ref, 'videoPlayerInstance') }
            adPauseUrl={ adPauseUrl }
            isPremium={ user?.isSubscribed }
            isPodcast={ isPodcast }
            waveImage={ waveImage }
            externalSites={ externalSites }
            onShrinkSticky= {(onShrinkSticky) => this.onShrink(onShrinkSticky,isShrinked)}
            isSticky={ fixedOpening }
            onCloseSticky={ (onCloseSticky) => this.onClose(onCloseSticky) }
            onToggleCarousel={ (isToggled) =>  this.onToggleCarousel(isToggled)}
            isShrinked={ isShrinked }
            v48={ v48 }
            onNextVideoChange={ this.props.onNextVideoChange }
            onSendRecommendEvent={ onSendRecommendEvent }
            contentTitle={ contentTitle }
            isAdShapeVisible={ isAdShapeVisible }
            topVideo={ topVideo }
          />
        )
        break
    }

    const container = (
      <div
        className={ `${styles.container} ${className}` }
        style={ style }
        ref={ (ref) => this.saveRef(ref) }
      >
        { children }
      </div>
    )

    if(mustSelfSize){
      return(
        <div className={ `${styles.selfsize} ${isShrinked ? styles.shrink : ''}` }>
          { container }
        </div>
      )
    } else {
      return container
    }

  }
}

MSPlayer.propTypes = {
  // Proporciones del player: [16, 9]
  // Por defecto: undefined
  aspectRatio: PropTypes.arrayOf(PropTypes.number),
  // Avtivate adShape if player enter fullscreen
  toggleAdShape: PropTypes.func,
  // Indica si el vídeo/audio debe iniciarse automáticamente
  // Por defecto: false
  autoplay: PropTypes.bool,
  // Obsoleto. Persistent ID para Videoplaza Pulse
  // Por defecto: undefined
  bkuuid: PropTypes.string,
  // Parámetros de configuración de Bluekai
  bluekai: PropTypes.shape({
    active: PropTypes.bool,
    bluekaiId: PropTypes.string
  }),
  // Propiedades para consultar los consentimientos del usuario
  // Si no se recibe, se interpreta que el usuario no ha dado consentimientos a nada
  // Por defecto: undefined
  consent: PropTypes.shape({
    bluekai: PropTypes.shape({
      purpose: PropTypes.string,
      vendor: PropTypes.string
    }),
    consentManager: PropTypes.shape({
      CONSENTS_CHANGED_EVENT: PropTypes.string.isRequired,
      getConsent: PropTypes.func.isRequired,
      getConsentForPersonalizedAds: PropTypes.func.isRequired
    }).isRequired,
    moat: PropTypes.shape({
      purpose: PropTypes.string,
      vendor: PropTypes.string
    }),
    omniture: PropTypes.shape({
      purpose: PropTypes.string,
      vendor: PropTypes.string
    })
  }),
  // URL del vídeo/audio para SEO
  // Por defecto: undefined
  contentUrl: PropTypes.string,
  // Parámetros de configuración de Conviva
  conviva: PropTypes.shape({
    allowUncaughtExceptions: PropTypes.bool,
    customerKey: PropTypes.string,
    defaultResource: PropTypes.string,
    disabledDevices: PropTypes.arrayOf(PropTypes.string),
    disabledDomains: PropTypes.arrayOf(PropTypes.string),
    disabledOS: PropTypes.arrayOf(PropTypes.string),
    disabledPlatforms: PropTypes.arrayOf(PropTypes.string),
    enabledDevices: PropTypes.arrayOf(PropTypes.string),
    enabledDomains: PropTypes.arrayOf(PropTypes.string),
    enabledOS: PropTypes.arrayOf(PropTypes.string),
    enabledPlatforms: PropTypes.arrayOf(PropTypes.string),
    enabledRatio: PropTypes.number,
    enabledRatioPremium: PropTypes.number,
    gatewayUrl: PropTypes.string,
    isEnabled: PropTypes.bool,
    isEnabledAds: PropTypes.bool,
    logLevel: PropTypes.string
  }),
  // Datos de configuración que sobreescriben los del servicio Analytics
  // Por defecto: undefined
  customAnalytics: PropTypes.shape({
    bluekai: PropTypes.shape({
      msId: PropTypes.string
    }),
    omniture: PropTypes.shape({
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
      }),

    })
  }),
  customServices: PropTypes.shape({
    ads: PropTypes.object,
    analytics: PropTypes.object,
    caronte: PropTypes.object,
    cerbero: PropTypes.object,
    config: PropTypes.object,
    delivery: PropTypes.object,
    gatekeeper: PropTypes.object,
    gbx: PropTypes.object,
    geo: PropTypes.object,
    next: PropTypes.object,
    program: PropTypes.object,
    related: PropTypes.object,
    share: PropTypes.object,
    xdr: PropTypes.object,
  }),
  // Nombre de la clase CSS que se añadirá al <div> principal del componente MSPlayer
  // Por defecto: undefined
  className: PropTypes.string,
  // Canal que ha dado error en multicanal y no se pinta
  channelError: PropTypes.string,
  // Id del CMS
  // Por defecto: undefined
  cmsId: PropTypes.string,
  // Configuración de chequeo concurrencia de sesión de usuario
  concurrency: PropTypes.shape({
    endpoint: PropTypes.string,
    interval: PropTypes.number,
    isEnabled: PropTypes.bool
  }),
  // URL del servicio Config
  // Por defecto: undefined
  config: PropTypes.string,
  // Configuración de CSAI
  csai: PropTypes.shape({
    isEnabled: PropTypes.bool
  }),
  // Configuración de la capa de debug
  debug: PropTypes.shape({
    isEnabled: PropTypes.bool,
    uids: PropTypes.arrayOf(PropTypes.string)
  }),
  // Descripción del vídeo. Sobreescribe config.info.description
  description: PropTypes.string,
  // Propiedades de configuración de IMA/DFP
  dfp: PropTypes.shape({
    // Custom params que se mergean en los cust_params del ad-tag
    // Por defecto: {}
    custParams: PropTypes.objectOf(PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.number,
      PropTypes.string
    ])),
    // Description URL que sobreescribe la del ad-tag
    // Por defecto: undefined
    descriptionUrl: PropTypes.string,
    // https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.ImaSdkSettings.setDisableCustomPlaybackForIOS10Plus
    // Por defecto: true
    disableCustomPlaybackForIOS10Plus: PropTypes.bool,
    // https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdsRenderingSettings.enablePreloading
    // Por defecto: false
    enablePreloading: PropTypes.bool,
    // https://developers.google.com/interactive-media-ads/docs/sdks/html5/ad-rules#manualAdBreaks
    // Por defecto: false
    isCustomAdBreakEnabled: PropTypes.bool,
    // Indica si el contenido es long-form (duración >= 300 seg)
    // Sobreescribe el valor que se devuelve en el servcicio Ads
    // Por defecto: undefined
    isLongForm: PropTypes.bool,
    // Ad unit que sobreescribe el que venga en el ad-tag
    // Por defecto: undefined
    iu: PropTypes.string,
    // https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdsRenderingSettings.useStyledNonLinearAds
    // Por defecto: true
    useStyledNonLinearAds: PropTypes.bool
  }),
  // Indica si el cambio a full-screen se hace desde el player o se gestiona desde fuera.
  // En el segundo caso se lanza el evento 'playerToggleFullScreen'
  // Se usa en Videogalerías para poner en full-screen el player + la playlist
  // Por defecto: false
  delegateFullScreen: PropTypes.bool,
  // URL del vídeo/audio para descargar
  downloadUrl: PropTypes.string,
  // Id del objeto editorial
  // Por defecto: undefined
  editorialId: PropTypes.string,
  // Nombre del episodio
  episodeName: PropTypes.string,
  mediaName: PropTypes.string,
  // Propiedades de configuración del botón para abandonar la reproducción
  // Este botón resetea el player a su estado inicial y lanza el evento 'playerExitPlayback' para que la página lo elimine, recupere el estado de pre-player y/o ejecute las acciones que en cada caso sean necesarias
  // Se usa en Mitele/Tongil para mostrar el botón con la flecha arriba a la izda
  exitPlaybackBt: PropTypes.shape({
    // Alineación del botón
    position: PropTypes.oneOf(['TL', 'TC', 'TR', 'CL', 'CC', 'CR', 'BL', 'BC', 'BR']),
    // Tipo de icono
    // De momento sólo está soportado el icono de la flecha
    type: PropTypes.oneOf(['arrow'])
  }),
  // Configuración del fingerprint
  fingerprint: PropTypes.shape({
    active: PropTypes.bool,
    duration: PropTypes.number,
    interval: PropTypes.number
  }),
  // Id de la instancia de VideoPlayer en el DOM
  // Por defecto: undefined
  id: PropTypes.string,
  // Indica se estamos en AMP
  // Por defecto: false
  isAmp: PropTypes.bool,
  // Activa/Desactiva la publicidad de Header Biding
  // Por defecto: false
  isHeaderBiddingEnabled: PropTypes.bool,
  // Obsoleto. Indica si el player está embebido. Se usaba para Videoplaza
  // Por defecto: false
  isEmbed: PropTypes.bool,
  // Indica si se debe dar la posibilidad de salir de full-window con un botón de cerrar arriba a la dcha
  // Se usa en conjunto con props.mustPlayFullWindow: true
  // Debería ser false si existe props.exitPlaybackBt, por ejemplo en Mitele/Tongil
  // Por defecto: true
  isExitFullWindowEnabled: PropTypes.bool,
  // Activa/Desactiva el envío de Adobe Heartbeats
  // Si Adobe Heartbeats está activado, se desactiva Adobe Milestones, y viceversa
  // Por defecto: false
  isHeartbeatsEnabled: PropTypes.bool,
  // Indica si el vídeo/audio es un directo (true) o un VoD (false)
  // Por defecto: undefined
  isLive: PropTypes.bool,
  // Activa/Desactiva la funcionalidad de reproducción en bucle
  // Por defecto: false
  isLoopEnabled: PropTypes.bool,
  // Activa/Desactiva la funcionalidad de Multi-canal
  // Por defecto: undefined (true si viene informado el servcio Multichannel en el Config)
  isMultichannelEnabled: PropTypes.bool,
  // Indica si el player debe iniciarse en mute
  // Por defecto: false
  isMuted: PropTypes.bool,
  // Activa/Desactiva los vídeos relacionados que se muestran al final de la reproducción
  // Sobreescribe lo que se devuelva en el servicio Config
  // Por defecto: false
  isRelatedEnabled: PropTypes.bool,
  // Activa/Desactiva los botones inset para seeking en móviles
  // Por defecto: true
  isSeekInsetEnabled: PropTypes.bool,
  // Activa/Desactiva la funcionalidad start-over
  // Por defecto: true
  isStartOverEnabled: PropTypes.bool,
  // Indica si el player forma parte de una videogalería
  // Por defecto: false
  isVideoGallery: PropTypes.bool,
  // Kibana config
  kibana: PropTypes.shape({
    isEnabled: PropTypes.bool,
    path: PropTypes.string
  }),
  // Id MMC
  // Por defecto: undefined
  mediaId: PropTypes.string,
  // Media player que se quiere usar para reproducir Dash: 'shaka_player' | 'dash_js'
  mediaPlayerDash: PropTypes.string,
  // Propiedades de configuración de Moat
  moat: PropTypes.shape({
    isEnabled: PropTypes.bool,
    partnerCode: PropTypes.string
  }),
  // Modos especiales de reproducción
  // Por defecto: undefined
  mode: PropTypes.oneOf(Object.values(playerModes)),
  // Indica si el player sólo permite la reproducción en modo full-screen
  // Por defecto: false
  mustPlayFullScreen: PropTypes.bool,
  // Indica si el player sólo permite la reproducción en modo full-window
  // Por defecto: false
  mustPlayFullWindow: PropTypes.bool,
  // Indica el título del contenido y no del video para mostrar en el player
  contentTitle: PropTypes.string,
  // Método al que llama cuando termina un bloque de publicidad (Preroll/Midroll/Postroll)
  onAdsEnd: PropTypes.func,
  // Método al que llama cuando empieza un bloque de publicidad (Preroll/Midroll/Postroll)
  onAdsStart: PropTypes.func,
  // Callback para el estado de mostrar/ocultar el menu del chatComponent
  onChatButtonChange: PropTypes.func,
  // Callback para el estado de mostrar/ocultar a bar de control
  onControlBarVisibleChange: PropTypes.func,
  // Método al que se llama cuando termina la reproducción del vídeo
  onEnded: PropTypes.func,
  // Callback al que se le pasan los errores fatales o de precarga
  onError: PropTypes.func,
  // Callback para el error de concurrencia de Cerbero 4039
  onMaxSessionReached: PropTypes.func,
  // Método al que llama a cuando del valor del volume haya cambiado
  onMuteChange: PropTypes.func,
  // Método al que llama a cuando de reproducir el siguiente vídeo en videogaleria
  onNextVideo: PropTypes.func,
  // Método al que llama cuando se invoce el método pause
  onPause: PropTypes.func,
  // Método al que se llama cuando se invoca el método play/resume
  onPlay: PropTypes.func,
  // Método al que llama a cuando de reproducir el anterior vídeo en videogaleria
  onPreviousVideo: PropTypes.func,
  // Método al que se llama cuando se detecta un cambio de programa en directos por id3
  // Se usa para comprobar los permisos de reproducción desde la página
  // Debe devolver una promesa:
  //  - resolve(true) si hay permisos de reproducción
  //  - resolve(false) o reject(description) si no hay permisos de reproducción
  // Se llama pasando onProgramChange({ eventId, playerId})
  // Por defecto: undefined
  onProgramChange: PropTypes.func,
  // Método al que se llama cuando el componente MSPlayer se ha montado y existe su ref
  // Se llama pasando onReady({instance: ref})
  // Por defecto: undefined
  onReady: PropTypes.func,
  // Método al que llamar cuando existe un cambio en el screen (fullscreen|fullwindow|none)
  onScreenChange: PropTypes.func,
  // Método al que se llama cuando se detecta una cambio de programa en start-over
  // Por defecto: undefined
  onStartOverPlaybackEnded: PropTypes.func,
  // Método al que se llama cuando se hace click sobre el botón "Ver desde el inicio"
  // Devuelve una promesa que se resolverá a true si el usuario tiene permisos para esta funcionalidad
  // Por defecto: undefined
  onStartOverRequested: PropTypes.func,
  // Platformaa donde estamos
  // Por defecto: undefined
  platform: PropTypes.string,
  // Posición del vídeo que se esta reproduciendo en la vídeo galeria
  // Por defecto: undefined
  positionNextPrev: PropTypes.number,
  // URL del poster
  // Por defecto: undefined
  poster: PropTypes.string,
  // URL del posterBackup
  // Por defecto: undefined
  posterBackup: PropTypes.string,
  // Tipo de escalado del poster
  posterImagizerType: PropTypes.string,
  // Propiedades de configuración del la precarga del player
  preloading: PropTypes.shape({
    // Activa/Desactiva la precarga
    // Por defecto: false
    isEnabled: PropTypes.bool,
    // Nivel de preloading: Qué módulos se precargan (v. preloadingLevels)
    // Por defecto: 'ads'
    level: PropTypes.string,
    // Límite de players precargados en la página
    // Por defecto: -1 (Infinito)
    limit: PropTypes.limit,
    // Tipo de precarga (v. preloadingTypes)
    // Por defecto: 'lazy'
    type: PropTypes.string
  }),
   // Propiedades de configuración de permutive
   permutive: PropTypes.shape({
    // Activa/Desactiva la precarga
    // Por defecto: true
    isEnabled: PropTypes.bool,
    active: PropTypes.bool,
  }),
  // Indica si el botón play inset del pre-player se debe mostrar (true) o no (false)
  // Por defecto: true
  isPreplayerPlayInsetVisible: PropTypes.bool,
  // Sobreescribe el atributo services del servicio Config
  // Por defecto: undefined
  services: PropTypes.shape({
    ads: PropTypes.string
  }),
  // Configuración para servicio pull de Atenea
  servicesPing: PropTypes.shape({
    active: PropTypes.bool,
    interval: PropTypes.number,
    url: PropTypes.string
  }),
  // Si se recibe "fb", el player no muestra publicidad
  shareDisabled: PropTypes.string,
  // Películas: Título del vídeo
  // Programas o series: Su microsite, siempre y cuando se categoricen correctamente en el CMS
  // Directos: Campo name en MMC
  show: PropTypes.string,
  // Indica en que plataforma se ha creado el contenido
  siteCreated: PropTypes.string,
  // Indica en que plataforma esta publicado el contenido
  sitePublished: PropTypes.string,
  // URL de la imagen que se usa para simular las barras de frecuencia en el player de audio
  // Por defecto: undefined
  soundWaveUrl: PropTypes.string,
  // URL del vídeo/audio que se quiera reproducir
  // Por defecto: undefined
  src: PropTypes.string,
  // Segundo inicial de reproducción
  // Por defecto: 0
  startPosition: PropTypes.number,
  // Estilos inline que se le añaden al <div> contenedor del componente MSPlayer
  // Por defecto: undefined
  style: PropTypes.objectOf(PropTypes.string),
  // Subtítulo del vídeo. Sobreescribe config.info.subtitle
  subtitle: PropTypes.string,
  // Configuración de subtítulos
  subtitles: PropTypes.shape({
    isEnabled: PropTypes.bool
  }),
  // Numero total de vídeos en la videogaleria
  totalVideogallery: PropTypes.number,
  // Título del vídeo. Sobreescribe config.info.title
  title: PropTypes.string,
  // Tipo de player
  // Por defecto: 'video_player'
  type: PropTypes.oneOf(['audio_player', 'video_player']),
  // Usuario Gigya
  // Sólo se indican los atributos que utiliza MSPlayer
  // Por defecto: undefined
  user: PropTypes.shape({
    isSubscribed: PropTypes.bool,
    signatureTimestamp: PropTypes.string,
    UID: PropTypes.string,
    UIDSignature: PropTypes.string
  }),
  // Tipo de escalado del vídeo
  // Por defecto: 'contain'
  videoScaleFit: PropTypes.oneOf(['contain', 'cover']),
  // Volumen inicial: 0-1
  // Por defecto: 1
  volume: PropTypes.number,
  // npaw configuration
  npaw: PropTypes.shape({
    accountId: PropTypes.string,
    active: PropTypes.bool,
    dash: PropTypes.string,
    hls: PropTypes.string,
    html5: PropTypes.string,
    ima: PropTypes.string,
    shaka: PropTypes.string
  }),
  externalSites: PropTypes.arrayOf(CommonPropTypes.externalSite),
  fixedOpening: PropTypes.bool,
  onCloseSticky: PropTypes.func,
  onShrinkSticky: PropTypes.func,
  onSendRecommendEvent: PropTypes.func
}

export default MSPlayer
