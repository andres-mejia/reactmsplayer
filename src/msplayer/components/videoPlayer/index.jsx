/* eslint-disable class-methods-use-this */
import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import CommonPropTypes from 'helpers/CommonPropTypes'
import { Collector, generateGuid, isEmpty } from '../../commons/util'
import { isAutoplayAllowed, isIPad, isMobileAny, isMobilePhone, isTablet, isPortrait } from '../../commons/userAgent'
import { genres, playerModes, playerTypes, serviceNames, stages, themes } from '../../commons/types'
import { mediaEvents, playerEvents } from '../../commons/types/events'
import { callAdPauseInfo } from './lib/services/ads'
import ActionFeedback from '../actionFeedback'
import Ads from '../ads'
import Analytics from '../analytics'
import Background from '../controls/background'
import CarouselPlayer from '../../../../../../app/modules/_components/carouselPlayer'
import ChatBt from '../controls/chatBt'
import ControlBar from '../controls/controlBar'
import ControlBarMobile from '../controls/controlBarMobile'
import FloatingTopBar from '../controls/floatingTopBar'
import Debug from '../debug'
import DialogAudioSubtitlesMobile from '../dialogs/dialogAudioSubtitlesMobile'
import DialogError from '../dialogs/dialogError'
import DialogPause from '../dialogs/dialogPause'
import DialogRelated from '../dialogs/dialogRelated'
import DialogRelatedAutoplay from '../dialogs/dialogRelatedAutoplay'
import DialogSeeAgain from '../dialogs/dialogSeeAgain'
import DialogShare from '../dialogs/dialogShare'
import Fingerprint from '../fingerprint'
import InsetBt from '../controls/insetBt'
import KeyControls from '../controls/keyControls'
import Next from '../controls/next'
import Poster from '../poster'
import PosterAudio from '../posterAudio'
import PrePlayer from '../prePlayer'
import SeekBtsInset from '../controls/seekBtsInset'
import Sparrow from '../sparrow'
import Spinner from '../spinner'
import Subtitles from '../subtitles'
import AudioSubtitlesIcon from '../controls/audioSubtitlesIcon'
import DialogAudioSubtitlesDesktop from '../controls/dialogAudioSubtitlesDesktop'
import TogglePlayBtInset from '../controls/togglePlayBtInset'
import Tooltip from '../controls/tooltip'
import Video from '../video'
import VideoGalleryBts from '../controls/videoGalleryBts'
import Watermarks from '../watermarks'
import Widget from '../controls/widget'
import Xdr from '../xdr'
import * as lib from './lib'
import styles from './videoPlayer.css'
import AdPauseContainer from '../ads/adPauseContainer'
import Waves from '../waves'

const { ADS, CONTENT } = genres
const { MITELE, PREVIEW } = playerModes
const { AUDIO_PLAYER } = playerTypes
const { ANALYTICS, NEXT, RELATED_VIDEOS, SHARE, VIDEO_THUMBNAILS, XDR } = serviceNames
const { END, ERROR, PLAYBACK, PRE_PLAYER } = stages
const { MOBILE } = themes

class VideoPlayer extends Component {
  constructor(props) {
    super(props)

    const { initialParsedProps, initialState, onNextVideoChange, isAdShapeVisible } = props
    const { id } = initialState

    this.initialParsedProps = { ...initialParsedProps }

    this.state = {
      ...initialState,
      isToggleOn: false,
      selectedCardIndex: 0,
      isEnabled: false,
      currentVideoId: id,
      isSparrowVisible: false,
      isVideoPlaying: false,
      keyAll: Math.round(Math.random() * 1000000),
      keyAnalytics: Math.round(Math.random() * 1000000),
      sessionId: generateGuid(),
      sizeClassName: '',
      showAdPause: false,
      adPauseInfo: {},
      newAdBackgrounStyle: {},
      newPlayerStyle: {},
      newAdStyle: {},
      onNextVideoChange
    }

    this.registerMethods(lib)

    // Añadir al collector todas las propiedades que se declaren al vuelo
    // para poder eliminarlas al resetear
    this.collector = new Collector(this)
    this.getVideoRef = this.getVideoRef.bind(this)
    this.onCloseAdPauseHandler = this.onCloseAdPauseHandler.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    const { initialState } = props
    const {
      bluekai: stateBluekai,
      chatComponent: stateChatComponent,
      concurrency: stateConcurrency,
      configChatButton: stateconfigChatButton,
      conviva: stateConviva,
      dfp: stateDfp,
      debug: stateDebug,
      fingerprint: stateFingerprint,
      isAdsEnabled: stateIsAdsEnabled,
      isHeaderBiddingEnabled: stateIsHeaderBiddingEnabled,
      kibana: stateKibana,
      mediaPlayerDash: stateMediaPlayerDash,
      moat: stateMoat,
      mustPlayFullWindow: stateMustPlayFullWindow,
      omniture: stateOmniture,
      positionNextPrev: statePositionNextPrev,
      poster: statePoster,
      posterImagizerType: statePosterImagizerType,
      preloading: statePreloading,
      permutive: statePermutive,
      sparrow: stateSparrow,
      startPosition: stateStartPosition,
      user: stateUser,
      npaw: stateNpaw,
      contentTitle: stateContentTitle,
      startPlayerAttr
    } = state

    const {
      bluekai,
      chatComponent,
      concurrency,
      configChatButton,
      conviva,
      customAnalytics,
      dfp,
      debug,
      fingerprint,
      isAdsEnabled,
      isHeaderBiddingEnabled,
      isVideoGallery,
      kibana,
      mediaPlayerDash,
      moat,
      mustPlayFullWindow,
      omniture,
      positionNextPrev,
      poster,
      posterImagizerType,
      preloading,
      permutive,
      sparrow,
      startPosition,
      user,
      npaw,
      contentTitle
    } = { ...initialState, ...startPlayerAttr }

    const newState = {}

    if(JSON.stringify(bluekai) !== JSON.stringify(stateBluekai)) {
      newState.bluekai = bluekai
    }

    if(chatComponent !== stateChatComponent) {
      newState.chatComponent = chatComponent
    }

    if(contentTitle !== stateContentTitle) {
      newState.contentTitle = contentTitle
    }

    if(JSON.stringify(concurrency) !== JSON.stringify(stateConcurrency)) {
      newState.concurrency = concurrency
    }

    if(JSON.stringify(configChatButton) !== JSON.stringify(stateconfigChatButton)) {
      newState.configChatButton = configChatButton
    }

    if(JSON.stringify(conviva) !== JSON.stringify(stateConviva)) {
      newState.conviva = conviva
    }

    let analytics = { ...customAnalytics }
    if(customAnalytics && customAnalytics.omniture) {
      analytics.omniture = {}

      if(customAnalytics.omniture.heartbeats) {
        analytics.omniture.heartbeats = {}

        if (customAnalytics.omniture.heartbeats.config) {
          analytics.omniture.heartbeats.config = {
            ...customAnalytics.omniture.heartbeats.config
          }
        }
        if (customAnalytics.omniture.heartbeats.media) {
          analytics.omniture.heartbeats.media = {
            ...customAnalytics.omniture.heartbeats.media
          }
        }
        if (customAnalytics.omniture.heartbeats.videoCustomMetadata) {
          analytics.omniture.heartbeats.videoCustomMetadata = {
            ...customAnalytics.omniture.heartbeats.videoCustomMetadata
          }
        }
      }

      if(customAnalytics.omniture.multiProfile) {
        analytics.omniture.multiProfile = {}

        if (customAnalytics.omniture.multiProfile) {
          analytics.omniture.multiProfile.config = {
            ...customAnalytics.omniture.multiProfile,
          }
        }
      }
      newState.customAnalytics = analytics
    }

    if(JSON.stringify(dfp) !== JSON.stringify(stateDfp)) {
      newState.dfp = dfp
    }

    if(JSON.stringify(debug) !== JSON.stringify(stateDebug)) {
      newState.debug = debug
    }

    if(JSON.stringify(fingerprint) !== JSON.stringify(stateFingerprint)) {
      newState.fingerprint = fingerprint
    }

    if(isAdsEnabled !== stateIsAdsEnabled) {
      newState.isAdsEnabled = isAdsEnabled
    }

    if(isHeaderBiddingEnabled !== stateIsHeaderBiddingEnabled) {
      newState.isHeaderBiddingEnabled = isHeaderBiddingEnabled
    }

    if(JSON.stringify(kibana) !== JSON.stringify(stateKibana)) {
      newState.kibana = kibana
    }

    if(mediaPlayerDash !== stateMediaPlayerDash) {
      newState.mediaPlayerDash = mediaPlayerDash
    }

    if(JSON.stringify(moat) !== JSON.stringify(stateMoat)) {
      newState.moat = moat
    }

    if(mustPlayFullWindow !== stateMustPlayFullWindow) {
      newState.mustPlayFullWindow = mustPlayFullWindow
    }

    if(JSON.stringify(omniture) !== JSON.stringify(stateOmniture)) {
      newState.omniture = omniture
    }

    if(positionNextPrev !== statePositionNextPrev) {
      newState.positionNextPrev = positionNextPrev
    }

    if(poster !== statePoster) {
      newState.poster = isVideoGallery ? poster : statePoster
    }

    if(posterImagizerType !== statePosterImagizerType) {
      newState.posterImagizerType = posterImagizerType
    }

    if(JSON.stringify(preloading) !== JSON.stringify(statePreloading)) {
      newState.preloading = preloading
    }

    if(JSON.stringify(permutive) !== JSON.stringify(statePermutive)) {
      newState.permutive = permutive
    }

    if(JSON.stringify(sparrow) !== JSON.stringify(stateSparrow)) {
      newState.sparrow = sparrow
    }

    if(startPosition !== stateStartPosition) {
      newState.startPosition = startPosition
    }

    if(JSON.stringify(user) !== JSON.stringify(stateUser)) {
      newState.user = user
    }

    if(JSON.stringify(npaw) !== JSON.stringify(stateNpaw)) {
      newState.npaw = npaw
    }

    return newState
  }

