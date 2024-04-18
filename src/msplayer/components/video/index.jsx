import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { isDash, isHls } from '../../commons/util'
import { mediaEvents, mediaPlayerEvents } from '../../commons/types/events'
import { errorTypes, mediaPlayerTypes, scaleFits } from '../../commons/types'
import {
  isAutoplayAllowed,
  isEdge,
  isIE,
  isSafari,
  mustUseHlsJs
} from '../../commons/userAgent'
import { DashJs, HlsJs, HtmlVideoElement, ShakaPlayer } from './mediaPlayers'
import styles from './video.css'

const {
  ERROR_MEDIA_ABORTED,
  ERROR_MEDIA_DECODE,
  ERROR_MEDIA_NETWORK,
  ERROR_MEDIA_PLAY_ABORT,
  ERROR_MEDIA_PLAY_NOT_ALLOWED,
  ERROR_MEDIA_PLAY_NOT_SUPPORTED,
  ERROR_MEDIA_PLAY_UNKNOWN,
  ERROR_MEDIA_PLAYER_NOT_CREATED,
  ERROR_MEDIA_SRC_NOT_SUPPORTED,
  ERROR_MEDIA_UNKNOWN
} = errorTypes

const {
  CAN_PLAY,
  CAN_PLAY_THROUGH,
  DURATION_CHANGE,
  ENDED,
  ERROR,
  LOADED_METADATA,
  PAUSE,
  PLAY,
  PLAYING,
  PROGRESS,
  SEEKED,
  SEEKING,
  STOPPED,
  SUSPEND,
  TIME_UPDATE,
  VOLUME_CHANGE,
  WAITING
 } = mediaEvents

 const { MEDIA_PLAYER_CHANGED } = mediaPlayerEvents

const {
  DASH_JS,
  HLS_JS,
  HTML_VIDEO_ELEMENT,
  SHAKA_PLAYER
} = mediaPlayerTypes

const { COVER } = scaleFits

class Video extends Component {
  constructor(props){
    super(props)

    this.mediaPlayer = undefined
    this.src = undefined

    this.error = this.error.bind(this)
    this.handleMediaEvent = this.handleMediaEvent.bind(this)
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { isVisible, isSparrowVisible, sparrow, poster } = this.props
    return (
      nextProps.isVisible !== isVisible
      || nextProps.isSparrowVisible !== isSparrowVisible
      || nextProps.sparrow.isFilterEnabled !== sparrow.isFilterEnabled
      || nextProps.sparrow.room !== sparrow.room
      || nextProps.poster !== poster
    )
  }

  componentWillUnmount() {
    this.reset()
  }

