pragma solidity ^0.4.18;


import 'openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol';

contract NILToken is MintableToken, PausableToken {

  string public name = "NIL Token";

  string public symbol = "NIL";

  uint8 public decimals = 9;

}