  componentDidMount() {
    this.initPlayer()
    window.addEventListener('resize', this.onResizeScreen.bind(this))
  }

  componentDidUpdate(prevProps, prevState) {
    const { initialParsedProps, adShapeStyle, updateConsent, isSticky, isShrinked } = this.props
    const { id, isAdsEnabled, preloading = {}, startPosition, isAdsConsented } = this.state
    const {
      initialState: {
        isAdsEnabled: prevIsAdsEnabled
      }
    } = prevProps

    const {
      id: idPrevState,
      isContentStarted,
      isStartPlayerRequested,
      preloading: prevPreloading = {},
      isAdsConsented: prevIsAdsConsented
    } = prevState

    if (
      (adShapeStyle && prevProps.adShapeStyle === null) ||
      adShapeStyle?.backgroundImage !== prevProps.adShapeStyle?.backgroundImage
    ) {
      this.getResizePlayer()
    }

    if (
      prevProps.isSticky !== isSticky ||
      prevProps.isShrinked !== isShrinked
    ) {
      this.handleFloatingClick()
    }

    this.initialParsedProps = { ...initialParsedProps }

    if(
      isStartPlayerRequested &&
      !isContentStarted &&
      prevIsAdsEnabled === true &&
      isAdsEnabled === false
    ) {
      this.stopProcessing()
      this.discardAdBreak()
      this.startContent(startPosition)

    } else if(
      preloading.isEnabled === true && prevPreloading.isEnabled === false ||
      preloading.level !== 'none' && preloading.level !== prevPreloading.level
    ) {
      this.initPreloading()
    }

    if(id !== idPrevState) {
      this.exposePlayer()
    }

    if (isAdsConsented !== prevIsAdsConsented && updateConsent) {
      updateConsent(isAdsConsented)
    }
  }

  componentWillUnmount() {
    document.removeEventListener('fullscreenchange', this.handleFullScreenChange)
    document.removeEventListener('mozfullscreenchange', this.handleFullScreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullScreenChange)
    document.removeEventListener('MSFullscreenChange', this.handleFullScreenChange)

    window.removeEventListener('click', this.handleWindowClick)
    window.removeEventListener('resize', this.handleWindowResize)

    this.unexposePlayer()
  }

  onCloseAdPauseHandler() {
    this.setState({
      showAdPause: false
    })
  }

  getVideoRef() {
    if (this.videoInstance) {
      return this.videoInstance.getRef()
    }
    return null
  }

  saveRef(ref, name = "ref") {
    if (ref) {
      this[name] = ref;

      this.collector.addProperty(name);
    }
  }

  registerMethods(library) {
    for (let methodName in library) {
      this[methodName] = library[methodName](this);
    }
  }

  exposePlayer(id = this.state.id) {
    if(typeof window !== 'undefined' && typeof document !== 'undefined') {
      if(!window.MSPlayer) window.MSPlayer = {}
      if(!window.MSPlayer[id]) window.MSPlayer[id] = {}

      if(document.cookie.indexOf('consoleDebug=') !== -1) {
        for(let methodName in lib){
          window.MSPlayer[id][methodName] = (...params) => this[methodName](...params)
        }
      } else {
        window.MSPlayer[id].propagatePlayerEvent = (...params) => this.propagatePlayerEvent(...params)
        window.MSPlayer[id].reset = (...params) => this.reset(...params)
      }
    }
  }

  unexposePlayer(id) {
    if(typeof window !== 'undefined' && window.MSPlayer){
      if(!window.MSPlayer[id]) {
        for(let methodName in window.MSPlayer[id]) {
          delete window.MSPlayer[id][methodName]
        }
        window.MSPlayer[id] = null
      }
    }
  }

  newActionFeedbackComponent() {
    const { mode } = this.state

    return (
      mode !== PREVIEW &&
      <ActionFeedback
        key={ 'actionFeedback' }
        ref={ (ref) => this.saveRef(ref, 'actionFeedbackInstance') }
      />
    )
  }

  isAdPauseVisible(adPauseInfo) {
    if (!adPauseInfo || isEmpty(adPauseInfo)) return false
    const {
      showAdPause,
      isPlaying,
      isFullScreen,
      isFullWindow,
      isDialogShareVisible,
      genre,
      type,
      mode,
      isContentStarted,
      isContentEnded,
      isPausedByUser,
      stage,
      newAdStyle
    } = this.state
    const { isPodcast } = this.props

    const { src } = adPauseInfo
    return src && showAdPause && callAdPauseInfo(this)
      && mode !== PREVIEW && stage === PLAYBACK && type !== AUDIO_PLAYER && genre === CONTENT
      && isContentStarted && !isContentEnded && !isPlaying && isPausedByUser
      && !isDialogShareVisible && (isFullScreen || isFullWindow) && !(isPortrait() && isMobilePhone())
      && !isPodcast
      && (typeof newAdStyle === 'object' ? Object.keys(newAdStyle).length === 0 : !newAdStyle)
  }

  adPauseComponent() {
    const { adPauseUrl } = this.props
    if (!adPauseUrl) return null

    const { adPauseInfo } = this.state
    if (!adPauseInfo || isEmpty(adPauseInfo)) return null
    const { src, href } = adPauseInfo
    return this.isAdPauseVisible(adPauseInfo) ? <AdPauseContainer src={ src } link={ href } onClose={ this.onCloseAdPauseHandler } className={ isPortrait() ? 'portrait' : 'landscape' } /> : null
  }

