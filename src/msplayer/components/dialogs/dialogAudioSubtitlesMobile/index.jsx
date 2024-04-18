import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import styles from './dialogAudioSubtitlesMobile.css'

const SUBTITLES = 'Subtítulos'
const AUDIO = 'Audio'

/**
 * Render a Audio/Subtitles layer
 * @return {Component}
*/
class DialogAudioSubtitlesMobile extends Component {
  constructor(props) {
    super(props)
    this.containerRef = React.createRef()
    this.shouldExecuteFunction = true
    this.state = {
      selectedItem: {},
      currentAudioTracks: {},
      isItemSelectedChanged: false,
      isAudioTracksChanged: false
    }
  }

  componentDidMount() {
    const { selected, currentAudioTrack } = this.props
    document.addEventListener('touchstart', this.handleTouch, true)
    document.addEventListener('touchmove', this.handleTouch, true)
    document.addEventListener('touchend', this.handleTouch, true)
    document.addEventListener('touchcancel', this.handleTouch, true)
    this.setState({
      selectedItem: selected,
      currentAudioTracks: currentAudioTrack
    })
  }

  componentWillUnmount() {
    document.removeEventListener('touchstart', this.handleTouch, true)
    document.removeEventListener('touchmove', this.handleTouch, true)
    document.removeEventListener('touchend', this.handleTouch, true)
    document.removeEventListener('touchcancel', this.handleTouch, true)
  }

  handleTouch = (event) => {
    if (this.containerRef.current && !this.containerRef.current.contains(event.target)) {
      if (this.shouldExecuteFunction) {
        const { onClose } = this.props
        onClose()
        this.shouldExecuteFunction = false
      }
      event.stopPropagation()
    }
  }

  changeItems(items) {
    this.setState({
      selectedItem: items,
      isItemSelectedChanged: true
    })
  }

  changeTrack(tracks) {
    this.setState({
      currentAudioTracks: tracks,
      isAudioTracksChanged: true
    })
  }

  handleAudioChange(e) {
    const { onAudioChange } = this.props
    if (onAudioChange) {
      onAudioChange(e)
    }
  }

  handleSubtitlesChange(e) {
    const { onSubtitlesChange } = this.props
    if (onSubtitlesChange) {
      onSubtitlesChange(e)
    }
  }

  handleSubtitlesAudioChange(subtitle, audio) {
    const { onClose } = this.props
    const { isItemSelectedChanged, isAudioTracksChanged } = this.state
    if (isAudioTracksChanged) {
      this.handleAudioChange(audio)
    }
    if (isItemSelectedChanged) {
      this.handleSubtitlesChange(subtitle)
    }
    onClose()
  }

  renderMenu() {
    const { audioTracks, config } = this.props
    const { selectedItem, currentAudioTracks } = this.state
    const isAudioTrack = audioTracks && audioTracks.length > 1
    const isSubtitles = config && config.length > 0

    return (
      <div className={ styles.container_menu }>
        { isAudioTrack
        && (
          <div className={ styles.menu_audio }>
            <div className={ styles.container_audioText }>
              <span className={ styles.title_audio }>{ AUDIO }</span>
            </div>
            <ul>
              { audioTracks.map((track, index) => (
                <li
                  data-agth={ `playerAudioItem-${index+1}` }
                  key={ `language-item-${track.index}` }
                  className={ [styles.item, typeof currentAudioTracks !== 'undefined' && currentAudioTracks.index === track.index ? styles.selected : ''].join(' ') }
                  onClick={ () => this.changeTrack({ ...track }) }
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
                  className={ [styles.item, selectedItem && selectedItem.language === item.language ? styles.selected : ''].join(' ') }
                  key={ `subtitle-item-${item.language}-${index}` }
                  onClick={ () => this.changeItems({ ...item })}
                >
                  <span className={ styles.label }>{ item.name }</span><span className={ styles.check }></span>
                </li>
              )) }
            </ul>
          </div>
        )}
      </div>
    )
  }

  render() {
    const { onClose } = this.props
    const { selectedItem, currentAudioTracks } = this.state

    return (
      <div ref={ this.containerRef } className={ styles.container }>
        { this.renderMenu() }
        <div className={ styles.container_buttons }>
          <button
            data-agth={ 'playerCancelButton' }
            className={ styles.btcancelar }
            onClick={ () => onClose() }
          >
            <span className={ styles.btntext_cancelar }>{ 'Cancelar' }</span>
          </button>
          <button
            data-agth={ 'playerApplyButton' }
            className={ styles.btaplicar }
            onClick={ () => this.handleSubtitlesAudioChange(selectedItem, currentAudioTracks)}
          >
            <span className={ styles.btntext_aplicar }>{ 'Aplicar' }</span>
          </button>
        </div>
      </div>
    )
  }
}

DialogAudioSubtitlesMobile.propTypes = {
  config: PropTypes.arrayOf(PropTypes.shape({
    language: PropTypes.string,
    vtt: PropTypes.string
  })),
  onClose: PropTypes.func.isRequired,
  selected: PropTypes.shape({
    language: PropTypes.string,
    name: PropTypes.string
  })
}

export default DialogAudioSubtitlesMobile
