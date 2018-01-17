const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic = process.env.TESTNET_MNEMONIC
const infuraRinkebyUrl = process.env.INFURA_RINKEBY_URL

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 4000000
    },
    private: {
      host: "localhost",
      port: 8546,
      network_id: "11",
      gas: 4612388
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, infuraRinkebyUrl)
      },
      network_id: 4,
      gas: 4612388,
      gasPrice: 23000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