  newAdsComponent() {
    const { logger } = this.props
    const {
      csai,
      currentTime,
      dfp: {
        disableCustomPlaybackForIOS10Plus,
        enabledPreloading,
        isCustomAdBreakEnabled,
        useStyledNonLinearAds
      },
      headerBidding,
      isAdsConsented,
      isAdsStartFailed,
      isAutoplay,
      isAutoplayWithDelayEnabled,
      isControlBarVisible,
      isLive,
      isMoatConsented,
      isMuted,
      isHeaderBiddingEnabled,
      isPermutiveConsented,
      permutive,
      keyAll,
      moat,
      mode,
      playedTime,
      platform,
      type,
      volume
    } = this.state

    return (
      (!isAdsStartFailed || isLive) &&
      mode !== PREVIEW &&
      <Ads
        adTagUrl={ this.findAdTagUrl() }
        currentTime={ currentTime }
        disableCustomPlaybackForIOS10Plus={ disableCustomPlaybackForIOS10Plus }
        enablePreloading={ enabledPreloading }
        getVideoRef={ this.getVideoRef }
        headerBidding={ headerBidding }
        isAutoplay={ isAutoplayAllowed() && ( isAutoplay || isAutoplayWithDelayEnabled ) }
        isConsented={ isAdsConsented }
        isCustomAdBreakEnabled={ isCustomAdBreakEnabled }
        isLive={ isLive }
        isLongForm={ this.findIsLongForm() }
        isMoatConsented={ isMoatConsented }
        isMuted={ isMuted }
        isHeaderBiddingEnabled={ isHeaderBiddingEnabled }
        key={ `ads-${keyAll}` }
        logger={ this.getLogger('ads') }
        moat={ moat }
        onAdEvent={ this.handleAdEvent }
        onErrorFatal={ this.startAdsFailed }
        paddingBottom={ isControlBarVisible && this.controlBarInstance ? this.controlBarInstance.getHeight() : 0 }
        platform={ platform }
        playedTime={ playedTime }
        playerType={ type }
        ref={ (ref) => this.saveRef(ref, 'adsInstance') }
        useStyledNonLinearAds={ useStyledNonLinearAds }
        volume={ volume }
      />
    )
  }

  newAnalyticsComponent() {
    const {
      ampVars,
      bluekai,
      conviva,
      carouselType,
      currentBitrate,
      currentFps,
      currentLocationIndex,
      currentTime,
      customAnalytics,
      droppedFrames,
      duration,
      editorialId,
      episodeName,
      genre,
      id,
      isAdsEnabled,
      isAmp,
      isBluekaiConsented,
      isContentEnded,
      isContentStarted,
      isFullScreen,
      isHeartbeatsEnabled,
      isLive,
      isNextBottonVisible,
      isNextVideo,
      isNextVideoPlayback,
      isOmnitureConsented,
      isPausedByUser,
      isPermutiveConsented,
      isPlaying,
      isProcessingStartOver,
      isQosAnalyticsEnabled,
      isStartOverAvailable,
      isStartOverPlayback,
      isStartPlayerRequested,
      isVideoGallery,
      keyAll,
      keyAnalytics,
      locations,
      mode,
      // Deprecated cuando se migre a Heartbeats
      omniture : {
        vars
      },
      next,
      playedTime,
      preloading,
      previousVideoTitle,
      permutive,
      selectedCardIndex,
      services,
      sessionId,
      show,
      src,
      stage,
      title,
      user,
      version,
      npaw,
      jekyllCookie
    } = this.state

    const { isSticky, v48, topVideo } = this.props
    const drm = locations[currentLocationIndex] ? locations[currentLocationIndex].drm : null
    const cdn = locations[currentLocationIndex] ? locations[currentLocationIndex].cdn : null

    return (
      mode !== PREVIEW && (
        conviva && conviva.isEnabled && isStartPlayerRequested ||
        npaw && npaw.active ||
        services[ANALYTICS].response
      ) && !isProcessingStartOver ?
      <Analytics
        ampVars={ ampVars }
        bluekai={ bluekai }
        carouselType={carouselType}
        carouselIndexClicked={selectedCardIndex}
        cdn={cdn}
        configAnalytics={ services[ANALYTICS].response }
        conviva={ conviva }
        currentBitrate={ currentBitrate }
        currentFps={ currentFps }
        currentTime={ currentTime }
        customAnalytics={ customAnalytics }
        drm={ drm }
        droppedFrames={ droppedFrames }
        duration={ duration }
        editorialId={ editorialId }
        episodeName={ episodeName }
        genre={ genre }
        getVideoRef={ this.getVideoRef }
        isAdsEnabled={ isAdsEnabled }
        isBluekaiConsented={ isBluekaiConsented }
        isContentEnded={ isContentEnded }
        isContentStarted={ isContentStarted }
        id={ id }
        isAmp={ isAmp }
        isFullScreen={ isFullScreen }
        isHeartbeatsEnabled={ isHeartbeatsEnabled }
        isLive={ isLive }
        isNextBottonVisible={ isNextBottonVisible }
        isNextVideoEnabled={next.isEnabled}
        isNextVideoPlayback={ isNextVideoPlayback }
        isNextVideo={isNextVideo}
        topVideo={ topVideo }
        isOmnitureConsented={ isOmnitureConsented }
        isPausedByUser={ isPausedByUser }
        isPermutiveConsented={ isPermutiveConsented }
        isPlaying={ isPlaying }
        isQosAnalyticsEnabled={ isQosAnalyticsEnabled }
        isStartOverAvailable={ isStartOverAvailable }
        isStartOverPlayback={ isStartOverPlayback }
        isStartPlayerRequested={ isStartPlayerRequested }
        isSticky={ isSticky }
        isVideoGallery={ isVideoGallery }
        jekyllCookie={ jekyllCookie }
        key={ 'analytics' }
        keyAnalytics={ `${keyAll}-${keyAnalytics}` }
        logger={ this.getLogger('analytics') }
        omnitureInitialVars={ vars }
        playedTime={ playedTime }
        playerApi={ this }
        playerId={ id }
        playerVersion={ version }
        preloading={ preloading }
        previousVideoTitle={previousVideoTitle}
        permutive={ permutive }
        ref={ (ref) => this.saveRef(ref, 'analyticsInstance') }
        sessionId={ sessionId }
        show={ show }
        src={ src }
        stage={ stage }
        title={ title }
        user={ user }
        v48={ v48 }
        npaw={ npaw }
      />
      :
      null
    )
  }

  newBackgroundComponent() {
    const {
      genre,
      isContentEnded,
      isContentStarted,
      isControlBarVisible,
      isPlaying,
      mode,
      theme
    } = this.state

    return (
      theme === MOBILE &&
      mode !== MITELE &&
      mode !== PREVIEW &&
      genre === CONTENT &&
      isContentStarted &&
      !isContentEnded &&
      (isControlBarVisible || !isPlaying) &&
      <Background />
    )
  }

  newFloatingTopBarComponent() {
    const { isSticky, onShrinkSticky, isShrinked, onCloseSticky} = this.props
    const { isFullScreen } = this.state
    return (
      !isFullScreen &&
      <FloatingTopBar
        isSticky={ isSticky }
        isShrinked= { isShrinked }
        onShrinkFloatingVideo = { onShrinkSticky }
        onCloseFloatingVideo = { onCloseSticky }

      />
    )
  }

