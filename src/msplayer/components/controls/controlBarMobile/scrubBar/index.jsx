import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { playerTypes } from '../../../../commons/types'
import { getMousePosition, getElementPosition } from '../../../../commons/util'
import { isMobileAny } from '../../../../commons/userAgent'
import ScrubBarTooltip from './scrubBarTooltip'
import stylesAudio from './scrubBarAudio.css'
import stylesVideo from './scrubBarVideo.css'

const { AUDIO_PLAYER } = playerTypes

class ScrubBar extends Component  {
  constructor(props){
    super(props)

    this.state = {
      isOverScrubBar: false
    }
  }

  /**
   * React lifecycle
   */
  componentWillUnmount(){
    document.removeEventListener('mousemove', this.handleDocumentMove)
    document.removeEventListener('mouseup', this.handleDocumentUp)

    this.scrubBar.removeEventListener('mousemove', this.handleScrubBarMove)
  }

  /**
   * Calcule the width percentage of scrubBar with one scrubbingPosition
   * @return { Number }
   */
  getBufferPercentage(buffered) {
    const { currentTime, duration } = this.props

    if (buffered && buffered.length > 0) {
      for (let i = buffered.length - 1; i >= 0; i--) {
        const bufferTimeStart = buffered.start(i)
        const bufferTimeEnd = buffered.end(i)

        if (currentTime >= bufferTimeStart && currentTime <= bufferTimeEnd) {
          return ((bufferTimeEnd / duration) * 100)
        }
      }
    }
  }

  handleScrubBarOver() {
    this.setState({
      isOverScrubBar: true
    })
    this.scrubBar.addEventListener('mousemove', this.handleScrubBarMove)
  }

  handleScrubBarOut(){
    this.scrubBar.removeEventListener('mousemove', this.handleScrubBarMove)

    this.setState({
      isOverScrubBar: false
    })
  }

  handleScrubBarDown(e) {
    const { onScrubbingChange } = this.props

    this.setState({
      isOverScrubBar: true
    })

    this.updateScrubbingPosition(e)

    onScrubbingChange(true)

    if(isMobileAny()) {
      document.removeEventListener('touchmove', this.handleDocumentMove)
      document.removeEventListener('touchend', this.handleDocumentUp)
      document.removeEventListener('touchcancel', this.handleDocumentUp)

      document.addEventListener('touchmove', this.handleDocumentMove)
      document.addEventListener('touchend', this.handleDocumentUp)
      document.addEventListener('touchcancel', this.handleDocumentUp)
    } else {
      this.scrubBar.removeEventListener('mousemove', this.handleScrubBarMove)
      document.removeEventListener('mousemove', this.handleDocumentMove)
      document.removeEventListener('mouseup', this.handleDocumentUp)

      document.addEventListener('mousemove', this.handleDocumentMove)
      document.addEventListener('mouseup', this.handleDocumentUp)
    }
  }

  handleScrubBarMove = (e) => {
    this.updateScrubbingPosition(e)
  }

  handleDocumentMove = (e) => {
    this.updateScrubbingPosition(e)
  }

  handleDocumentUp = (e) => {
    const { onScrubbingChange, onSeek, scrubbingPosition } = this.props

    if(isMobileAny()) {
      document.removeEventListener('touchmove', this.handleDocumentMove)
      document.removeEventListener('touchend', this.handleDocumentUp)
      document.removeEventListener('touchcancel', this.handleDocumentUp)

      this.setState({
        isOverScrubBar: false
      })
    } else {
      document.removeEventListener('mousemove', this.handleDocumentMove)
      document.removeEventListener('mouseup', this.handleDocumentUp)
    }

    this.updateScrubbingPosition(e)

    onScrubbingChange(false)

    onSeek(scrubbingPosition)
  }

