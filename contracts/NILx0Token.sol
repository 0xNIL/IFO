pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/token/StandardToken.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


contract NILx0Token is StandardToken, Ownable {

  string public name = "NIL";

  string public symbol = "NIL";

  uint256 public decimals = 18;

  event MintFinished();

  bool public mintingFinished = false;

  bool public isMinting = false;

  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  function finalTransfer(address _to, uint256 _amount) onlyOwner returns (bool) {
    balances[_to].add(_amount);
    Transfer(0x0, _to, _amount);
    return true;
  }

  function mint(uint256 _amount) onlyOwner canMint returns (bool) {
    totalSupply = totalSupply.add(_amount);
    isMinting = true;
    return true;
  }

  function getTotalSupply() public constant returns (uint256) {
    return totalSupply;
  }

  function finishMinting() onlyOwner returns (bool) {
    mintingFinished = true;
    MintFinished();
    return true;
  }

}