  newControlBarComponent() {
    const {
      audioTracks,
      buffered,
      channelError,
      configChatButton,
      currentAudioTrack,
      currentTime,
      description,
      downloadUrl,
      duration,
      isControlBarVisible,
      isFullScreen,
      isFullWindow,
      isLive,
      isMuted,
      isPlaying,
      isProcessingChannelChange,
      isProcessingChannelChangeRecovery,
      isProcessingStartOver,
      isScrubbing,
      isSeeking,
      isShareEnabled,
      isStartOverAvailable,
      isStartOverPlayback,
      mode,
      mustPlayFullScreen,
      platform,
      playerSize,
      scrubbingPosition,
      services,
      sizeClassName,
      stage,
      subtitle,
      theme,
      type,
      volume
    } = this.state

    const { waveImage, isPodcast } = this.props

    if (isPodcast || this.canRenderControlBar()) {
      const attr = {
        audioTracks,
        buffered,
        channelError,
        configChatButton,
        currentAudioTrack,
        currentTime,
        downloadUrl,
        duration,
        isControlBarVisible: stage !== ERROR && isControlBarVisible,
        isFullScreen,
        isFullScreenEnabled: this.isFullScreenEnabled(),
        isFullWindow,
        isLive,
        isMultichannelEnabled: this.isMultichannelEnabled(),
        isMultichannelVisible: stage === ERROR || (isProcessingChannelChange && isProcessingChannelChangeRecovery),
        isMuted,
        isPlaying,
        isPodcast,
        isProcessingChannelChange,
        isProcessingStartOver,
        isScrubbing,
        isSeeking,
        isShareEnabled: isShareEnabled && Boolean(!subtitle && !description),
        isStartOverAvailable,
        isStartOverPlayback,
        multichannelConfig: this.findMultichannelConfig(),
        mustPlayFullScreen,
        onDialogShareOpen: this.openDialogShare,
        onLanguageChange: this.setAudioTrack,
        onRefreshMultichannelRequested: this.refreshMultichannel,
        onScrubbingChange: this.handleScrubbingChange,
        onScrubbingPositionChange: this.handleScrubbingPositionChange,
        onSeek: this.seek,
        onSwitchChannel: this.switchChannel,
        onToggleFullScreen: this.handleToggleFullScreenBtClick,
        onToggleMute: this.toggleMuted,
        onTogglePlay: this.togglePlay,
        onToggleStartOver: this.toggleStartOver,
        onVolumeChange: this.setVolume,
        platform,
        playerSize,
        playerType: type,
        ref: (ref) => this.saveRef(ref, 'controlBarInstance'),
        sizeClassName,
        scrubbingPosition,
        theme,
        thumbs: services[VIDEO_THUMBNAILS],
        volume,
        waveImage
      }

      if(theme === MOBILE && mode !== MITELE) {
        return <ControlBarMobile key="controlBarMobile" { ...attr } />
      } else {
        return <ControlBar key="controlBar" { ...attr } />
      }
    }
    return null
  }

  newDialogErrorComponent() {
    const { logger } = this.props
    const { error, isLive, mode, poster, posterImagizerType, sizeClassName, siteCreated, sitePublished, title } = this.state

    return (
      error &&
      (mode === PREVIEW ?
      <Poster alt={ title } poster={ poster } imagizerType={ posterImagizerType } />
      :
      <DialogError
        key="dialogError"
        error={ error }
        isLive={ isLive }
        logger={ this.getLogger('error') }
        mode={ mode }
        playerState={ this.state }
        siteCreated={ siteCreated }
        sitePublished={ sitePublished }
        sizeClassName={ sizeClassName }

      />)
    )
  }

  newDialogPauseComponent() {
    const {
      description,
      exitPlaybackBt: {
        isEnabled
      },
      genre,
      isContentEnded,
      isContentStarted,
      isDialogShareVisible,
      isPlaying,
      isProcessing,
      isToggleOn,
      mode,
      services,
      subtitle,
      title,
      contentTitle,
      type
    } = this.state

    return (
      mode !== PREVIEW &&
      type !== AUDIO_PLAYER &&
      (contentTitle || title) &&
      genre === CONTENT &&
      isContentStarted &&
      !isContentEnded &&
      !isDialogShareVisible &&
      (!isPlaying && !isToggleOn) &&
      <DialogPause
        description={ description }
        extraPaddingLeft={ isEnabled }
        isPlaying={ isPlaying }
        isProcessing={ isProcessing }
        isShareEnabled={ services[SHARE].response && mode === MITELE }
        key="dialogPause"
        onDialogShareOpen={ () => this.openDialogShare() }
        subtitle={ subtitle }
        title={ contentTitle || title }
      />
    )
  }

  newDialogRelatedComponent() {
    const {
      isDialogRelatedVisible,
      isFullScreen,
      isRelatedAutoplayEnabled,
      isRelatedEnabled,
      isShareEnabled,
      mode,
      poster,
      posterImagizerType,
      services,
      title,
      type
    } = this.state

    const relatedVideos = services[RELATED_VIDEOS].response && services[RELATED_VIDEOS].response.videos

    return (
      mode !== PREVIEW &&
      type !== AUDIO_PLAYER &&
      (isDialogRelatedVisible || !isRelatedAutoplayEnabled) && isRelatedEnabled && relatedVideos && Array.isArray(relatedVideos) && relatedVideos.length &&
      <DialogRelated
        key="dialogRelated"
        isFullScreen={ isFullScreen }
        isFullScreenEnabled={ this.isFullScreenEnabled() }
        isShareEnabled={ isShareEnabled }
        poster={ poster }
        posterImagizerType={ posterImagizerType }
        relatedVideosList={ relatedVideos }
        onDialogShareOpen={ this.openDialogShare }
        onRelatedPlay={ (attributes) => this.playNewVideo(this.parseRelatedAttributes(attributes), true) }
        onSeeAgain={ this.seeAgain }
        onToggleFullScreen={ this.toggleFullScreen }
        title={ title }
      />
    )
  }

  newDialogRelatedAutoplayComponent() {
    const {
      isFullScreen,
      isShareEnabled,
      posterImagizerType,
      services
    } = this.state

    const relatedVideos = services[RELATED_VIDEOS].response && services[RELATED_VIDEOS].response.videos

    return (
      this.isRelatedAutoplayEnabled() &&
      <DialogRelatedAutoplay
        key="dialogRelatedAutoplay"
        isFullScreen={ isFullScreen }
        isFullScreenEnabled={ this.isFullScreenEnabled() }
        isShareEnabled={ isShareEnabled }
        poster={ relatedVideos[0].poster }
        posterImagizerType={ posterImagizerType }
        title={ relatedVideos[0].title }
        onDialogRelatedOpen={ this.openDialogRelated }
        onDialogShareOpen={ this.openDialogShare }
        onNextRelatedPlay={ (canPlay) => this.playNewVideo(this.parseRelatedAttributes(relatedVideos[0]), canPlay) }
        onSeeAgain={ this.seeAgain }
        onToggleFullScreen={ this.toggleFullScreens }
      />
    )
  }

  newDialogSeeAgainComponent() {
    const {
      isFullScreen,
      isLoopEnabled,
      isRelatedEnabled,
      isShareEnabled,
      poster,
      posterImagizerType,
      isVideoGallery,
      positionNextPrev,
      isAmp,
      title
    } = this.state

    return (
      (!isRelatedEnabled && !isLoopEnabled && !isVideoGallery) || (isVideoGallery && ( isAmp || positionNextPrev === 1)) ?
      (<DialogSeeAgain
        key="dialogSeeAgain"
        isFullScreen={ isFullScreen }
        isFullScreenEnabled={ isVideoGallery ? false : this.isFullScreenEnabled() }
        isShareEnabled={ isShareEnabled }
        poster={ poster }
        posterImagizerType={ posterImagizerType }
        onSeeAgain={ this.seeAgain }
        onDialogShareOpen={ this.openDialogShare }
        onToggleFullScreen={ this.toggleFullScreen }
        title={ title }
      />): null
    )
  }

