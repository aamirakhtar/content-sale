// loading contract
var ContentSale = artifacts.require("./ContentSale.sol");

module.exports = function(deployer)
{
  deployer.deploy(ContentSale);
};