  mediaPlayerFactory(src) {
    const {
      canPlayTimeout,
      drm,
      isLive,
      logger,
      onMediaPlayerEvent,
      onStreamEvent
    } = this.props
    let { mediaPlayerDash } = this.props

    if(!src) return null

    let windowMediaPlayer = undefined

    //..
    if(typeof window !== 'undefined' && window.MSPlayer && window.MSPlayer.mediaPlayer) {
      windowMediaPlayer = window.MSPlayer.mediaPlayer
    }
    if(typeof window !== 'undefined' && window.MSPlayer && window.MSPlayer.mediaPlayerDash) {
      mediaPlayerDash = window.MSPlayer.mediaPlayerDash
    }
    //..test

    // Si es iOS/Safari
    // - No DRM: HLS con HlsJs o HtmlVideoElement si es Safari < iOS 17.1
    // - DRM: HLS con HlsJs + FairPlay

    // Si es IE o Edge
    // - No DRM: HLS con Hls.js o Dash con Shaka o Dash.js
    // - DRM: Dash con Shaka o Dash.js + PlayReady

    // Si es Chrome, Firefox, Opera...
    // - No DRM: HLS con Hls.js o Dash con Shaka o Dash.js
    // - DRM: Dash con Shaka o Dash.js + Widevine

    // Default: HtmlVideoElement
    let MediaPlayer = HtmlVideoElement
    let mediaPlayerType = HTML_VIDEO_ELEMENT
    if (isSafari() && window.Hls?.isSupported()) {
      // Si estamos en safari y soporta HLS.js
      // damos prioridad a ese player.
      MediaPlayer = HlsJs
      mediaPlayerType = HLS_JS
    }

    if(!isSafari()) {
      logger.info(`El navegador no es Safari...`)
      if(isDash(src)) logger.info(`El stream es Dash...`)
      if(isHls(src)) {
        logger.info(`El stream es HLS...`)
        if(mustUseHlsJs(isLive)) logger.info(`Se debe usar Hls.js...`)
      }

      if(isDash(src)) {
        if(drm) {
          logger.info(`El contenido está protegido con DRM...`)
        } else {
          logger.info(`El contenido no está protegido con DRM...`)
        }
        if(isEdge()) logger.info(`El navegador es Edge...`)
        if(isIE()) logger.info(`El navegador es IE...`)

        if(drm && (isEdge() || isIE())) {
          MediaPlayer = ShakaPlayer
          mediaPlayerType = SHAKA_PLAYER

        } else if(mediaPlayerDash && mediaPlayerDash === SHAKA_PLAYER || windowMediaPlayer && windowMediaPlayer === SHAKA_PLAYER) {
          logger.info(`Se da prioridad al uso de Shaka Player`)

          MediaPlayer = ShakaPlayer
          mediaPlayerType = SHAKA_PLAYER
        } else {
          MediaPlayer = DashJs
          mediaPlayerType = DASH_JS
        }
      } else if(isHls(src) && mustUseHlsJs(isLive)) {
        if(windowMediaPlayer && windowMediaPlayer === SHAKA_PLAYER) {
          logger.info(`Se fuerza el uso de Shaka Player`)

          MediaPlayer = ShakaPlayer
          mediaPlayerType = SHAKA_PLAYER
        } else {
          MediaPlayer = HlsJs
          mediaPlayerType = HLS_JS
        }
      }
    } else if(windowMediaPlayer && windowMediaPlayer === SHAKA_PLAYER) {
      logger.info(`El navegador es Safari y se fuerza el uso de Shaka Player`)

      MediaPlayer = ShakaPlayer
      mediaPlayerType = SHAKA_PLAYER
    }

    if ((mediaPlayerType === SHAKA_PLAYER ||  mediaPlayerType === HLS_JS) && navigator?.userAgent?.includes('Instagram') && !navigator?.userAgent?.includes('Android')) {
      MediaPlayer = HtmlVideoElement
      mediaPlayerType = HTML_VIDEO_ELEMENT
    }
    // Aquí se indica explícitamente que el player HLS se destruye
    if(
      this.mediaPlayer && (
        mediaPlayerType === HTML_VIDEO_ELEMENT ||
        mediaPlayerType === DASH_JS ||
        mediaPlayerType === SHAKA_PLAYER
      ) &&
      this.mediaPlayer instanceof MediaPlayer
    ) {
      onMediaPlayerEvent(MEDIA_PLAYER_CHANGED, {
        player: this.mediaPlayer.getPlayer(),
        type: mediaPlayerType
      })
      return this.mediaPlayer

    } else {
      logger.info(`Crear nuevo MediaPlayer de tipo ${mediaPlayerType}`)

      if(this.mediaPlayer) this.mediaPlayer.destroy()

      return new MediaPlayer({
        canPlayTimeout,
        isLive,
        logger: logger.factory('video', mediaPlayerType),
        onError: this.error,
        onMediaEvent: this.handleMediaEvent,
        onMediaPlayerEvent,
        onStreamEvent,
        video: this.ref
      })
    }
  }

