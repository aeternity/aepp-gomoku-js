import { Channel, MemoryAccount, Crypto } from '@aeternity/aepp-sdk'
import axios from 'axios'
import AppModel from '../gomoku/AppModel'
import AppView from '../gomoku/AppView'
import AppController from '../gomoku/AppController'

const secretKey = Buffer.from('279b5459eca39ece4497b1530418029167ca62c14ae89a4498ef3dd5066b610cb85b45b329315a0c794bf9e69a3e4aae0e2407018993e90d0e598859ec3f6720', 'hex')
const account = MemoryAccount({
  keypair: {
    publicKey: 'ak_2QC98ahNHSrZLWKrpQyv91eQfCDA3aFVSNoYKdQ1ViYWVF8Z9d',
    secretKey
  }
})

async function init () {
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
    async sign (tag, tx) {
      const transaction = Crypto.deserialize(Crypto.decodeTx(tx))
      if (tag === 'responder_sign') {
        if (
          transaction.tag === 50 && /* CHANNEL_CREATE_TX */
          transaction.initiatorAmount === 100 &&
          transaction.responderAmount === 100
        ) {
          return account.signTransaction(tx)
        }
      }
      if (tag === 'update_ack') {
        updateBalances()
        if (
          transaction.tag === 57 && /* CHANNEL_OFFCHAIN_TX */
          transaction.updates.length === 1 &&
          transaction.updates[0].from === sharedParams.responderId &&
          transaction.updates[0].to === sharedParams.initiatorId &&
          transaction.updates[0].amount === 10 &&
          model.winner() === 2
        ) {
          return account.signTransaction(tx)
        }
      }
    }
  })
  window.CHANNEL = channel
  
  function sendMessage(message) {
    channel.sendMessage(message, sharedParams.initiatorId)
  }

  new AppController(model, view, channel, sendMessage)
  window.MODEL = model
  
  channel.on('statusChanged', status => console.log(status))
  channel.on('onChainTx', tx => console.log('onChainTx', tx))
  channel.on('stateChanged', () => updateBalances())
}

init()
