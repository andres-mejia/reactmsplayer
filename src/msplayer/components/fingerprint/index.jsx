import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import styles from './fingerprint.css'

const Fingerprint = ({ fingerprint, label, playerSize, playedTime }) => {

  const findVisible = (i = 1) => {
    const { duration, interval } = fingerprint

    if(!isNaN(duration) && duration > 0 && !isNaN(interval) && interval > 0) {
      if(playedTime > interval * i + duration) {
        return findVisible(++i)
      } else if(playedTime >= interval * i && playedTime <= interval * i + duration) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }
  
  const fingerPrintStyle = {
      fontSize: `${Math.round((playerSize.width*21)/1280)}px`,
  };

  return (
    findVisible() &&
    <div style = {fingerPrintStyle} className={ styles.container }>{ label }</div>
  )
}

Fingerprint.propTypes = {
  fingerprint: PropTypes.shape({
    duration: PropTypes.number,
    interval: PropTypes.number
  }),
  label: PropTypes.string,
  playerSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  playedTime: PropTypes.number
}

export default Fingerprint
