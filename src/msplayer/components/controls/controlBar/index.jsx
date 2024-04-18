import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { CSSTransitionGroup as ReactCSSTransitionGroup } from 'react-transition-group'
import classNames from 'classnames/bind'
import { isIPhone, isMobileAny } from '../../../commons/userAgent'
import { playerTypes, themes } from '../../../commons/types'
import Multichannel from '../multichannel'
import LanguageControl from './languageControl'
import ScrubBar from './scrubBar'
import StartOver from './startOver'
import Timer from './timer'
import ToggleBt from './toggleBt'
import VolumeControl from './volumeControl'
import stylesAudio from './controlBarAudio.css'
import stylesVideo from './controlBarVideo.css'

const { AUDIO_PLAYER } = playerTypes
const { MOBILE } = themes

const cx = classNames.bind(stylesVideo)

export default class ControlBar extends Component {
  getHeight() {
    if (this.ref) {
      return this.ref.clientHeight
    }
    return 0
  }

  /**
   * Render button of toggle fullscreen
   * @return {Component}
   */
  renderFullScreenButton() {
    const {
      isFullScreen, isFullScreenEnabled, onToggleFullScreen, theme, isPodcast
    } = this.props

    if (!isFullScreenEnabled || (isFullScreen && theme === MOBILE) || !!isPodcast) return null

    return (
      <ToggleBt
        description={ !isFullScreen ? 'playerFullScreenOnButton' : 'playerFullScreenOffButton' }
        state={isFullScreen}
        iconNameInitial="player_icon_fullscreen_in"
        iconNameToggled="player_icon_fullscreen_out"
        onToggle={() => onToggleFullScreen()}
      />
    )
  }

  /**
   * Render button of toggle play/pause
   * @return {Component}
   */
  renderPlayButton() {
    const { isPlaying, onTogglePlay, playerType } = this.props

    return (
      <ToggleBt
        description={ isPlaying ? 'playerPauseButton' : 'playerPlayButton' }
        state={isPlaying}
        iconNameInitial={
          playerType === AUDIO_PLAYER ? 'player_icon_audio_play' : 'player_icon_play'
        }
        iconNameToggled={
          playerType === AUDIO_PLAYER ? 'player_icon_audio_pause' : 'player_icon_pause'
        }
        onToggle={() => onTogglePlay()}
      />
    )
  }

  /**
   * Render share button
   * @return {Component}
   */
  renderShareButton() {
    const { isShareEnabled, onDialogShareOpen, playerType } = this.props

    return (
      isShareEnabled
      && (
        <ToggleBt
          description='playerShareButton'
          iconNameInitial={
            playerType === AUDIO_PLAYER ? 'player_icon_audio_share' : 'player_icon_share'
          }
          onToggle={() => onDialogShareOpen()}
        />
      )
    )
  }

  /**
   * Render download button
   * @return {Component}
   */
  renderDownloadButton() {
    const { downloadUrl, playerType } = this.props

    const styles = playerType === AUDIO_PLAYER ? stylesAudio : stylesVideo

    return (
      downloadUrl
      && (
        <a className={styles.downloadLink} href={downloadUrl} download={true}>
          <ToggleBt
            iconNameInitial="player_icon_download"
            onToggle={() => onDialogShareOpen()}
          />
        </a>
      )
    )
  }

