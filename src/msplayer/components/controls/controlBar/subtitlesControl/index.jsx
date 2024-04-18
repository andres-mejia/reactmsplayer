import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import ToggleBt from '../toggleBt'
import styles from './subtitlesControl.css'

class SubtitlesControl extends Component  {
  constructor(props) {
    super(props)

    this.state = {
      isMenuVisible: false
    }

    this.handleToggleMenuVisible = this.handleToggleMenuVisible.bind(this)
  }

  renderMenu() {
    const { config, selected } = this.props
    const { isMenuVisible } = this.state

    return (
      isMenuVisible &&
      <div className={ styles.menu }>
        <ul>
          { [{
              language: 'none',
              name: 'Sin subtítulos'
            }, 
            ...config 
          ].map((item, index) => (
            <li
              className={ [styles.item, selected && selected.language === item.language ? styles.selected : ''].join(' ') }
              key={ `subtitle-item-${item.language}-${index}` }
              onClick={ () => this.handleSubtitlesChange({ ...item })}
            >
              <span className={ styles.label }>{ item.name }</span><span className={ styles.check }></span>
            </li>
          )) }
        </ul>
      </div>
    )
  }

  handleSubtitlesChange(e) {
    const { onChange } = this.props

    if(onChange) {
      onChange(e)
    }

    this.setState({
      isMenuVisible: false
    })
  }

  handleToggleMenuVisible() {
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
          iconNameInitial={ 'player_icon_subtitles' }
          onToggle={ this.handleToggleMenuVisible }
        />
      </div>
    )
  }
}

SubtitlesControl.propTypes= {
  config: PropTypes.arrayOf(PropTypes.shape({
    language: PropTypes.string,
    vtt: PropTypes.string
  })),
  onChange: PropTypes.func,
  selected: PropTypes.shape({
    language: PropTypes.string,
    name: PropTypes.string
  })
}

export default SubtitlesControl