  newDialogShareComponent() {
    const { isDialogShareVisible, mode, services, type } = this.state
    const mediaType = type === AUDIO_PLAYER ? 'audio' : 'vídeo'
    const { isPodcast } = this.props

    return (
      mode !== PREVIEW &&
      services[SHARE].response && isDialogShareVisible &&
      <DialogShare
        configShare={ services[SHARE].response }
        key="dialogShare"
        isPodcast={ isPodcast }
        mediaType={ mediaType }
        onClose={ this.closeDialogShare }
        onShare={ (target) => this.propagatePlayerEvent(playerEvents.SHARE, { target }) }
      />
    )
  }

  newAudioSubtitlesIcon() {
    const {
      audioTracks,
      configChatButton,
      isControlBarVisible,
      isExitFullWindowEnabled,
      isFullScreen,
      isFullWindow,
      platform,
      subtitles: { isEnabled, isAvailable, config },
      theme,
      genre
    } = this.state

    const isCloseBottonVisible = (
      isExitFullWindowEnabled && isFullWindow && !isFullScreen)
      || (theme === MOBILE && isFullScreen)

    return (
      ((isEnabled && isAvailable && config)
      || (Array.isArray(audioTracks) && audioTracks.length > 1))
      && genre === CONTENT && isControlBarVisible
      && platform === 'mtweb' && (
        <AudioSubtitlesIcon
          key={ 'audioSubtitlesIcon' }
          audioTracks={ audioTracks }
          isChatBottonEnabled={ configChatButton && configChatButton.enabled }
          isCloseBottonVisible={ isCloseBottonVisible }
          onClick={
            isMobilePhone() || isIPad() || isTablet()
              ? this.openDialogAudioSubtitlesMobile
              : this.openDialogAudioSubtitlesDesktop
          }
          subtitlesConfig={ config }
        />
      )
    )
  }

  newDialogAudioSubtitlesMobile() {
    const {
      audioTracks,
      currentAudioTrack,
      isDialogAudioSubtitlesMobileVisible,
      platform,
      subtitles: {
        isEnabled,
        isAvailable,
        config,
        selected
      }
    } = this.state

    return (
      ((isEnabled && isAvailable && config)
      || (Array.isArray(audioTracks) && audioTracks.length > 1))
      && isDialogAudioSubtitlesMobileVisible && platform === 'mtweb'
      && (
        <DialogAudioSubtitlesMobile
          audioTracks={ audioTracks }
          config={ config }
          currentAudioTrack={ currentAudioTrack }
          key={ 'dialogAudioSubtitlesMobile' }
          onSubtitlesChange={ this.handleSubtitlesChange }
          onClose={ this.closeDialogAudioSubtitlesMobile }
          onAudioChange={ this.setAudioTrack }
          selected={ selected }
        />
      )
    )
  }

  newDialogAudioSubtitlesDesktop() {
    const {
      audioTracks,
      configChatButton,
      currentAudioTrack,
      isExitFullWindowEnabled,
      isFullScreen,
      isFullWindow,
      isDialogAudioSubtitlesDesktopVisible,
      platform,
      subtitles: {
        isEnabled,
        isAvailable,
        config,
        selected
      },
      theme
    } = this.state

    const isCloseBottonVisible = (
      isExitFullWindowEnabled && isFullWindow && !isFullScreen)
      || (theme === MOBILE && isFullScreen
      )

    return (
      ((isEnabled && isAvailable && config)
      || (Array.isArray(audioTracks) && audioTracks.length > 1))
      && isDialogAudioSubtitlesDesktopVisible && platform === 'mtweb'
      && (
        <DialogAudioSubtitlesDesktop
          audioTracks={ audioTracks }
          config={ config }
          currentAudioTrack={ currentAudioTrack }
          isChatBottonVisible={ configChatButton && configChatButton.enabled }
          isCloseBottonVisible={ isCloseBottonVisible }
          key={ 'dialogAudioSubtitlesDesktop' }
          onSubtitlesChange={ this.handleSubtitlesChange }
          onClose={ this.closeDialogAudioSubtitlesDesktop }
          onAudioChange={ this.setAudioTrack }
          selected={ selected }
        />
      )
    )
  }

  newExitFullScreenBtComponent() {
    const {
      genre,
      isControlBarVisible,
      isDialogShareVisible,
      isExitFullWindowEnabled,
      isFullScreen,
      isFullWindow,
      isPlaying,
      theme,
      adPauseInfo
    } = this.state

    const isAdPauseVisible = this.isAdPauseVisible(adPauseInfo)

    if(genre === CONTENT && !isDialogShareVisible && (isControlBarVisible || !isPlaying) && !isAdPauseVisible) {
      if(isExitFullWindowEnabled && isFullWindow && !isFullScreen) {
        return (
          <InsetBt
            description='playerExitFullWindowButton'
            key="exitFullWindowBt"
            onClick={ this.exitFullWindow }
            position={ 'TR' }
            type={ 'close' }
          />
        )
      } else if(theme === MOBILE && isFullScreen) {
        return (
          <InsetBt
            description='playerExitFullScreenButton'
            key="exitFullScreenBt"
            onClick={ this.exitFullScreen }
            position={ 'TR' }
            type={ 'close' }
          />
        )
      }
    }
    return null
  }

  newExitPlaybackBtComponent() {
    const {
      exitPlaybackBt: {
        isEnabled,
        position,
        type
      },
      genre,
      isControlBarVisible,
      isDialogShareVisible,
      isPlaying,
      isProcessing,
      stage
    } = this.state

    return (
      (
        isEnabled && (
          (
            genre === CONTENT &&
            !isProcessing &&
            (isControlBarVisible || !isPlaying) &&
            !isDialogShareVisible
          ) ||
          stage === ERROR
        )
      ) &&
      <InsetBt
        description='playerExitPlaybackButton'
        key="exitPlaybackBt"
        onClick={ this.exitPlayback }
        position={ position || 'TL' }
        type={ type || 'arrow' }
      />
    )
  }

  newFingerprintComponent() {
    const { fingerprint, playerSize, playedTime, user } = this.state

    return (
      fingerprint.isEnabled && user && user.UID &&
      <Fingerprint
        fingerprint={ fingerprint }
        key={ 'fingerprint' }
        label={ user.UID }
        playerSize= { playerSize }
        playedTime={ playedTime }
      />
    )
  }

  newKeyControlsComponent() {
    const {
      currentTime,
      duration,
      genre,
      hasFocus,
      isDialogShareVisible,
      isKeyboardControlEnabled,
      isLive,
      isScrubbing,
      mode,
      scrubbingPosition,
      stage,
      volume
    } = this.state

    return (
      mode !== PREVIEW &&
      isKeyboardControlEnabled && !isMobileAny() &&
      <KeyControls
        currentTime={ currentTime }
        duration={ duration }
        genre={ genre }
        hasFocus={ hasFocus }
        isDialogShareVisible={ isDialogShareVisible }
        isLive={ isLive }
        isScrubbing={ isScrubbing }
        key="keyControls"
        onScrubbingChange={ this.handleScrubbingChange }
        onScrubbingPositionChange={ this.handleScrubbingPositionChange }
        onSeek={ this.seek }
        onTogglePlay={ this.togglePlay }
        onUserInteraction={ this.handleUserInteraction }
        onVolumeChange={ this.setVolume }
        scrubbingPosition={ scrubbingPosition }
        stage={ stage }
        volume={ volume }
      />
    )
  }

