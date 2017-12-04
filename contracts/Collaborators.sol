pragma solidity ^0.4.15;


import 'zeppelin/ownership/Ownable.sol';

contract Collaborators is Ownable {

  bool public activated;

  bool public completed;

  struct Percentage {
  uint percentage;
  bool active;
  }

  mapping (address => Percentage) public percentages;

  address[] public collaborators;

  uint public limit;

  function getPercentage(address _address) constant returns (uint) {
    require(_address != 0x0);
    return percentages[_address].percentage;
  }

  function getHowManyCollaborators() constant returns (uint) {
    return collaborators.length;
  }

  function getCollaborator(uint index) constant returns (address) {
    return collaborators[index];
  }

  function activateCollabs(address _architect, uint _amount, uint _limit) onlyOwner {
    require(_architect != 0x0);
    require(collaborators.length == 0);
    limit = _amount;
    activated = true;
    updatePercentage(_architect, _amount);
    limit = _limit;
  }

  function updatePercentage(address _address, uint _percentage) public onlyOwner  {
    require(activated && !completed);
    require(_percentage >= 0 && _percentage <= limit);
    require(_address != 0x0);

    if (percentages[_address].active == false) {
      collaborators.push(_address);
    }
    percentages[_address] = Percentage(_percentage, true);
  }

  function getAmount(uint _totalSupply, address _collaborator) public returns (uint){
    require(activated);
    require(_collaborator != 0x0);
    require(_totalSupply > 0);

    uint percentage = percentages[_collaborator].percentage;
    return _totalSupply * percentage / 100000;
  }

  function setCompleted() public onlyOwner {
    completed = true;
  }

}