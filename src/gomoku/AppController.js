/* eslint-disable */

import MouseController from './MouseController'

var AppController = function(model, view, channel, sendMessage) {
  var AppController = this
  this.model = model
  this.view = view
  this.channel = channel
  this.sendMessage = sendMessage
  this.awaitingAIMove = true

  this.init = function() {
    AppController.mouse = new MouseController(
      view.canvas,
      AppController.move,
      AppController.click
    )
    AppController.newGame(2)
    AppController.view.inputNewGameX.onclick = function() {
      AppController.newGame(1)
    }
    AppController.view.inputNewGameO.onclick = function() {
      AppController.newGame(2)
    }

    AppController.channel.on('message', ({ info }) => {
      const message = JSON.parse(info)
      switch (message.type) {
        case 'START':
          AppController.view.renderBoard()
          AppController.model.setStartData(message.player)
          AppController.awaitingAIMove = message.player === 2
          break
        case 'MOVE':
          AppController.model.setNM({ n: message.n, m: message.m })
          AppController.model.move(message.n, message.m, true)
          AppController.view.renderMove({ n: message.n, m: message.m })
          AppController.awaitingAIMove = false
          if (!AppController.model.playing) {
            AppController.view.renderWinLine()
          }
          break
      }
    })
  }

  this.newGame = function(a) {
    AppController.sendMessage({ type: 'START', player: a })
  }

  this.moveUser = function() {
    if (!this.model.emptyCell()) return
    var nm = this.model.moveUser()
    this.view.renderMove(nm)
    this.view.setStyleCursorDefault()
    if (!this.model.playing) this.view.renderWinLine()
    sendMessage({ type: 'MOVE', ...nm })
  }

  this.move = function(x, y) {
    if (!AppController.model.playing) return
    AppController.nm = AppController.view.setStyleCursor(x, y)
    AppController.model.setNM(AppController.nm)
  }

  this.click = function() {
    if (!AppController.model.playing || AppController.awaitingAIMove) return
    AppController.moveUser()
  }

  this.init()
}

export default AppController
