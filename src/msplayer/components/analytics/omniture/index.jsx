import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import Heartbeats from './heartbeats'

class Omniture extends Component {
  reset() {
    if (this.heartbeatsInstance) {
      this.heartbeatsInstance.reset()
    }
  }

  handleEvent(eventType, params) {
    if (this.heartbeatsInstance) {
      this.heartbeatsInstance.handleEvent(eventType, params)
    }
  }

  saveRef(ref, propertyName) {
    if (ref) {
      this[propertyName] = ref
    }
  }

  render() {
    const {
      ampVars,
      carouselType,
      carouselIndexClicked,
      config,
      currentBitrate,
      currentFps,
      currentTime,
      customConfig,
      droppedFrames,
      duration,
      getVideoRef,
      initialVars,
      isFullScreen,
      isHeartbeatsEnabled,
      isLive,
      isNextBottonVisible,
      isNextVideoPlayback,
      isNextVideo,
      topVideo,
      isNextVideoEnabled,
      isPausedByUser,
      isStartOverPlayback,
      isSticky,
      isVideoGallery,
      keyAnalytics,
      logger,
      previousVideoTitle,
      title,
      user,
      v48,
      jekyllCookie
    } = this.props

    return (
      <div className={ 'omniture' }>
        { isHeartbeatsEnabled
        && (
          <Heartbeats
            ampVars={ ampVars }
            carouselType={ carouselType }
            carouselIndexClicked={ carouselIndexClicked }
            config={ config }
            currentBitrate={ currentBitrate }
            currentFps={ currentFps }
            currentTime={ currentTime }
            customConfig={ customConfig }
            droppedFrames={ droppedFrames }
            duration={ duration }
            getVideoRef={ getVideoRef }
            initialVars={ initialVars }
            isFullScreen={ isFullScreen }
            isLive={ isLive }
            isNextBottonVisible={ isNextBottonVisible }
            isNextVideoPlayback={ isNextVideoPlayback }
            isNextVideo={ isNextVideo }
            topVideo={ topVideo }
            isNextVideoEnabled={ isNextVideoEnabled }
            isPausedByUser={ isPausedByUser }
            isStartOverPlayback={ isStartOverPlayback }
            isSticky={ isSticky }
            isVideoGallery={ isVideoGallery }
            jekyllCookie={ jekyllCookie }
            key={ `heartbeats-${keyAnalytics}` }
            logger={ logger.factory('analytics', 'heartbeats') }
            previousVideoTitle={ previousVideoTitle }
            ref={ (ref) => this.saveRef(ref, 'heartbeatsInstance') }
            title={ title }
            user={ user }
            v48={ v48 }
          />
        )}
      </div>
    )
  }
}

Omniture.propTypes = {
  config: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.object,
    PropTypes.string
  ])).isRequired,
  currentBitrate: PropTypes.number,
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
  initialVars: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string
  ])),
  isFullScreen: PropTypes.bool,
  isHeartbeatsEnabled: PropTypes.bool,
  isLive: PropTypes.bool,
  isNextVideoPlayback: PropTypes.bool,
  isPausedByUser: PropTypes.bool,
  isStartOverPlayback: PropTypes.bool,
  jekyllCookie: PropTypes.string,
  keyAnalytics: PropTypes.string,
  logger: PropTypes.object,
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

export default Omniture
