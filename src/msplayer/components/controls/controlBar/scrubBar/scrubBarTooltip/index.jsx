import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { hhmmss } from '../../../../../commons/util'
import { playerTypes } from '../../../../../commons/types'
import ThumbsLightflow from './thumbsLightflow'
import styles from './scrubBarTooltip.css'

const { AUDIO_PLAYER } = playerTypes

const ScrubBarTooltip = ({
  config,
  left,
  maxLeft,
  minLeft,
  playerType,
  timeOnly,
  timeSeconds,
  urlBase
}) => {

  // ThumbsLightflow & Bitmovin
  if(!timeOnly && playerType !== AUDIO_PLAYER && config && config.spriteMap && config.interval && config.url) {
    return(
      <ThumbsLightflow
        config={ config }
        left={ left }
        maxLeft={ maxLeft }
        minLeft={ minLeft }
        timeSeconds={ timeSeconds }
      />
    )

  // Time only
  } else {
    return (
      <div
        className={ styles.tooltip }
        style={{ left }}
      >
        <div className={ styles.time }>{ hhmmss(timeSeconds) || '--:--' }</div>
      </div>
    )
  }
}

ScrubBarTooltip.propTypes = {
  config: PropTypes.oneOfType([
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
  ]),
  left: PropTypes.number,
  maxLeft: PropTypes.number,
  minLeft: PropTypes.number,
  timeSeconds: PropTypes.number.isRequired,
  urlBase: PropTypes.string
}

export default ScrubBarTooltip
