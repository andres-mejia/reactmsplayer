import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import classNames from 'classnames/bind'
import { copyToClipboard } from '../../../commons/util'
import { isIos, isMobileAny } from '../../../commons/userAgent'
import styles from './dialogShare.css'

const cx = classNames.bind(styles)

/**
 * Render a share layer
 * @return {Component}
*/
class DialogShare extends Component {

  constructor(props){
    super(props)
    this.state = {
      linkCopied: false,
      embebCopied: false
    }

    this.handleCopyToClipboard = this.handleCopyToClipboard.bind(this)
  }

  handleCopyToClipboard(itemName, stringToBeCopied){
    if(copyToClipboard(stringToBeCopied, isIos())) {
      this.setState({
        [`${itemName}Copied`]: true
      }, () => window.setTimeout(() => {
        this.setState({
          [`${itemName}Copied`]: false
        })
      }, 10000))
    }
  }

  renderNetworksTag() {
    const { configShare, onShare } = this.props

    if(configShare && configShare.share){
      const networks = configShare.share

      return Object.keys(networks).map((item, index) => {
        if(item === 'twitter' || item === 'facebook'){
          const styleTag = cx({ 'shareButtons':true, [`shareButtons_${item}`]:true })
          const handleShare = () => {
            if(onShare) {
              onShare(item)
            }
            window.open(networks[item])
          }
          return  (
            <button
              key={ index }
              className={ styleTag }
              onClick={ handleShare }
            />
          )
        }
      })
    }
  }

  renderLinkTag(configShare) {
    if(configShare && configShare.share && configShare.share.link){
      const { linkCopied } = this.state
      const { isPodcast } = this.props

      //const mediaType = this.props.mediaType
      const mediaType = isPodcast ? 'podcast' : 'video'

      const literal = linkCopied ? `Enlace del ${mediaType} copiado` : `Copiar enlace del ${mediaType}`
      const stringToBeCopied = configShare.share.link

      return  (
        <button
          key="linkBt"
          className={ styles.shareLinks_button }
          onClick={ () => this.handleCopyToClipboard('link', stringToBeCopied) }
        >
          { literal }
        </button>
      )
    }
    return null
  }

  renderEmbedTag(configShare) {
    if(configShare && configShare.embed && configShare.embed.code){
      const { embedCopied } = this.state

      const literal = embedCopied ? 'Código embeber copiado' : 'Copiar código embeber'
      const stringToBeCopied = configShare.embed.code

      return  (
        <button
          key="embedBt"
          className={ styles.shareLinks_button }
          onClick={ () => this.handleCopyToClipboard('embed', stringToBeCopied) }
        >
          { literal }
        </button>
      )
    }
    return null
  }

  render(){
    const { configShare, onClose } = this.props

    const networksTag = this.renderNetworksTag(configShare)
    const linkTag = this.renderLinkTag(configShare)
    const embedTag = this.renderEmbedTag(configShare)

    return (
      <div className={ styles.container } >
        <div className={ styles.container_buttons } >
          <div className={ styles.container_shareButtons } >
            { networksTag }
          </div>
          <div className={ styles.container_shareLinks } >
            { [ linkTag, embedTag ] }
          </div>
        </div>
        <div className={ styles.container_closeButton } >
          <button
            className={ styles.closeButton }
            onClick={ () => onClose() }
          />
        </div>
      </div>
    )
  }
}

DialogShare.propTypes= {
  configShare: PropTypes.shape({
    share: PropTypes.object,
    embed: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string
    ])
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onShare: PropTypes.func
}

export default DialogShare
