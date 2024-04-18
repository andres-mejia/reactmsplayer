import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { stages } from '../../commons/types'
import Bluekai from './bluekai'
import Conviva from './conviva'
import Gfk from './gfk'
import Omniture from './omniture'
import Npaw from './npaw'
import Permutive from './permutive'

class Analytics extends Component {

  reset() {
    if(this.bluekaiInstance){
      this.bluekaiInstance.reset()
    }
    if(this.omnitureInstance){
      this.omnitureInstance.reset()
    }
    if(this.convivaInstance){
      this.convivaInstance.reset()
    }
    if(this.npawInstance){
      this.npawInstance.reset()
    }
    if(this.gfkInstance){
      this.gfkInstance.reset()
    }
    if(this.permutiveInstance){
      this.permutiveInstance.reset()
    }
  }

  handleAdEvent(eventType, params){
    if(this.bluekaiInstance){
      this.bluekaiInstance.handleEvent(eventType, { ...params })
    }
    if(this.omnitureInstance){
      this.omnitureInstance.handleEvent(eventType, { ...params })
    }
    if(this.convivaInstance){
      this.convivaInstance.handleEvent(eventType, { ...params })
    }
    if(this.npawInstance){
      this.npawInstance.handleEvent(eventType, { ...params })
    }
    if(this.gfkInstance){
      this.gfkInstance.handleEvent(eventType, { ...params })
    }
    if(this.permutiveInstance){
      this.permutiveInstance.handleEvent(eventType, { ...params })
    }
  }

  handleContentEvent(eventType, params){
    if(this.bluekaiInstance){
      this.bluekaiInstance.handleEvent(eventType, { ...params })
    }
    if(this.omnitureInstance){
      this.omnitureInstance.handleEvent(eventType, { ...params })
    }
    if(this.convivaInstance){
      this.convivaInstance.handleEvent(eventType, { ...params })
    }
    if(this.npawInstance){
      this.npawInstance.handleEvent(eventType, { ...params })
    }
    if(this.gfkInstance){
      this.gfkInstance.handleEvent(eventType, { ...params })
    }
    if(this.permutiveInstance){
      this.permutiveInstance.handleEvent(eventType, { ...params })
    }
  }

  handleMediaEvent(eventType, params){
    if(this.gfkInstance){
      this.gfkInstance.handleEvent(eventType, { ...params })
    }
    if(this.permutiveInstance){
      this.permutiveInstance.handleEvent(eventType, { ...params })
    }
  }

  handleMediaPlayerEvent(eventType, params){
    if(this.npawInstance){
      this.npawInstance.handleEvent(eventType, { ...params })
    }
  }

  handlePlayerEvent(eventType, params){
    if(this.bluekaiInstance) {
      this.bluekaiInstance.handleEvent(eventType, { ...params })
    }
    if(this.convivaInstance) {
      this.convivaInstance.handleEvent(eventType, { ...params })
    }
    if(this.omnitureInstance) {
      this.omnitureInstance.handleEvent(eventType, { ...params })
    }
    if(this.npawInstance){
      this.npawInstance.handleEvent(eventType, { ...params })
    }
  }

  handleStreamEvent(eventType, params){
    if(this.convivaInstance) {
      this.convivaInstance.handleEvent(eventType, { ...params })
    }
    if(this.omnitureInstance) {
      this.omnitureInstance.handleEvent(eventType, { ...params })
    }
    if(this.npawInstance){
      this.npawInstance.handleEvent(eventType, { ...params })
    }
    if(this.gfkInstance) {
      this.gfkInstance.handleEvent(eventType, { ...params })
    }
    if(this.permutiveInstance){
      this.permutiveInstance.handleEvent(eventType, { ...params })
    }
  }

  saveRef(ref, propertyName){
    if(ref){
      this[propertyName] = ref
    }
  }

