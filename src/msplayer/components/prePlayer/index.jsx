import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { waitFor } from '../../commons/util'
import { isAutoplayAllowed, isIos } from '../../commons/userAgent'
import Poster from '../poster'
import styles from './prePlayer.css'

const AUTOPLAY_PROGRESS_START_DELAY = 500

class PrePlayer extends Component {
  constructor(props) {
    super(props)

    const { isAutoplayEnabled, isMuted } = props

    this.autoplay = isAutoplayEnabled && (isAutoplayAllowed() || isMuted)

    this.state = {
      isAutoplayVisible: false,
      isAutoplayCancelled: false
    }

    this.handlePlay = this.handlePlay.bind(this)
    this.handleCancelAutoplay = this.handleCancelAutoplay.bind(this)
  }

  componentDidMount() {
    const { autoplayDelay } = this.props

    if(this.autoplay) {
      waitFor( () => (this.svgRef && this.svgRef.clientWidth > 1 && this.svgRef.clientHeight > 1) ).then(
        () => this.setState({
          isAutoplayVisible: true
        }, () => {
          this.autoplayTimeout = window.setTimeout(() => this.handlePlay(), autoplayDelay + AUTOPLAY_PROGRESS_START_DELAY)
        }),
        () => {
          this.svgRef.style.width = '60px'
          this.svgRef.style.height = '60px'

          this.setState({
            isAutoplayVisible: true
          })
        }
      )
    }
  }

  handlePlay() {
    const { onClick } = this.props

    if(this.autoplayTimeout) {
      window.clearTimeout(this.autoplayTimeout)
    }

    onClick()
  }

  handleCancelAutoplay(e) {
    e.stopPropagation()

    if(this.autoplayTimeout) {
      window.clearTimeout(this.autoplayTimeout)
    }

    this.setState({
      isAutoplayCancelled: true
    })
  }

  saveSvgRef(ref) {
    if(ref) {
      this.svgRef = ref
    }
  }

  render() {
    const { autoplayDelay, isPlayInsetBtVisible, poster, posterImagizerType, title } = this.props
    const { isAutoplayCancelled, isAutoplayVisible } = this.state

    const boxWidth = 32
    const strokeWidth = 1.25
    const radius = boxWidth / 2 - strokeWidth
    const perimeter = 2 * Math.PI * radius
    return (
      <div className={ `${styles.container} plusContentWall` } onClick={ this.handlePlay }>
        { poster ?
            <Poster alt={ title } poster={ poster } imagizerType={ posterImagizerType } />
          :
            <div className={ styles.bck } />
        }
        { isPlayInsetBtVisible ?
            this.autoplay && !isAutoplayCancelled ?
              <div className={ styles.progressBarContainer }>
                <svg
                  viewBox={ `0 0 ${boxWidth} ${boxWidth}` }
                  version="1.1"
                  ref={ (ref) => this.saveSvgRef(ref) }
                >
                  <circle
                    cx={ boxWidth / 2 }
                    cy={ boxWidth / 2 }
                    r={ radius }
                    fillOpacity="0"
                    stroke="#ffffff"
                    strokeWidth={ strokeWidth }
                    strokeOpacity="0.32"
                  />
                  <circle
                    cx={ -boxWidth / 2 }
                    cy={ boxWidth / 2 }
                    r={ radius }
                    fillOpacity="0"
                    stroke="#ffffff"
                    strokeWidth={ strokeWidth }
                    strokeDasharray={ perimeter }
                    strokeDashoffset={ perimeter }
                    style={{
                      animation: isAutoplayVisible ? `${autoplayDelay}ms linear ${AUTOPLAY_PROGRESS_START_DELAY}ms forwards ${styles.dashAnimation} ` : null,
                      transform: 'rotate(-90deg)'
                    }}
                  />
                  <path
                    d="M11.838 7.281c-0.040-0.040-0.159-0.081-0.239-0.081-0.199 0-0.399 0.162-0.399 0.404v16.317c0 0.202 0.159 0.404 0.399 0.404 0.080 0 0.199-0.040 0.239-0.081l12.002-8.158c0.080-0.040 0.16-0.162 0.16-0.323s-0.080-0.242-0.16-0.323l-12.002-8.158z"
                    fill="#ffffff"
                  />
                </svg>
                { isAutoplayVisible ?
                    <button
                      className={ styles.cancelBt }
                      onClick={ this.handleCancelAutoplay }>
                      CANCELAR
                    </button>
                  :
                    null
                }
              </div>
            :
              <div data-agth={ 'playerPreplayer' } className={ styles.playIcon } />
          :
            null
        }
      </div>
    )
  }
}

PrePlayer.propTypes = {
  autoplayDelay: PropTypes.number,
  isAutoplayEnabled: PropTypes.bool,
  isPlayInsetBtVisible: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  poster: PropTypes.string,
  title: PropTypes.string
}

export default PrePlayer
