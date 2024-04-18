import { mergeQueryStringParamsSmart } from '../../../commons/util'
import { genres, processes, serviceNames } from '../../../commons/types'

const { CONTENT } = genres
const { START_OVER } = processes
const { CONFIG } = serviceNames

export function startOver(player) {
  return (toStartOver) => {
    const { onStartOverRequested } = player.props

    if(onStartOverRequested) {
      player.pause(true)

      onStartOverRequested()
      .then(
        (isAllowed) => {
          if(isAllowed) {
            const { liveEventId, services } = player.state

            player.setState({
              isProcessingStartOver: true
            })

            if(toStartOver) {
              player.startProcessing(START_OVER, 'Cargando programa desde el inicio...')

              player.startData(
                { [CONFIG]: mergeQueryStringParamsSmart(services[CONFIG].url, { event: liveEventId, so: 1 }) },
                CONTENT
              )
              .then((genre) => {
                player.setState({
                  isProcessingStartOver: false,
                  isStartOverPlayback: true,
                  keyAnalytics: Math.round(Math.random() * 1000000)
                }, () => {
                  player.stopProcessing()
                  player.startContent(1)
                })
              })
              .catch((error) => player.error(error))

            } else {
              player.startProcessing(START_OVER, 'Volviendo al directo...')

              player.startData(
                { [CONFIG]: mergeQueryStringParamsSmart(services[CONFIG].url, { event: undefined, so: undefined }) },
                CONTENT
              )
              .then((genre) => {
                player.setState({
                  isProcessingStartOver: false,
                  isStartOverPlayback: false,
                  keyAnalytics: Math.round(Math.random() * 1000000)
                }, () => {
                  player.stopProcessing()
                  player.startContent()
                })
              })
              .catch((error) => player.error(error))
            }
          } else {
            player.play()
          }
        },
        () => null
      )
      .catch((error) => player.play())

    } else {
      player.setState({
        isStartOverAvailable: false
      })
    }
  }
}
