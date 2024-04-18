import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import ToggleBt from '../toggleBt'
import styles from './languageControl.css'

class LanguageControl extends Component  {
  constructor(props) {
    super(props)

    this.state = {
      isMenuVisible: false
    }

    this.handleToggleMenuVisible = this.handleToggleMenuVisible.bind(this)
  }

  renderMenu() {
    const { audioTracks, currentAudioTrack } = this.props
    const { isMenuVisible } = this.state

    return (
      isMenuVisible &&
      <div className={ styles.menu }>
        {/*<div className={ styles.menuTitle }>Audio</div>*/}
        <ul>
          { audioTracks.map((track, index) => (
            <li
              key={ `language-item-${track.index}` }
              className={ [styles.item, typeof currentAudioTrack !== 'undefined' && currentAudioTrack.index === track.index ? styles.selected : ''].join(' ') }
              onClick={ () => this.handleLanguageChange({ ...track })}
            >
              <span className={ styles.label }>{ `Audio ${index + 1}`/*track.label*/ }</span><span className={ styles.check }></span>
            </li>
          )) }
        </ul>
      </div>
    )
  }

  handleLanguageChange(e) {
    const { onLanguageChange } = this.props
    if(onLanguageChange) {
      onLanguageChange(e)
    }
    this.setState({
      isMenuVisible: false
    })
  }

  handleToggleMenuVisible(e) {
    const { isMenuVisible } = this.state

    this.setState({
      isMenuVisible: !isMenuVisible
    })
  }

  render() {
    return (
      <div className={ styles.container }>
        { this.renderMenu() }
        <ToggleBt
          iconNameInitial={ 'player_icon_language' }
          onToggle={ this.handleToggleMenuVisible }
        />
      </div>
    )
  }
}

LanguageControl.propTypes= {
  audioTracks: PropTypes.arrayOf(PropTypes.shape({
    index: PropTypes.number,
    label: PropTypes.string,
    language: PropTypes.string
  })),
  currentAudioTrack: PropTypes.shape({
    index: PropTypes.number,
    label: PropTypes.string,
    language: PropTypes.string
  })
}

export default LanguageControl
