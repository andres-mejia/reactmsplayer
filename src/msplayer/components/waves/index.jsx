import React from 'react'
import styles from './waves.css'

const Waves = ({ image }) => (
  <div className={ styles.container }>
    <img
      alt={ 'audio' }
      src={ image }
    />
  </div>
)

export default Waves
