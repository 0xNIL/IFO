var Token0xNIL = artifacts.require("./Token0xNIL")
var FreeDist0xNIL = artifacts.require("./FreeDist0xNIL")

module.exports = function(deployer) {
  deployer.deploy(Token0xNIL);
  deployer.link(Token0xNIL, FreeDist0xNIL);
  deployer.deploy(FreeDist0xNIL);
};
