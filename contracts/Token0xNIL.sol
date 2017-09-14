pragma solidity ^0.4.11;


import 'zeppelin/token/MintableToken.sol';


contract Token0xNIL is MintableToken {

  string public name = "0xNIL";

  string public symbol = "NIL";

  uint8 public decimals = 9;

}
