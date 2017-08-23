/* globals Promise */

const Token0xNIL = artifacts.require('./Token0xNIL.sol')

contract('Token0xNIL', function (accounts) {

  it('should have 0 Token0xNIL in the beginning', () => {
    return Token0xNIL.deployed().then(instance => {
      return instance.totalSupply.call()
    }).then(totalSupply => {
      assert.equal(totalSupply.valueOf(), 0)
    })
  })

  it('should mint 100 Token0xNILs', () => {
    let token
    return Token0xNIL.deployed().then(instance => {
      token = instance
      return token.mint(100)
    }).then(result => {
      return token.totalSupply.call()
    }).then(totalSupply => {
      assert.equal(totalSupply.valueOf(), 100)
    })
  })

  it('should mint other 50 Token0xNILs', () => {
    let token
    return Token0xNIL.deployed().then(instance => {
      token = instance
      return token.mint(50)
    }).then(result => {
      return token.totalSupply.call()
    }).then(totalSupply => {
      assert.equal(totalSupply.valueOf(), 150)
    })
  })

  it('should throw an error if minting amount is negative', () => {
    let token
    return Token0xNIL.deployed().then(instance => {
      token = instance
      return token.mint(-10)
    }).catch(() => assert(true))
  })

  it('should throw an error calling finalTransfer when minting is still active', () => {
    let token
    return Token0xNIL.deployed().then(instance => {
      token = instance
      return token.finalTransfer(accounts[0], 40)
    }).catch(() => assert(true))
  })

  it('should mint stop minting', () => {
    let token
    return Token0xNIL.deployed().then(instance => {
      token = instance
      return token.finishMinting()
    }).then(result => {
      return token.mintingFinished.call()
    }).then(result => {
      assert.equal(result.valueOf(), true)
    })
  })

  it('should assign 30 tokens to account[0]', () => {
    let token
    return Token0xNIL.deployed().then(instance => {
      token = instance
      return token.finalTransfer(accounts[0], 30)
    }).then(result => {
      return token.balanceOf(accounts[0])
    }).then(balance => {
      assert.equal(balance.valueOf(), 30)
    })
  })

  it('should assign 100 tokens to account[1]', () => {
    let token
    return Token0xNIL.deployed().then(instance => {
      token = instance
      return token.finalTransfer(accounts[1], 100)
    }).then(result => {
      return token.balanceOf(accounts[1])
    }).then(balance => {
      assert.equal(balance.valueOf(), 100)
    })
  })

  it('should throw an error if mining after the end', () => {
    let token
    return Token0xNIL.deployed().then(instance => {
      token = instance
      return token.mint(10)
    }).catch(() => assert(true))
  })

})
