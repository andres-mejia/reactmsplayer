import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import DialogTransitionAppear from '../transitions/dialogTransitionAppear'
import DialogControlBar  from '../dialogControlBar'
import { isIos } from '../../../commons/userAgent'
import Poster from '../../poster'
import styles from './dialogRelatedAutoplay.css'

class DialogRelatedAutoplay extends Component {
  constructor(props){
    super(props)

    this.state = {
      remainingTime: 6
    }

    this.handleDialogRelatedOpen = this.handleDialogRelatedOpen.bind(this)
    this.handleDialogShareOpen = this.handleDialogShareOpen.bind(this)
    this.handleNextRelatedPlay = this.handleNextRelatedPlay.bind(this)
    this.handleSeeAgain = this.handleSeeAgain.bind(this)
    this.handleTimerChange = this.handleTimerChange.bind(this)
  }

  componentDidMount() {
    this.playTimer()
  }

  componentDidUpdate(prevProps) {
    if(prevProps.isDialogShareVisible && !this.props.isDialogShareVisible) {
      this.playTimer()
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  playTimer() {
    if(this.timer) clearInterval(this.timer)
    this.timer = setInterval(this.handleTimerChange, 1000)
  }

  handleDialogShareOpen() {
    const { onDialogShareOpen } = this.props

    clearInterval(this.timer)

    onDialogShareOpen()
  }

  handleDialogRelatedOpen() {
    clearInterval(this.timer)

    this.props.onDialogRelatedOpen()
  }

  handleNextRelatedPlay(forcePlay) {
    clearInterval(this.timer)
    const canPlay = isIos() ? forcePlay : true

    this.props.onNextRelatedPlay(canPlay)
  }

  handleSeeAgain() {
    clearInterval(this.timer)

    this.props.onSeeAgain()
  }

  handleTimerChange() {
    let { remainingTime } = this.state

    if(remainingTime > 1) {
      this.setState({
        remainingTime: --remainingTime
      })
    } else {
      this.handleNextRelatedPlay(false)
    }
  }

  render() {
    const {
      isFullScreen,
      isFullScreenEnabled,
      isShareEnabled,
      onToggleFullScreen,
      poster,
      posterImagizerType,
      title
    } = this.props

    const { remainingTime } = this.state

    return (
      <DialogTransitionAppear name="dialogRelatedAutoplay">
        { poster && <Poster alt={ title } poster={ poster } imagizerType={ posterImagizerType } /> }
        <div className={ styles.container }>
          <div className={ styles.cellWrapper }>
            <div className={ styles.cell }>
              <div className={ styles.title }>{ title }</div>
              <button className={ styles.playBt } onClick={ this.handleNextRelatedPlay } title="Reproducir siguiente vídeo" />
              <div className={ styles.timer }>{ `El próximo vídeo se reproducirá en ${remainingTime} segundos` }</div>
              <button className={ styles.openRelatedDialogBt } onClick={ this.handleDialogRelatedOpen }>{ 'Ver todos los relacionados' }</button>
            </div>
          </div>
          <DialogControlBar
            isFullScreen={ isFullScreen }
            isFullScreenEnabled={ isFullScreenEnabled }
            isSeeAgainEnabled={ true }
            isShareEnabled={ isShareEnabled }
            onDialogShareOpen={ () => this.handleDialogShareOpen() }
            onSeeAgain={ () => this.handleSeeAgain() }
            onToggleFullScreen={ onToggleFullScreen }
          />
        </div>
      </DialogTransitionAppear>
    )
  }
}

DialogRelatedAutoplay.propTypes = {
  isDialogShareVisible: PropTypes.bool,
  isFullScreen: PropTypes.bool,
  isFullScreenEnabled: PropTypes.bool,
  isShareEnabled: PropTypes.bool,
  onDialogRelatedOpen: PropTypes.func.isRequired,
  onDialogShareOpen: PropTypes.func.isRequired,
  onNextRelatedPlay: PropTypes.func.isRequired,
  onSeeAgain: PropTypes.func.isRequired,
  onToggleFullScreen: PropTypes.func.isRequired,
  poster: PropTypes.string,
  title: PropTypes.string
}

export default DialogRelatedAutoplay
