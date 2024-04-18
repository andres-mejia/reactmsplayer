import React from 'react'
import { PropTypes } from 'prop-types'
import DialogTransitionAppear from '../transitions/dialogTransitionAppear'
import DialogControlBar from '../dialogControlBar'
import Poster from '../../poster'
import styles from './dialogSeeAgain.css'

const DialogSeeAgain = ({
  isFullScreen,
  isFullScreenEnabled,
  isShareEnabled,
  onDialogShareOpen,
  onSeeAgain,
  onToggleFullScreen,
  poster,
  posterImagizerType,
  title
}) => (
  <DialogTransitionAppear name="dialogSeeAgain">
    { poster && <Poster alt={ title } poster={ poster } imagizerType={ posterImagizerType } /> }
    <div className={ styles.container }>
      <div className={ styles.seeAgainIcon } onClick={ () => onSeeAgain() } />
      <DialogControlBar
        isFullScreen={ isFullScreen }
        isFullScreenEnabled={ isFullScreenEnabled }
        isSeeAgainEnabled={ false }
        isShareEnabled={ isShareEnabled }
        onDialogShareOpen={ onDialogShareOpen }
        onSeeAgain={ onSeeAgain }
        onToggleFullScreen={ onToggleFullScreen }
      />
    </div>
  </DialogTransitionAppear>
)

DialogSeeAgain.propTypes= {
  isFullScreen: PropTypes.bool,
  isFullScreenEnabled: PropTypes.bool,
  isShareEnabled: PropTypes.bool,
  onDialogShareOpen: PropTypes.func,
  onSeeAgain: PropTypes.func.isRequired,
  onToggleFullScreen: PropTypes.func,
  poster: PropTypes.string,
  title: PropTypes.string
}

export default DialogSeeAgain