  render(){
    const {
      ampVars,
      bluekai,
      carouselType,
      carouselIndexClicked,
      cdn,
      configAnalytics,
      conviva,
      currentBitrate,
      currentFps,
      currentTime,
      customAnalytics,
      drm,
      droppedFrames,
      duration,
      editorialId,
      episodeName,
      genre,
      getVideoRef,
      id,
      isAmp,
      isAdsEnabled,
      isBluekaiConsented,
      isContentStarted,
      isFullScreen,
      isHeartbeatsEnabled,
      isLive,
      isNextBottonVisible,
      isNextVideoEnabled,
      isNextVideoPlayback,
      isNextVideo,
      topVideo,
      isOmnitureConsented,
      isPausedByUser,
      isPermutiveConsented,
      isQosAnalyticsEnabled,
      isStartOverPlayback,
      isStartPlayerRequested,
      isSticky,
      isVideoGallery,
      keyAnalytics,
      logger,
      omnitureInitialVars,
      playerApi,
      playerId,
      playerVersion,
      preloading,
      previousVideoTitle,
      permutive,
      show,
      src,
      stage,
      title,
      user,
      v48,
      npaw,
      jekyllCookie
    } = this.props

    return (
      <div className="analytics">
        { isBluekaiConsented && bluekai && bluekai.isEnabled && stage !== stages.END && configAnalytics && configAnalytics.bluekai &&
          <Bluekai
            config={ { ...configAnalytics.bluekai, ...customAnalytics.bluekai } }
            genre={ genre }
            isLive={ isLive }
            key={ `bluekai-${keyAnalytics}` }
            logger={ logger.factory('analytics', 'bluekai') }
            ref={ (ref) => this.saveRef(ref, 'bluekaiInstance') }
            siteCode={ bluekai.siteCode }
            title={ title }
            uid={ user && user.UID ? user.UID : typeof window !== 'undefined' && window.mspage && window.mspage.getGigyaUID && window.mspage.getGigyaUID() }
          />
        }
        { isQosAnalyticsEnabled && conviva && conviva.isEnabled && isStartPlayerRequested && stage !== stages.END &&
          <Conviva
            allowUncaughtExceptions={ conviva.allowUncaughtExceptions }
            configAnalytics={ configAnalytics }
            currentBitrate={ currentBitrate }
            currentFps={ currentFps }
            customerKey={ conviva.customerKey }
            defaultResource={ conviva.defaultResource }
            duration={ duration }
            gatewayUrl={ conviva.gatewayUrl }
            genre={ genre }
            editorialId={ editorialId }
            episodeName={ episodeName }
            isContentStarted={ isContentStarted }
            isEnabledAds={ conviva.isEnabledAds }
            isLive={ isLive }
            isStartOverPlayback={ isStartOverPlayback }
            key={ `conviva-${keyAnalytics}` }
            logger={ logger.factory('analytics', 'conviva') }
            logLevel={ conviva.logLevel }
            playerApi={ playerApi }
            playerId={ `${playerId}` }
            playerVersion={ playerVersion }
            preloading={ preloading }
            ref={ (ref) => this.saveRef(ref, 'convivaInstance') }
            show={ show }
            src={ src }
            title={ title }
            user={ user }
            viewerId={ user && user.UID }
          />
        }
        { isOmnitureConsented && stage !== stages.END && configAnalytics && configAnalytics.omniture
          && 
          <Omniture
            ampVars={ ampVars }
            carouselType={carouselType}
            carouselIndexClicked={carouselIndexClicked}
            config={ configAnalytics.omniture }
            currentBitrate={ currentBitrate }
            currentFps={ currentFps }
            currentTime={ currentTime }
            customConfig={ customAnalytics && customAnalytics.omniture }
            droppedFrames={ droppedFrames }
            duration={ duration }
            getVideoRef={ getVideoRef }
            initialVars={ omnitureInitialVars }
            isFullScreen={ isFullScreen }
            isHeartbeatsEnabled={ isHeartbeatsEnabled }
            isLive={ isLive }
            isNextBottonVisible={ isNextBottonVisible }
            isNextVideoPlayback={ isNextVideoPlayback }
            isNextVideoEnabled={isNextVideoEnabled}
            isNextVideo={isNextVideo}
            topVideo={topVideo}
            isPausedByUser={ isPausedByUser }
            isStartOverPlayback={ isStartOverPlayback }
            isSticky={ isSticky }
            isVideoGallery={ isVideoGallery }
            jekyllCookie={ jekyllCookie }
            key={ `omniture-${keyAnalytics}` }
            keyAnalytics={ keyAnalytics }
            logger={ logger.factory('analytics', 'omniture') }
            previousVideoTitle={previousVideoTitle}
            ref={ (ref) => this.saveRef(ref, 'omnitureInstance') }
            title={ title }
            user={ user }
            v48={v48}
          />
        }
        { isQosAnalyticsEnabled && npaw && npaw.active &&
          <Npaw
            config={ configAnalytics }
            cdn={ cdn }
            drm={ drm }
            duration={ duration }
            episodeName={ episodeName }
            isAdsEnabled={ isAdsEnabled }
            isLive={ isLive }
            isStartOverPlayback={ isStartOverPlayback }
            key={ `npaw` }
            logger={ logger.factory('analytics', 'npaw') }
            playerVersion={ playerVersion }
            preloading={ preloading }
            ref={ (ref) => this.saveRef(ref, 'npawInstance') }
            src={ src }
            title={ title }
            userId={ user && user.UID }
            user={ user }
            npaw={ npaw }
          />
        }
        { stage !== stages.END && (configAnalytics?.gfk) &&
          <Gfk
            config={ (configAnalytics?.gfk) }
            duration={ duration }
            editorialId={ editorialId }
            genre={ genre }
            getVideoRef={ getVideoRef }
            id={ id }
            isFullScreen={ isFullScreen }
            isLive={ isLive }
            logger={ logger.factory('analytics', 'gfk') }
            ref={ (ref) => this.saveRef(ref, 'gfkInstance') }
            src={ src }
            show={ configAnalytics?.omniture?.eVar41 }
            title={ title }
          />
        }
        { permutive && permutive.isEnabled && isPermutiveConsented && isStartPlayerRequested && stage !== stages.END &&
          <Permutive 
            duration={ duration }
            genre={ genre }
            getVideoRef={ getVideoRef }
            videoValues={ {
              ...permutive,
              ...(configAnalytics && configAnalytics.omniture && { title: configAnalytics.omniture.eVar20 }),
              ...(configAnalytics && configAnalytics.bluekai && configAnalytics.bluekai.category && { genre: configAnalytics.bluekai.category }),
            } }
            isLive={ isLive }
            logger={ logger.factory('analytics', 'permutive') }
            ref={ (ref) => this.saveRef(ref, 'permutiveInstance') }
            user={ user }
        />}
      </div>
    )
  }
}