  setSrc(src, start) {
    const { contentId, drm, logger, onSrcChange } = this.props

    //..
    if(typeof window !== 'undefined' && window.MSPlayer && window.MSPlayer.src) {
      src = window.MSPlayer.src
    }
    //..test

    this.src = src

    logger.info(`Asignar src ${src}`, {drm, start})

    if(onSrcChange) onSrcChange(src)

    return new Promise((resolve, reject) => {
      // Set factory destruye el player para hls
      // Recuperamos el estado del player antes de perderlos.
      // Si no existen (son null) es porque nunca se han seteado
      const { audioTrack = null, subtitleTrack = null } = this.getMediaPlayer() || {}
      this.mediaPlayer = this.mediaPlayerFactory(src)

      if(this.mediaPlayer) {
        this.mediaPlayer.setSrc({ src, start, drm, contentId, audioTrack, subtitleTrack })
        .then( () => resolve() )
        .catch( (error) => {
          logger.error(`Error al asignar src`, error)
          reject(error)
        })
      } else {
        logger.error(`No ha sido posible crear un media player para este recurso`)

        reject({
          type: ERROR_MEDIA_PLAYER_NOT_CREATED,
          info: {
            src,
            ua: navigator.userAgent
          }
        })
      }
    })
  }

  getSrc() {
    if(this.mediaPlayer) {
      return this.mediaPlayer.getSrc()
    }
    return null
  }

  setVolume(volume){
    if(this.ref) this.ref.volume = volume
  }

  setMuted(muted){
    if(this.ref) this.ref.muted = muted
  }

  play(src, start) {
    const { logger } = this.props

    const self = this
    const videoRef = this.ref

    logger.info(`Reproducir${src ? ` ${src}` : ''} empezando en la posición ${start}. El src actual es ${this.src}`)

    const resolve = () => {
      // v. https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play#Browser_compatibility

      logger.info(`Ejecutar play en instancia de video...`)

      const playPromise = videoRef.play()

      if(playPromise) {
        playPromise.then(
          () => {
            logger.info(`La llamada a play se ha resuelto con éxito`)
          },
          (error) => {
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
            if(typeof error === 'string') {
              logger.error(`Error en la llamada a play: ${error}`)

              switch(error) {
                case 'NotAllowedError':
                  self.error({
                    type: ERROR_MEDIA_PLAY_NOT_ALLOWED,
                    info: {
                      ua: navigator.userAgent
                    }
                  })
                  break
                case 'NotSupportedError':
                  self.error({
                    type: ERROR_MEDIA_PLAY_NOT_SUPPORTED,
                    info: {
                      ua: navigator.userAgent
                    }
                  })
                  break
                default:
                  self.error({
                    type: ERROR_MEDIA_PLAY_UNKNOWN,
                    info: {
                      code: {
                        media: error
                      }
                    }
                  })
                  break
              }

            // (Deprecated)
            // Safari
            // https://developer.mozilla.org/en-US/docs/Web/API/DOMError
            // !Safari
            // https://developer.mozilla.org/en-US/docs/Web/API/DOMException
            } else if(error && error.name === 'AbortError') {
              logger.error(`Error en la llamada a play`, {
                name: error.name,
                message: error.message
              })

              self.error({
                type: ERROR_MEDIA_PLAY_ABORT,
                info: {
                  message: error.message,
                  ua: navigator.userAgent
                }
              })

            } else if(error && error.name === 'NotAllowedError') {
              logger.error(`Error en la llamada a play`, {
                name: error.name,
                message: error.message
              })

              self.error({
                type: ERROR_MEDIA_PLAY_NOT_ALLOWED,
                info: {
                  message: error.message,
                  ua: navigator.userAgent
                }
              })

            } else {
              logger.error(`Error en la llamada a play`, {
                name: error && error.name,
                message: error && error.message
              })

              self.error({
                type: ERROR_MEDIA_PLAY_UNKNOWN,
                info: {
                  code: {
                    media: error && error.name
                  },
                  message: error && error.message
                }
              })
            }
          }
        )
        .catch((error) => {
          logger.error(`Error en la llamada a play`, error)

          self.error({
            type: ERROR_MEDIA_PLAY_UNKNOWN,
            info: {
              code: {
                media: error.name
              },
              message: error.message
            }
          })
        })
      }
    }

    if(src &&
      ( !this.src || this.src.indexOf(src) === -1 || typeof start !== 'undefined' )
    ) {
      this.setSrc(src, start)
      .then(() => resolve())
      .catch((error) => this.error(error))
    } else {
      resolve()
    }

    // v. https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
    // if(this.ref && this.ref.readyState === 0){
    //   this.ref.load()
    // }
  }

