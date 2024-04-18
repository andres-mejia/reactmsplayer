import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import styles from './dialogAudioSubtitlesDesktop.css'

const SUBTITLES = 'Subtítulos'
const AUDIO = 'Audio'

/**
 * Render a Audio/SubtitlesMenu layer
 * @return {Component}
*/
class DialogAudioSubtitlesDesktop extends Component {
  constructor(props) {
    super(props)
    this.containerRef = React.createRef()
    this.shouldExecuteFunction = true
    this.state = {
      isMenuVisible: true
    }
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClick, true)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick, true)
  }

  handleClick = (event) => {
    if (this.containerRef.current && !this.containerRef.current.contains(event.target)) {
      if (this.shouldExecuteFunction) {
        const { onClose } = this.props
        onClose()
        this.shouldExecuteFunction = false
      }
      event.stopPropagation()
      event.preventDefault()
    }
  }

  handleAudioChange(e) {
    const { onAudioChange } = this.props
    if (onAudioChange) {
      onAudioChange(e)
    }
    this.setState({
      isMenuVisible: false
    })
  }

  handleSubtitlesChange(e) {
    const { onSubtitlesChange } = this.props

    if (onSubtitlesChange) {
      onSubtitlesChange(e)
    }

    this.setState({
      isMenuVisible: false
    })
  }

  findClassName(isAudioTrack, isSubtitles) {
    const { isChatBottonVisible, isCloseBottonVisible } = this.props

    if (isAudioTrack && isSubtitles) {
      if (isCloseBottonVisible) {
        return isChatBottonVisible ? styles.menu_ambos_chat_close : styles.menu_ambos_close
      } else {
        return isChatBottonVisible ? styles.menu_ambos_chat : styles.menu_ambos
      }
    } else {
      if (isCloseBottonVisible) {
        return isChatBottonVisible ? styles.menu_chat_close : styles.menu_close
      } else {
        return isChatBottonVisible ? styles.menu_chat : styles.menu
      }
    }
  }

  renderMenu() {
    const {
      audioTracks, config, currentAudioTrack, selected
    } = this.props
    const { isMenuVisible } = this.state

    const isAudioTrack = audioTracks && audioTracks.length > 1
    const isSubtitles = config && config.length > 0

    return (
      isMenuVisible
      && (
        <div
          className={ this.findClassName(isAudioTrack, isSubtitles) }
        >
          { isAudioTrack
          && (
            <div className={ styles.menu_audio }>
              <div className={ styles.container_audioText } >
                <span className={ styles.title_audio }>{ AUDIO }</span>
              </div>
              <ul>
                { audioTracks.map((track, index) => (
                  <li
                    data-agth={ `playerAudioItem-${index+1}` }
                    key={ `language-item-${track.index}` }
                    className={ [styles.item, typeof currentAudioTrack !== 'undefined' && currentAudioTrack.index === track.index ? styles.selected : ''].join(' ') }
                    onClick={ () => this.handleAudioChange({ ...track })}
                  >
                    <span className={ styles.label }>{ track && track.label ? track.label : `Audio ${index + 1}` }</span>
                    <span className={ styles.check } />
                  </li>
                )) }
              </ul>
            </div>
          )}
          { isSubtitles
          && (
            <div className={ styles.menu_subtitulo }>
              <div className={ styles.container_subtitleText }>
                <span className={ styles.title_subtitle }>{ SUBTITLES }</span>
              </div>
              <ul>
                { [{
                  language: 'none',
                  name: 'Ninguno'
                },
                ...config
                ].map((item, index) => (
                  <li
                    data-agth={ `playerSubtitleItem-${index+1}` }
                    className={ [styles.item, selected && selected.language === item.language ? styles.selected : ''].join(' ') }
                    key={ `subtitle-item-${item.language}-${index}` }
                    onClick={ () => this.handleSubtitlesChange({ ...item })}
                  >
                    <span className={ styles.label }>{ item.name }</span>
                    <span className={ styles.check } />
                  </li>
                )) }
              </ul>
            </div>
          )}
        </div>
      )
    )
  }

  render() {
    return (
      <div ref={ this.containerRef } className={ styles.container }>
        { this.renderMenu() }
      </div>
    )
  }
}

DialogAudioSubtitlesDesktop.propTypes = {
  config: PropTypes.arrayOf(PropTypes.shape({
    language: PropTypes.string,
    vtt: PropTypes.string
  })),
  onSubtitlesChange: PropTypes.func,
  selected: PropTypes.shape({
    language: PropTypes.string,
    name: PropTypes.string
  })
}

export default DialogAudioSubtitlesDesktop
