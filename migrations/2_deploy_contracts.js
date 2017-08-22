var NILx0Token = artifacts.require("./NILx0Token")
var NILx0FreeDist = artifacts.require("./NILx0FreeDist")

module.exports = function(deployer) {
  deployer.deploy(NILx0Token);
  deployer.link(NILx0Token, NILx0FreeDist);
  deployer.deploy(NILx0FreeDist);
};