  newNextComponent() {
    const {
      adPauseInfo,
      currentTime,
      duration,
      formatType,
      genre,
      isButtonVisible,
      isControlBarVisible,
      isPlaying,
      isVideoGallery,
      isToggleOn,
      selectedCardIndex,
      mode,
      next,
      services,
      platform,
      isEnabled
    } = this.state

    const { isAdShapeVisible } = this.props

    const isAdPauseVisible = this.isAdPauseVisible(adPauseInfo)
    const videoType = services[NEXT]?.response?.videos?.length > 0 ? services[NEXT].response.videos[0].type : ''
    const showButtonNext = mode !== PREVIEW
      && services[NEXT]?.response
      && next && next.isEnabled
      && genre === CONTENT && !isVideoGallery
    const showCarouselPlayer = showButtonNext && platform === 'mtweb' && videoType === 'video'

    return (
      ((showButtonNext || showCarouselPlayer) && !isAdShapeVisible) && (
        <div className={ `
            ${isToggleOn ? styles.containerNextCarousel : styles.foldPlayer}
            ${isControlBarVisible ? styles.aboveControlBar : styles.hideControlBar}
          ` }
        >
          <div className={ styles.secondContainer }>
            {showButtonNext
              && (
                <Next
                  config={ services[NEXT].response }
                  currentTime={ currentTime }
                  duration={ duration }
                  isControlBarVisible={ isControlBarVisible }
                  isToggleOn={ isToggleOn }
                  isPlaying={ isPlaying }
                  key={ 'nextVideo' }
                  next={ next }
                  onNext={ this.handleNextClick }
                />
              )}
            {showCarouselPlayer && isButtonVisible && formatType === 'short' && (
              <CarouselPlayer
                config={ services[NEXT].response }
                next={ next }
                currentTime={ currentTime }
                type="Top videos player"
                duration={ duration }
                isToggleOn={ isToggleOn }
                isPlaying={ isPlaying }
                isDisabled={ isAdPauseVisible }
                onToggle={ () => this.handleToogleButton() }
                onClickCardCarousel={ (index, type) => {
                  this.handleClick(index, {     
                    carouselType: type
                  })
                } }
                isControlBarVisible={ isControlBarVisible }
                selectedCardIndex={ selectedCardIndex }
                isEnabled={ isEnabled }
              />
            )}
          </div>
        </div>
      )
    )
  }

  newChatBottonComponent() {
    const {
      configChatButton,
      genre,
      isControlBarVisible,
      isExitFullWindowEnabled,
      isFullScreen,
      isFullWindow,
      theme
    } = this.state

    const isCloseBottonVisible = (isExitFullWindowEnabled && isFullWindow && !isFullScreen) || (theme === MOBILE && isFullScreen)

    return (
      genre === CONTENT && isControlBarVisible &&
      (configChatButton && configChatButton.enabled) &&
      <ChatBt
        config={ configChatButton }
        isCloseBottonVisible={ isCloseBottonVisible }
        isMobile={ isMobilePhone() }
        key="chatBotton"
        onClick={ this.handleChatBottonClick }
      />
    )
  }

  newWidgetComponent() {
    const {
      chatComponent,
      genre
    } = this.state

    return (
      genre === CONTENT &&
      <Widget
        chatComponent={ chatComponent }
        key="widget"
      />
    )
  }

  newPosterAudioComponent() {
    const { isPlaying, poster, posterImagizerType, soundWaveUrl, title, type } = this.state

    return (
      type === AUDIO_PLAYER &&
      <PosterAudio
        key="posterAudio"
        imagizerType={ posterImagizerType }
        isPlaying={ isPlaying }
        poster={ poster }
        soundWaveUrl={ soundWaveUrl }
        title={ title }
      />
    )
  }

  newPrePlayerComponent() {
    const {
      autoplayDelay,
      currentVideoId,
      downloadUrl,
      duration,
      id,
      isAutoplay,
      isAutoplayWithDelayEnabled,
      isFullScreen,
      isLive,
      isMuted,
      isPreplayerPlayInsetVisible,
      isProcessing,
      isShareEnabled,
      isVideoPlaying,
      poster,
      posterBackup,
      posterImagizerType,
      scrubbingPosition,
      title,
      type,
      volume
    } = this.state
    const { isPodcast } = this.props
    const videoPoster = !(id === currentVideoId && isVideoPlaying) && !isPodcast && poster ? poster : posterBackup
    return (
      !isProcessing &&
      <React.Fragment>
        <PrePlayer
          autoplayDelay={ autoplayDelay }
          isAutoplayEnabled={ !isAutoplay && isAutoplayWithDelayEnabled }
          isMuted={ isMuted }
          isPlayInsetBtVisible={ type !== AUDIO_PLAYER && ( typeof isPreplayerPlayInsetVisible === 'undefined' || isPreplayerPlayInsetVisible ) }
          key="prePlayer"
          onClick={ this.startPlayer }
          poster={ videoPoster }
          posterImagizerType={ posterImagizerType }
          title={ title }
        />
        {
          type === AUDIO_PLAYER &&
          <ControlBar
            downloadUrl={ downloadUrl }
            duration={ duration }
            isControlBarVisible={ true }
            isPodcast={ isPodcast }
            isFullScreen={ isFullScreen }
            isFullScreenEnabled={ this.isFullScreenEnabled() }
            isLive={ isLive }
            isMuted={ isMuted }
            isScrubBarEnabled={ false }
            isShareEnabled={ isShareEnabled }
            isVolumeEnabled={ false }
            key="prePlayerControlBar"
            onDialogShareOpen={ this.openDialogShare }
            onScrubbingChange={ this.handleScrubbingChange }
            onScrubbingPositionChange={ this.handleScrubbingPositionChange }
            onSeek={ this.seek }
            onToggleFullScreen={ this.toggleFullScreen }
            onToggleMute={ this.toggleMuted }
            onTogglePlay={ this.startPlayer }
            onToggleSubtitles={ this.toggleSubtitle }
            onVolumeChange={ this.setVolume }
            playerType={ type }
            scrubbingPosition={ scrubbingPosition }
            volume={ volume }
          />
        }
      </React.Fragment>
    )
  }

  newSeekBtsInsetComponent() {
    const {
      currentTime,
      duration,
      genre,
      isContentStarted,
      isControlBarVisible,
      isDialogShareVisible,
      isFullScreen,
      isFullWindow,
      isLive,
      isRecoveryPlay,
      isSeekInsetEnabled,
      isVideoGallery,
      theme,
      isToggleOn
    } = this.state
    const { isAdShapeVisible } = this.props

    return (
      isSeekInsetEnabled &&
      !isLive &&
      genre === CONTENT &&
      theme === MOBILE &&
      isContentStarted &&
      !isRecoveryPlay &&
      (isFullScreen || isFullWindow) &&
      !isDialogShareVisible &&
      <SeekBtsInset
        currentTime={ currentTime }
        duration={ duration }
        isVideoGallery={ isVideoGallery }
        isVisible={ isControlBarVisible }
        key="seekBtsInset"
        onClickEmpty={ !isToggleOn && this.handleClickEmpty }
        onSeek={ this.seek }
        isToggleOn={ isToggleOn }
        isAdShapeVisible={ isAdShapeVisible }
      />
    )
  }

  newVideoGalleryBtsComponent() {
    const {
      genre,
      isControlBarVisible,
      isFullScreen,
      isFullWindow,
      isVideoGallery,
      positionNextPrev,
      totalVideogallery
    } = this.state

    return (
      isVideoGallery && genre === CONTENT &&
      positionNextPrev && totalVideogallery &&
      isControlBarVisible && isMobileAny() &&
      (isFullScreen || isFullWindow) &&
      <VideoGalleryBts
        key="videoGalleryBts"
        onNext={ this.handleNextVideoClick }
        onPrevious={ this.handlePreviousVideoClick }
        positionNextPrev={ positionNextPrev }
        totalVideogallery={ totalVideogallery }
      />
    )
  }

