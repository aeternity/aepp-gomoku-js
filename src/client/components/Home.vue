<template>
  <ae-main>
    <div class="flex-col content-center min-h-screen">
      <div class="mx-auto w-full text-center">
        <ae-backdrop v-if="!isChannelOpen">
          <div class="mb-2">
            <ae-loader />
          </div>
          <ae-text>Opening state channel</ae-text>
        </ae-backdrop>
        <div class="flex my-4">
          <div class="w-1/2">
            <div class="flex">
              <ae-identicon :address="initiatorAddress" />
              <div class="ml-2 mt-2 text-left">
                <ae-amount v-bind:value="initiatorAmount" unit="Æ" />
              </div>
            </div>
          </div>
          <div class="w-1/2">
            <div class="flex justify-end">
              <div class="mr-2 mt-2 text-left">
                <ae-amount v-bind:value="responderAmount" unit="Æ" />
              </div>
              <ae-identicon :address="responderAddress" />
            </div>
          </div>
        </div>
        <div class="mb-4">
          <ae-button-group shadow>
            <ae-button fill="primary" face="round" v-bind:disabled="isPlaying" @click="newGame(1)">New game for X</ae-button>
            <ae-button fill="alternative" face="round" v-bind:disabled="isPlaying" @click="newGame(2)">New game for O</ae-button>
          </ae-button-group>
        </div>
        <div id="gomoku"></div>
        <div class="mt-4">
          <ae-button face="round" fill="neutral">Close channel</ae-button>
        </div>
      </div>
    </div>
  </ae-main>
</template>

<script>
import { Channel, Universal, TxBuilder } from '@aeternity/aepp-sdk'
import axios from 'axios'
import AppModel from '../../gomoku/AppModel'
import AppView from '../../gomoku/AppView'
import AppController from '../../gomoku/AppController'
import config from '../../config'

const { unpackTx } = TxBuilder

export default {
  name: 'Play',
  components: {},
  data() {
    return {
      isChannelOpen: false,
      isPlaying: false,
      initiatorAddress: '',
      responderAddress: '',
      initiatorAmount: 0,
      responderAmount: 0
    }
  },
  methods: {
    newGame (player) {
      this.controller.newGame(player)
      this.isPlaying = true
    }
  },
  async mounted () {
    const model = new AppModel()
    const view = new AppView(model)
    const account = await Universal({
      url: config.url,
      internalUrl: config.internalUrl,
      networkId: config.networkId,
      keypair: config.keypair
    })
    const { data: sharedParams } = await axios.post(
      `http://localhost:9000/start/${await account.address()}`
    )
    this.initiatorAddress = sharedParams.initiatorId
    this.responderAddress = sharedParams.responderId
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

    this.controller = new AppController(model, view, channel, sendMessage)
    this.controller.init()

    channel.on('statusChanged', (status) => {
      if (status === 'open') {
        this.isChannelOpen = true
        this.isPlaying = true
      }
    })
    channel.on('stateChanged', async () => {
      this.isPlaying = model.playing
      const { initiatorId, responderId } = sharedParams
      const balances = await channel.balances([initiatorId, responderId])
      this.initiatorAmount = balances[initiatorId]
      this.responderAmount = balances[responderId]
    })
  }
}
</script>

<style scoped lang="css">
</style>