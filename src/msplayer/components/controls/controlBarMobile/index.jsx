import React from 'react'
import { PropTypes } from 'prop-types'
import { CSSTransitionGroup as ReactCSSTransitionGroup } from 'react-transition-group'
import classNames from 'classnames/bind'
import { hhmmss } from '../../../commons/util'
import { isIos } from '../../../commons/userAgent'
import { playerTypes, themes } from '../../../commons/types'
import LanguageControl from './languageControl'
import Multichannel from '../multichannel'
import ScrubBar from './scrubBar'
import StartOver from './startOver'
import styles from './controlBarMobile.css'

const { AUDIO_PLAYER } = playerTypes
const { MOBILE } = themes

const cx = classNames.bind(styles)
const controlBarTransition = {
  enter: cx({ 'controlBar__panel-enter': true }),
  enterActive: cx({ 'controlBar__panel-enter-active': true }),
  leave: cx({ 'controlBar__panel-leave': true }),
  leaveActive: cx({ 'controlBar__panel-leave-active': true }),
  appear: cx({ 'controlBar__panel-appear': true }),
  appearActive: cx({ 'controlBar__panel-appear-active': true })
}

class ControlBarMobile extends React.Component {
  getHeight() {
    if (this.ref) {
      return this.ref.clientHeight
    }
    return 0
  }

  renderToggleFullScreenBt() {
    const {
      isFullScreen,
      isFullScreenEnabled,
      onToggleFullScreen,
      platform,
      theme
    } = this.props

    const isMultisite = !!(platform && platform === 'multisite')

    if (isFullScreenEnabled
      && (!isFullScreen || theme !== MOBILE)
    ) {
      return (
        <div
          data-agth={ !isFullScreen ? 'playerFullscreenOnButton' : 'playerFullscreenOffButton' }
          className={[
            styles.bt, 
            `${styles.toggleFullScreenBt} ${this.multichannelRenderAllowed() && isMultisite ? `${styles._withMultichannel_multisite}` : '' }`,
            isFullScreen ? styles._out : styles._in].join(' ')
          }
          onClick={onToggleFullScreen}
        />
      )
    }
    return null
  }

  renderShareBt() {
    const {
      isShareEnabled,
      onDialogShareOpen
    } = this.props

    if (isShareEnabled) {
      return (
        <div
          data-agth='playerShareButton'
          className={[styles.bt, styles.shareBt, isIos() ? styles._ios : styles._android].join(' ')}
          onClick={onDialogShareOpen}
        />
      )
    }
    return null
  }

  renderDownloadBt() {
    const {
      downloadUrl
    } = this.props

    if (downloadUrl) {
      return (
        <a
          className={`${styles.bt} ${styles.downloadBt}`}
          download={true}
          href={downloadUrl}
        />
      )
    }
    return null
  }

  renderScrubBar() {
    const {
      category,
      buffered,
      currentTime,
      duration,
      isLive,
      isScrubBarEnabled,
      isScrubbing,
      isSeeking,
      onScrubbingChange,
      onScrubbingPositionChange,
      onSeek,
      playerType,
      scrubbingPosition,
      thumbs
    } = this.props

    if (!isLive && isScrubBarEnabled !== false) {
      return (
        <ScrubBar
          buffered={buffered}
          category={ category }
          currentTime={currentTime}
          duration={duration}
          isScrubbing={isScrubbing}
          isSeeking={isSeeking}
          onScrubbingChange={onScrubbingChange}
          onScrubbingPositionChange={onScrubbingPositionChange}
          onSeek={onSeek}
          playerType={playerType}
          scrubbingPosition={scrubbingPosition}
          thumbs={thumbs}
          tooltipTimeOnly={playerType === AUDIO_PLAYER}
        />
      )
    }
    return null
  }

  renderLanguageControl() {
    const {
      audioTracks,
      currentAudioTrack,
      onLanguageChange
    } = this.props

    if (Array.isArray(audioTracks) && audioTracks.length > 1) {
      return (
        <LanguageControl
          audioTracks={audioTracks}
          currentAudioTrack={currentAudioTrack}
          onLanguageChange={onLanguageChange}
        />
      )
    }
    return null
  }

  multichannelRenderAllowed() {
    const {
      isMultichannelEnabled,
      multichannelConfig
    } = this.props

    return !!(
      isMultichannelEnabled
      && multichannelConfig
      && Array.isArray(multichannelConfig.channels)
      && multichannelConfig.channels.length
    )
  }

  renderMultichannel() {
    const {
      channelError,
      configChatButton,
      isFullWindow,
      multichannelConfig,
      onRefreshMultichannelRequested,
      onSwitchChannel,
      platform,
      playerSize,
      sizeClassName
    } = this.props

    if (this.multichannelRenderAllowed() && (configChatButton && !configChatButton.state)) {
      return (
        <div className={styles.multichannelWrapper}>
          <Multichannel
            channels={multichannelConfig.channels}
            channelError={channelError}
            isFullWindow={isFullWindow}
            onRefreshRequested={onRefreshMultichannelRequested}
            onSwitchChannel={onSwitchChannel}
            platform={platform}
            playerSize={playerSize}
            refreshTimestamp={multichannelConfig.refreshTime}
            sizeClassName={sizeClassName}
          />
        </div>
      )
    } else {
      return null
    }
  }

