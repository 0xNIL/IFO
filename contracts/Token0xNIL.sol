pragma solidity ^0.4.15;


import 'zeppelin/token/MintableToken.sol';
import 'zeppelin/token/PausableToken.sol';


contract Token0xNIL is MintableToken, PausableToken {

  string public name = "0xNIL";

  string public symbol = "NIL";

  uint8 public decimals = 9;

  function pause() onlyOwner whenNotPaused canMint public {
    super.pause();
  }

}
