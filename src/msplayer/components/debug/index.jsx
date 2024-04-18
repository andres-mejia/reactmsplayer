import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { copyToClipboard } from '../../commons/util'
import { isIos } from '../../commons/userAgent'
import styles from './debug.css'

class Debug extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dragOffsetX: 0,
      dragOffsetY: 0,
      id: null,
      isClosed: false,
      isMinimized: false,
      left: undefined,
      top: undefined
    }

    this.handleClear = this.handleClear.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleCopy = this.handleCopy.bind(this)
    this.handleDocumentMove = this.handleDocumentMove.bind(this)
    this.handleDocumentUp = this.handleDocumentUp.bind(this)
    this.handleLog = this.handleLog.bind(this)
    this.handleMaximize = this.handleMaximize.bind(this)
    this.handleMinimize = this.handleMinimize.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.saveRef = this.saveRef.bind(this)
  }

  componentDidMount() {
    if(this.props.logger) {
      this.props.logger.subscribe(this.handleLog, 'debug')
    }
  }

  handleLog(message) {
    if(this.textAreaInstance) {
      let output = ''

      if (this.textAreaInstance.textContent !== '') output += '\r\n'
      if (typeof message === 'string') {
        output += message
      } else {
        const getObjectString = (obj, indentation) => {
          let str = ''
          for (let key in obj) {
            if (typeof obj[key] === 'string') {
              str += `\r\n${indentation}${key}: ${obj[key]}`
            } else if(Array.isArray(obj[key])){
              str += `\r\n${indentation}${key}: ${obj[key]}`
            } else {
              str += getObjectString(obj[key], indentation + indentation);
            }
          }
          return str
        }
        output += getObjectString(message, '    ')
      }
      this.textAreaInstance.textContent += output
      this.textAreaInstance.scrollTop = this.textAreaInstance.scrollHeight
    }
  }

  handleMouseDown(e) {
    this.setState({
      dragOffsetX: e.pageX - this.ref.offsetLeft,
      dragOffsetY: e.pageY - this.ref.offsetTop
    }, () => {
      document.addEventListener('touchmove', this.handleDocumentMove)
      document.addEventListener('touchend', this.handleDocumentUp)
      document.addEventListener('touchcancel', this.handleDocumentUp)
      document.addEventListener('mousemove', this.handleDocumentMove)
      document.addEventListener('mouseup', this.handleDocumentUp)
    })
  }

  handleDocumentMove(e) {
    const { dragOffsetX, dragOffsetY } = this.state

    this.setState({
      left: `${e.pageX - dragOffsetX}px`,
      top: `${e.pageY - dragOffsetY}px`
    })
  }

  handleDocumentUp() {
    document.removeEventListener('touchmove', this.handleDocumentMove)
    document.removeEventListener('touchend', this.handleDocumentUp)
    document.removeEventListener('touchcancel', this.handleDocumentUp)
    document.removeEventListener('mousemove', this.handleDocumentMove)
    document.removeEventListener('mouseup', this.handleDocumentUp)
  }

  handleMaximize() {
    this.setState({
      isMinimized: false
    })
  }

  handleMinimize() {
    this.setState({
      isMinimized: true
    })
  }

  handleClose() {
    this.setState({
      isClosed: true
    })
  }

  handleClear() {
    if(this.textAreaInstance) {
      this.textAreaInstance.textContent = ''
    }
  }

  handleCopy() {
    const { logger, playerState } = this.props

    if(logger) {
      let log = logger.getLog()
      log = `${JSON.stringify(playerState)}\n\n${log}`
      if( copyToClipboard(log, isIos()) ) this.handleLog('Log copiado en el portapapeles')
    } else {
      this.handleLog('No se ha encontrado ningún log que copiar')
    }
  }

  saveRef(ref, name = 'ref') {
    if(ref){
      this[name] = ref
    }
  }

  render() {
    const { isClosed, isMinimized, left, top } = this.state

    return (
      !isClosed &&
      <div
        className={ styles.logPanel }
        style={{ left, top }}
        onMouseDown={ this.handleMouseDown }
        onTouchStart={ this.handleMouseDown }
        ref={ (ref) => this.saveRef(ref) }
      >
        <div className={ styles.winControls }>
          <div onClick={ this.handleMinimize }>-</div>
          <div onClick={ this.handleMaximize }>+</div>
          <div onClick={ this.handleClose }>x</div>
        </div>
        <button className={ styles.button } onClick={ this.handleCopy }>Copy</button>
        <button className={ styles.button } onClick={ this.handleClear }>Clear</button>
        <div
          className={ `${styles.textArea}${isMinimized ? ` ${styles.minimized}` : ''}` }
          ref={ (ref) => this.saveRef(ref, 'textAreaInstance') }
        />
      </div>
    )
  }
}

Debug.propTypes = {
  logger: PropTypes.object,
  playerState: PropTypes.object
}

Debug.defaultProps = {
  logger: { log: (message) => console.warn(`[DEFAULT]${message}`) }
}

export default Debug
