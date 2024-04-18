class HeaderBidding {
    static getBids(slots, domain, iu, options) {
      return new Promise((resolve, reject) => {
        if(typeof window === 'undefined' || !window.Sibbo) return reject()

        try {
          if(typeof options !== 'undefined' && options.timeout) {
            window.Sibbo.runVideo(slots, domain, iu, options)
            .then((encodedVideoTargeting) => {
              if(!encodedVideoTargeting) return reject({
                message: 'No se ha recibido encodedVideoTargeting'
              })

              resolve(encodedVideoTargeting)
            })
            .catch((error) => {
              reject(error)
            })  

          } else {
            window.Sibbo.runVideo(slots, domain, iu)
            .then((encodedVideoTargeting) => {
              if(!encodedVideoTargeting) return reject({
                message: 'No se ha recibido encodedVideoTargeting'
              })

              resolve(encodedVideoTargeting)
            })
            .catch((error) => {
              reject(error)
            })  
          }
        } catch(e) {
          reject(e)
        }
      })
    }
  }
  
  export default HeaderBidding
  