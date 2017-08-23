pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/token/StandardToken.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


contract Token0xNIL is StandardToken, Ownable {

  event Mint(uint amount);

  event MintFinished();

  string public name = "0xNIL";

  string public symbol = "NIL";

  uint public decimals = 0;

  bool public mintingFinished = false;

  bool public isMinting = false;

  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  function finalTransfer(address _to, uint _amount) onlyOwner returns (bool) {
    require(mintingFinished);
    balances[_to] = balances[_to].add(_amount);
    Transfer(0x0, _to, _amount);
    return true;
  }

  function mint(uint _amount) onlyOwner canMint returns (bool) {
    totalSupply = totalSupply.add(_amount);
    isMinting = true;
    Mint(_amount);
    return true;
  }

  function finishMinting() onlyOwner returns (bool) {
    if (!mintingFinished) {
      mintingFinished = true;
      MintFinished();
    }
    return true;
  }

}
