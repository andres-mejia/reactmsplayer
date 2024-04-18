import React from 'react'
import { PropTypes } from 'prop-types'
import styles from './tooltip.css'

const Tooltip = ({ isMultichannelEnabled, onClick }) => {
  return (
    <div className={ `${styles.container} ${isMultichannelEnabled ? ` ${styles.multichannel}` : '' }` }>
      <p className={ styles.info } >Reproduce el directo en pantalla completa para ver el chat</p>
      <a
        className={ styles.link } 
        onClick={ onClick } >ENTENDIDO
      </a>
    </div>
  )
}

Tooltip.propTypes = {
  isMultichannelEnabled: PropTypes.bool,
  onClick: PropTypes.func
}

export default Tooltip
