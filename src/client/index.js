import { Channel, Universal, TxBuilder } from '@aeternity/aepp-sdk'
import axios from 'axios'
import AppModel from '../gomoku/AppModel'
import AppView from '../gomoku/AppView'
import AppController from '../gomoku/AppController'
import config from '../config'

const { unpackTx } = TxBuilder

;(async () => {
  const account = await Universal({
    url: config.url,
    internalUrl: config.internalUrl,
    networkId: config.networkId,
    keypair: config.keypair
  })
  const model = new AppModel()
  const view = new AppView(model)
  const { data: sharedParams } = await axios.post(
    `http://localhost:9000/start/${await account.address()}`
  )

  async function updateBalances () {
    const { initiatorId, responderId } = sharedParams
    const balances = await channel.balances([initiatorId, responderId])
    view.updateBalance(balances[initiatorId], balances[responderId])
  }

  const channel = await Channel({
    ...sharedParams,
    role: 'responder',
    sign (tag, tx) {
      const { txType, tx: txData } = unpackTx(tx)
      if (tag === 'responder_sign') {
        if (
          txType === 'channelCreate' &&
          Number(txData.initiatorAmount) === config.deposit &&
          Number(txData.responderAmount) === config.deposit
        ) {
          return account.signTransaction(tx)
        }
      }
      if (tag === 'update_ack') {
        if (
          txData.updates.length === 1 &&
          txData.updates[0].tx.from === sharedParams.responderId &&
          txData.updates[0].tx.to === sharedParams.initiatorId &&
          Number(txData.updates[0].tx.amount) === config.reward &&
          model.winner() === 2
        ) {
          return account.signTransaction(tx)
        }
      }
    }
  })

  function sendMessage (message) {
    channel.sendMessage(message, sharedParams.initiatorId)
  }

  // eslint-disable-next-line no-new
  new AppController(model, view, channel, sendMessage)

  channel.on('statusChanged', status => console.log('CHANNEL_STATUS', status))
  channel.on('onChainTx', tx => console.log('ONCHAIN_TX', tx))
  channel.on('stateChanged', () => updateBalances())
})()
