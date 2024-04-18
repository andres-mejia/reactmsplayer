import { processes, serviceNames } from '../../../commons/types'
import { generateGuid, parseProgramChangeError } from '../../../commons/util'

const { START_OVER } = processes
const { MULTICHANNEL } = serviceNames

export function findMultichannelConfig(player) {
  return () => {
    //..
    // return {
    //   "refreshTime": Date.now() + 300000,
    //   "channels": [{
    //      channel: "telecinco",
    //      color: "#00aadb",
    //      config: "https://mab.mediaset.es/1.0.0/get?oid=bitban_api&eid=%2Fapi%2Fcms%2Fmitele%2Fvideos%2FMDSVST20191211_0006%2Fconfig%2Ffinal.json%3Fplatform%3Dmtweb",
    //      eventId: "1086071",
    //      image: "https://album.mediaset.es//parrillas/2019/09/10/bd3c6dd171f768d0e465bae1e1001e021568105507.jpg"
    //   },
    //   {
    //     channel: "cuatro",
    //     color: "#d91c04",
    //     config: "https://mab.mediaset.es/1.0.0/get?oid=bitban_api&eid=%2Fapi%2Fcms%2Fmitele%2Fvideos%2FMDSVST20191211_0007%2Fconfig%2Ffinal.json%3Fplatform%3Dmtweb",
    //     eventId: "1085967",
    //     image: "https://album.mediaset.es//parrillas/2018/11/05/595555d41d79c7322c0ab68059f8e7fe1541415149.jpg"
    //   },
    //   {
    //     channel: "divinity",
    //     color: "#fa5197",
    //     config: "https://mab.mediaset.es/1.0.0/get?oid=bitban_api&eid=%2Fapi%2Fcms%2Ftelecinco%2Fvideos%2FMDSVOD20200608_0074%2Fconfig%2Ffinal.json",
    //     eventId: "1085994",
    //     image: "https://album.mediaset.es//parrillas/2018/11/28/191f515705eefaa4ba5233b3e34483661543399885.jpg"
    //   },
    //   {
    //     channel: "boing",
    //     color: "#00aadb",
    //     config: "https://mab.mediaset.es/1.0.0/get?oid=bitban_api&eid=%2Fapi%2Fcms%2Fmitele%2Fvideos%2FMDSVST20191211_0009%2Fconfig%2Ffinal.json%3Fplatform%3Dmtweb",
    //     eventId: "1085902",
    //     image: "https://album.mediaset.es//parrillas/2020/03/24/7b2c6d17b6f6d4bb233233cb9799d50f1585037752.jpg"
    //   },
    //   {
    //     channel: "fdf",
    //     color: "#69ac40",
    //     config: "https://mab.mediaset.es/1.0.0/get?oid=bitban_api&eid=%2Fapi%2Fcms%2Fmitele%2Fvideos%2FMDSVST20191205_0006%2Fconfig%2Ffinal.json%3Fplatform%3Dmtweb",
    //     eventId: "1086051",
    //     image: "https://album.mediaset.es//parrillas/2017/03/07/728ba11794449fa8bf37992501baa3011488880845.jpg"
    //   },
    //   {
    //     channel: "energy",
    //     color: "#1a1a1a",
    //     config: "https://mab.mediaset.es/1.0.0/get?oid=bitban_api&eid=%2Fapi%2Fcms%2Fmitele%2Fvideos%2FMDSVST20191211_0010%2Fconfig%2Ffinal.json%3Fplatform%3Dmtweb",
    //     eventId: "1086023",
    //     image: "https://album.mediaset.es//parrillas/2017/03/06/38ace98cf746bf73bf2e7603e62c732b1488826183.jpg"
    //   },
    //   {
    //     channel: "bemad",
    //     color: "#274c8e",
    //     config: "https://mab.mediaset.es/1.0.0/get?oid=bitban_api&eid=%2Fapi%2Fcms%2Fmitele%2Fvideos%2FMDSVST20191205_0005%2Fconfig%2Ffinal.json%3Fplatform%3Dmtweb",
    //     eventId: "1085840",
    //     image: "https://album.mediaset.es//parrillas/2020/04/20/bb59c0e8c25512e4995f8716a019b5541587371076.jpg"
    //   }]
    // }
    //..test

    const { multichannelLastConfig, services } = player.state

    return services[MULTICHANNEL].response || multichannelLastConfig
  }
}

