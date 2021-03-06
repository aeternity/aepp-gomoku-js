import fs from 'fs'
import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import https from 'https'
import { Channel, Universal, TxBuilder } from '@aeternity/aepp-sdk'

import Model from '../gomoku/AppModel'
import config from '../config'

const PORT = process.env.PORT || 9000
const ASSETS_PATH = path.resolve(process.cwd(), process.env.DIST_PATH || '', 'public')

const { unpackTx } = TxBuilder

;(async () => {
  const account = await Universal({
    url: config.url,
    internalUrl: config.internalUrl,
    networkId: config.networkId,
    keypair: {
      publicKey: process.env.PUBLIC_KEY,
      secretKey: process.env.SECRET_KEY
    }
  })

  const app = express()
  app.use(bodyParser.json())
  app.use(cors())
  app.use(express.static(ASSETS_PATH))

  app.get('/', (req, res) => {
    res.sendFile('index.html', {
      root: ASSETS_PATH,
      headers: {
        'Content-Type': 'text/html'
      }
    })
  })

  app.post('/start/:pubkey', async (req, res) => {
    let model
    const sharedParams = {
      url: config.channelUrl,
      initiatorId: await account.address(),
      responderId: req.params.pubkey,
      pushAmount: 0,
      initiatorAmount: config.deposit,
      responderAmount: config.deposit,
      channelReserve: 0,
      ttl: 1000,
      host: 'localhost',
      port: 3333,
      lockPeriod: 10,
      minimumDepth: 0
    }
    let initiatorAmount = config.deposit
    let responderAmount = config.deposit
    const channel = await Channel({
      ...sharedParams,
      role: 'initiator',
      async sign (tag, tx) {
        const { txType, tx: txData } = unpackTx(tx)
        if (tag === 'shutdown_sign_ack') {
          const fee = Number(txData.fee) / 2
          if (
            txType === 'channelCloseMutual' &&
            Number(txData.initiatorAmountFinal) === (initiatorAmount - fee) &&
            Number(txData.responderAmountFinal) === (responderAmount - fee)
          ) {
            return account.signTransaction(tx)
          }
        } else {
          return account.signTransaction(tx)
        }
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
              Number(config.reward),
              async (tx) => await account.signTransaction(tx)
            )
            initiatorAmount -= Number(config.reward)
            responderAmount += Number(config.reward)
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
              Number(config.reward),
              async (tx) => await account.signTransaction(tx)
            )
            initiatorAmount += Number(config.reward)
            responderAmount -= Number(config.reward)
          }
          break
      }
    })
    res.json(sharedParams)
  })

  if (process.env.HTTPS_KEY_FILE && process.env.HTTPS_CERT_FILE) {
    https.createServer({
      key: fs.readFileSync(process.env.HTTPS_KEY_FILE),
      cert: fs.readFileSync(process.env.HTTPS_CERT_FILE)
    }, app).listen(PORT, () =>
      console.log(`Gomoku server listening on port ${PORT}`)
    )
  } else {
    app.listen(PORT, () =>
      console.log(`Gomoku server listening on port ${PORT}`)
    )
  }
})()
