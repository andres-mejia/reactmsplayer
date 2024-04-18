import React from 'react'
import { PropTypes } from 'prop-types'
import { hhmmss } from '../../../../commons/util'
import styles from './timer.css'

/**
 * Render a timer
 * @return {Component}
 */
const Timer = ({ currentTime, duration }) => {
  return (
    <div
      className={ styles.container }
      draggable={ false }
    >
      { `${hhmmss(currentTime)} / ${hhmmss(duration)}` }
    </div>
  )
}

Timer.propTypes= {
  currentTime: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired
}

export default Timer
