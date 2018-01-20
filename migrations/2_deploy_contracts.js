const token = artifacts.require("./NILToken")
const firstRound = artifacts.require("./IFOFirstRound")
// const secondRound = artifacts.require("./IFOSecondRound")

module.exports = function(deployer) {
  deployer.deploy(token)
  deployer.deploy(firstRound)
  // deployer.deploy(secondRound)
}
