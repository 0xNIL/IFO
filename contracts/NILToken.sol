pragma solidity ^0.4.18;


import 'zeppelin/token/MintableToken.sol';
import 'zeppelin/token/PausableToken.sol';

contract NILToken is MintableToken, PausableToken {

  string public name = "NIL Token";

  string public symbol = "NIL";

  uint8 public decimals = 9;

  uint8 public me = 167;

  function pause() onlyOwner whenNotPaused canMint public {
    super.pause();
  }

}
