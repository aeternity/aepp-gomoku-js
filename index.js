const Model = require('./src/gomoku/AppModel.js')
const { getRandomInt } = require('./src/gomoku/lib')

const model = new Model()
model.setStartData(1)
while (model.playing) {
  const n = getRandomInt(0, 10)
  const m = getRandomInt(0, 10)
  model.setNM({ n, m })
  model.move(n, m, false)
  if (model.playing) {
    model.moveAI()
  }
}