  pause(mustStopLoad) {
    const { isLive, isStartOverPlayback } = this.props

    if(this.mediaPlayer) {
      this.mediaPlayer.pause(
        typeof mustStopLoad !== 'undefined' ? mustStopLoad : isLive && !isStartOverPlayback
      )
    }
  }

  seek(seekTarget) {
    if(this.ref) {
      this.ref.currentTime = seekTarget
      this.ref.play()
    }
  }

  setAudioTrack(track) {
    if(this.mediaPlayer) {
      this.mediaPlayer.setAudioTrack(track)
    }
  }

  setSubtitleTrack(subtitleTrack) {
    if(this.mediaPlayer) {
      this.mediaPlayer.setSubtitleTrack(subtitleTrack)
    }
  }

  saveRef(ref) {
    const { isMuted, volume } = this.props

    if(ref){
      this.ref = ref
      this.ref.id = `${this.props.playerId}__video`
      this.ref.muted = isMuted
      this.ref.volume = volume
    }
  }

  handleMediaEvent(e, data = {}) {
    const { isSeeking, onMediaEvent } = this.props
    const { buffered, currentTime, duration, volume } = this.ref

    switch(e.type){
      case CAN_PLAY:
        onMediaEvent(e.type)
        break

      case CAN_PLAY_THROUGH:
        onMediaEvent(e.type)
        break

      case DURATION_CHANGE:
        onMediaEvent(e.type, { duration })
        break

      case ENDED:
        onMediaEvent(e.type)
        break

      case ERROR: {
        // v. https://developer.mozilla.org/en-US/docs/Web/API/MediaError

        let type = ERROR_MEDIA_UNKNOWN
        let message = null

        if(e.target.error) {
          type = this.getMediaErrorType(e.target.error.code)
          message = e.target.error.message
        }
        // https://jira.mediaset.es/browse/MLTSITE-1146
        if(this.ref && this.ref.src && this.ref.src !== '' && document.location.href && document.location.href.indexOf(this.ref.src) === -1) {
          if(e.target.error && e.target.error.code < 5) {
            onMediaEvent(e.type, {
              type,
              info: {
                code: {
                  media: e.target.error && e.target.error.code
                },
                message,
                ua: navigator.userAgent
              },
            })
          }
        }
        break
      }

      case LOADED_METADATA:
        onMediaEvent(DURATION_CHANGE, { duration })
        break

      case PAUSE:
        onMediaEvent(e.type)
        break

      case PLAY:
        onMediaEvent(e.type)
        break

      case PLAYING:
        onMediaEvent(e.type)
        break

      case PROGRESS:
        onMediaEvent(e.type, { buffered })
        break

      // NOTA: El evento seeking del <video> no es fiable
      // Mejor lanzarlo manualmente desde player.seek
      case SEEKING:
        break

      case SEEKED:
        if(isSeeking){
          onMediaEvent(e.type)
        }
        break

      case STOPPED:
        onMediaEvent(e.type)
        break

      case SUSPEND:
        onMediaEvent(e.type)
        break

      case TIME_UPDATE:
        if(this.mediaPlayer && this.mediaPlayer.handleTimeUpdate) {
          this.mediaPlayer.handleTimeUpdate({ currentTime })
        }
        onMediaEvent(e.type, { currentTime })
        break

      case VOLUME_CHANGE:
        onMediaEvent(e.type, { volume })
        break

      case WAITING:
        onMediaEvent(e.type)
        break
    }
  }

  reset() {
    if(this.mediaPlayer) {
      this.mediaPlayer.destroy()
      this.mediaPlayer = null
    }
    if(this.ref) {
      this.ref.pause()
      this.ref.src = ''
      this.src = null
    }
  }

  getMediaErrorType(code) {
    switch (code) {
      // The fetching of the associated resource has been aborted by the user
      case 1:
        return ERROR_MEDIA_ABORTED
        break
      // A network error caused the resource to stop being fetched
      case 2:
        return ERROR_MEDIA_NETWORK
        break
      // A decoding error caused the resource to stop being fetched
      case 3:
        return ERROR_MEDIA_DECODE
        break
      // The associated resource has been detected to be not suitable
      case 4:
        return ERROR_MEDIA_SRC_NOT_SUPPORTED
        break
    }
    return ERROR_MEDIA_UNKNOWN
  }

