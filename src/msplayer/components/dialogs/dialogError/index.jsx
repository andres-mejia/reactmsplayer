import React from 'react'
import { PropTypes } from 'prop-types'
import { isIos } from '../../../commons/userAgent'
import { copyToClipboard } from '../../../commons/util'
import { errorCodes, errorMessages, errorTypes, playerModes } from '../../../commons/types'
import styles from './dialogError.css'

const MESSAGE_DEFAULT = {
  long: <div><b>{ 'Ha habido un error' }</b><br />{ 'Por favor, inténtalo de nuevo más tarde' }</div>,
  short: 'Ha habido un error',
  mini: 'Error'
}

const MESSAGE_DRM_TOO_MANY_CONCURRENT_STREAMS = {
  long: <div><b>{ 'Lo sentimos, tu usuario ha alcanzado el número máximo de reproducciones simultáneas' }</b><br />{ 'Cierra uno de tus reproductores y vuelve a probar' }</div>,
  short: 'Máximo de reproducciones simultáneas alcanzado',
  mini: 'Demasiadas reproducciones simultáneas'
}

const MESSAGE_GEOBLOCKED = {
  long: <div><b>{ 'Lo sentimos,' }</b><br />{ 'este contenido no está disponible en tu país' }</div>,
  short: <div><b>{ 'Lo sentimos,' }</b><br />{ 'este contenido no está disponible en tu país' }</div>,
  mini: 'Contenido no disponible en tu país'
}

const MESSAGE_MAX_SESSIONS_REACHED = {
  long: <div><b>{ 'Número máximo de reproducciones simultáneas alcanzado' }</b><br />{ 'Por favor, cierra uno de tus reproductores y vuelve a intentarlo' }</div>,
  short: 'Máximo de reproducciones simultáneas alcanzado',
  mini: 'Demasiadas rerpoducciones simultáneas'
}

const MESSAGE_NOT_ALLOWED = {
  long: <div><b>{ 'Contenido no disponible' }</b><br />{ 'No se cumplen los requisitos necesarios para ver este programa' }</div>,
  short: 'Contenido no disponible',
  mini: 'Contenido no disponible'
}

const MESSAGE_NOT_ALLOWED_FOR_DEVICE = {
  long: <div><b>{ 'Lo sentimos' }</b><br />{ 'Este contenido no está disponible para tu dispositivo' }</div>,
  short: 'Contenido no disponible',
  mini: 'Contenido no disponible'
}

const MESSAGE_NOT_OFFERS_REGION = {
  long: <div><b>{ 'Este contenido' }</b><br />{ 'no está disponible para tu región' }</div>,
  short: 'Contenido no disponible',
  mini: 'Contenido no disponible'
}

const MESSAGE_NOT_SUPPORTED = {
  long: <div><b>{ 'Navegador no compatible' }</b><br />{ 'Por favor, actualiza la versión de tu navegador o prueba con uno distinto' }</div>,
  short: 'Navegador no compatible',
  mini: 'Navegador no compatible'
}

const MESSAGE_CONTENT_NOT_PURCHASED = {
  long: <div><b>{ 'No tienes acceso a este contenido' }</b><br />{ 'Hazte plus y no te pierdas nada' }</div>,
  short: 'No tienes acceso a este contenido',
  mini: 'No tienes acceso a este contenido'
}

const MESSAGE_USER_NOT_LOGGED = {
  long: <div><b>{ 'Regístrate' }</b><br />{ 'O inicia sesión para disfrutar de este contenido' }</div>,
  short: 'Regístrate o inicia sesión',
  mini: 'Regístrate o inicia sesión'
}

const MESSAGE_USER_NOT_VALID = {
  long: <div><b>{ 'Lo sentimos' }</b><br />{ 'El usuario que intentas utilizar no es válido' }</div>,
  short: 'Usuario no es válido',
  mini: 'Usuario no es válido'
}

const MESSAGE_INTERNATIONAL_SUBSCRIPTION_REQUIRED = {
  long: <div><b>{ 'Este contenido requiere la suscripción a mitele Internacional' }</b><br />{ 'Inicia sesión con tu cuenta PLUS o accede a ' }<a href="https://www.mitele.es/suscripciones/miteleplusinternacional/">{ 'mitele.es' }</a>{ ' para administrar tu cuenta' }</div>,
  short: <div>{ 'Inicia sesión con tu cuenta PLUS o accede a ' }<a href="https://www.mitele.es/suscripciones/miteleplusinternacional/">{ 'mitele.es' }</a></div>,
  mini: <div>{ 'Inicia sesión con tu cuenta PLUS o accede a ' }<a href="https://www.mitele.es/suscripciones/miteleplusinternacional/">{ 'mitele.es' }</a></div>
}

const MESSAGE_GEOBLOCKED_MITELE_EMBED_VOD = {
  long: <div><b>{ 'Este contenido no está disponible en tu país a través de esta web' }</b><br />{ 'Accede a ' }<a href="https://www.mitele.es/suscripciones/miteleplusinternacional/">{ 'mitele.es' }</a>{ ' y consulta su disponibilidad' }</div>,
  short: <div>{ 'Accede a ' }<a href="https://www.mitele.es/suscripciones/miteleplusinternacional/">{ 'mitele.es' }</a>{ ' y consulta su disponibilidad' }</div>,
  mini: <div>{ 'Accede a ' }<a href="https://www.mitele.es/suscripciones/miteleplusinternacional/">{ 'mitele.es' }</a>{ ' y consulta su disponibilidad' }</div>
}

