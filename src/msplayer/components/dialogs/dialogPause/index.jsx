import React from 'react'
import { PropTypes } from 'prop-types'
import DialogTransitionAppear from '../transitions/dialogTransitionAppear'
import styles from './dialogPause.css'

/**
 * Render a pause dialog
 * @return {Component}
 */
const DialogPause = ({
  description,
  extraPaddingLeft,
  isPlaying,
  isProcessing,
  isShareEnabled,
  onDialogShareOpen,
  subtitle,
  title
}) => {
  return(
    <DialogTransitionAppear name="dialogPause">
      { !isPlaying && !isProcessing &&
        <div className={ styles.container }>
          <div className={ styles.background } />
          <div className={ `${styles.textWrapper}${extraPaddingLeft ? ` ${styles.extraPaddingLeft}` : ''}` }>
            <div className={ styles.titleWrapper }>
              <div className={ styles.title }>
                { title }
              </div>
              { isShareEnabled &&
                <button className={ styles.shareBt } onClick={ onDialogShareOpen } />
              }
            </div>
            { (subtitle || description) &&
              <div className={ styles.subtitleWrapper }>
                { subtitle &&
                  <div className={ styles.subtitle }>
                    { subtitle }
                  </div>
                }
                { description &&
                  <div className={ styles.description }>
                    { description }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </DialogTransitionAppear>
  )

}

DialogPause.propTypes= {
  description: PropTypes.string,
  extraPaddingLeft: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isProcessing: PropTypes.bool,
  isShareEnabled: PropTypes.bool,
  onDialogShareOpen: PropTypes.func,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired
}

export default DialogPause
