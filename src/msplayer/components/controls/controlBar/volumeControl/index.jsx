import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { playerTypes } from '../../../../commons/types'
import { getMousePosition, getElementPosition } from '../../../../commons/util'
import ToggleBt from '../toggleBt'
import stylesAudio from './volumeControlAudio.css'
import stylesVideo from './volumeControlVideo.css'

export default class VolumeControl extends Component {

  /**
   * React lifecycle
   */
  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
  }

  /**
   * Handler event mousedown
   */
  handleMouseDown() {
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
  }

  /**
   * Handler event mousemove
   */
  handleMouseMove = (e) => {
    this.moveVolumeElement(getElementPosition(this.ref), getMousePosition(e))
  }

  /**
   * Handler event mouseup
   */
  handleMouseUp = (e) => {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)

    this.moveVolumeElement(getElementPosition(this.ref), getMousePosition(e))
  }

  /**
   * Handler for volume bar movement
   */
  moveVolumeElement(element, mousePosition){
    const { onVolumeChange, volume: previousVolume } = this.props

    if(mousePosition) {
      const elementWidth = this.ref.offsetWidth
      const elementFinalPx = element.x + elementWidth

      let volume = -1

      if(mousePosition.x >= elementFinalPx){
        volume = 1
      } else if( mousePosition.x <= element.x){
        volume = 0
      } else {
        volume = (mousePosition.x - element.x) / elementWidth
      }

      if(volume !== previousVolume) {
        onVolumeChange(volume)
      }
    }
  }

  saveRef(ref){
    if(ref){
      this.ref = ref
    }
  }

  /**
   * Render button of toggle mute/unmute volume
   * @return {Component}
   */
  renderButtonVolume(){
    const { isMuted, onToggleMute, playerType } = this.props

    return(
      <ToggleBt
        description={ !isMuted ? 'playerMutedButton' : 'playerUnmutedButton' }
        state={ isMuted }
        iconNameInitial={
          playerType === playerTypes.AUDIO_PLAYER ? 'player_icon_audio_volume' : 'player_icon_volume'
        }
        iconNameToggled={
          playerType === playerTypes.AUDIO_PLAYER ? 'player_icon_audio_mute' : 'player_icon_mute'
        }
        onToggle={ () => onToggleMute() }
      />
    )
  }

  /**
   * Render a volume bar
   * @return {Component}
   */
  render(){
    const { isMuted, playerType, volume } = this.props

    const styles = playerType === playerTypes.AUDIO_PLAYER ? stylesAudio : stylesVideo

    const buttonVolumeTag = this.renderButtonVolume()
    const volumePercentage = isMuted ? '0%' : (`${volume * 100}%`)

    return (
      <div className={ styles.container }>
        { buttonVolumeTag }
        <div
          data-agth='playerVolumeBar'
          className={ styles.volumeBarContainer }
          draggable={ false }
          onMouseDown={ () => this.handleMouseDown() }
          ref={ (ref) => this.saveRef(ref) }
        >
          <div className={ styles.volumeBarBck } />
          <div
            className={ styles.volumeBarValueContainer }
            style={ { width: volumePercentage } }
          >
            <div className={ styles.volumeBarValue } />
          </div>
        </div>
      </div>
    )
  }
}

VolumeControl.propTypes= {
  isMuted: PropTypes.bool,
  onToggleMute: PropTypes.func.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  playerType: PropTypes.string,
  volume: PropTypes.number.isRequired
}