export function isMultichannelEnabled(player) {
  return () => {
    const { onProgramChange } = player.props
    const { isMultichannelEnabled } = player.state

    const config = player.findMultichannelConfig()

    return !!(
      onProgramChange &&
      isMultichannelEnabled !== false &&
      config && Array.isArray(config.channels) && config.channels.length
    )
  }
}

export function refreshMultichannel(player) {
  return() => {
    const { services } = player.state
    player.initService(MULTICHANNEL, services[MULTICHANNEL].url)
  }
}

export function switchChannel(player) {
  let activeThreadId = null

  return(data) => {
    const { onProgramChange } = player.props
    const { dfp, id, multichannelLastConfig, multichannelZaps, playedTime, user } = player.state
    const { channel: dataChannel, eventId: dataEventId } = data

    const logger = player.getLogger('multichannel')

    player.stopProcessing()

    if(onProgramChange) {
      const currentThreadId = generateGuid()
      activeThreadId = currentThreadId

      player.pause(true)

      player.setState({
        isProcessingChannelChange: true,
        isProcessingChannelChangeRecovery: false
      }, () => {
        const resolve = () => {
          if(currentThreadId === activeThreadId) {
            const nextMultichannelPlayedTime = playedTime ? Math.ceil(playedTime / 60) : 1
            const nextMultichannelZaps = multichannelZaps + 1
    
            player.setState({
              isProcessingChannelChange: false,
              isProcessingChannelChangeRecovery: false
            }, () => {
              player.playNewVideo({
                configUrl: data.config,
                dfp: {
                  ...dfp,
                  custParams: {
                    ...(dfp && dfp.custParams),
                    duracionzapping: `${nextMultichannelPlayedTime}`,
                    zappeos: `${nextMultichannelZaps}`
                  }
                },
                multichannelLastConfig,
                multichannelPlayedTime: nextMultichannelPlayedTime,
                multichannelZaps: nextMultichannelZaps
              }, true)
            })
          }
        }
  
        const reject = (reason) => {
          if(currentThreadId === activeThreadId) {
            player.setState({
              isProcessingChannelChange: false,
              isProcessingChannelChangeRecovery: false
            }, () => {
              player.error({ 
                type: parseProgramChangeError(reason && reason.type),
                info: {
                  code: {
                    multichannel: 'not_allowed'
                  },
                  user: user && user.UID
                }
              })
            })
          }
        }

        window.setTimeout(() => {
          if(currentThreadId === activeThreadId) {
            if(player.state.isProcessingChannelChange) {
              player.startProcessing(START_OVER, 'Cambiando de canal...')
            }
          }
        }, 100)

        window.setTimeout(() => {
          if(currentThreadId === activeThreadId) {
            if(player.state.isProcessingChannelChange) {
              player.startProcessing(START_OVER, 'Cambiando de canal...')

              player.setState({
                isProcessingChannelChangeRecovery: true
              })
            }
          }
        }, 5000)

        onProgramChange({ channel: dataChannel, eventId: dataEventId, forceCheck: true, playerId: id })  
        .then(
          (allowed) => {
            if(allowed) {
              resolve()

            } else {
              reject()
              player.setState({
                channelError: dataEventId
              })
            }
          },
          (reason) => {
            reject(reason)
            player.setState({
              channelError: dataEventId
            })
          })
        .catch((error) => resolve())
      })
    } else {
      logger.error('No se encuentra onProgramChange, por tanto, no se puede cambiar de canal')
    }
  }
}