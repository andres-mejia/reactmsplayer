import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import styles from './subtitles.css'

const Subtitles = ({ bottom, currentTime, subtitles }) => {
  // [
  //   {
  //     start: 20000, // milliseconds
  //     end: 24400,
  //     text: 'Bla Bla Bla Bla'
  //   },
  //   {
  //     start: 24600,
  //     end: 27800,
  //     text: 'Bla Bla Bla Bla',
  //     settings: 'align:middle line:90%'
  //   },
  //   // ...
  // ]

  const findText = (arr, time) => {
    const midIndex = arr.length > 1 ? Math.ceil(arr.length / 2) : 0
    const midItem = arr[midIndex]
  
    if(time >= midItem.start) {
      if(time <= midItem.end) {
        return midItem.text
      } else if(arr.length > 1) {
        return findText(arr.slice(midIndex), time)
      }
    } else if(midIndex > 0) {
      return findText(arr.slice(0, midIndex), time)
    }
    return null
  }

  let text = null

  if(Array.isArray(subtitles)) {
    text = findText(subtitles, currentTime * 1000)
  }

  return (
    text &&
    <div className={ styles.container }>
      <div 
        className={ styles.text }
        style={{
          bottom: `${bottom}px`
        }}
        dangerouslySetInnerHTML={{ __html: text }}
      ></div>
    </div>
  )
}

Subtitles.propTypes = {
  bottom: PropTypes.number,
  currentTime: PropTypes.number,
  logger: PropTypes.object,
  subtitles: PropTypes.arrayOf(PropTypes.shape({
    end: PropTypes.number.isRequired,
    settings: PropTypes.string,
    start: PropTypes.number.isRequired,
    text: PropTypes.string
  }))
}

Subtitles.defaultProps = {
  bottom: 0,
  currentTime: 0,
  logger: { log: (message) => console.warn(message, null, 'detault') }
}

export default Subtitles
