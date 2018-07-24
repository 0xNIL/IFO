pragma solidity ^0.4.18;


import '../Whitelist.sol';

contract WhitelistHelper {

  address public whitelistAddress;
  Whitelist public whitelist;

  mapping (address => bool) public sets;

  function setWhitelist(address addr) public {
    whitelistAddress = addr;
    whitelist = Whitelist(addr);
  }

  modifier whenWhitelisted() {
    require(whitelist.whitelisted(msg.sender));
    _;
  }

  function amIWhitelisted() public constant returns (bool) {
    return address(whitelist) != address(0) && whitelist.whitelisted(msg.sender);
  }

  function doSomething() public whenWhitelisted payable {
    sets[msg.sender] = true;
  }

}
