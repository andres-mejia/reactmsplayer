import { serviceNames } from '../../../../commons/types'

const { GEOLOCATION } = serviceNames

export function storeGeoResponse(player) {
  return (response, url) => {
    return new Promise((resolve, reject) => {
      const { services } = player.state

      let newState = {}

      if(response.country) {
        newState = {
          locale: response.country.toLowerCase()
        }
      }

      player.setState({
        ...newState,
        services: {
          ...services,
          [GEOLOCATION]: {
            url,
            response
          }
        }
      }, () => resolve())
    })
  }
}
