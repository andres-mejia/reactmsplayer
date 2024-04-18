import React from 'react'
import { PropTypes } from 'prop-types'
import styles from './watermarks.css'

const Watermarks = ({ configWatermarks, playerSize }) => {
  let children = []

  configWatermarks.forEach( (watermark, index) => {
    if(watermark.imageUrl) {
      if(!watermark.position) {
        watermark.position = 'TR'
      }
      children.push(
        <li className={ styles[watermark.position] } key={ index }>
          {
            watermark.link ?
              <a href={ watermark.link }>
                <img
                  className={ styles[watermark.position] }
                  src={ watermark.imageUrl }
                  role="presentation"
                />
              </a>
            :
              <img
                className={ styles[watermark.position] }
                src={ watermark.imageUrl }
                role="presentation"
              />
          }
        </li>
      )
    }
  })

  let inlineStyle = null
  if(playerSize && playerSize.width && playerSize.height) {
    if(playerSize.width/playerSize.height > 16/9) {
      inlineStyle = {
        height: `${Math.round(playerSize.height)}px`,
        padding: '0',
        width: `${Math.round(playerSize.height * 16/9)}px`
      }
    }
  }

  return (
    <div className={ styles['wrapper'] }>
      <div className={ styles.container } style={ inlineStyle  }>
        <ul>
          { children }
        </ul>
      </div>
    </div>
  )
}

Watermarks.propTypes = {
  configWatermarks: PropTypes.arrayOf(PropTypes.object).isRequired,
  playerSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  })
}

export default Watermarks