  newSparrow() {
    const {
      isSparrowVisible,
      playerSize,
      sparrow: {
        position,
        reveal,
        room
      },
      user
    } = this.state

    return (
      isSparrowVisible && room &&
      <Sparrow
        key="sparrow"
        playerSize={ playerSize }
        position={ position }
        reveal={ reveal }
        room={ room }
        user={ user }
      />
    )
  }

  newSpinnerComponent() {
    const { isProcessing, mode, processingMessage, stage } = this.state

    return (
      mode !== PREVIEW &&
      <Spinner
        key="spinner"
        description={ processingMessage }
        descriptionDelay={ stage === ERROR ? 0 : undefined }
        iconDelay={ stage === ERROR ? 0 : undefined }
        isProcessing={ isProcessing }
      />
    )
  }

  newTooltipMessage() {
    const {
      chatComponent,
      genre,
      isAlreadyClickMessage,
      isControlBarVisible,
      isFullScreen,
      isFullWindow,
      isLive,
      platform
    } = this.state

    return (
      platform === 'multisite' &&
      isLive && isControlBarVisible &&
      genre === CONTENT && !isAlreadyClickMessage &&
      !isMobilePhone() && chatComponent &&
      !isFullScreen && !isFullWindow &&
      <Tooltip
        isMultichannelEnabled={ this.isMultichannelEnabled() }
        key="tootltip"
        onClick={ this.handleMessageClick }
      />
    )
  }

  newSubtitlesComponent() {
    const {
      currentTime,
      isControlBarVisible,
      subtitles: {
        isAvailable,
        isEnabled,
        currentSubtitles,
        selected: {
          language
        }
      }
    } = this.state

    return (
      isEnabled &&
      isAvailable &&
      currentSubtitles &&
      language !== 'none' &&
      <Subtitles
        bottom={ isControlBarVisible ? this.controlBarInstance ? this.controlBarInstance.getHeight() : 0 : 0 }
        currentTime={ currentTime }
        key="subtitles"
        logger={ this.getLogger('subtitles') }
        subtitles={ currentSubtitles }
      />
    )
  }

  newTogglePlayBtInsetComponent() {
    const {
      genre,
      isContentEnded,
      isControlBarVisible,
      isDialogShareVisible,
      isPlaying,
      isProcessing,
      isProcessingChannelChange,
      isRecoveryPlay,
      mode,
      theme,
      isToggleOn
    } = this.state
    const { isAdShapeVisible } = this.props

    return (
      mode !== PREVIEW &&
      !isProcessing &&
      genre === CONTENT &&
      !isContentEnded &&
      (!isMobileAny() || isControlBarVisible) &&
      !isDialogShareVisible &&
      !isProcessingChannelChange &&
      <TogglePlayBtInset
        key="togglePlayBtInset"
        iconType={ theme === MOBILE && mode !== MITELE ? 'no-inset' : 'inset' }
        isIconVisible={ isMobileAny() || isRecoveryPlay }
        isPlaying={ isPlaying }
        onClick={ this.togglePlay }
        onClickEmpty={ this.handleClickEmpty }
        theme={ theme }
        isToggleOn={ isToggleOn }
        isAdShapeVisible={ isAdShapeVisible }
      />
    )
  }

  newVideoComponent() {
    const {
      canPlayTimeout,
      contentUrl,
      currentLocationIndex,
      currentVideoId,
      genre,
      id,
      isContentStarted,
      isLive,
      isMuted,
      isSeeking,
      isSparrowVisible,
      isStartOverPlayback,
      isVideoPlaying,
      locations,
      mediaPlayerDash,
      poster,
      posterBackup,
      sparrow,
      stage,
      title,
      videoScaleFit,
      volume
    } = this.state

    const { isPodcast } = this.props

    let drm = locations[currentLocationIndex] && locations[currentLocationIndex].drm

    if(typeof window !== 'undefined' && window.MSPlayer && window.MSPlayer.drm) {
      drm = window.MSPlayer.drm
    }

    const videoPoster = !(id === currentVideoId && isVideoPlaying) && !isPodcast && poster && stage === PRE_PLAYER ? poster : posterBackup

    return (
      <Video
        canPlayTimeout={ canPlayTimeout }
        isPodcast={ isPodcast }
        contentId={ locations[currentLocationIndex] && locations[currentLocationIndex].contentId }
        contentUrl={ contentUrl }
        drm={ drm }
        isLive={ isLive }
        isMuted={ isMuted }
        isSeeking={ isSeeking }
        isSparrowVisible={ isSparrowVisible }
        isStartOverPlayback={ isStartOverPlayback }
        isVisible={ !!(genre !== ADS || isContentStarted) }
        key="video"
        logger={ this.getLogger('video') }
        mediaPlayerDash={ mediaPlayerDash }
        onError={ (error) => this.handleMediaEvent(mediaEvents.ERROR, error) }
        onMediaEvent={ this.handleMediaEvent }
        onMediaPlayerEvent={ this.propagateMediaPlayerEvent }
        onSrcChange={ this.handleSrcChange }
        onStreamEvent={ this.handleStreamEvent }
        playerId={ id }
        poster={ videoPoster }
        ref={ (ref) => this.saveRef(ref, 'videoInstance') }
        sparrow={ sparrow }
        title={ title }
        videoScaleFit={ videoScaleFit }
        volume={ volume }
      />
    )
  }

  newWatermarksComponent() {
    const { genre, isPlaying, mode, playerSize, type, watermarks } = this.state

    return (
      mode !== PREVIEW &&
      watermarks && genre === CONTENT && (isPlaying || type === AUDIO_PLAYER) &&
      <Watermarks
        key="watermarks"
        configWatermarks={ watermarks }
        playerSize={ playerSize }
      />
    )
  }

  newXdrComponent() {
    const {
      currentTime,
      genre,
      isPlaying,
      mode,
      services,
      user
    } = this.state

    return (
      mode !== PREVIEW
      && genre === CONTENT
      && services[XDR] && services[XDR].response
      && user && user.UID ?
        (
          <Xdr
            config={ services[XDR].response }
            currentTime={ currentTime }
            isPlaying={ isPlaying }
            key={ 'xdr' }
            logger={ this.getLogger('xdr') }
            ref={ (ref) => this.saveRef(ref, 'xdrInstance') }
            user={ user }
          />
        ) : null
    )
  }

  onResizeScreen() {
    this.recalculateSizes()
  }

  recalculateSizes(argAdShapeStyle) {
    const { newAdStyle } = this.state
    const adShapeStyle = argAdShapeStyle === undefined ? newAdStyle : argAdShapeStyle
    const { resizeStyle } = adShapeStyle ? this.onResizePlayer(adShapeStyle) : {}
    const backgroundStyle = adShapeStyle ? {
      backgroundImage: adShapeStyle.backgroundImage
    } : {}

    const stateUpdate = {
      newAdBackgrounStyle: backgroundStyle,
      newPlayerStyle: resizeStyle,
    }

    if (argAdShapeStyle !== undefined
      && (!newAdStyle || newAdStyle?.backgroundImage !== argAdShapeStyle?.backgroundImage)) {
      Object.assign(stateUpdate, {
        newAdStyle: adShapeStyle
      })
    }

    this.setState(stateUpdate)
  }

  getResizePlayer() {
    const { adShapeStyle } = this.props
    this.recalculateSizes(adShapeStyle)
    const timeOut = window.setTimeout(() => {
      this.setState({
        newAdBackgrounStyle: {},
        newPlayerStyle: {},
        newAdStyle: {}
      })
      window.clearTimeout(timeOut)
    }, adShapeStyle?.duration * 1000)
  }

