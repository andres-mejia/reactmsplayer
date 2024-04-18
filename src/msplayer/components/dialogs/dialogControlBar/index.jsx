import React from 'react'
import { PropTypes } from 'prop-types'
import { isIos, isMobileAny } from '../../../commons/userAgent'
import styles from './dialogControlBar.css'

const DialogControlBar = ({
  isFullScreen,
  isFullScreenEnabled,
  isSeeAgainEnabled,
  isShareEnabled,
  onToggleFullScreen,
  onSeeAgain,
  onDialogShareOpen
}) => (
  <div className={ styles.container }>
    { isSeeAgainEnabled &&
      <div className={ `${styles.btsGroup} ${styles.left}` }>
        <button 
          className={ `${styles.bt} ${styles.seeAgainBt}` } 
          onClick={ isMobileAny() ? null : onSeeAgain }
          onTouchEnd={ isMobileAny() ? onSeeAgain : null }
          title="Ver otra vez" 
        />
      </div>
    }
    <div className={ `${styles.btsGroup} ${styles.right}` }>
      { isShareEnabled &&
        <button 
          data-agth={ 'playerShareButton' }
          className={ `${styles.bt} ${styles.openShareDialogBt} ${isIos() ? `${styles._ios}` : '' }` }
          onClick={ isMobileAny() ? null : onDialogShareOpen }
          onTouchEnd={ isMobileAny() ? onDialogShareOpen : null }
          title="Abrir opciones de compartir" 
        />
      }
      { isFullScreenEnabled && (
        isFullScreen ?
          <button 
            data-agth={ 'playerExitFullScreenButton' }
            className={ `${styles.bt} ${styles.exitFullScreenBt}` } 
            onClick={ isMobileAny() ? null : onToggleFullScreen }
            onTouchEnd={ isMobileAny() ? onToggleFullScreen : null }
            title="Salir de pantalla completa" 
          />
          :
          isIos() && 
          <button 
            data-agth={ 'playerEnterFullScreenButton' }
            className={ `${styles.bt} ${styles.enterFullScreenBt}` } 
            onClick={ isMobileAny() ? null : onToggleFullScreen }
            onTouchEnd={ isMobileAny() ? onToggleFullScreen : null }
            title="Pantalla completa"
          />
        )
      }
    </div>
  </div>
)

DialogControlBar.propTypes= {
  isFullScreen: PropTypes.bool,
  isFullScreenEnabled: PropTypes.bool,
  isSeeAgainEnabled: PropTypes.bool,
  isShareEnabled: PropTypes.bool,
  onToggleFullScreen: PropTypes.func,
  onSeeAgain: PropTypes.func,
  onDialogShareOpen: PropTypes.func
}

export default DialogControlBar
