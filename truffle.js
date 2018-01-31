const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic = process.env.MNEMONIC
const infuraUrl = process.env.INFURA_URL

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
      gas: 3200000
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, infuraUrl)
      },
      network_id: 4,
      gas: 4612388,
      gasPrice: 23000000000
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(mnemonic, infuraUrl)
      },
      network_id: 1,
      gas: 2000000,
      gasPrice: 10000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
