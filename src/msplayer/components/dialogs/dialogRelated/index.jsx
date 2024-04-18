import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { isMobileAny, isMobilePhone } from '../../../commons/userAgent'
import DialogControlBar from '../dialogControlBar'
import Poster from '../../poster'
import stylesIndex from './dialogRelated.css'
import stylesCarousel from './dialogRelatedCarousel.css'
import stylesNavBts from './dialogRelatedNavBts.css'

const styles = {
  ...stylesNavBts,
  ...stylesCarousel,
  ...stylesIndex
}

const BATCH_LENGTH = 6

class DialogRelated extends Component {
  constructor(props){
    super(props)

    const configBatches = this.divideInGroups(props.relatedVideosList, BATCH_LENGTH)

    this.state = {
      configBatches,
      nextBtVisible: null,
      previousBtVisible: null,
      styleBatch: {
        width: `${(100 / configBatches.length)}%`
      },
      styleContent: {}
    }

    this.batchPercentageWidth = null
    this.numRows = null
    this.itemPercentageWidth = null
    this.numItemsPerStep = null
    this.stepPercentageWidth = null

    this.step = 0
    this.carouselWrapperScale = 1
    this.maxX = 0
    this.minX = this.updateMinX()
    this.offset = 0

    this.handleNextBtClick = this.handleNextBtClick.bind(this)
    this.handlePreviousBtClick = this.handlePreviousBtClick.bind(this)
    this.handleRelatedPlay = this.handleRelatedPlay.bind(this)
    this.handleWindowResize = this.handleWindowResize.bind(this)
    this.saveCarouselWrapperRef = this.saveCarouselWrapperRef.bind(this)
  }

  componentDidMount() {
    this.updateCarouselWidths()
    this.updateMinX()
    this.decideCarouselBtsVisibility(this.getPosX(this.step))

    window.addEventListener('resize', this.handleWindowResize)
    this.handleWindowResize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
  }

  /*
   * http://stackoverflow.com/questions/744319/get-css-rules-percentage-value-in-jquery
   */
  getPercentageWidth(element) {
    const parent = element.parentNode
    const prevParentDisplay = parent.style.display
    const prevElementWidth = element.style.width

    parent.style.display = 'none'
    element.style.width = ''

    let w = window.getComputedStyle(element).width
    if(typeof w === 'string' && w.indexOf('%') !== -1) w = Number(w.split('%')[0])

    parent.style.display = prevParentDisplay
    element.style.width = prevElementWidth

    return w
  }

  getPosX(step){
    let posX = (-this.stepPercentageWidth * step) * this.carouselWrapperScale
    if(posX < this.minX) posX = this.minX
    if(posX > this.maxX) posX = this.maxX

    return posX
  }

  divideInGroups(list, groupLength) {
    let groups = []
    for (let i = 0, j = 0, l = list.length; i < l; i++) {
      if (i > 0)
        if (groups[j].length === groupLength) j++
      if (!groups[j]) groups[j] = []
      groups[j].push(list[i])
    }
    return groups
  }

  handleWindowResize(){
    this.updateMetrics()
    this.updateCarouselWidths()
    this.updateMinX()

    const posX = this.getPosX(this.step)

    this.updateContainerX(posX)
    this.decideCarouselBtsVisibility(posX)
  }

  updateMetrics() {
    this.batchPercentageWidth = this.getPercentageWidth(this.carouselWrapperElement)
    this.numRows = this.batchPercentageWidth === 100 ? 2 : 1 // 100%: 2 rows | 300%: 1 row
    this.itemPercentageWidth = (this.batchPercentageWidth / BATCH_LENGTH) * this.numRows
    this.numItemsPerStep = this.numRows === 1 ? 1 : Math.floor(BATCH_LENGTH / (this.batchPercentageWidth / 100))
    this.stepPercentageWidth = (this.itemPercentageWidth * this.numItemsPerStep) / this.numRows

    if(this.numRows === 1 && !isMobilePhone()){
      this.offset = (100 - this.itemPercentageWidth) / 2
    }else{
      this.offset = 0
    }
  }

  calculateContentPercentageWidth() {
    const numItems = this.props.relatedVideosList.length
    const numFullBatches = Math.floor(numItems / BATCH_LENGTH)
    const numRemainderItems = numItems % BATCH_LENGTH
    const numItemsPerRow = BATCH_LENGTH / this.numRows
    const numRemainderFullRows = Math.floor(numRemainderItems / numItemsPerRow)

    let contentPercentageWidth = numFullBatches * this.batchPercentageWidth
    contentPercentageWidth += numRemainderFullRows >= 1 ? this.batchPercentageWidth : numRemainderItems * this.itemPercentageWidth

    return contentPercentageWidth
  }

  updateCarouselWidths(){
    const contentPercentageWidth = this.calculateContentPercentageWidth()
    const carouselWrapperWidth = this.state.configBatches.length * this.batchPercentageWidth

    // (100 * (carouselWrapperWidth / contentPercentageWidth)) / carouselWrapperWidth
    this.carouselWrapperScale = 100 / contentPercentageWidth

    this.carouselWrapperElement.style.width = `${(carouselWrapperWidth * this.carouselWrapperScale).toFixed(2)}%`
    this.carouselWrapperElement.style['margin-left'] = this.offset > 0 ? `${(this.offset * this.carouselWrapperScale).toFixed(2)}%` : ''

    this.setState({
      styleContent: {
        width: `${contentPercentageWidth.toFixed(2)}%`
      }
    })
  }

