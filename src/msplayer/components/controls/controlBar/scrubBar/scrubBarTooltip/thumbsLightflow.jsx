import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { hhmmss, mergeQueryStringParams } from '../../../../../commons/util'
import styles from './thumbsLightflow.css'

class ThumbsLightflow extends Component {
  constructor(props) {
    super(props)

    this.container = undefined
  }

  render() {
    const { config, maxLeft, minLeft, timeSeconds } = this.props
    let { left } = this.props

    if(this.container) {
      const containerWidth = this.container.offsetWidth
      const containerHeight = this.container.offsetHeight

      left = left - (containerWidth / 2)
      if(left > maxLeft - containerWidth) {
        left = maxLeft - containerWidth
      } else if(left < minLeft) {
        left = minLeft
      }

      const spriteMap = config.spriteMap.split('x')
      const numColumns = parseInt(spriteMap[0])
      const numRows = parseInt(spriteMap[1])
      const maxTimeMatrix = config.interval * numColumns * numRows
      const grid = parseInt(timeSeconds / maxTimeMatrix) + 1
      const index = ( grid > 1 ) ? (
        parseInt( (maxTimeMatrix * (grid - 1) - timeSeconds) / config.interval )
      ) : (
        parseInt(timeSeconds / config.interval)
      )
      const offset = typeof config.offset !== 'undefined' ? config.offset : 0
      const row = parseInt(index / numRows)
      const column = index - (row * numRows)
      const imageWidth = containerWidth * numColumns
      const imageHeight = containerHeight * numRows

      const className = numColumns === 1 && numRows === 1 ? styles.image : undefined
      const style = numColumns > 1 || numRows > 1 ? {
        height: imageHeight,
        left: -Math.abs(containerWidth * column),
        position: 'absolute',
        top: -Math.abs(containerHeight * row),
        width: imageWidth
      } : undefined

      let source = ''
      let thumbName = `${Math.trunc(timeSeconds / maxTimeMatrix)}`
      let numDigits = config.url.match(/%([0-9]+)d/i)
      if(numDigits) {
        // Lightflow
        numDigits = parseInt(numDigits[1])

        while(thumbName.length < numDigits) {
          thumbName = `0${thumbName}`
        }

        source = mergeQueryStringParams(config.url.replace(/%[0-9]+d/i, thumbName), { w: imageWidth })
      } else {
        // Bitmovin
        const url = config.url.replace('%number%', thumbName)
        source = mergeQueryStringParams(url, { w: imageWidth })
      }

      return(        
        <div
          className={ styles.scrubBarThumb }
          ref={ (ref) => this.container = ref }
          style={{ left }}
        >
          <div className={ styles.imageWrapper }>
            { imageWidth !== 0 && <img
              className={ className }
              src={ source }
              style={ style }
              role="presentation"
            />
            }
          </div>
          <div className={ styles.time }>{ hhmmss(timeSeconds) || '' }</div>
        </div>
      )
    }

    return (
      <div
        className={ styles.scrubBarThumbGhost }
        ref={ (ref) => this.container = ref }
      />
    )
  }
}

ThumbsLightflow.propTypes = {
  config: PropTypes.shape({
    firstThumb: PropTypes.number,
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
  left: PropTypes.number,
  maxLeft: PropTypes.number,
  minLeft: PropTypes.number,
  timeSeconds: PropTypes.number.isRequired
}

export default ThumbsLightflow
