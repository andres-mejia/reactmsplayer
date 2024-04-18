import fetch from 'isomorphic-fetch'
import { getBrowserInfo, isIos, isMobileAny } from '../../../commons/userAgent'
import { copyToClipboard, isObject } from '../../../commons/util'
import { errorCodes } from '../../../commons/types'

export function copyLog(player) {
  return (logLevels, contexts) => {
    const { logger } = player.props

    if(logger) {
      let log = logger.getLog(logLevels, contexts)
      log = `${JSON.stringify(player.state)}\n\n${log}`
      if( copyToClipboard(log, isIos()) ) console.log('Log copiado en el portapapeles')
    } else {
      console.error('No se ha encontrado ningún log')
    }
  }
}

export function getError(player) {
  return () => {
    return player.state && player.state.error
  }
}

export function getLog(player) {
  return (logLevels, contexts) => {
    const { logger } = player.props

    if(logger) {
      return logger.getLog(logLevels, contexts)
    } else {
      return null
    }
  }
}

export function getLogger(player) {
  return (...tags) => {
    const { logger } = player.props

    if(logger) {
      return logger.factory(...tags)
    }
    return null
  }
}

export function getPlayer(player) {
  return () => {
    return player
  }
}

export function getPlayerProps(player) {
  return () => {
    return player.props
  }
}

export function getPlayerState(player) {
  return () => {
    return player.state
  }
}

export function isDebugEnabled(player) {
  return () => {
    //..
    // return true
    //..test
    const { debug, user } = player.state
    
    if(isMobileAny() && debug && debug.isEnabled === true && user && user.UID) {
      if(Array.isArray(debug.uids) && debug.uids.length) {
        if(debug.uids.indexOf(user.UID) !== -1) return true
      }
    }
    return false
  }
}

export function sendKibanaLog(player) {

  const parseProps = (props) => {
    let obj = {}

    for(const key in props) {
      const value = props[key]

      if(isObject(value)) {
        obj[key] = parseProps(value)
      } else {
        obj[key] = typeof value === 'function' ? 'function' : value
      }
    }
    return obj
  }

  const getBrowserData = () => {
    const browserInfo = getBrowserInfo()

    if(!browserInfo) return {}

    return {
      browserName: browserInfo.browser.name,
      browserVersion: browserInfo.browser.version,
      deviceModel: browserInfo.device.model || 'na',
      deviceType: browserInfo.device.type || 'desktop',
      deviceVendor: browserInfo.device.vendor || 'na',
      osName: browserInfo.os.name,
      osVersion: browserInfo.os.version
    }
  }

  const simplifyState = (state) => {
    let obj = {}

    for(const key in state) {
      const value = state[key]
      
      if(!isObject(value) && !Array.isArray(value)) {
        obj[key] = state[key]
      }  
    }
    return obj
  }

  return (attributes = {}, isSparrow = false) => {
    const { user, kibana } = player.state

    if(kibana && kibana.isEnabled && kibana.path) {
      const logger = player.getLogger('kibana')

      const log = !isSparrow ? logger.getLog() : ''
      const errorInfo = !isSparrow ? attributes && attributes.error && attributes.error.info : ''
      //const entryProps = !isSparrow ? parseProps(player.props.entryProps) : ''
      const serviceUrl = kibana.path

      const body = {
        code: attributes.error && attributes.error.type ? errorCodes[attributes.error.type] : '',
        details: JSON.stringify(attributes),
        level: isSparrow ? 'SPARROW' : 'ERR',
        location: {
          href: document && document.location.href
        },
        msg: errorInfo && errorInfo.message || '',
        origin: 'msplayer',
        // props: entryProps,
        stack: log,
        state: !isSparrow ? JSON.stringify(simplifyState(player.state)) : '', 
        userAgent: window.navigator.userAgent,
        userId: user && user.UID
      }

      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8'
      }

      fetch(serviceUrl, {
        body: JSON.stringify(body),
        headers,
        method: 'POST'
      })
      .then((response) => {
        if(response.ok) {
          logger.info(`Se envía el log a Kibana correctamente: ${serviceUrl}`)
        }
      })
      .catch((error) => {
        logger.warn(`Error al enviar log a kibana`, error)
      })
    }
  }
}