  /**
   * Calcule the width percentage of scrubBar with one scrubbingPosition
   */
  updateScrubbingPosition = (e) => {
    const { duration, onScrubbingPositionChange } = this.props

    const mousePosition = getMousePosition(e.touches ? e.touches[0] : e)

    if(mousePosition) {
      const scrubBarPosition = getElementPosition(this.scrubBar)
      const scrubBarWidth = this.scrubBar.offsetWidth

      // Calculate percentage duration
      const maxBar = scrubBarPosition.x + scrubBarWidth
      const minBar = scrubBarPosition.x

      let ratio = 0

      if(mousePosition.x >= maxBar){
        ratio = 1
      } else if( mousePosition.x <= minBar){
        ratio = 0
      } else {
        ratio = (mousePosition.x - scrubBarPosition.x) / scrubBarWidth
      }

      // Dispatch action to set scrubbingPosition
      onScrubbingPositionChange(duration * ratio)
    }
  }

  /**
   * Render a thumbnail
   * @return { Component }
   */
  renderThumbnailTag(){
    const { isOverScrubBar } = this.state
    const {
      duration,
      isScrubbing,
      playerType,
      scrubbingPosition,
      thumbs,
      tooltipTimeOnly
    } = this.props

    if( thumbs && thumbs.response && (isOverScrubBar || isScrubbing) ) {
      const scrubBarWidth = this.scrubBar.offsetWidth
      const left = scrubBarWidth * (scrubbingPosition / duration)

      return (
        <ScrubBarTooltip
          config={ thumbs.response }
          left={ left }
          maxLeft={ scrubBarWidth }
          minLeft={ 0 }
          playerType={ playerType }
          timeOnly={ tooltipTimeOnly }
          timeSeconds={ scrubbingPosition }
          urlBase={ thumbs.url }
        />
      )
    } else {
      return null
    }
  }

  /**
   * Render a scrub bar
   * @return { Component }
   */
  render(){
    const {
      buffered,
      currentTime,
      duration,
      isSeeking,
      isScrubbing,
      scrubbingPosition,
      playerType
    } = this.props

    const styles = playerType === AUDIO_PLAYER ? stylesAudio : stylesVideo

    const currentTimePercentage = isScrubbing || isSeeking ? (
      `${((scrubbingPosition / duration) * 100)}%`
    ) : (
      `${((currentTime / duration) * 100)}%`
    )
    const bufferPercentage = `${this.getBufferPercentage(buffered)}%`
    const thumbnailTag = this.renderThumbnailTag()

    return (
      <div className={ styles.container } >
        <div
          data-agth='playerScrubBar'
          className={ styles.scrubBar }
          onMouseDown={ isMobileAny() ? null : (e) => this.handleScrubBarDown(e) }
          onMouseOver={ isMobileAny() ? null : () => this.handleScrubBarOver() }
          onMouseOut={ isMobileAny() ? null : () => this.handleScrubBarOut() }
          onTouchStart={ isMobileAny() ? (e) => this.handleScrubBarDown(e) : null }
          ref={ (scrubBar) => this.scrubBar = scrubBar }
        />
        <div
          className={ styles.playbackBar }
          style={ { width: currentTimePercentage } }
        >
          <div className={ styles.scrubber } />
          { thumbnailTag }
        </div>
        <div
          className={ styles.bufferBar }
          style={ { width: bufferPercentage } }
        />
      </div>
    )
  }
}

ScrubBar.propTypes= {
  // v. https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/buffered
  buffered: PropTypes.shape({
    end: PropTypes.func.isRequired,
    length: PropTypes.number.isRequired,
    start: PropTypes.func.isRequired
  }),
  currentTime: PropTypes.number,
  duration: PropTypes.number,
  isSeeking: PropTypes.bool,
  isScrubbing: PropTypes.bool,
  onScrubbingChange: PropTypes.func,
  onScrubbingPositionChange: PropTypes.func,
  onSeek: PropTypes.func,
  playerType: PropTypes.string,
  scrubbingPosition: PropTypes.number,
  thumbs: PropTypes.shape({
    url: PropTypes.string,
    response: PropTypes.oneOfType([
      // Lightflow
      PropTypes.shape({
        interval: PropTypes.number,
        spriteMap: (props, propName, componentName) => {
          if(!/[0-9]+x[0-9]+/.test(props[propName])) {
            return new Error(
              `Invalid prop '${propName}' supplied to '${componentName}'. Validation failed.`
            )
          }
        },
        url: (props, propName, componentName) => {
          if(!/%[0-9]+d/.test(props[propName])) {
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
  tooltipTimeOnly: PropTypes.bool
}

export default ScrubBar
