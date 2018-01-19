const round = artifacts.require("./IFOFirstRound")
// const round = artifacts.require("./IFOSecondRound")

const token = artifacts.require("./NILToken")

module.exports = function(deployer) {
  deployer.deploy(token)
}
