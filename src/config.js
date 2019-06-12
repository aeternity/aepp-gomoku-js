export default {
  // URL of the API
  url: 'https://sdk-testnet.aepps.com',
  // URL of the internal API
  internalUrl: 'https://sdk-testnet.aepps.com/internal',
  // URL of state channels endpoint
  channelUrl: 'wss://sdk-testnet.aepps.com/channel',
  // Network ID
  networkId: 'ae_uat',
  // Public and secret keys of the client
  keypair: {
    publicKey: 'ak_24RZkzfKAQCxMD66shsbEUVEbQ3inU45Gu3j3VCSgF7GwNbZaU',
    secretKey: 'd549faca2aa008dc0d5e99268c613d29c5a23c809795ca1b88d6a6e5fe716c778b783a6b93d1f1686dfaae3f25a539799246fe0e469a11250fba02c749055c08'
  },
  // Deposit required to start the game (1 AE)
  deposit: 1000000000000000000,
  // Reward for winning the game (0.05 AE)
  reward:  50000000000000000
}
