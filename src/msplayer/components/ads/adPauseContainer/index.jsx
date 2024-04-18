/* eslint-disable react/self-closing-comp */
import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import AdPause from '../adPause'
import styles from './adPauseContainer.css'

class AdPauseContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isAdPauseVisible: false,
      imageClassName: 'high'
    }
    this.imageRef = React.createRef()
    this.setImageClassName = this.setImageClassName.bind(this)
  }

  setImageClassName() {
    const image = this.imageRef.current
    if (!image) return
    const { naturalHeight: height, naturalWidth: width } = image
    if (!height && !width) return

    this.setState({
      imageClassName: height > width ? 'high' : 'wide',
      isAdPauseVisible: true
    })
  }

  render() {
    const {
      src, link, alt, title, className, onClose
    } = this.props
    const { isAdPauseVisible, imageClassName } = this.state
    const closeButtonClass = `closeButton__${imageClassName}`
    return (
      <div className={ `${styles.container} ${styles[className]}` }>
        { isAdPauseVisible ? <div className={ `${styles.closeButton} ${styles[closeButtonClass]}` } onClick={ onClose }></div> : null }
        <AdPause
          src={ src }
          link={ link }
          alt={ alt }
          title={ title }
          className={ isAdPauseVisible ? className : 'hiddenContainer' }
          imageClassName={ imageClassName }
          imageRef={ this.imageRef }
          setImageClassName={ this.setImageClassName }
        />
      </div>
    )
  }
}

AdPauseContainer.propTypes = {
  src: PropTypes.string.isRequired,
  link: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.oneOf(['portrait', 'landscape']),
  onClose: PropTypes.func.isRequired
}

AdPauseContainer.defaultProps = {
  link: '',
  alt: '',
  className: ''
}

export default AdPauseContainer
