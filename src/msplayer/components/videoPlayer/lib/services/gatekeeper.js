import fetch from 'isomorphic-fetch'
import { getCookie, removeCookie, setCookie } from '../../../../commons/util'
import { errorTypes, serviceNames } from '../../../../commons/types'

const { 
  ERROR_FETCH,
  ERROR_CERBERO_FETCH,
  ERROR_USER_NOT_VALID,
  ERROR_CONTENT_GEOBLOCKED,
  ERROR_USER_NO_PRIVILEGES,
  ERROR_USER_MAX_SESSIONS_REACHED,
  ERROR_CONTENT_NOT_OFFERS_REGION
} = errorTypes
const { GATEKEEPER } = serviceNames

export function findToken(player) {
  return (id, type) => {
    const { services } = player.state
    const gatekeeperResponse = services[GATEKEEPER].response

    if(gatekeeperResponse && gatekeeperResponse.tokens) {
      return gatekeeperResponse.tokens[id] && gatekeeperResponse.tokens[id][type]
    } else {
      return null
    }
  }
}

export function requestCerbero(player) {
  const MAX_ATTEMPTS = 3
  const ATTEMPT_INTERVAL_BASE = 1000

  return (user, attempt = 1) => {
    return new Promise((resolve, reject) => {
      const { onMaxSessionReached } = player.props
      const { bbx, cerberoCookie, concurrency, gbx, isStartPlayerRequested, services, user: storedUser } = player.state

      const logger = player.getLogger('cerbero')

      user = user || storedUser

      const url = services[GATEKEEPER].url
      let body = { bbx, gbx }

      const gid = user && user.UID
      const sig = user && user.UIDSignature
      const time = user && user.signatureTimestamp

      if(gid && sig && time) {
        body.gid = gid
        body.sig = sig
        body.time = time
      }

      let headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8'
      }

      const cerberoSession = getCookie(cerberoCookie) || concurrency.session
      if(cerberoSession) {
        headers['x-session'] = cerberoSession
      }

      logger.info(`Se piden tokens a Cerbero...`)

      fetch(url, {
        body: JSON.stringify(body),
        credentials: 'include',
        headers,
        method: 'POST'
      })
      .then((response) => {
        if(response.headers && response.headers.get('x-session')) {
          setCookie(cerberoCookie, response.headers.get('x-session'))

          player.setState({
            concurrency: {
              ...player.state.concurrency,
              session: response.headers.get('x-session')
            }
          })
        }

        if (response.ok) {
          if(response.status === 204) {
            resolve({})
          } else {
            return response.json()
          }
        } else {
          throw {
            message: `GET ${url} ${response.status} ${response.statusText}`,
            response
          }
        }
      })
      .then((json) => {
        resolve(json)
      })
      .catch((error) => {
        const fetchError = {
          type: ERROR_FETCH,
          info: {
            message: error.message,
            status: error.response && error.response.status
          },
          response: error.response
        }

        const resolveError = (error = {}, mustRetry = false) => {
          if(mustRetry && attempt <= MAX_ATTEMPTS) {
            player.collector.addTimeout( window.setTimeout(
              () => player.resolveGatekeeper(++attempt)
              .then((res) => resolve(res))
              .catch((err) => reject(err)),
              ATTEMPT_INTERVAL_BASE * attempt
            ))
          } else {
            reject({
              type: error.type || ERROR_CERBERO_FETCH,
              info: {
                ...fetchError.info,
                ...error.info,
                url
              }
            })
          }
        }

        // https://jira.mediaset.es/browse/MIWEB-482

        if(fetchError.response) {
          fetchError.response.json()
          .then((json) => {
            logger.error(`Error`, { ...fetchError.info, ...json })

            switch(json.code) {
              // Uaser not valid
              case 4033:
                resolveError({
                  type: ERROR_USER_NOT_VALID,
                  info: {
                    code: {
                      cerbero: json.code
                    },
                    user: user && user.UID
                  }
                })
                break

              // IP in blacklist
              case 4035:
              // Geoblocked
              case 4036:
              // Internal IP not admitted
              case 4037:
                resolveError({
                  type: ERROR_CONTENT_GEOBLOCKED,
                  info: {
                    code: {
                      cerbero: json.code
                    }
                  }
                })
                break

              // Not privileges for this content
              case 4038:
                resolveError({ 
                  type: ERROR_USER_NO_PRIVILEGES,
                  info: {
                    code: {
                      cerbero: json.code
                    },
                    user: user && user.UID
                  }
                })
                break

              // Max number of sessions reached
              case 4039:
                if(isStartPlayerRequested) {
                  logger.error(`Se elimina sesión de usuario`)
                  removeCookie(cerberoCookie)

                  if(onMaxSessionReached) {
                    logger.info(`Se comunica a la página el error de concurrencia`)
                    onMaxSessionReached()
                  } else {
                    logger.warn(`No hay callback para controlar el error de concurencia en la página`)
                  }
                }
                
                resolveError({
                  type: ERROR_USER_MAX_SESSIONS_REACHED,
                  info: {
                    code: {
                      cerbero: json.code
                    },
                    user: user && user.UID,
                    session: cerberoSession
                  }
                })
                break

              // Content has no offers for the region from which it is being played
              case 40313:
                resolveError({ 
                  type: ERROR_CONTENT_NOT_OFFERS_REGION,
                  info: {
                    code: {
                      cerbero: json.code
                    },
                    user: user && user.UID
                  }
                })
                break
                
              default:
                resolveError({
                  info: {
                    code: {
                      cerbero: json.code
                    },
                    user: user && user.UID
                  }
                })
                break
            }
          })
          .catch(() => {
            resolveError()
          })
        } else {
          resolveError(undefined, true)
        }
      })
    })
  }
}

