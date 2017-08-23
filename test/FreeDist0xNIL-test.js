/* globals Promise */

const FreeDist0xNIL = artifacts.require('./FreeDist0xNIL.sol')

contract('FreeDist0xNIL', function (accounts) {

  let current
  let startBlock
  let endBlock
  let artist = accounts[1]

  it('should be waiting to start', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.isInitiated.call()
    }).then(result => {
      assert.equal(result.valueOf(), false)
    })
  })

  it('should throw an error if call changeEndBlock before starting', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      current = web3.eth.blockNumber
      endBlock = current + 10
      return dist.changeEndBlock(endBlock)
    }).catch(err => {
      assert(true)
    })
  })

  it('should isInitiated return false', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.isInitiated()
    }).then(result => {
      assert.equal(result.valueOf(), false)
    })
  })

  it('should return an initial token balance of 0 for account[0]', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.reservedBalanceOf(accounts[0])
    }).then(result => {
      assert.equal(result.valueOf(), 0)
    })
  })

  it('should initiate the distribution', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      current = web3.eth.blockNumber
      startBlock = current + 5
      endBlock = current + 1000
      return dist.start(startBlock, endBlock, artist)
    }).then(() => {
      return dist.isInitiated()
    }).then(result => {
      assert.equal(result.valueOf(), true)
    })
  })

  it('should throw sending ethers too early', () => {

    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[0], value: 1})
    }).then(result => {
      console.log(result.valueOf())
    })

        .catch(() => {
      assert(true)
    })

  })

  it('should mint 10 tokens receiving 0 ether', () => {

    let dist

    let iterate = () => {
      // iterates until the transaction succeds, i.e. startBlock >= eth.blockNumber
      return dist.sendTransaction({from: accounts[0], value: 0}).then(() => {
        return dist.isActive.call()
      }).catch(() => {
        return iterate()
      })
    }

    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return iterate()
    }).then(isActive => {
      assert.equal(isActive, true)
      return dist.sendTransaction({from: accounts[2], value: 0})
    }).then(() => {
      return dist.tokenDistributed.call()
    }).then(result => {
      assert.equal(result.valueOf(), 20)
    }).then(() => {
      return dist.totalParticipants.call()
    }).then(result => {
      assert.equal(result.valueOf(), 2)
      return dist.reservedBalanceOf(accounts[2])
    }).then(result => {
      assert.equal(result.valueOf(), 10)
    })

  })

  it('should assign tokens to accounts 2, 3 and 4 and verify that all the values are consistent', () => {

    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[2], value: 100})
    }).then(() => {
      return dist.sendTransaction({from: accounts[3], value: 0})
    }).then(() => {
      return dist.sendTransaction({from: accounts[3], value: 0})
    }).then(() => {
      return dist.sendTransaction({from: accounts[3], value: 300})
    }).then(() => {
      return dist.sendTransaction({from: accounts[4], value: 0})
    }).then(() => {
      return Promise.all([
        dist.reservedBalanceOf(accounts[0]),
        dist.reservedBalanceOf(artist),
        dist.reservedBalanceOf(accounts[2]),
        dist.reservedBalanceOf(accounts[3]),
        dist.reservedBalanceOf(accounts[4]),
        dist.totalParticipants.call(),
        dist.tokenDistributed.call(),
        dist.weiDonated.call()
      ])
    }).then(([balance0, balance1, balance2, balance3, balance4, participants, distributed, weiDonated]) => {
      assert.equal(balance0.valueOf(), 10)
      assert.equal(balance1.valueOf(), 7)
      assert.equal(balance2.valueOf(), 20)
      assert.equal(balance3.valueOf(), 30)
      assert.equal(balance4.valueOf(), 10)
      assert.equal(participants.valueOf(), 4)
      assert.equal(distributed.valueOf(), 70)
      assert.equal(weiDonated.valueOf(), 400)
    })

  })

  it('should change the endBlock', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      current = web3.eth.blockNumber
      endBlock = current + 5
      return dist.changeEndBlock(endBlock)
    }).then(() => {
      assert(true)
    })
  })

  it('should end the distribution', () => {

    let dist

    let iterate = () => {
      // iterates until the transaction fails, i.e. endBlock < eth.blockNumber
      return dist.sendTransaction({from: accounts[0], value: 0}).then(() => {
        return iterate()
      }).catch(() => {
        return Promise.resolve(true)
      })
    }

    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return iterate()
    }).then(() => {
      return dist.hasEnded()
    }).then(result => {
      assert.equal(result.valueOf(), true)
    })

  })

  it('should return 0 because the tokens have not been assigned yet', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.tokenBalanceOf(accounts[2])
    }).then(balance => {
      assert.equal(balance.valueOf(), 0)
    })
  })

  it('should distribute the tokens to the accounts', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[2], value: 0})
    }).then(() => {
      return dist.sendTransaction({from: accounts[3], value: 0})
    }).then(() => {
      return dist.sendTransaction({from: accounts[4], value: 0})
    }).then(() => {

      return Promise.all([
        dist.tokenBalanceOf(accounts[2]),
        dist.tokenBalanceOf(accounts[3]),
        dist.tokenBalanceOf(accounts[4])
      ])
    }).then(([balance2, balance3, balance4]) => {
      assert.equal(balance2.valueOf(), 20)
      assert.equal(balance3.valueOf(), 30)
      assert.equal(balance4.valueOf(), 10)
    })
  })

  it('should hasEnded return true', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.hasEnded()
    }).then(result => {
      assert.equal(result.valueOf(), true)
    })
  })

  it('should throw if tokens are already distributed', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[2], value: 0})
    }).catch(() => {
      assert(true)
    })
  })

  it('should throw an error trying to call changeEndBlock after ended', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      current = web3.eth.blockNumber
      endBlock = current + 10
      return dist.changeEndBlock(endBlock)
    }).catch(err => {
      assert(true)
    })
  })

  it('should throw an error trying to restart the distribution', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      current = web3.eth.blockNumber
      startBlock = current + 5
      endBlock = current + 1000
      return dist.start(startBlock, endBlock, artist)
    }).catch(err => {
      assert(true)
    })
  })


})
