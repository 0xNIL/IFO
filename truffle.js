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
      gas: 2500000
    }
  }
};