  error(error) {
    this.props.onError(error)
  }

  getRef(){
    return this.ref
  }

  getVideoElementId() {
    return this.ref ? this.ref.id : null
  }

  getMediaPlayer() {
    return this.mediaPlayer ? this.mediaPlayer.getPlayer() : null
  }

  getMediaPlayerType() {
    return this.mediaPlayer ? this.mediaPlayer.getType() : null
  }

  render() {
    const {
      poster,
      contentUrl,
      isMuted,
      isPodcast,
      isSparrowVisible,
      isVisible,
      playerId,
      sparrow,
      title,
      videoScaleFit,
      volume
    } = this.props

    const videoClassName = [styles.video]

    if (videoScaleFit === COVER) {
      videoClassName.push(styles.cover)
    }
    if (isVisible === false) {
      videoClassName.push(styles.hidden)
    }
    if (isSparrowVisible && sparrow.isFilterEnabled && sparrow.room) {
      videoClassName.push(styles[sparrow.room])
    }

    const tagProps = {
      className: videoClassName.join(' '),
      src: contentUrl,
      id: `${playerId}__video`,
      muted: isMuted || volume === 0,
      onAbort: this.handleMediaEvent,
      onCanPlay: this.handleMediaEvent,
      onCanPlayThrough: this.handleMediaEvent,
      onDurationChange: this.handleMediaEvent,
      onEmptied: this.handleMediaEvent,
      onEnded: this.handleMediaEvent,
      onError: this.handleMediaEvent,
      onLoadedData: this.handleMediaEvent,
      onLoadedMetadata: this.handleMediaEvent,
      onLoadStart: this.handleMediaEvent,
      onPause: this.handleMediaEvent,
      onPlay: this.handleMediaEvent,
      onPlaying: this.handleMediaEvent,
      onProgress: this.handleMediaEvent,
      onRateChange: this.handleMediaEvent,
      onSeeked: this.handleMediaEvent,
      onSeeking: this.handleMediaEvent,
      onStalled: this.handleMediaEvent,
      onSuspend: this.handleMediaEvent,
      onTimeUpdate: this.handleMediaEvent,
      onVolumeChange: this.handleMediaEvent,
      onWaiting: this.handleMediaEvent,
      playsInline: true,
      preload: 'none',
      poster,
      ref: (ref) => this.saveRef(ref),
      title
    }

    const tagPlay = !isPodcast ? (
      <video  { ...tagProps } />
    ) : (
      <audio { ...tagProps } />
    )

    return (
      <div
        className={ styles.container }
        style={ isPodcast ? {
          display: 'none',
          width: '5px',
          height: '5px'
        } : {} }
      >
        { tagPlay }
      </div>
    )
  }
}

Video.propTypes = {
  poster: PropTypes.string,
  canPlayTimeout: PropTypes.number,
  contentId: PropTypes.string,
  contentUrl: PropTypes.string,
  drm: PropTypes.shape({
    certificate: PropTypes.string,
    csmEnabled: PropTypes.bool,
    keySystem: PropTypes.string,
    license: PropTypes.string,
    token: PropTypes.string
  }),
  isLive: PropTypes.bool,
  isMuted: PropTypes.bool,
  isSeeking: PropTypes.bool,
  isStartOverPlayback: PropTypes.bool,
  isVisible: PropTypes.bool,
  logger: PropTypes.object,
  mediaPlayerDash: PropTypes.string,
  onError: PropTypes.func.isRequired,
  onStreamEvent: PropTypes.func.isRequired,
  onMediaEvent: PropTypes.func.isRequired,
  onMediaPlayerEvent: PropTypes.func.isRequired,
  onSrcChange: PropTypes.func.isRequired,
  playerId: PropTypes.string,
  videoScaleFit: PropTypes.string,
  volume: PropTypes.number
}

Video.defaultProps = {
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default Video