const DETAILS_TIMEOUT = 1500
const MITELE = /mitele/i

class DialogError extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isDetailsHidden: true
    }

    this.detailsTimeout = undefined
    this.numClicks = 0

    this.handleClick = this.handleClick.bind(this)
  }

  findMessage(errorType, sizeClassName = 'large') {
    const { isLive, mode, siteCreated, sitePublished, playerState } = this.props
    const { isNextVideo, isNextVideoPlayback } = playerState
    const isMtwebEmbedInMulti = MITELE.test(siteCreated) && !MITELE.test(sitePublished)
  
    // TODO: Estudiar tamaños y textos

    const size = 'long'

    // if(sizeClassName.indexOf('xx-small') !== -1) {
    //   size = 'mini'
    // } else if(sizeClassName.indexOf('x-small') !== -1) {
    //   size = 'long'
    // } else {
    //   size = 'long'
    // }

    switch (errorType) {
      case errorTypes.ERROR_CONTENT_GEOBLOCKED:
        if (!isLive && sitePublished !== playerModes.MITELE && isMtwebEmbedInMulti) {
          return MESSAGE_GEOBLOCKED_MITELE_EMBED_VOD[size]
        }
        return MESSAGE_GEOBLOCKED[size]

      case errorTypes.ERROR_CONTENT_MULTICHANNEL_GEOBLOCKED:
        return MESSAGE_GEOBLOCKED[size]

      case errorTypes.ERROR_CONTENT_NOT_ALLOWED:
        return MESSAGE_NOT_ALLOWED_FOR_DEVICE[size]

      case errorTypes.ERROR_CONTENT_NOT_OFFERS_REGION:
        return MESSAGE_NOT_OFFERS_REGION[size]

      case errorTypes.ERROR_DRM_LICENSE_AUTHORIZATION_DENIED:
        return MESSAGE_NOT_ALLOWED[size]

      case errorTypes.ERROR_CONTENT_NOT_PURCHASED:
        return MESSAGE_CONTENT_NOT_PURCHASED[size]

      case errorTypes.ERROR_DASHJS_NOT_SUPPORTED:
      case errorTypes.ERROR_DRM_KEY_SYSTEM_ACCESS_DENIED:
      case errorTypes.ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED:
      case errorTypes.ERROR_HLSJS_NOT_SUPPORTED:
      case errorTypes.ERROR_SHAKA_NOT_SUPPORTED:
        return MESSAGE_NOT_SUPPORTED[size]

      case errorTypes.ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS:
        return MESSAGE_DRM_TOO_MANY_CONCURRENT_STREAMS[size]

      case errorTypes.ERROR_USER_MAX_SESSIONS_REACHED:
        return MESSAGE_MAX_SESSIONS_REACHED[size]

      case errorTypes.ERROR_USER_NO_PRIVILEGES:
        if (isLive && sitePublished !== playerModes.MITELE) {
          return MESSAGE_INTERNATIONAL_SUBSCRIPTION_REQUIRED[size]
        }
        if (isNextVideo || isNextVideoPlayback) {
          return MESSAGE_CONTENT_NOT_PURCHASED[size]
        }
        return MESSAGE_USER_NOT_VALID[size]

      case errorTypes.ERROR_USER_CHECK_PRIVILEGES:
      case errorTypes.ERROR_USER_NOT_VALID:
        return MESSAGE_USER_NOT_VALID[size]

      case errorTypes.ERROR_USER_NOT_LOGGED:
        return MESSAGE_USER_NOT_LOGGED[size]

      default:
        return MESSAGE_DEFAULT[size]
    }
  }

  checkShowDetails() {
    if(this.numClicks >= 5) {
      const { logger, playerState } = this.props

      this.setState({
        isDetailsHidden: false
      })

      let log = logger.getLog()
      log = `${JSON.stringify(playerState)}\n\n${log}`
      copyToClipboard(log, isIos())
    }
  }

  handleClick(e) {
    if(!this.detailsTimeout) {
      this.detailsTimeout = window.setTimeout(() => {
        window.clearTimeout(this.detailsTimeout)
        this.detailsTimeout = null
        this.checkShowDetails()
        this.numClicks = 0
      }, DETAILS_TIMEOUT)
    } else {
      this.checkShowDetails()
    }
    this.numClicks++
  }

  render() {
    const { error, sizeClassName } = this.props
    const { isDetailsHidden } = this.state

    return (
      <div className={ styles.container } onClick={ this.handleClick }>
        <div className={ styles.text }>
          { this.findMessage(error.type, sizeClassName) }
        </div>
        <div className={ [
          styles.text,
          styles.details,
          isDetailsHidden ? styles.hidden : ''
        ].join(' ') }>
          { `${errorCodes[error.type]} - ${errorMessages[error.type]}: ${JSON.stringify(error)}` }
        </div>
      </div>
    )
  }
}

DialogError.propTypes = {
  error: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string
  }).isRequired,
  isLive: PropTypes.bool,
  logger: PropTypes.object,
  mode: PropTypes.oneOf(Object.values(playerModes)),
  playerState: PropTypes.object,
  sizeClassName: PropTypes.string
}

DialogError.defaultProps = {
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default DialogError
