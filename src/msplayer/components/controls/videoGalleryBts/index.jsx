import React from 'react'
import { PropTypes } from 'prop-types'
import styles from './videoGalleryBts.css'

const VideoGalleryBts = ({ onNext, onPrevious, positionNextPrev, totalVideogallery }) => {
  return (
    <div className={ styles.bts }>
       <div className={ styles.btContainer } >
        { positionNextPrev > 1 &&
          <button className={ `${styles.button}` } onClick={ onPrevious }>
            {
              <div className={ `${styles.icon} ${styles.previous}` } />
            }
          </button>
        }
       </div>
        <div className={ styles.btContainer } >
        { positionNextPrev < totalVideogallery &&
          <button className={ `${styles.button}` } onClick={ onNext }>
            {
              <div className={ `${styles.icon}` } />
            }
          </button>
        }
      </div>
    </div>
  )
}

VideoGalleryBts.propTypes = {
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
  positionNextPrev: PropTypes.number,
  totalVideogallery: PropTypes.number
}

export default VideoGalleryBts