import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { Channel, MemoryAccount } from '@aeternity/aepp-sdk'
import Model from '../gomoku/AppModel'

const PORT = process.env.PORT || 9000
const DEPOSIT_AMOUNT = 100
const WINNING_AMOUNT = 10

const account = MemoryAccount({
  keypair: {
    publicKey: process.env.PUBLIC_KEY,
    secretKey: process.env.SECRET_KEY
  }
})

const app = express()
app.use(bodyParser.json())
app.use(cors())

app.post('/start/:pubkey', async (req, res) => {
  let model
  const sharedParams = {
    url: 'ws://localhost:3001',
    initiatorId: await account.address(),
    responderId: req.params.pubkey,
    pushAmount: 0,
    initiatorAmount: DEPOSIT_AMOUNT,
    responderAmount: DEPOSIT_AMOUNT,
    channelReserve: 0,
    ttl: 1000,
    host: 'localhost',
    port: 3333,
    lockPeriod: 10
  }
  const channel = await Channel({
    ...sharedParams,
    role: 'initiator',
    async sign (tag, tx) {
      return account.signTransaction(tx)
    }
  })

  function sendMessage(message) {
    channel.sendMessage(message, req.params.pubkey)
  }

  channel.on('message', async ({ info }) => {
    const message = JSON.parse(info)
    switch (message.type) {
      case 'START':
        if (model && model.playing) {
          break
        }
        model = new Model()
        model.setStartData(message.player)
        sendMessage({
          type: 'START',
          player: message.player
        })
        if (message.player === 2) {
          sendMessage({
            type: 'MOVE',
            ...model.moveAI()
          })
        }
        break
      case 'MOVE':
        model.setNM({ n: message.n, m: message.m })
        model.move(message.n, message.m, false)
        // user wins
        if (!model.playing) {
          await channel.update(
            await account.address(),
            req.params.pubkey,
            WINNING_AMOUNT,
            async (tx) => await account.signTransaction(tx)
          )
        }
        sendMessage({
          type: 'MOVE',
          ...model.moveAI()
        })
        // computer wins
        if (!model.playing) {
          await channel.update(
            req.params.pubkey,
            await account.address(),
            WINNING_AMOUNT,
            async (tx) => await account.signTransaction(tx)
          )
        }
        break
    }
  })
  res.json(sharedParams)
})

app.listen(PORT, () =>
  console.log(`Gomoku server listening on port ${PORT}`)
)