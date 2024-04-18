import React from 'react'
import { PropTypes } from 'prop-types'
import styles from './multichannel.css'
import { isIPhone } from '../../../commons/userAgent'

const DEFAULT_REFRESH_TIME = 10 * 60 * 1000

class Multichannel extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      left: 0,
      showList: false
    }

    this.thumbsListWidth = 0

    this.handleLeft = this.handleLeft.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.handleRight = this.handleRight.bind(this)
    this.saveThumbsListWidth = this.saveThumbsListWidth.bind(this)
  }

  componentDidMount() {
    this.setRefreshTimeout()
    window.addEventListener('resize', this.handleResize)
  }

  componentDidUpdate(prevProps) {
    if(this.props.refreshTimestamp !== prevProps.refreshTimestamp) {
      this.setRefreshTimeout()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  handleResize(e) {
    const { left } = this.state

    // if(this.thumbsList) {
    //   this.thumbsListWidth = this.thumbsList.offsetWidth
    // }

    const minLeft = this.findMinLeft()
    const nextLeft = this.findCarouselStep()

    if(left < minLeft) {
      this.setState({
        left: nextLeft
      })
    } else if(left > 0) {
      this.setState({
        left: 0
      })
    }
  }

  setRefreshTimeout(props = this.props) {
    const { onRefreshRequested, refreshTimestamp } = props

    let timeout = DEFAULT_REFRESH_TIME

    if(!isNaN(refreshTimestamp) && refreshTimestamp && refreshTimestamp > 0) {
      const currentTimestamp = Date.now()
      timeout = refreshTimestamp - currentTimestamp
    }

    if(!isNaN(timeout) && timeout > 0) {
      window.setTimeout(() => onRefreshRequested && onRefreshRequested(), timeout)
    }
  }

  handleLeft(e) {
    const { left } = this.state

    let nextLeft = left + this.findCarouselStep()
    if(nextLeft > 0) nextLeft = 0

    this.setState({
      left: nextLeft
    })
  }

  handleRight(e) {
    const { left } = this.state

    const minLeft = this.findMinLeft()
    let nextLeft = left - this.findCarouselStep()
    if(nextLeft < minLeft) nextLeft = minLeft

    this.setState({
      left: nextLeft
    })
  }

  saveThumbsListWidth(ref) {
    if(!ref) {
      this.setState({ showList: false })
      return
    }
    this.thumbsList = ref
    this.thumbsListWidth = ref.offsetWidth
    this.setState({ showList: true })
  }

  findCarouselStep() {
    if(!this.thumbsListWidth) return 135
    return Math.round(this.thumbsListWidth / this.props.channels.length)
  }

  findMinLeft() {
    if(!this.thumbsListWidth) return -1000000

    const { playerSize } = this.props
    return (-1 * this.thumbsListWidth) + playerSize.width
  }

  render() {
    const { channels, channelError, isFullWindow, onSwitchChannel, platform, playerSize } = this.props
    const { left, showList } = this.state
    const isMultisite = !!(platform && platform === 'multisite')

    const thumbs = channels.map((c, index) => {
      return (
        `${c.eventId}` !== `${channelError}` &&
        <li 
          data-agth={ `playerMultichannelItem- ${index + 1}` }
          className={ `${isMultisite ? `${styles.thumb_multisite}` : `${styles.thumb}` }  `}
          key={ `${c.channel}_${c.eventId}_${index}` }
          onClick={ () => onSwitchChannel && onSwitchChannel({ ...c }) }
        > 
          <img className={ styles.image } src={ `${c.image}?w=130`} />
          <div className={ styles.color } style={{ background: c.color }} />
        </li>
      )
    })

    const center = this.thumbsListWidth <= playerSize.width

    let isLeftArrowVisible = !center
    if(left >= 0) isLeftArrowVisible = false

    let isRightArrowVisible = !center
    if(left <= this.findMinLeft()) isRightArrowVisible = false

    return (
      <div className={ `${!showList ? styles.hidden : ''} ${isMultisite && isFullWindow ? `${styles.container_multisite}` :  `${isIPhone() && !isMultisite ? `${styles.container_iphone}` : `${styles.container}` }` }` }>
        <div className={ `${styles.thumbsListWrapper} ${center ? styles._center : ''}` }>
          <ul 
            className={ styles.thumbsList } 
            ref={ this.saveThumbsListWidth } 
            style={{ left: !center ? `${left}px` : null }}
          >
            { thumbs }
          </ul>
        </div>
        { isLeftArrowVisible &&
          <div data-agth={ 'playerLeftMultichannelButton' } className={ `${isMultisite ? `${styles.arrow_multisite}` : `${isIPhone() ? `${styles.arrow_iphone}` : `${styles.arrow}` }` } ${styles._left}` } onClick={ this.handleLeft }>
            <div className={ styles.icon } />
          </div>
        }
        { isRightArrowVisible &&
          <div data-agth={ 'playerRightMultichannelButton' } className={ `${isMultisite ? `${styles.arrow_multisite}` : `${isIPhone() ? `${styles.arrow_iphone}` : `${styles.arrow}` }` } ${styles._right}` } onClick={ this.handleRight }>
            <div className={ styles.icon } />
          </div>
        }
      </div>
    )
  }
}

Multichannel.propTypes = {
  channels: PropTypes.arrayOf(PropTypes.shape({
    channel: PropTypes.string,
    config: PropTypes.string,
    eventId: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    image: PropTypes.string
  })),
  onRefreshRequested: PropTypes.func,
  onSwitchChannel: PropTypes.func,
  playerSize: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number
  }),
  refreshTimestamp: PropTypes.number,
  sizeClassName: PropTypes.string
}

export default Multichannel
