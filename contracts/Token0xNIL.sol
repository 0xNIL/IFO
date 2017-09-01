pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/token/MintableToken.sol';


contract Token0xNIL is MintableToken {

  string public name = "0xNIL";

  string public symbol = "NIL";

  uint public decimals = 0;

  function getTotalSupply() public constant returns(uint) {
    return totalSupply;
  }

}
