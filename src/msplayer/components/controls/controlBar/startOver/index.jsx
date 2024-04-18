import React from 'react'
import { PropTypes } from 'prop-types'
import { isMobileAny } from '../../../../commons/userAgent'
import styles from './startOver.css'

const StartOver = ({ isStartOverPlayback, onClick }) => {
  return (
    <button
      className={ [
        styles.container, 
        isStartOverPlayback ? styles.startOver : '', 
        isMobileAny() ? styles.mobile : styles.desktop
      ].join(' ') }
      data-agth={ isStartOverPlayback ? 'playerGoLiveButton' : 'playerStartOverButton' }
      draggable={ false }
      onClick={ onClick }
    >
      <div className={ styles.icon } />
      <div className={ styles.text }>
        { isStartOverPlayback ? 'Ir al directo' : 'Ver desde el inicio' }
      </div>
    </button>
  )
}

StartOver.propTypes= {
  isStartOverPlayback: PropTypes.bool,
  onClick: PropTypes.func
}

export default StartOver
