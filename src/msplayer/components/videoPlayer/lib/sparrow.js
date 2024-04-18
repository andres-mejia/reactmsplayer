import { fetchData, findRandomItem, waitFor } from '../../../commons/util'

export function sparrow(player) {
  const { editorialId, isLive, sparrow, user } = player.state

  const logger = player.getLogger('sparrow')

  let timeout = null

  logger.info('Se comprueba config de Sparrow', { editorialId, isLive, sparrow })

  if(sparrow.isEnabled && sparrow.namespace) {
    if(isLive && sparrow.isEnabledLive || !isLive && sparrow.isEnabledVod) {
      if(!sparrow.ids || sparrow.ids.indexOf(editorialId) !== -1) {
        waitFor( () => window.io )
        .then(() => {
          logger.info('Se intenta conectar con socket.io', { namespace: `${sparrow.namespace}?ct=player` })
          player.sparrow = io(`${sparrow.namespace}?ct=player&uid=${user.UID}`)
          player.sparrow.on(sparrow.eventName, (msg) => {
            logger.info(`Se recibe mensaje ${sparrow.eventName}`, { msg })
            player.setState({
              isSparrowVisible: true,
              sparrow: {
                ...sparrow,
                position: msg.position || sparrow.position,
                room: msg.room
              }
            }, () => {
              if(timeout) window.clearTimeout(timeout)
              timeout = window.setTimeout(() => {
                player.setState({
                  isSparrowVisible: false
                })
              }, msg.duration || sparrow.duration)
            })
          })
          player.sparrow.on('connect', () => logger.info('Recibido evento socket.io: connect'))
          player.sparrow.on('connect_error', (error) => logger.info('Recibido evento socket.io: connect_error', { error }))
          player.sparrow.on('connect_timeout', () => logger.info('Recibido evento socket.io: connect_timeout'))
          player.sparrow.on('error', (error) => logger.info('Recibido evento socket.io: error', { error }))
          player.sparrow.on('disconnect', (reason) => logger.info('Recibido evento socket.io: disconnect', { reason }))
          player.sparrow.on('reconnect', (attemptNumber) => logger.info('Recibido evento socket.io: reconnect', { attemptNumber }))
          player.sparrow.on('reconnect_attempt', (attemptNumber) => logger.info('Recibido evento socket.io: reconnect_attempt', { attemptNumber }))
          player.sparrow.on('reconnecting', (attemptNumber) => logger.info('Recibido evento socket.io: reconnecting', { attemptNumber }))
          player.sparrow.on('reconnect_error', (error) => logger.info('Recibido evento socket.io: reconnect_error', { error }))
          player.sparrow.on('reconnect_failed', () => logger.info('Recibido evento socket.io: reconnect_failed'))
        })
        .catch(() => logger.error('No se ha encontrado el SDK de Socket.io'))
      }
    }
  }

  startServicesPing(player)
}

function startServicesPing(player) {
  if(typeof window === 'undefined') return

  const { servicesPing } = player.state

  const logger = player.getLogger('sparrow', 'ping')

  if(player.servicesPingTimeout) window.clearInterval(player.servicesPingTimeout)

  if(servicesPing && servicesPing.isEnabled) {
    logger.info('Iniciar intervalo pull de Atenea', { servicesPing })

    player.servicesPingTimeout = window.setInterval(() => {
      fetchData(servicesPing.url)
      .then((result) => {
        if(result && result.sparrow) {
          const { editorialId, sparrow: prevSparrow } = player.state

          logger.info('Se recupera configuración de Atenea', { sparrow: result.sparrow })

          const currentSparrow = {
            ...prevSparrow,
            datetime: result.sparrow.datetime,
            duration: result.sparrow.duration,
            eventName: result.sparrow.eventName,
            ids: result.sparrow.ids,
            isEnabled: result.sparrow.active,
            isEnabledLive: result.sparrow.activeLive,
            isEnabledVod: result.sparrow.activeVod,
            isFilterEnabled: result.sparrow.isFilterEnabled,
            namespace: result.sparrow.namespace,
            position: result.sparrow.position,
            reveal: result.sparrow.showUid,
            targetRoom: result.sparrow.room
          }

          player.setState({
            sparrow: { ...currentSparrow }
          }, () => {
            if(player.sparrow) {
              logger.info('Hay una instancia de Sparrow en uso', { connected: player.sparrow.connected })

              const areArraysEquivalent = (arr1, arr2) => {
                if(!Array.isArray(arr1) && !Array.isArray(arr2)) return true
                if(!Array.isArray(arr1) && Array.isArray(arr2)) return false
                if(Array.isArray(arr1) && !Array.isArray(arr2)) return false

                return arr1.join() == arr2.join()
              }
              if(
                prevSparrow.eventName !== currentSparrow.eventName ||
                !areArraysEquivalent(prevSparrow.ids, currentSparrow.ids) ||
                prevSparrow.isEnabled !== currentSparrow.isEnabled ||
                prevSparrow.isEnabledLive !== currentSparrow.isEnabledLive ||
                prevSparrow.isEnabledVod !== currentSparrow.isEnabledVod ||
                prevSparrow.namespace !== currentSparrow.namespace
              ) {
                logger.info('La configuración actual de Sparrow en Atenea es distinta de la anterior, se cerrará la conexión actual', { prevSparrow, currentSparrow })

                player.sparrow.close()
                player.sparrow = null
                sparrow(player)
              } else {
                logger.info('La configuración actual de Sparrow en Atenea no ha cambiado, se mantiene la sesión actual', { prevSparrow, currentSparrow })
              }
            } else {
              logger.info('No hay instancias de Sparrow en uso, se iniciará una si la configuración de Atenea lo indica')
              sparrow(player)
            }

            if(
              result.sparrow.isManuallyEnabled &&
              currentSparrow.targetRoom && 
              (currentSparrow.targetRoom === 'player' || currentSparrow.targetRoom === prevSparrow.room) &&
              currentSparrow.datetime !== prevSparrow.datetime &&
              (currentSparrow.ids || currentSparrow.ids.indexOf(editorialId) !== -1)
            ) {
              if(currentSparrow.duration) {
                const newRoom = findRandomRoom()

                logger.info('Se muestra Sparrow de manera manual', { room: newRoom })

                player.setState({
                  isSparrowVisible: true,
                  sparrow: {
                    ...currentSparrow,
                    room: newRoom
                  }
                }, () => {
                  window.setTimeout(() => {
                    logger.info(`Se oculta Sparrow después de ${currentSparrow.duration}`)

                    player.setState({
                      isSparrowVisible: false
                    })
                  }, currentSparrow.duration)
                })
                player.sendKibanaLog({
                  ...player.state.user,
                  ...player.state.sparrow,
                  datetime: currentSparrow.datetime,
                  message: 'Usuario afectado por Sparrow manual',
                  room: newRoom
                }, true)

              } else {
                logger.warn('No hay una duración definida')
              }
            }
          })
        } else {
          logger.info('No se ha encontrado Sparrow en los datos de Atenea', result)
        }
      })
      .catch( (error) => {
        logger.error('Error al recuperar datos de Atenea', error)
      })
    }, servicesPing.interval * 1000)
  }
}

function findRandomRoom() {
  return findRandomItem([
    'cyan',
    'yellow',
    'pink',
    'black',
    'red',
    'green',
    'blue',
    'white'
  ])
}
