import { serviceNames } from '../../../../commons/types'

const { GBX } = serviceNames

export function storeGbxResponse(player) {
  return (response, url) => {
    return new Promise((resolve, reject) => {
      const { services } = player.state

      let newState = {}

      if(response.gbx) {
        newState = {
          gbx: response.gbx
        }
      }

      player.setState({
        ...newState,
        services: {
          ...services,
          [GBX]: {
            url,
            response
          }
        }
      }, () => resolve())
    })
  }
}
