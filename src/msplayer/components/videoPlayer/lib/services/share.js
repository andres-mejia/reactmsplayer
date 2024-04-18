import { serviceNames } from '../../../../commons/types'

const { SHARE } = serviceNames

export function storeShareResponse(player) {
  return (response, url) => {
    return new Promise((resolve, reject) => {
      let newState = {}

      if(response.share && Object.keys(response.share).length ||
        response.embed && response.embed.code && response.embed.code !== ''
      ){
        newState = { isShareEnabled: true }
      }

      player.setState({
        ...newState,
        services: {
          ...player.state.services,
          [SHARE]: { url, response }
        }
      }, () => resolve())
    })
  }
}
