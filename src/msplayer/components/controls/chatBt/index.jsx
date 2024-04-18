import React from 'react'
import { PropTypes } from 'prop-types'
import styles from './chatBt.css'

const ChatBt = ({ config, isCloseBottonVisible, isMobile, onClick }) => {
  return (
    <button
      data-agth={ config.state ? 'playerOpenChatButton' : 'playerCloseChatButton' }
      className={ `${styles.container} ${isMobile ? ` ${isCloseBottonVisible ? ` ${styles.mobile}` : `${styles.mobile_close}` }` : `${isCloseBottonVisible ? ` ${styles.close}` : '' } `} `}
      onClick={ onClick }
    >
      <div className={ `${config.state ? ` ${styles.icon_ocultar}` : `${styles.icon_mostrar}` } ${isMobile ? `${styles.icono_mobile}` : '' }`  } />
      { !isMobile && <div className={ styles.text }>
        { config.literal }
      </div>
      }
    </button>
  )
}

ChatBt.propTypes= {
  config: PropTypes.shape({
    enabled: PropTypes.bool,
    literal: PropTypes.string,
    state: PropTypes.bool
  }),
  isMobile: PropTypes.bool,
  onClick: PropTypes.func
}

export default ChatBt