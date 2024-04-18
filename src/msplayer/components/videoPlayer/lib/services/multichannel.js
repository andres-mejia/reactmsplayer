import { serviceNames } from '../../../../commons/types'

const { MULTICHANNEL } = serviceNames

export function storeMultichannelResponse(player) {
  return (response, url) => {
    return new Promise((resolve, reject) => {
      let nextState = {}

      if(
        response && Object.keys(response).length &&
        Array.isArray(response.channels)
      ){
        nextState = { 
          multichannelLastConfig: {
            ...response,
            channels: response.channels.map((chan) => ({ ...chan }))
          } 
        }
      }

      player.setState({
        ...nextState,
        services: {
          ...player.state.services,
          [MULTICHANNEL]: { url, response }
        }
      }, () => resolve())
    })
  }
}