  renderStartOverBt() {
    const {
      isProcessingStartOver,
      isStartOverAvailable,
      isStartOverPlayback,
      onToggleStartOver,
      playerType
    } = this.props

    if (isStartOverAvailable && !isProcessingStartOver) {
      return (
        <StartOver
          isStartOverPlayback={isStartOverPlayback}
          onClick={onToggleStartOver}
          playerType={playerType}
        />
      )
    }
    return null
  }

  render() {
    const {
      currentTime,
      duration,
      isControlBarVisible,
      isLive,
      isPlaying,
      isScrubbing,
      platform
    } = this.props

    const isMultisite = !!(platform && platform === 'multisite')
    const multiaudioRenderAllowed = platform !== 'mtweb'

    return (
      <ReactCSSTransitionGroup
        className="controlBar__transitionGroup"
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        transitionName={controlBarTransition}
        component={ 'div' }
      >
        {
          (isControlBarVisible || isScrubbing || !isPlaying) && isControlBarVisible !== false
            ? (
                <div className={`${styles.container} ${this.multichannelRenderAllowed() ? `${isMultisite ? `${styles._withMultichannel_multisite}` : `${styles._withMultichannel}` }`: ''}`} ref={(ref) => this.ref = ref}>
                <div className={styles.background} />
                <div className={styles.btsWrapper}>
                  <div className={styles.startOverBtWrapper}>{this.renderStartOverBt()}</div>
                  {multiaudioRenderAllowed && this.renderLanguageControl()}
                  {this.renderDownloadBt()}
                  {this.renderShareBt()}
                  {this.renderToggleFullScreenBt()}
                </div>
                {this.renderMultichannel()}
                {!isLive
                  && (
                    <div className={styles.scrubBarWrapper}>
                      <div className={styles.currentTime}>{hhmmss(currentTime)}</div>
                      {this.renderScrubBar()}
                      <div className={styles.duration}>{hhmmss(duration)}</div>
                    </div>
                  )}
              </div>
            )
            : <span />
        }
      </ReactCSSTransitionGroup>
    )
  }
}

ControlBarMobile.propTypes = {
  audioTracks: PropTypes.arrayOf(PropTypes.shape({
    index: PropTypes.number,
    label: PropTypes.string,
    language: PropTypes.string
  })),
  // v. https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/buffered
  buffered: PropTypes.shape({
    end: PropTypes.func.isRequired,
    length: PropTypes.number.isRequired,
    start: PropTypes.func.isRequired
  }),
  currentAudioTrack: PropTypes.shape({
    index: PropTypes.number,
    label: PropTypes.string,
    language: PropTypes.string
  }),
  currentTime: PropTypes.number,
  downloadUrl: PropTypes.string,
  duration: PropTypes.number,
  isControlBarVisible: PropTypes.bool,
  isFullScreen: PropTypes.bool,
  isFullScreenEnabled: PropTypes.bool,
  isLive: PropTypes.bool,
  isMuted: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isProcessingStartOver: PropTypes.bool,
  isScrubBarEnabled: PropTypes.bool,
  isScrubbing: PropTypes.bool,
  isSeeking: PropTypes.bool,
  isShareEnabled: PropTypes.bool,
  isStartOverAvailable: PropTypes.bool,
  isStartOverPlayback: PropTypes.bool,
  isVolumeEnabled: PropTypes.bool,
  mustPlayFullScreen: PropTypes.bool,
  onDialogShareOpen: PropTypes.func,
  onLanguageChange: PropTypes.func,
  onScrubbingChange: PropTypes.func,
  onScrubbingPositionChange: PropTypes.func,
  onSeek: PropTypes.func,
  onToggleFullScreen: PropTypes.func,
  onToggleMute: PropTypes.func,
  onTogglePlay: PropTypes.func,
  onToggleStartOver: PropTypes.func,
  onVolumeChange: PropTypes.func,
  playerType: PropTypes.string,
  scrubbingPosition: PropTypes.number,
  theme: PropTypes.string,
  thumbs: PropTypes.shape({
    url: PropTypes.string,
    response: PropTypes.oneOfType([
      // Lightflow
      PropTypes.shape({
        interval: PropTypes.number,
        spriteMap: (props, propName, componentName) => {
          if (!/[0-9]+x[0-9]+/.test(props[propName])) {
            return new Error(
              `Invalid prop '${propName}' supplied to '${componentName}'. Validation failed.`
            )
          }
        },
        url: (props, propName, componentName) => {
          if (!/%[0-9]+d/.test(props[propName])) {
            return new Error(
              `Invalid prop '${propName}' supplied to '${componentName}'. Validation failed.`
            )
          }
        }
      }),
      // MMC
      PropTypes.shape({
        baseUrl: PropTypes.string,
        levels: PropTypes.arrayOf(PropTypes.shape({
          numberGrid: PropTypes.number,
          thumbSize: PropTypes.shape({
            width: PropTypes.number.isRequired,
            height: PropTypes.number.isRequired
          }),
          interval: PropTypes.number.isRequired,
          id: PropTypes.string,
          matrix: PropTypes.shape({
            column: PropTypes.number.isRequired,
            height: PropTypes.number,
            rows: PropTypes.number.isRequired,
            width: PropTypes.number
          }).isRequired,
          minPlayerSize: PropTypes.shape({
            height: PropTypes.number.isRequired,
            width: PropTypes.number.isRequired
          }),
          maxPlayerSize: PropTypes.shape({
            width: PropTypes.number.isRequired,
            height: PropTypes.number.isRequired
          })
        })).isRequired
      })
    ])
  }),
  volume: PropTypes.number
}

export default ControlBarMobile
