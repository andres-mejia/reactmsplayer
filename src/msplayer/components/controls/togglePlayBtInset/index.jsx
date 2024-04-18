import React from 'react'
import { PropTypes } from 'prop-types'
import { isMobileAny } from '../../../commons/userAgent'
import { themes } from '../../../commons/types'
import styles from './togglePlayBtInset.css'

const { MOBILE } = themes

const TogglePlayBtInset = ({ iconType, isIconVisible, isPlaying, onClick, onClickEmpty, theme, isToggleOn, isAdShapeVisible }) => {
  const handleClick = (e) => {
    !isToggleOn && e.stopPropagation()

    if(onClick) onClick(e)
  }

  const handleClickEmpty = (e) => {
    !isToggleOn && e.stopPropagation()

    if(onClickEmpty) onClickEmpty(e)
  }

  return (
    <div
      className={`${ styles.container } ${ isToggleOn && !isAdShapeVisible && styles.containerOpacity }`}
      onClick={ theme === MOBILE ? null : handleClick }
      onTouchEnd={ theme === MOBILE ? handleClickEmpty : isMobileAny() ? handleClick : null }
    >
      { isIconVisible &&
        <div 
          data-agth={ isPlaying ? 'playerPauseInsetButton' : 'playerPlayInsetButton' }
          className={ `${isPlaying ? styles.pauseIcon : styles.playIcon} ${styles[iconType]} ${isMobileAny() ? `${styles.touchDevice}` : '' }` }
          onTouchEnd={ theme === MOBILE ? handleClick : null}
        />
      }
    </div>
  )
}

TogglePlayBtInset.propTypes= {
  isIconVisible: PropTypes.bool,
  isPlaying: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onClickEmpty: PropTypes.func
}

export default TogglePlayBtInset
