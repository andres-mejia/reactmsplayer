import fetch from 'isomorphic-fetch'
import { errorTypes } from '../../../commons/types'
import { getCookie } from '../../../commons/util'

const { ERROR_USER_MAX_SESSIONS_REACHED } = errorTypes

export function clearConcurrencyTimeout(player) {
  return() => {
    if(player.concurrencyCheckTimeout){
      window.clearTimeout(player.concurrencyCheckTimeout)
    } 
  }
}

export function startConcurrencyCheck(player) {
  return() => {
    const { 
      concurrency: {
        timestamp
      },
      user 
    } = player.state 

    if(user && user.UID) {
      player.startConcurrencyTimeout(timestamp) 
    }
  }
}

export function startConcurrencyTimeout(player) {
  return(timestamp) => {
    const { onMaxSessionReached } = player.props
    const { 
      concurrency: {
        interval: concurrencyInterval,
        session: concurrencySession
      }, 
      user 
    } = player.state

    const logger = player.getLogger('concurrency')

    const interval = concurrencyInterval * 1000

    if(player.concurrencyCheckTimeout){
      window.clearTimeout(player.concurrencyCheckTimeout)
    } 

    player.concurrencyCheckTimeout = window.setTimeout(() => {
      player.requestUserSession()
      .then((data) => {
        const { timestamp: dataTimestamp } = data

        player.setState({
          concurrency: {
           ...player.state.concurrency,
           timestamp: dataTimestamp      
          }
        }, () => {
          player.startConcurrencyTimeout(player.state.timestamp)
        })

      })
      .catch((error) => {
        const { allowed } = error
        if(allowed !== false) {
          player.startConcurrencyTimeout()
        } else {
          if(onMaxSessionReached) {
            logger.info(`Se comunica a la página el error de concurrencia`)
            onMaxSessionReached()
          } else {
            logger.warn(`No hay callback para controlar el error de concurencia en la página`)
          }

          player.error({ 
            type: ERROR_USER_MAX_SESSIONS_REACHED,
            info: {
              session: concurrencySession,
              user: user && user.UID
            }
          })
        }
      })

    }, interval)

    player.collector.addTimeout(player.concurrencyCheckTimeout)
    player.collector.addProperty('concurrencyCheckTimeout')
  }
}

export function requestUserSession(player) {
  return (url) => {
    return new Promise((resolve, reject) => {
      const { user, cerberoCookie, concurrency } = player.state

      const url = concurrency.endpoint.replace('{gid}', user && user.UID)

      let headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8'
      }
      headers['x-session'] = getCookie(cerberoCookie) || concurrency.session

      fetch(url, {
        headers,
        method: 'GET'
      })
      .then((response) => {
        if(response.ok){
          if(response.status === 200){
            return response.json()
          }
        } else {
          if(response.status === 403){
            reject({ allowed: false })
          } else {
            throw {
              message: `GET ${url} ${response.status} ${response.statusText}`,
              response
            }
          }
        }
      })
      .then((json) => {
        if(json && json.timestamp) {
          resolve(json)
        } else {
          throw {
            message: 'No se ha encontrado el atributo timestamp en la respuesta'
          }
        }
      })
      .catch((error) => {
        reject({ allowed: true, error })
      })
    })
  }
}
