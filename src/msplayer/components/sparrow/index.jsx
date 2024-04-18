import React, { useReducer } from 'react'
import { PropTypes } from 'prop-types'
import styles from './sparrow.css'

const Sparrow = ({ playerSize, position, reveal, room, user }) => {
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
    room &&
    <div className={ styles['wrapper'] }>
      <div className={ styles['container'] } style={ inlineStyle }>
        <div 
          className={[
            styles['content'],
            styles[room],
            styles[position]
          ].join(' ')}
        >
          { reveal && user.UID ? <span className={ styles['text'] }>{ user.UID }</span> : null }
        </div>
      </div>
    </div>
  )
}

Sparrow.propTypes = {
  position: PropTypes.string,
  room: PropTypes.string
}

Sparrow.defaultProps = {
  position: 'TR'
}

export default Sparrow