  handleNextBtClick() {
    const posX = this.getPosX(++this.step)

    this.updateContainerX(posX)
    this.decideCarouselBtsVisibility(posX)
  }

  handlePreviousBtClick() {
    const posX = this.getPosX(--this.step)

    this.updateContainerX(posX)
    this.decideCarouselBtsVisibility(posX)
  }

  updateMinX() {
    this.minX = ((100 - (this.offset * 2)) - this.calculateContentPercentageWidth()) * this.carouselWrapperScale

    return this.minX
  }

  updateContainerX(posX) {
    this.carouselWrapperElement.style.left = `${posX}%`
  }

  decideCarouselBtsVisibility(posX) {
    posX = Math.round(posX)

    this.setState({
      nextBtVisible: posX > Math.round(this.minX),
      previousBtVisible: posX < Math.round(this.maxX)
    })
  }

  handleRelatedPlay(attributes) {
    this.props.onRelatedPlay(attributes)
  }

  saveCarouselWrapperRef(ref) {
    if(ref){
      this.carouselWrapperElement = ref
      this.updateMetrics()
    }
  }

  render() {
    const {
      isFullScreen,
      isFullScreenEnabled,
      isShareEnabled,
      onDialogShareOpen,
      onSeeAgain,
      onToggleFullScreen,
      poster,
      posterImagizerType
    } = this.props

    const {
      configBatches,
      nextBtVisible,
      previousBtVisible,
      styleBatch,
      styleContent
    } = this.state

    const carouselItems = configBatches.map( (batch, batchIndex) => {
      const batchItems = batch.map( (configItem, itemIndex) =>
        <li
          key={ itemIndex }
          onClick={ () => this.handleRelatedPlay(configItem) }
        >
          <div className={ styles.thumbnail }>
            { configItem.thumbUrl ?
              <Poster
                alt={ configItem.title }
                style={ { position: 'relative' } }
                poster={ configItem.thumbUrl }
                imagizerType={ posterImagizerType }
              /> :
                <img
                  alt={ configItem.title }
                  src={ 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAC0CAYAAADl5PURAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RTg1QThGOUY1MjgxMUU2OTlFMzg1NjMwNkU2QkM5QiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RTg1QThGQUY1MjgxMUU2OTlFMzg1NjMwNkU2QkM5QiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFODVBOEY3RjUyODExRTY5OUUzODU2MzA2RTZCQzlCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFODVBOEY4RjUyODExRTY5OUUzODU2MzA2RTZCQzlCIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+ObJgHQAAAeRJREFUeNrs1EERADAIBLFSS/jXduhgSCTsYytJP4CDvgSAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhggYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAgAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIGCAEgAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYICAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECGCCAAQIYIIABAhgggAECBghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAAAYIYIAABghggAAGCGCAgAFKABgggAECGCCAAQIYIIABAuw3AgwAl8oEmE/Ru/AAAAAASUVORK5CYII=' }
                  role="presentation"
                />
            }
            <div className={ styles.description }>{ configItem.title }</div>
            <div className={ styles.playBt } />
          </div>
        </li>
      )
      return (
        <ul key={ batchIndex } style={ styleBatch }>{ batchItems }</ul>
      )
    })

    return (
      <div>
        { poster && <Poster alt={ this.props.title } poster={ poster } imagizerType={ posterImagizerType } /> }
        <div className={ `${styles.container}${isMobilePhone() ? ' is-mobile' : ''}` }>
          <div className={ styles.scrollWrapper }>
            <div className={ styles.scrollContent } style={ styleContent }>
              <div className={ styles.carouselWrapper } ref={ (ref) => this.saveCarouselWrapperRef(ref) }>
                <div className={ styles.carousel }>
                  { carouselItems }
                </div>
              </div>
            </div>
          </div>
          { previousBtVisible &&
            <div
              className={ styles.previousBt }
              onClick={ isMobileAny() ? null : this.handlePreviousBtClick }
              onTouchEnd={ isMobileAny() ? this.handlePreviousBtClick : null }
            >
              <div className={ styles.navIcon } />
            </div>
          }
          { nextBtVisible &&
            <div
              className={ styles.nextBt }
              onClick={ isMobileAny() ? null : this.handleNextBtClick }
              onTouchEnd={ isMobileAny() ? this.handleNextBtClick : null }
            >
              <div className={ styles.navIcon } />
            </div>
          }
          <DialogControlBar
            isFullScreen={ isFullScreen }
            isFullScreenEnabled={ isFullScreenEnabled }
            isSeeAgainEnabled={ true }
            isShareEnabled={ isShareEnabled }
            onDialogShareOpen={ onDialogShareOpen }
            onSeeAgain={ onSeeAgain }
            onToggleFullScreen={ onToggleFullScreen }
          />
        </div>
      </div>
    )
  }
}

DialogRelated.propTypes = {
  isFullScreen: PropTypes.bool,
  isFullScreenEnabled: PropTypes.bool,
  isShareEnabled: PropTypes.bool,
  onDialogShareOpen: PropTypes.func.isRequired,
  onRelatedPlay: PropTypes.func.isRequired,
  onSeeAgain: PropTypes.func.isRequired,
  onToggleFullScreen: PropTypes.func.isRequired,
  poster: PropTypes.string,
  relatedVideosList: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default DialogRelated
