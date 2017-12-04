var Collaborators = artifacts.require("./Collaborators")
var NILToken = artifacts.require("./NILToken")
var FreeDistribution = artifacts.require("./FreeDistribution")

module.exports = function(deployer) {
  deployer.deploy(NILToken);
  deployer.link(NILToken, Collaborators);
  deployer.deploy(Collaborators);
  deployer.link(Collaborators, FreeDistribution);
  deployer.link(NILToken, FreeDistribution);
  deployer.deploy(FreeDistribution);
};
