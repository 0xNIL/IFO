pragma solidity ^0.4.18;


import 'openzeppelin-solidity/contracts/ownership/HasNoEther.sol';

contract Whitelist is HasNoEther {

  bool public open = true;

  mapping(address => bool) public whitelisted;
  uint public totalWhitelisted;
  mapping(address => bool) public blacklisted;
  uint public totalBlacklisted;

  modifier whenOpen() {
    require(open);
    _;
  }

  function close()
  external
  onlyOwner
  {
      open = false;
  }

  function whitelist(
    address[] addrs
  )
  external
  onlyOwner
  whenOpen
  {
    for (uint a = 0; a < addrs.length; a++) {
      if (addrs[a] != address(0) && !whitelisted[addrs[a]] && !blacklisted[addrs[a]]) {
        whitelisted[addrs[a]] = true;
        totalWhitelisted++;
      }
    }
  }

  function blacklist(
    address[] addrs
  )
  external
  onlyOwner
  {
    for (uint a = 0; a < addrs.length; a++) {
      if (!blacklisted[addrs[a]]) {
        if (whitelisted[addrs[a]]) {
          whitelisted[addrs[a]] = false;
          totalWhitelisted--;
        }
        blacklisted[addrs[a]] = true;
        totalBlacklisted++;
      }
    }
  }

  function reset(
    address[] addrs
  )
  external
  onlyOwner
  whenOpen
  {
    for (uint a = 0; a < addrs.length; a++) {
      if (whitelisted[addrs[a]]) {
        whitelisted[addrs[a]] = false;
        totalWhitelisted--;
      } else if (blacklisted[addrs[a]]) {
        blacklisted[addrs[a]] = false;
        totalBlacklisted--;
      }
    }
  }

}
