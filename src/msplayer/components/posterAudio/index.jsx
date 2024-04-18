import React from 'react'
import { PropTypes } from 'prop-types'
import Image from '../../../image'
import Poster from '../poster'
import styles from './posterAudio.css'

const PosterAudio = ({ imagizerType, isPlaying, poster, soundWaveUrl, title }) => {
  let isImagizerEnabled = false
  let imagizer = {}

  if(imagizerType !== null){
    isImagizerEnabled = true
    imagizer = {
      type: imagizerType
    }
  }

  return (
    <div className="poster-audio">
    { poster ?
        <Poster alt={ title } poster={ poster } imagizerType={ imagizerType } />
      :
        <div className={ styles.bck } />
    }
    { soundWaveUrl && isPlaying &&
        <Image
          alt={ title }
          className={ styles.soundWave }
          src={ soundWaveUrl }
          isImagizerEnabled={ isImagizerEnabled }
          imagizer={ imagizer }
        />
    }
    </div>
  )
}

PosterAudio.propTypes = {
  imagizerType: PropTypes.string,
  isPlaying: PropTypes.bool,
  poster: PropTypes.string.isRequired,
  soundWaveUrl: PropTypes.string,
  title: PropTypes.string
}

export default PosterAudio
