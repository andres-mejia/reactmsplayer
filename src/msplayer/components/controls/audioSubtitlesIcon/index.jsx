import React from 'react'
import { PropTypes } from 'prop-types'
import styles from './audioSubtitlesIcon.css'
import { isMobileAny, isMobilePhone } from '../../../commons/userAgent'

const AudioSubtitlesIcon = ({
  audioTracks, isChatBottonEnabled, isCloseBottonVisible, onClick, subtitlesConfig
}) => {
  const getclassName = () => {
    if (isCloseBottonVisible) {
      if (isChatBottonEnabled) {
        return isMobilePhone() ? styles.bt_chat_close_mobile : styles.bt_chat_close
      } else {
        return isMobileAny() ? styles.bt_close_mobile : styles.bt_close
      }
    } else {
      if(isChatBottonEnabled) {
        return isMobilePhone() ? styles.bt_chat_mobile : styles.bt_chat
      } else {
        return isMobileAny() ? styles.bt_mobile : styles.bt
      }
    }
  }

  const getNameToDataAgth = () => {
    const isAudioTrack = audioTracks && audioTracks.length > 1
    const isSubtitles = subtitlesConfig && subtitlesConfig.length > 0

    if (isAudioTrack && isSubtitles) {
      return 'playerAudioSubtitlesButton'
    }

    if (isAudioTrack) {
      return 'playerAudioButton'
    }

    if (isSubtitles) {
      return 'playerSubtitlesButton'
    }
  }

  return (
    <button
      data-agth={ getNameToDataAgth() }
      className={ getclassName() }
      onClick={ onClick }
    />
  )
}

AudioSubtitlesIcon.propTypes = {
  isChatBottonEnabled: PropTypes.bool,
  isCloseBottonVisible: PropTypes.bool,
  onClick: PropTypes.func
}

export default AudioSubtitlesIcon
