pragma solidity ^0.4.18;


import '../IFOSecondRound.sol';


contract IFOSecondRoundMock is IFOSecondRound {

  function getReserveCollaborator(address _collaborator) public constant returns (uint) {
    return permilles[_collaborator].permille;
  }

  function getCollaboratorAddressByIndex(uint _index) public constant returns (address) {
    return collaborators[_index];
  }

  function numberOfCollaborators() public constant returns (uint) {
    return collaborators.length;
  }

  function pauseToken() public onlyOwner {
    return token.pause();
  }

  function acceptingRequests() public constant returns (bool) {
    return (currentState() == "PreDist" || currentState() == "Dist");
  }

  function getCurrentState() public constant returns (string) {
    return bytes32ToString(currentState());
  }

  function bytes32ToString(bytes32 x) constant returns (string) {
    bytes memory bytesString = new bytes(32);
    uint charCount = 0;
    for (uint j = 0; j < 32; j++) {
      byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
      if (char != 0) {
        bytesString[charCount] = char;
        charCount++;
      }
    }
    bytes memory bytesStringTrimmed = new bytes(charCount);
    for (j = 0; j < charCount; j++) {
      bytesStringTrimmed[j] = bytesString[j];
    }
    return string(bytesStringTrimmed);
  }

}
