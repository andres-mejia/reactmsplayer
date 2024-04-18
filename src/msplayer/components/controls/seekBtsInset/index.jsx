import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import styles from './seekBtsInset.css'

const OFFSET_SHORT = 10
const OFFSET_LONG = 30
const TIMEOUT_ANIMATION = 750

class SeekBtsInset extends Component {
  constructor(props){
    super(props)

    this.prevTapTime = 0
    this.singleTapTimeout = undefined

    this.state = {
      backwardFeedbacks: [],
      forwardFeedbacks: []
    }

    this.handleDoubleTapBackward = this.handleDoubleTapBackward.bind(this)
    this.handleDoubleTapForward = this.handleDoubleTapForward.bind(this)
    this.handleSeekBackward = this.handleSeekBackward.bind(this)
    this.handleSeekForward = this.handleSeekForward.bind(this)
  }

  findSeekOffset() {
    const { duration } = this.props

    if(isNaN(duration) || !duration || duration < 0) return OFFSET_LONG

    if(duration < 180) {
      return OFFSET_SHORT
    } else {
      return OFFSET_LONG
    }
  }

  clearDoubleTap() {
    this.prevTapTime = 0
    if(this.singleTapTimeout) window.clearTimeout(this.singleTapTimeout)
  }

  doubleTap(doubleTapCallback, singleTapCallback) {
    const DOUBLE_TAP_DELAY = 400
    const now = new Date().getTime()
    const elapsedTime = now - this.prevTapTime

    if(elapsedTime > 0 && elapsedTime < DOUBLE_TAP_DELAY){
      this.clearDoubleTap()
      doubleTapCallback() 
    } else {
      const self = this
      
      if(self.singleTapTimeout) window.clearTimeout(self.singleTapTimeout)

      this.singleTapTimeout = window.setTimeout(function() {
        self.clearDoubleTap()
        singleTapCallback()
      }, DOUBLE_TAP_DELAY)
    }
    this.prevTapTime = new Date().getTime()
  }

  isCloseToEnd() {
    const { currentTime, duration } = this.props
    
    if(currentTime && duration && currentTime >= duration - this.findSeekOffset()) {
      return true
    }
    return false
  }

  isCloseToBegin() {
    const { currentTime, duration } = this.props
    
    if(currentTime && duration && currentTime <= this.findSeekOffset()) {
      return true
    }
    return false
  }

  handleDoubleTapBackward(e) {
    const { isToggleOn } = this.props
    !isToggleOn && e.stopPropagation()
    this.doubleTap(this.handleSeekBackward, this.props.onClickEmpty)
  }

  handleDoubleTapForward(e) {
    const { isToggleOn } = this.props
    !isToggleOn && e.stopPropagation()
    this.doubleTap(this.handleSeekForward, this.props.onClickEmpty)
  }

  handleSeekBackward() {
    const { currentTime, onSeek } = this.props
    const { backwardFeedbacks } = this.state

    const seekOffset = this.findSeekOffset()

    onSeek(
      currentTime < seekOffset ? 0 : currentTime - seekOffset
    )

    const feedbackId = Math.round(Math.random() * 1000000)

    this.setState({
      backwardFeedbacks: [ ...backwardFeedbacks, feedbackId ]
    }, () => {
      window.setTimeout(() => {
        this.setState({
          backwardFeedbacks: this.state.backwardFeedbacks.filter((id) => id !== feedbackId)
        })
      }, TIMEOUT_ANIMATION)
    })
  }

  handleSeekForward() {
    const { currentTime, duration, onSeek } = this.props
    const { forwardFeedbacks } = this.state

    const seekOffset = this.findSeekOffset()

    onSeek(
      currentTime >= (duration - seekOffset) ? duration : currentTime + seekOffset
    )

    const feedbackId = Math.round(Math.random() * 1000000)

    this.setState({
      forwardFeedbacks: [ ...forwardFeedbacks, feedbackId ]
    }, () => {
      window.setTimeout(() => {
        this.setState({
          forwardFeedbacks: this.state.forwardFeedbacks.filter((id) => id !== feedbackId)
        })
      }, TIMEOUT_ANIMATION)
    })
  }

  render() {
    const { isVisible, isVideoGallery, isToggleOn } = this.props
    const { backwardFeedbacks, forwardFeedbacks } = this.state

    const seekOffset = this.findSeekOffset()
    const closeToEnd = this.isCloseToEnd()
    const closeToBegin = this.isCloseToBegin()

    return (
      <div className={ `${ styles.seekBtsInset } ${ isToggleOn && styles.containerOpacity }` }>
        <div className={ styles.seekBtContainer } onTouchEnd={ this.handleDoubleTapBackward }>
          { !!(!closeToBegin && (isVisible || backwardFeedbacks.length)) &&
            <button data-agth='playerSeekBackwardButton' className={ `${styles.seekBt} ${styles.backward} ${isVideoGallery ? `${styles.videogallery}` : ''}` } onTouchEnd={ this.handleSeekBackward }>
              {
                backwardFeedbacks.length ? 
                backwardFeedbacks.map((id) => (
                  <div key={ `backward-feedback-${id}` } className={ styles.feedback }>
                    <div key={ `backward-text-${id}` } className={ `${styles.text} ${styles.backward}` }>{ `-${seekOffset}` }</div>
                    <div key={ `backward-icon-${id}` } className={ `${styles.icon} ${styles.backward}` } />
                  </div>
                ))
                :
                <React.Fragment>
                  <div className={ styles.text }>{ `-${seekOffset}` }</div>
                  <div className={ `${styles.icon} ${styles.backward}` } />
                </React.Fragment>
              }
            </button>
          }
        </div>
        <div className={ styles.seekBtContainer } onTouchEnd={ this.handleDoubleTapForward }>
          { !!(!closeToEnd && (isVisible || forwardFeedbacks.length)) &&
            <button data-agth='playerSeekForwardButton' className={ `${styles.seekBt} ${styles.forward} ${isVideoGallery ? `${styles.videogallery}` : ''}` } onTouchEnd={ this.handleSeekForward }>
              {
                forwardFeedbacks.length ? 
                forwardFeedbacks.map((id) => (
                  <div key={ `forward-feedback-${id}` } className={ styles.feedback }>
                    <div key={ `forward-text-${id}` } className={ `${styles.text} ${styles.forward}` }>{ `+${seekOffset}` }</div>
                    <div key={ `forward-icon-${id}` } className={ `${styles.icon} ${styles.forward}` } />
                  </div>
                ))
                :
                <React.Fragment>
                  <div className={ styles.text }>{ `+${seekOffset}` }</div>
                  <div className={ styles.icon } />
                </React.Fragment>
              }
            </button>
          }
        </div>
      </div>
    )
  }

}

SeekBtsInset.propTypes = {
  currentTime: PropTypes.number,
  duration: PropTypes.number,
  isVisible: PropTypes.bool,
  onClickEmpty: PropTypes.func,
  onSeek: PropTypes.func.isRequired
}

export default SeekBtsInset