export function resolveGatekeeper(player) {
  const GIGYA_TIMEOUT = 10000

  return (attempt = 1) => {
    const logger = player.getLogger('gatekeeper')

    logger.info(`Recuperando datos de usuario...`)

    return new Promise((resolve, reject) => {
      const self = {}
      const { user } = player.state

      self.requestCerbero = (user) => {
        window.clearTimeout(self.timeout)

        player.requestCerbero(user, attempt)
        .then((result) => {
          resolve(result)
        })
        .catch((error) => reject(error))
      }
      
      self.timeout = window.setTimeout(() => {
        logger.error(`Timeout (${GIGYA_TIMEOUT}) al recuperar usuario de Gigya`)

        player.setState({
          user: {
            ...user,
            signatureTimestamp: null,
            UID: null,
            UIDSignature: null
          }
        }, self.requestCerbero({
          signatureTimestamp: null,
          UID: null,
          UIDSignature: null
        }))
      }, GIGYA_TIMEOUT)

      if(user && user.signatureTimestamp) {
        if(typeof window !== 'undefined' && window.gigya && window.gigya.accounts && window.gigya.accounts.getAccountInfo) {
          logger.info(`Se piden datos de usuario a Gigya`)

          gigya.accounts.getAccountInfo({
            callback: (response) => {
              if(response.errorCode === 0) {
                logger.info(`Se obtienen los datos del usuario correctamente`)

                player.setState({
                  user: {
                    ...user,
                    signatureTimestamp: response.signatureTimestamp,
                    UID: response.UID,
                    UIDSignature: response.UIDSignature
                  }
                }, self.requestCerbero({
                  signatureTimestamp: response.signatureTimestamp,
                  UID: response.UID,
                  UIDSignature: response.UIDSignature
                }))
              } else {
                logger.error(`Error al recuperar usuario de Gigya`, response, null, 'user')
                self.requestCerbero()
              }
            }
          })
        } else {
          logger.error(`No se han detectado API de Gigya`)
          self.requestCerbero()
        }
      } else {
        logger.info(`No se han recibido datos iniciales de usuario`)
        self.requestCerbero()
      }
    })
  }
}

export function storeGatekeeperResponse(player) {
  return (response, url) => {
    return new Promise((resolve, reject) => {
      const { services: storedServices } = player.state

      let newState = {
        services: {
          ...storedServices,
          [GATEKEEPER]: { url, response }
        }
      }
      if(response.locale) {
        newState.locale = response.locale
      }

      player.setState(newState, () => resolve())
    })
  }
}
