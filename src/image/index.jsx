// Libs
import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { getCustomSizeImagizerUrl, getImagizerDefaultUrl, getSrcSet, getSizes, getFallbackUrl } from './imagizer'

/**
 * Render an image with srcSet if imagizer parameters are provided
 * @param {String} src     Image url
 * @param {String} alt     Image alt text
 * @param {String} imageCN classname string
 * @param {String} role
 * @param {Object} [imagizer={}}]
 */
export default class ImageComponent extends Component {
  static defaultProps = {
    imagizer: {},
    isAsset: false
  }

  constructor(props){
    super(props)
    const { src, imagizer, isAsset } = props
    const srcSet = this.createSrcSetState(src, imagizer, isAsset)

    this.state = {
      ...srcSet
    }
  }

  componentDidMount() {
    this.updateSrc()
  }

  componentDidUpdate(prevProps) {
    const { src, imagizer, isAsset } = this.props
    if(prevProps.src !== src){
      this.updateSrcSet(src, imagizer, isAsset).then(() => {
        this.updateSrc()
      })
    }
  }

  updateSrc(){
    const { isImagizerEnabled } = this.props
    const { sizes, baseUrl } = this.state
    if(isImagizerEnabled && sizes){
      const url = getFallbackUrl(baseUrl)
      this.updateState({ url })
    }
  }

  updateSrcSet(...params){
    return this.updateState(this.createSrcSetState(...params))
  }

  createSrcSetState(src, imagizer, isAsset){
    const { isImagizerEnabled } = this.props
    if(!isImagizerEnabled || isAsset){
      return { url: src }
    }

    const baseUrl = src
    const srcSet = getSrcSet(baseUrl)

    let url, sizes
    if (imagizer.width || imagizer.height) {
      url = getCustomSizeImagizerUrl(baseUrl, imagizer)
    } else if (imagizer.type) {
      sizes = getSizes(imagizer.type)
      url = getImagizerDefaultUrl(baseUrl)
    } else {
      url = getImagizerDefaultUrl(baseUrl)
    }

    return { baseUrl, url, srcSet, sizes }
  }

  updateState(updateState) {
    return new Promise((resolve) => {
      const newState = Object.assign({}, this.state, updateState)
      this.setState(newState, () => resolve)
    })
  }

  render(){
    const { alt, className, role, style, title } = this.props

    return (
      <img
        title={ title }
        className={ className }
        loading={ 'lazy' }
        src={ this.state.url }
        srcSet={ this.state.srcSet }
        sizes={ this.state.sizes }
        alt={ alt }
        role={ role }
        style={ style }
        
      />
    )
  }
}

ImageComponent.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
  role: PropTypes.string,
  imagizer: PropTypes.shape({
    width: PropTypes.string,
    height: PropTypes.string,
    imageType: PropTypes.string,
    type: PropTypes.string
  }),
  isAsset: PropTypes.bool,
  title: PropTypes.string,
  isImagizerEnabled: PropTypes.bool
}

ImageComponent.defaultProps = {
  isImagizerEnabled: true
}
