const round = artifacts.require("./IFOFirstRound")
// const round = artifacts.require("./IFOSecondRound")

module.exports = function(deployer) {
  deployer.deploy(round)
}