Analytics.propTypes = {
  bluekai: PropTypes.shape({
    isEnabled: PropTypes.bool,
    siteCode: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    uid: PropTypes.string
  }),
  configAnalytics: PropTypes.shape({
    comscore: PropTypes.object,
    gfk: PropTypes.object,
    omniture: PropTypes.object
  }),
  conviva: PropTypes.shape({
    allowUncaughtExceptions: PropTypes.bool,
    customerKey: PropTypes.string,
    defaultResource: PropTypes.string,
    gatewayUrl: PropTypes.string,
    isEnabled: PropTypes.bool,
    isEnabledAds: PropTypes.bool,
    logLevel: PropTypes.string
  }),
  currentBitrate: PropTypes.number,
  currentFps: PropTypes.number,
  currentTime: PropTypes.number,
  customAnalytics: PropTypes.shape({
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
      })
    })
  }),
  drm: PropTypes.shape({
    certificate: PropTypes.string,
    keySystem: PropTypes.string,
    license: PropTypes.string
  }),
  droppedFrames: PropTypes.number,
  duration: PropTypes.number,
  editorialId: PropTypes.string,
  episodeName: PropTypes.string,
  genre: PropTypes.string,
  isAdsEnabled: PropTypes.bool,
  isBluekaiConsented: PropTypes.bool,
  isContentEnded: PropTypes.bool,
  isContentStarted: PropTypes.bool,
  isFullScreen: PropTypes.bool,
  isHeartbeatsEnabled: PropTypes.bool,
  isLive: PropTypes.bool,
  isNextVideoPlayback: PropTypes.bool,
  isOmnitureConsented: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isQosAnalyticsEnabled: PropTypes.bool,
  isStartOverPlayback: PropTypes.bool,
  isStartPlayerRequested: PropTypes.bool,
  isSticky: PropTypes.bool,
  keyAnalytics: PropTypes.string,
  logger: PropTypes.object,
  omnitureInitialVars: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string
  ])),
  playedTime: PropTypes.number,
  playerApi: PropTypes.object,
  playerId: PropTypes.string,
  playerVersion: PropTypes.string,
  preloading: PropTypes.shape({
    isEnabled: PropTypes.bool,
    level: PropTypes.string,
    limit: PropTypes.limit,
    type: PropTypes.string
  }),
  sessionId: PropTypes.string,
  show: PropTypes.string,
  src: PropTypes.string,
  stage: PropTypes.string,
  title: PropTypes.string,
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
          color: PropTypes.string,
      }),
      images: PropTypes.shape({
        id: PropTypes.string,
        src: PropTypes.string
      })
    })
  }),
  npaw: PropTypes.shape({
    accountId: PropTypes.string,
    active: PropTypes.bool,
    dash: PropTypes.string,
    hls: PropTypes.string,
    html5: PropTypes.string,
    ima: PropTypes.string,
    shaka: PropTypes.string
  }),
  jekyllCookie: PropTypes.string
}

export default Analytics
