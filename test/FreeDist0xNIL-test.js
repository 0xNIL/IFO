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

  it('should return an initial token balance of 0 for accounts[0]', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.reservedBalanceOf(accounts[0])
    }).then(result => {
      assert.equal(result.valueOf(), 0)
    })
  })

  it('should add two supporters: accounts[6] and accounts[7]', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.addSupporter(accounts[6], 1)
    }).then(result => {
      return dist.addSupporter(accounts[7], 2)
    }).then(result => {
      return Promise.all([
        dist.supporterAddress.call(0),
        dist.supporterAddress.call(1),
        dist.supporters.call(accounts[6]),
        dist.supporters.call(accounts[7]),
        dist.totalSupporters.call(),
        dist.totalSupportersRatios.call()
      ])
    }).then(([supporter0, supporter1, ratio0, ratio1, totalSupporters, totalSupportersRatios]) => {
      assert.equal(supporter0.valueOf(), accounts[6])
      assert.equal(supporter1.valueOf(), accounts[7])
      assert.equal(ratio0.valueOf(), 1)
      assert.equal(ratio1.valueOf(), 2)
      assert.equal(totalSupporters.valueOf(), 2)
      assert.equal(totalSupportersRatios.valueOf(), 3)
    })
  })

  it('should add a new supporters accounts[8] and change accounts[7] ratio', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.addSupporter(accounts[7], 3)
    }).then(result => {
      return dist.addSupporter(accounts[8], 2)
    }).then(result => {
      return Promise.all([
        dist.supporterAddress.call(1),
        dist.supporterAddress.call(2),
        dist.supporters.call(accounts[7]),
        dist.supporters.call(accounts[8])
      ])
    }).then(([supporter1, supporter2, ratio1, ratio2]) => {
      assert.equal(supporter1.valueOf(), accounts[7])
      assert.equal(supporter2.valueOf(), accounts[8])
      assert.equal(ratio1.valueOf(), 3)
      assert.equal(ratio2.valueOf(), 2)
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

  it('should throw adding a new supporter accounts[9]', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.addSupporter(accounts[9], 1)
    }).catch(() => {
      assert(true)
    })
  })

  it('should throw sending ethers too early', () => {

    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[0], value: 1})
    }).catch(() => {
      assert(true)
    })

  })

  it('should mint 10 tokens receiving 0 ether', () => {

    let dist

    const iterate = () => {
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
      assert.equal(result.valueOf(), 2)
    }).then(() => {
      return dist.totalParticipants.call()
    }).then(result => {
      assert.equal(result.valueOf(), 2)
      return dist.reservedBalanceOf(accounts[2])
    }).then(result => {
      assert.equal(result.valueOf(), 1)
    })

  })

  it('should assign tokens to accounts 2, 3 and 4 and verify that all the values are consistent', () => {

    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[2], value: 1})
    }).then(() => {
      return dist.sendTransaction({from: accounts[3], value: 0})
    }).then(() => {
      return dist.sendTransaction({from: accounts[3], value: 0})
    }).then(() => {
      return dist.sendTransaction({from: accounts[3], value: 1})
    }).then(() => {
      return dist.sendTransaction({from: accounts[4], value: 0})
    }).then(() => {
      return dist.sendTransaction({from: accounts[4], value: 0})
    }).then(() => {
      return dist.sendTransaction({from: accounts[4], value: 0})
    }).then(() => {
      return Promise.all([
        dist.reservedBalanceOf(artist),
        dist.reservedBalanceOf(accounts[2]),
        dist.reservedBalanceOf(accounts[3]),
        dist.reservedBalanceOf(accounts[4]),
        dist.totalParticipants.call(),
        dist.tokenDistributed.call(),
        dist.tokenMinted.call()
      ])
    }).then(([balance1, balance2, balance3, balance4, participants, distributed, tokenMinted]) => {
      assert.equal(balance1.valueOf(), 0)
      assert.equal(balance2.valueOf(), 2)
      assert.equal(balance3.valueOf(), 3)
      assert.equal(balance4.valueOf(), 3)
      assert.equal(participants.valueOf(), 4)
      assert.equal(distributed.valueOf(), 9)
      assert.equal(tokenMinted.valueOf(), 9)
    })

  })

  it('should throw if sending more than 1 wei', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[2], value: 10})
    }).catch(() => {
      assert(true);
    })
  })

  it('should assign 50 tokens each to accounts 5 and 9', () => {
    let dist

    const iterate = (account, counter) => {
      return dist.sendTransaction({from: account, value: 0}).then(() => {
        if (--counter > 0) {
          return iterate(account, counter)
        } else {
          return Promise.resolve(true)
        }
      })
    }

    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return Promise.all([
        iterate(accounts[5], 50),
        iterate(accounts[9], 50)
      ])
    }).then(() => {
      return Promise.all([
        dist.reservedBalanceOf(artist),
        dist.reservedBalanceOf(accounts[5]),
        dist.reservedBalanceOf(accounts[9]),
        dist.tokenDistributed.call(),
        dist.tokenMinted.call()
      ])
    }).then(([balance1, balance5, balance9, tokenDistributed, tokenMinted]) => {
      assert.equal(balance1.valueOf(), 20)
      assert.equal(balance5.valueOf(), 50)
      assert.equal(balance9.valueOf(), 50)
      assert.equal(tokenDistributed.valueOf(), 109)
      assert.equal(tokenMinted.valueOf(), 135)
    })

  })

  it('should verify that tokens have been assigned to supporters', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return Promise.all([
        dist.reservedBalanceOf(accounts[6]),
        dist.reservedBalanceOf(accounts[7]),
        dist.reservedBalanceOf(accounts[8])
      ])
    }).then(([balance6, balance7, balance8]) => {
      assert.equal(balance6.valueOf(), 1)
      assert.equal(balance7.valueOf(), 3)
      assert.equal(balance8.valueOf(), 2)
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

    const iterate = () => {
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
        dist.tokenBalanceOf(accounts[4]),
        dist.reservedBalanceOf(accounts[2])
      ])
    }).then(([balance2, balance3, balance4, balance2b]) => {
      assert.equal(balance2.valueOf(), 2)
      assert.equal(balance3.valueOf(), 3)
      assert.equal(balance4.valueOf(), 3)
      assert.equal(balance2b.valueOf(), 0)
    })
  })


  it('should throw if trying to withdraw again', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[2], value: 0})
    }).catch(() => {
      assert(true);
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