  onResizePlayer(style) {
    // contain centered
    const adRatio = style?.width / style?.height;
    const screenRatio = window.innerWidth / window.innerHeight
    const scaleFactor =
      adRatio > screenRatio
        ? window.innerWidth / style?.width
        : window.innerHeight / style?.height

    const width = scaleFactor * (style?.width - style?.left - style?.right)
    const height = scaleFactor * (style?.height - style?.top - style?.bottom)
    const horizontalMargin =
      style?.left * scaleFactor +
      (adRatio > screenRatio
        ? 0
        : (window.innerWidth - scaleFactor * style?.width) / 2)
    const verticalMargin =
      style?.top * scaleFactor -
      (window.innerHeight - height) / 2 +
      (adRatio > screenRatio
        ? (window.innerHeight - scaleFactor * style?.height) / 2
        : 0)
    const transform = `translate(${horizontalMargin}px, ${verticalMargin}px)`

    // Set new player style
    const resizeStyle = {
      transform,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: 9
    }

    return { resizeStyle, size: { width, height } }
  }

  handleToogleButton = () => { 
    const { onToggleCarousel } = this.props
    const { isToggleOn } = this.state

    onToggleCarousel(!isToggleOn)

    this.setState((prevState) => ({
      isToggleOn: !prevState.isToggleOn,
      isControlBarVisible: (isMobileAny() && !prevState.isToggleOn) ? false : true
    }))

    if (!isToggleOn && !isMobileAny()) {
      this.handleUserInteraction()
    } else if (isMobileAny()) {
      this.handleClearTimeOut()
    }

  }

  handleClickPlayer() {
    const { isToggleOn } = this.state
    
    if (isToggleOn) this.handleToogleButton()
  }

  handleOnClick() {
    const { adShapeStyle, toggleAdShape } = this.props
    toggleAdShape(false)
    window.open(adShapeStyle.href, '_blank')
  }

  renderWaves() {
    const {
      isPodcast,
      waveImage
    } = this.props
    const { isPlaying } = this.state
    if (isPodcast) {
      return (
        <Waves image={ isPlaying ? `${waveImage}.gif` : `${waveImage}.png` } />
      )
    }
    return null
  }

  render() {
    const { logger, isPodcast, adShapeStyle } = this.props
    const {
      id,
      isCursorVisible,
      isFullWindow,
      poster,
      sizeClassName,
      stage,
      newAdBackgrounStyle,
      newPlayerStyle,
      isToggleOn
    } = this.state

    const wavesTag = this.renderWaves()
    let children = []

    switch(stage) {
      case PRE_PLAYER:
        children.push(
          this.newAnalyticsComponent(),
          this.newVideoComponent(),
          this.newPosterAudioComponent(),
          this.newAdsComponent(),
          this.newPrePlayerComponent(),
          this.newSpinnerComponent(),
          this.newFloatingTopBarComponent(),
          this.newNextComponent()
        )
        break

      case PLAYBACK:
        children.push(
          this.newKeyControlsComponent(),
          this.newXdrComponent(),
          this.newAnalyticsComponent(),
          this.newVideoComponent(),
          this.newSubtitlesComponent(),
          this.newFingerprintComponent(),
          this.newPosterAudioComponent(),
          this.newAdsComponent(),
          this.newBackgroundComponent(),
          this.newActionFeedbackComponent(),
          this.newDialogPauseComponent(),
          this.newTogglePlayBtInsetComponent(),
          this.newTooltipMessage(),
          this.newWatermarksComponent(),
          this.newSeekBtsInsetComponent(),
          this.newChatBottonComponent(),
          this.newWidgetComponent(),
          this.newControlBarComponent(),
          this.newExitFullScreenBtComponent(),
          this.newExitPlaybackBtComponent(),
          this.newNextComponent(),
          this.newDialogShareComponent(),
          this.newSpinnerComponent(),
          this.newSparrow(),
          this.newDialogAudioSubtitlesDesktop(),
          this.newAudioSubtitlesIcon(),
          this.newDialogAudioSubtitlesMobile(),
          this.newVideoGalleryBtsComponent(),
          this.adPauseComponent(),
        )
        break

      case END:
        children.push(
          this.newXdrComponent(),
          this.newAnalyticsComponent(),
          this.newVideoComponent(),
          this.newPosterAudioComponent(),
          this.newExitPlaybackBtComponent(),
          this.newExitFullScreenBtComponent(),
          this.newNextComponent(),
          this.newDialogSeeAgainComponent(),
          this.newDialogRelatedAutoplayComponent(),
          this.newDialogRelatedComponent(),
          this.newDialogShareComponent(),
          this.newSpinnerComponent(),
          this.newSparrow()
        )
        break

      case ERROR:
        children.push(
          this.newPosterAudioComponent(),
          this.newDialogErrorComponent(),
          this.newControlBarComponent(),
          this.newExitPlaybackBtComponent(),
          this.newExitFullScreenBtComponent(),
          this.newSpinnerComponent(),
          this.newSparrow()
        )
        break
    }

  const containerPodcast = isPodcast ? (
    <div
      className={ styles.isPodcast }
      style={ { backgroundImage: `url(${poster})` } }
      >
      { wavesTag }
    </div>
  ) : null

  const containerAdShape = adShapeStyle ? (
    <div
      onClick={ () => this.handleOnClick() }
      className={ styles.adShapeStyle }
      style={ newAdBackgrounStyle }
    />
  ) : null

    return (
      <div
        id={ id }
        className={ `videoPlayer ${styles.container} ${sizeClassName} ${isCursorVisible ? '' : 'no-cursor'} ${isFullWindow ? styles.fullWindow : ''} ${isMobilePhone() ? 'player-mobile' : ''}` }
        onClick={ isMobileAny()
          ? null 
          : isToggleOn
            ? () => this.handleToogleButton()
            : this.handleFocus
        }
        onMouseMove={ isMobileAny() ? null : this.handlePlayerMouseMove }
        onMouseOut={ isMobileAny()
          ? null 
          : !isToggleOn ? this.startHideControlsTimeout : undefined }
        onTouchEnd={ isMobileAny()
          ? isToggleOn
            ? () => this.handleClickPlayer()
            : this.handleUserInteraction
          : null }
        ref={ (ref) => this.saveRef(ref) }
      >
        { this.isDebugEnabled() && <Debug logger={ logger } playerState={ this.state } /> }
        <div style={ newPlayerStyle } className={ styles.adShapeDefault }>
          { children }
        </div>
        { containerAdShape }

        { containerPodcast }
      </div>
    )
  }
}

VideoPlayer.propTypes = {
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
    conviva: PropTypes.shape({
      purpose: PropTypes.string,
      vendor: PropTypes.string
    }),
    moat: PropTypes.shape({
      purpose: PropTypes.string,
      vendor: PropTypes.string
    }),
    omniture: PropTypes.shape({
      purpose: PropTypes.string,
      vendor: PropTypes.string
    })
  }),
  initialState: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
    PropTypes.number,
    PropTypes.object,
    PropTypes.string
  ])).isRequired,
  adPauseUrl: PropTypes.string,
  isPremium: PropTypes.bool,
  onControlBarVisibleChange: PropTypes.func,
  onError: PropTypes.func,
  onProgramChange: PropTypes.func,
  externalSites: PropTypes.arrayOf(CommonPropTypes.externalSite),
  isSticky: PropTypes.bool,
  onShrinkSticky: PropTypes.func,
  isShrinked: PropTypes.bool,
  onCloseSticky: PropTypes.func,
}

export default VideoPlayer
