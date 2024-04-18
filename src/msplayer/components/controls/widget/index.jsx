import React from 'react'
import styles from './widget.css'

const Widget = ({ chatComponent }) => (
  <div className={ styles.container } >
    { chatComponent }
  </div>
)

export default Widget