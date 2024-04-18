import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { contentEvents } from '../../commons/types/events'

const {
  CONTENT_ENDED,
  CONTENT_ERROR,
  CONTENT_PLAYING,
  PLAY_NEXT_VIDEO
} = contentEvents

class Xdr extends Component {
  constructor(props){
    super(props)

    this.timer = undefined

    this.handleBeforeUnload = this.handleBeforeUnload.bind(this)
    this.storePosition = this.storePosition.bind(this)
  }

  componentDidMount() {
    this.init()
  }

  componentWillUnmount(){
    this.stop()

    window.removeEventListener('pagehide', this.handleBeforeUnload)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  }

  handleBeforeUnload(){
    this.stop()
  }

  safeCurrentTime(currentTime) {
    currentTime = currentTime === undefined ? this.props.currentTime : currentTime

    if(!isNaN(currentTime)) {
      currentTime = Math.round(currentTime)
    } else {
      currentTime = 0
    }

    return currentTime
  }

  accounts(user) {
    return new Promise((resolve) => {
      const { signatureTimestamp, uidSignature } = user
      const now = Math.floor(Date.now() / 1000);
      const userInfo = {
        signatureTimestamp: signatureTimestamp,
        uidSignature: uidSignature
      }
      if ((!signatureTimestamp || !uidSignature) || Math.abs(now - signatureTimestamp) > 180) {
        window.gigya.accounts.getAccountInfo({
          callback: (response) => {
            if (response) {
              userInfo.uidSignature = response.UIDSignature
              userInfo.signatureTimestamp = response.signatureTimestamp
              resolve(userInfo)
            }
          }
        })
      } else {
        resolve(userInfo)
      }
    })
  }

  init(){
    this.start()

    window.addEventListener('pagehide', this.handleBeforeUnload)
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  }

  handleEvent(eventType, params){
    switch(eventType){
      case CONTENT_PLAYING:
        this.start()
        break

      case CONTENT_ENDED:
      case PLAY_NEXT_VIDEO:
        this.complete()
        break

      case CONTENT_ERROR:
        this.stop()
        break
    }
  }

  async storePosition() {
    this.stop()
    const {
      config: { contentId, host },
      currentTime,
      isPlaying,
      logger,
      user
    } = this.props
    if(typeof window !== 'undefined' && window.gigya && window.gigya.accounts && window.gigya.accounts.getAccountInfo) {
     await this.accounts(user).then((data) => {
        let url = host
        if (url.substr(-1) !== '/') url += '/'
        url += `${user.UID}/${user.profile.pid}`


        const body = JSON.stringify({
          itemId: contentId,
          seconds: this.safeCurrentTime(currentTime)
        })

        logger.info(`Actualizar posición del cabezal de reproducción: ${body}`)
        fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            signatureTimestamp: data.signatureTimestamp,
            uidSignature: data.uidSignature
          },
          method: 'PUT',
          body
        })
          .then((response) => {
            if (response.ok) {
              return response.json()
            } else {
              throw new Error(`PUT ${url} ${response.status} ${response.statusText}`)
            }
          })
          .catch((error) => {
            logger.error(`Error al actualizar posición del cabezal de reproducción: ${error.message}`)
          })

        if (isPlaying) {
          this.start()
        }
      })
    }
  }

  start() {
    const { config: { interval }, logger } = this.props

    if(!this.timer) {
      if(interval && !isNaN(interval)) {
        logger.error(`Iniciar intervalo de tiempo para actualizar la posición del cabezal de reproducción: ${interval * 1000}`)

        this.timer = window.setTimeout( this.storePosition, interval * 1000 )
      }
    }
  }

  stop() {
    if(this.timer) {
      this.props.logger.error(`Cancelar intervalo de tiempo para actualizar la posición del cabezal de reproducción`)

      window.clearTimeout(this.timer)
      this.timer = null
    }
  }

  complete() {
    const {
      config: { contentId, host },
      logger,
      user
    } = this.props
    if(typeof window !== 'undefined' && window.gigya && window.gigya.accounts && window.gigya.accounts.getAccountInfo) {
      this.accounts(user).then((data) => {
        let url = host
        if (url.substr(-1) !== '/') url += '/'
        url += `${user.UID}/${user.profile.pid}`

        const body = JSON.stringify({
          itemId: contentId
        })

        logger.info(`Borrar los registros XDR del contenido (${contentId}) porque se ha llegado al final de la reproducción`)
        fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            signatureTimestamp: data.signatureTimestamp,
            uidSignature: data.uidSignature
          },
          method: 'DELETE',
          body
        })
          .then((response) => {
            if (response.ok) {
              return response.json()
            } else {
              throw new Error(`DELETE ${url} ${response.status} ${response.statusText}`)
            }
          })
          .catch((error) => {
            logger.info(`Error al borrar los registros XDR del contenido ${contentId}: ${error.message}`)
          })
      this.stop()
      })
    }

  }

  render() {
    return null
  }
}

Xdr.propTypes = {
  config: PropTypes.shape({
    contentId: PropTypes.string,
    host: PropTypes.string,
    interval: PropTypes.number
  }),
  currentTime: PropTypes.number,
  isPlaying: PropTypes.bool,
  logger: PropTypes.object,
  user: PropTypes.shape({
    firstName: PropTypes.string,
    gender: PropTypes.string,
    isSubscribed: PropTypes.bool,
    lastName: PropTypes.string,
    photoURL: PropTypes.string,
    signatureTimestamp: PropTypes.string,
    thumbnailURL: PropTypes.string,
    UID: PropTypes.string,
    UIDSignature: PropTypes.string,
    profile: PropTypes.shape({
      pid: PropTypes.string,
      name: PropTypes.string,
      channels: PropTypes.shape({
          id: PropTypes.string,
          color: PropTypes.string,
      }),
      images: PropTypes.shape({
        id: PropTypes.string,
        src: PropTypes.string
      })
    })
  })
}

Xdr.defaultProps = {
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default Xdr
