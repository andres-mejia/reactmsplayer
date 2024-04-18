'use strict'

const React = require('react')
const ReactDOM = require('react-dom')

const MSPlayer = require('../msplayer/index.jsx').default
const EventHandler = require('./eventHandler/index.js').default

window.EventHandler = new EventHandler()

window.__reactmsplayer = window.__reactmsplayer || {}
window.__reactmsplayer.render = function(id, args){
  ReactDOM.render(
    <MSPlayer { ...args } />,
    document.getElementById(id)
  )
}