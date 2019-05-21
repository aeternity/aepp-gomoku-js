<template>
  <ae-main>
    <div class="flex-col content-center min-h-screen">
      <div class="mx-auto w-full text-center">
        <ae-backdrop v-if="isOpeningChannel">
          <div class="mb-2">
            <ae-loader />
          </div>
          <ae-text>Opening state channel</ae-text>
        </ae-backdrop>
        <ae-backdrop v-if="isClosingChannel">
          <div class="mb-2">
            <ae-loader />
          </div>
          <ae-text>Closing state channel</ae-text>
        </ae-backdrop>
        <ae-backdrop v-if="isClosed">
          <ae-text weight="bold">State channel closed</ae-text>
        </ae-backdrop>
        <div class="flex my-4">
          <div class="w-1/2">
            <div class="flex">
              <ae-identicon :address="initiatorAddress" />
              <div class="ml-2 mt-2 text-left">
                <ae-amount v-bind:value="(initiatorAmount / 1000000000000000000).toFixed(4)" unit="Æ" />
              </div>
            </div>
          </div>
          <div class="w-1/2">
            <div class="flex justify-end">
              <div class="mr-2 mt-2 text-left">
                <ae-amount v-bind:value="(responderAmount / 1000000000000000000).toFixed(4)" unit="Æ" />
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
          <ae-button face="round" fill="neutral" v-bind:disabled="isOpeningChannel" @click="closeChannel()">Close channel</ae-button>
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
      isOpeningChannel: true,
      isClosingChannel: false,
      isPlaying: false,
      isClosed: false,
      initiatorAddress: '',
      responderAddress: '',
      initiatorAmount: 0,
      responderAmount: 0,
      channel: null,
      account: null
    }
  },
  methods: {
    newGame (player) {
      this.controller.newGame(player)
      this.isPlaying = true
    },
    async closeChannel () {
      this.isClosingChannel = true
      await this.channel.shutdown(async (tx) => {
        const { txType, tx: txData } = unpackTx(tx)
        const fee = Number(txData.fee) / 2
        if (
          Number(txData.initiatorAmountFinal) === (this.initiatorAmount - fee) &&
          Number(txData.responderAmountFinal) === (this.responderAmount - fee)
        ) {
          return this.account.signTransaction(tx)
        }
      })
      this.isClosingChannel = false
      this.isClosed = true
    }
  },
  async mounted () {
    const model = new AppModel()
    const view = new AppView(model)
    this.account = await Universal({
      url: config.url,
      internalUrl: config.internalUrl,
      networkId: config.networkId,
      keypair: config.keypair
    })
    const { data: sharedParams } = await axios.post(
      `http://localhost:9000/start/${await this.account.address()}`
    )
    this.initiatorAddress = sharedParams.initiatorId
    this.responderAddress = sharedParams.responderId
    this.channel = await Channel({
      ...sharedParams,
      role: 'responder',
      sign: (tag, tx, { updates } = {}) => {
        const { txType, tx: txData } = unpackTx(tx)
        if (tag === 'responder_sign') {
          if (
            txType === 'channelCreate' &&
            Number(txData.initiatorAmount) === config.deposit &&
            Number(txData.responderAmount) === config.deposit
          ) {
            return this.account.signTransaction(tx)
          }
        }
        if (tag === 'update_ack') {
          if (
            updates &&
            updates.length === 1 &&
            updates[0].from === sharedParams.responderId &&
            updates[0].to === sharedParams.initiatorId &&
            Number(updates[0].amount) === config.reward &&
            model.winner() === 2
          ) {
            return this.account.signTransaction(tx)
          }
        }
      }
    })
    this.channel.on('statusChanged', (status) => {
      if (status === 'open') {
        this.isOpeningChannel = false
        this.isPlaying = true
      }
    })
    this.channel.on('stateChanged', async () => {
      this.isPlaying = model.playing
      const { initiatorId, responderId } = sharedParams
      const balances = await this.channel.balances([initiatorId, responderId])
      this.initiatorAmount = balances[initiatorId]
      this.responderAmount = balances[responderId]
    })
    const sendMessage = (message) => {
      this.channel.sendMessage(message, sharedParams.initiatorId)
    }
    this.controller = new AppController(model, view, this.channel, sendMessage)
    this.controller.init()
  }
}
</script>

<style scoped lang="css">
</style>