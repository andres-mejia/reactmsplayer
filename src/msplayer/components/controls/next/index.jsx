import React from 'react'
import { PropTypes } from 'prop-types'
import { isMobilePhone, isMobileAny } from '../../../commons/userAgent'
import styles from './next.css'

const SHOW_TIME = 10

const Next = ({
  config, currentTime, duration, isControlBarVisible, isToggleOn, next, onNext
}) => {
  let children = null

  const getWidth = (n) => (1 - n) * 100

  if (!isNaN(duration) && duration > 0) {
    if (config) {
      const isMultisite = !!(next && next.literal)
      let position = isMultisite ? -SHOW_TIME : config.position

      if (position < 0) position = duration + position

      let literal = 'Siguiente capítulo'
      const isMobile = isMobilePhone() && isMultisite
      const nextPlatform = isMultisite || config.nextVideo
        ? config
        : config?.videos[0]

      switch (nextPlatform?.type) {
        case 'program':
          literal = 'Siguiente programa:'
          break
        case 'episode':
          literal = 'Siguiente capítulo:'
          break
        case 'video':
          literal = 'Siguiente vídeo:'
          break
      }

      if (isMultisite) {
        literal = 'SIGUIENTE VÍDEO:'
      }

      children = (
        <button
          className={ ` 
            ${isMultisite ? `${styles.nextBt_multisite} ` : ` ${styles.nextBt_mtweb} `}
            ${isControlBarVisible && !isToggleOn ? ` ${isMobile ? ` ${styles.aboveControlBarMobile}` : ` ${styles.aboveControlBar}`}` : ''}
            ${!isControlBarVisible && !isToggleOn ? `${styles.hideControlBar}` : ''}
            ${isControlBarVisible && isToggleOn ? `${styles.positionButtonNext}` : ''}
            ${isToggleOn ? `${styles.noneDisplay}` : ''} 
          ` }
          onClick={ isMobileAny() ? null : onNext }
          onTouchEnd={ isMobileAny() ? onNext : null }
          style={ currentTime >= position ? {} : { display: 'none' } }
        >
          {isMultisite ? (
            <>
              <img src={ nextPlatform.nextVideo?.poster } />
              <span className={ styles.icon_text_multisite }>
                <span className={ styles.next_text }>{literal}</span>
                <span className={ styles.next_title }>{nextPlatform.nextVideo?.title}</span>
              </span>
              <span className={ isMultisite ? styles.icon_multisite : styles.icon } />
              <div
                className={ `${styles.animacion}` }
                style={ { width: `${getWidth((duration - currentTime) / SHOW_TIME)}%` } }
              />
            </>
          ) : (
            <>
              <img src={ nextPlatform.nextVideo?.poster || nextPlatform?.parent?.images?.thumbnail?.src || nextPlatform?.images?.thumbnail?.src } />
              <span className={ styles.icon_text_mtweb }>
                <span className={ styles.next_text_mtweb }>{literal}</span>
                <span className={ styles.next_title_container }>
                  <span className={ styles.next_extratitle_mtweb }>
                    {nextPlatform.nextVideo?.info.extraTitle || nextPlatform?.infoNext}
                    {' '}
                  </span>
                  <span className={ styles.next_title_mtweb }>
                    { nextPlatform.nextVideo?.title || nextPlatform?.parent?.mediumTitle}
                    {' '}
                  </span>
                </span>
              </span>
              <span className={ styles.icon_container_mtweb }>
                <span className={ styles.icon_mtweb } />
              </span>
              <div
                className={ `${styles.animation_mtweb}` }
                style={ { width: `${getWidth((duration - currentTime) / (config.position * -1))}%` } }
              />
            </>
          )}
        </button>
      )
    }
  }

  return (
    <div className={ styles.next }>
      {children}
    </div>
  )
}

Next.propTypes = {
  config: PropTypes.shape({
    nextVideo: PropTypes.shape({
      cmsId: PropTypes.string,
      configUrl: PropTypes.string,
      context: PropTypes.string,
      editorialId: PropTypes.string,
      id: PropTypes.string,
      mediaId: PropTypes.string,
      poster: PropTypes.string,
      thumbUrl: PropTypes.string,
      title: PropTypes.string
    }),
    position: PropTypes.number,
    type: PropTypes.string
  }),
  currentTime: PropTypes.number,
  duration: PropTypes.number,
  onNext: PropTypes.func
}

export default Next
