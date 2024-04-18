import React from 'react'
import classNames from 'classnames/bind'
import screenfull from 'screenfull'
import { PropTypes } from 'prop-types'
import Image from '../../../image'
import styles from './poster.css'

const Poster = ({
  alt, imagizerType, poster, style
}) => {
  const cx = classNames.bind(styles)
  let isImagizerEnabled = false
  let imagizer = {}

  if (imagizerType !== null) {
    isImagizerEnabled = true
    imagizer = {
      type: imagizerType
    }
  }

  return (
    <div
      className={ styles.container }
      style={ style }
    >
      <Image
        alt={ alt }
        className={ cx({ img: true, imgFullscreen: screenfull.isFullscreen }) }
        src={ poster }
        isImagizerEnabled={ isImagizerEnabled }
        imagizer={ imagizer }
      />
    </div>
  )
}

Poster.defaultProps = {
  alt: '',
  imagizerType: null,
  style: null
}

Poster.propTypes = {
  alt: PropTypes.string,
  imagizerType: PropTypes.string,
  poster: PropTypes.string.isRequired,
  style: PropTypes.objectOf(PropTypes.string)
}

export default Poster