  /**
   * Render a scrub bar
   * @return {Component}
  */
  renderScrubBar() {
    const {
      buffered,
      currentTime,
      duration,
      isLive,
      isPodcast,
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

    if (isLive || isScrubBarEnabled === false) {
      return null
    }
    return (
      <ScrubBar
        buffered={ buffered }
        isPodcast={ isPodcast }
        currentTime={ currentTime }
        duration={ duration }
        isScrubbing={ isScrubbing }
        isSeeking={ isSeeking }
        playerType={ playerType }
        scrubbingPosition={ scrubbingPosition }
        thumbs={ thumbs }
        tooltipTimeOnly={ playerType === AUDIO_PLAYER }
        onScrubbingChange={ onScrubbingChange }
        onScrubbingPositionChange={ (position) => onScrubbingPositionChange(position) }
        onSeek={ onSeek }
      />
    )
  }

  /**
   * Render a timer
   * @return {Component}
   */
  renderTimer() {
    const {
      currentTime, duration, isLive, playerType
    } = this.props

    return (
      !isLive && duration > 0 && currentTime >= 0
      && (
        <Timer
          currentTime={currentTime}
          duration={duration}
          playerType={playerType}
        />
      )
    )
  }

  renderLanguageControl() {
    const { audioTracks, currentAudioTrack, onLanguageChange } = this.props

    return (
      Array.isArray(audioTracks) && audioTracks.length > 1
      && (
        <LanguageControl
          audioTracks={audioTracks}
          currentAudioTrack={currentAudioTrack}
          onLanguageChange={onLanguageChange}
        />
      )
    )
  }

  /**
   * Render a volume control bar
   * @return {Component}
   */
  renderVolumeBar() {
    const {
      isMuted,
      isVolumeEnabled,
      onToggleMute,
      onVolumeChange,
      playerType,
      volume
    } = this.props

    if (isMobileAny() || isVolumeEnabled === false) {
      return null
    }
    return (
      <VolumeControl
        isMuted={isMuted}
        playerType={playerType}
        volume={volume}
        onToggleMute={onToggleMute}
        onVolumeChange={onVolumeChange}
      />
    )
  }

  renderStartOverTag() {
    const {
      configChatButton,
      isProcessingStartOver,
      isStartOverPlayback,
      isStartOverAvailable,
      onToggleStartOver,
      playerType
    } = this.props

    if (isStartOverAvailable && !isProcessingStartOver && (configChatButton && !configChatButton.state)) {
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
      multichannelConfig,
      onRefreshMultichannelRequested,
      onSwitchChannel,
      platform,
      playerSize,
      playerType,
      sizeClassName
    } = this.props

    const styles = playerType === AUDIO_PLAYER ? stylesAudio : stylesVideo

    if (this.multichannelRenderAllowed() && (configChatButton && !configChatButton.state)) {
      return (
        <div className={styles.multichannelWrapper}>
          <Multichannel
            channels={multichannelConfig.channels}
            channelError={channelError}
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

  /**
   * Render a control bar
   * @return {Component}
   */
  render(){
    const { 
      isControlBarVisible,
      isLive,
      isMultichannelVisible,
      isProcessingChannelChange,
      isPlaying, 
      isScrubbing, 
      platform,
      playerType 
    } = this.props

    const styles = playerType === AUDIO_PLAYER ? stylesAudio : stylesVideo

    const playButtonTag = this.renderPlayButton()
    const volumeBarTag = this.renderVolumeBar()
    const startOverTag = this.renderStartOverTag()
    const timerTag = this.renderTimer()
    const languageControlTag = this.renderLanguageControl()
    const shareButtonTag = this.renderShareButton()
    const downloadButtonTag = this.renderDownloadButton()
    const fullScreenButtonTag = this.renderFullScreenButton()
    const scrubBarContainerTag = this.renderScrubBar()
    const multichannel = this.renderMultichannel()

    const controlBarTransition = {
      enter: cx({ 'controlBar__panel-enter': true }),
      enterActive: cx({ 'controlBar__panel-enter-active': true }),
      leave: cx({ 'controlBar__panel-leave': true }),
      leaveActive: cx({ 'controlBar__panel-leave-active': true }),
      appear: cx({ 'controlBar__panel-appear': true }),
      appearActive: cx({ 'controlBar__panel-appear-active': true })
    }

    const controlBarRenderAllowed = !!((isControlBarVisible || isScrubbing || !isPlaying) && isControlBarVisible !== false && !isProcessingChannelChange)
    const multichannelRenderAllowed = controlBarRenderAllowed || isMultichannelVisible
    const multiaudioRenderAllowed = platform !== 'mtweb'
    const allowedIphoneLandscape = platform === 'mtweb' && isIPhone() && !isLive

    const controlBarTag = (
      <div className={!allowedIphoneLandscape ? styles.wrapper : styles.wrapper_iphone} ref={(ref) => this.ref = ref}>
        {(controlBarRenderAllowed)
          && (
            <div className={`${styles.container} ${this.multichannelRenderAllowed() ? styles._withMultichannel : ''}`}>
              <div className={styles.background} />
              {scrubBarContainerTag}
              <div className={styles.controlsContainer}>
                <div className={styles.controlsWrapper}>
                  {startOverTag}
                  <div className={styles.controls}>
                    {playButtonTag}
                    {volumeBarTag}
                  </div>
                  <div className={styles.controls}>
                    {timerTag}
                    {multiaudioRenderAllowed && languageControlTag}
                    {downloadButtonTag}
                    {shareButtonTag}
                    {fullScreenButtonTag}
                  </div>
                </div>
              </div>
            </div>
          )}
        {multichannelRenderAllowed && multichannel}
      </div>
    )

    if (playerType === AUDIO_PLAYER) {
      return controlBarTag
    }
    return (
      <ReactCSSTransitionGroup
        className="controlBar__transitionGroup"
        transitionName={controlBarTransition}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        component={ 'div' }
      >
        {controlBarTag}
      </ReactCSSTransitionGroup>
    )
  }
}

ControlBar.propTypes = {
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
  isMultichannelEnabled: PropTypes.bool,
  isMultichannelVisible: PropTypes.bool,
  isMuted: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isProcessingChannelChange: PropTypes.bool,
  isProcessingStartOver: PropTypes.bool,
  isScrubBarEnabled: PropTypes.bool,
  isScrubbing: PropTypes.bool,
  isSeeking: PropTypes.bool,
  isShareEnabled: PropTypes.bool,
  isStartOverAvailable: PropTypes.bool,
  isStartOverPlayback: PropTypes.bool,
  isVolumeEnabled: PropTypes.bool,
  multichannelConfig: PropTypes.shape({
    refreshTime: PropTypes.number,
    channels: PropTypes.arrayOf(PropTypes.shape({
      channel: PropTypes.string,
      config: PropTypes.string,
      eventId: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
      ]),
      image: PropTypes.string
    }))
  }),
  mustPlayFullScreen: PropTypes.bool,
  onDialogShareOpen: PropTypes.func,
  onLanguageChange: PropTypes.func,
  onRefreshMultichannelRequested: PropTypes.func,
  onScrubbingChange: PropTypes.func,
  onScrubbingPositionChange: PropTypes.func,
  onSeek: PropTypes.func,
  onSwitchChannel: PropTypes.func,
  onToggleFullScreen: PropTypes.func,
  onToggleMute: PropTypes.func,
  onTogglePlay: PropTypes.func,
  onToggleStartOver: PropTypes.func,
  onVolumeChange: PropTypes.func,
  playerSize: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number
  }),
  playerType: PropTypes.string,
  sizeClassName: PropTypes.string,
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
