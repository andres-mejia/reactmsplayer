import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { genres, stages } from '../../../commons/types'

const SCRUBBING_STEP = 5
const SCRUBBING_MAX_STEP = 30
const SCRUBBING_ACCELERATION = .5
const VOLUME_STEP = .05

const { PLAYBACK } = stages
const { CONTENT } = genres

class KeyControls extends Component {
  constructor(props){
    super(props)

    this.scrubbingStepIncrement = 0

    this.handleWindowKeyDown = this.handleWindowKeyDown.bind(this)
    this.handleWindowKeyUp = this.handleWindowKeyUp.bind(this)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleWindowKeyDown)
    window.addEventListener('keyup', this.handleWindowKeyUp)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleWindowKeyDown)
    window.removeEventListener('keyup', this.handleWindowKeyUp)
  }

  doesApply(e) {
    const {
      genre,
      hasFocus,
      isDialogShareVisible,
      stage
    } = this.props

    if(stage === PLAYBACK && genre === CONTENT) {
      if(!isDialogShareVisible){
        if (hasFocus) {
          if (e.target == document.body) {
            if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
              const keyCodes = [
                32, // Space bar
                37, // Arrow left
                38, // Arrow up
                39, // Arrow right
                40  // Arrow down
              ]
              if (keyCodes.indexOf(e.keyCode) !== -1) {
                return true
              }
            }
          }
        }
      }
    }
    return false
  }

  handleWindowKeyDown(e) {
    if(this.doesApply(e)){
      e.preventDefault()

      const {
        currentTime,
        duration,
        isLive,
        isScrubbing,
        onScrubbingChange,
        onScrubbingPositionChange,
        onTogglePlay,
        onUserInteraction,
        onVolumeChange,
        scrubbingPosition,
        volume: initialVolume
      } = this.props

      let time = isScrubbing ? scrubbingPosition : currentTime
      let volume = initialVolume

      if(e.keyCode !== 32){
        if(!isLive || (e.keyCode === 38 || e.keyCode === 40)) {
          onUserInteraction()
        }
      }

      switch(e.keyCode){

        // Space bar
        case 32:
          onTogglePlay()
          break

        // Arrow left
        case 37: {
          if(!isLive) {
            onScrubbingChange(true)

            this.scrubbingStepIncrement += SCRUBBING_ACCELERATION

            let step = SCRUBBING_STEP + this.scrubbingStepIncrement
            if(step > SCRUBBING_MAX_STEP) step = SCRUBBING_MAX_STEP

            time -= step
            if(time < 0) time = 0

            onScrubbingPositionChange(time)
          }
          break
        }

        // Arrow right
        case 39: {
          if(!isLive) {
            onScrubbingChange(true)

            this.scrubbingStepIncrement += SCRUBBING_ACCELERATION

            let step = SCRUBBING_STEP + this.scrubbingStepIncrement
            if(step > SCRUBBING_MAX_STEP) step = SCRUBBING_MAX_STEP

            time += step
            if(time > duration) time = duration

            onScrubbingPositionChange(time)
          }
          break
        }

        // Arrow up
        case 38:
          volume += VOLUME_STEP
          if(volume > 1) volume = 1

          onVolumeChange(volume)
          break

        // Arrow down
        case 40:
          volume -= VOLUME_STEP
          if(volume < 0) volume = 0

          onVolumeChange(volume)
          break
      }
    }
  }

  handleWindowKeyUp(e) {
    if(this.doesApply(e)){
      e.preventDefault()

      const {
        duration,
        isLive,
        onScrubbingChange,
        onSeek,
        scrubbingPosition
      } = this.props

      this.scrubbingStepIncrement = 0

      // Arrow left
      // Arrow right

      switch(e.keyCode){
        case 37:
        case 39: {
          if(!isLive) {
            onScrubbingChange(false)

            let seekTarget = scrubbingPosition
            if(seekTarget > duration ) seekTarget = duration
            if(seekTarget < 0 ) seekTarget = 0

            onSeek(seekTarget)
          }
          break
        }
      }
    }
  }

  render(){
    return null
  }
}

KeyControls.propTypes = {
  duration: PropTypes.number,
  genre: PropTypes.string,
  hasFocus: PropTypes.bool,
  isDialogShareVisible: PropTypes.bool,
  isLive: PropTypes.bool,
  onScrubbingChange: PropTypes.func.isRequired,
  onScrubbingPositionChange: PropTypes.func.isRequired,
  onSeek: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  onUserInteraction: PropTypes.func.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  scrubbingPosition: PropTypes.number,
  stage: PropTypes.string,
  volume: PropTypes.number
}

export default KeyControls
