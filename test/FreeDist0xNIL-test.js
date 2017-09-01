/* globals Promise */

const FreeDist0xNIL = artifacts.require('./FreeDist0xNIL.sol')

contract('FreeDist0xNIL', function (accounts) {

  let current
  let startBlock
  let endBlock
  let duration
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

  it('should throw an error if call changeDuration before starting', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.changeDuration(100)
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

  it('should initiate the distribution', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      current = web3.eth.blockNumber
      startBlock = current + 10
      duration = 300
      endBlock = startBlock + duration
      return dist.startDistribution(startBlock, duration, artist)
    }).then(() => {
      return Promise.all([
        dist.isInitiated(),
        dist.endBlock.call()
      ])
    }).then(([isInitiated, _endBlock]) => {
      assert.equal(isInitiated.valueOf(), true)
      assert.equal(_endBlock, endBlock)
    }).catch(err => {
      console.error('err', err)
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
        return dist.isActive()
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
    }).then(result => {

      return Promise.all([
        dist.tokenDistributed.call(),
        dist.totalParticipants.call(),
        dist.totalSupply(),
        dist.tokenBalanceOf(accounts[2]),
        dist.tokenBalanceOf(artist)
      ])
    }).then(([tokenDistributed, totalParticipants, totalSupply, balance, aBalance]) => {
      assert.equal(tokenDistributed.valueOf(), 20)
      assert.equal(totalParticipants.valueOf(), 2)
      assert.equal(totalSupply.valueOf(), 20)
      assert.equal(balance.valueOf(), 10)
      assert.equal(aBalance.valueOf(), 0)
    })

  })

  it('should assign tokens to accounts 2, 3 and 4 and verify that all the values are consistent', () => {

    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return Promise.all([
        dist.sendTransaction({from: accounts[2], value: 1}),
        dist.sendTransaction({from: accounts[3], value: 0}),
        dist.sendTransaction({from: accounts[3], value: 0}),
        dist.sendTransaction({from: accounts[3], value: 1}),
        dist.sendTransaction({from: accounts[4], value: 0}),
        dist.sendTransaction({from: accounts[4], value: 0}),
        dist.sendTransaction({from: accounts[4], value: 0}),
        dist.sendTransaction({from: accounts[4], value: 0})
      ])
    }).then(() => {
      return Promise.all([
        dist.tokenBalanceOf(artist),
        dist.tokenBalanceOf(accounts[2]),
        dist.tokenBalanceOf(accounts[3]),
        dist.tokenBalanceOf(accounts[4]),
        dist.totalParticipants.call(),
        dist.tokenDistributed.call()
      ])
    }).then(([balance1, balance2, balance3, balance4, participants, distributed]) => {
      assert.equal(balance1.valueOf(), 0)
      assert.equal(balance2.valueOf(), 20)
      assert.equal(balance3.valueOf(), 30)
      assert.equal(balance4.valueOf(), 40)
      assert.equal(participants.valueOf(), 4)
      assert.equal(distributed.valueOf(), 100)
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

  it('should assign ~60 tokens each to accounts from 11 to 18', () => {
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
      return iterate(accounts[10], 10)
          .then(() => iterate(accounts[11], 6))
          .then(() => iterate(accounts[12], 6))
          .then(() => iterate(accounts[13], 6))
          .then(() => iterate(accounts[14], 6))
          .then(() => iterate(accounts[15], 6))
          .then(() => iterate(accounts[16], 6))
          .then(() => iterate(accounts[17], 6))
          .then(() => iterate(accounts[18], 6))
    }).then(() => {
      return Promise.all([
        dist.tokenBalanceOf(accounts[11]),
        dist.tokenBalanceOf(accounts[12]),
        dist.tokenBalanceOf(accounts[13]),
        dist.tokenBalanceOf(accounts[14]),
        dist.tokenBalanceOf(accounts[15]),
        dist.tokenBalanceOf(accounts[16]),
        dist.tokenBalanceOf(accounts[17]),
        dist.tokenBalanceOf(accounts[18]),
        dist.tokenDistributed.call()
      ])
    }).then(([balance11, balance12, balance13, balance14, balance15, balance16, balance17, balance18, tokenDistributed]) => {

      assert.equal(balance11.valueOf(), 60)
      assert.equal(balance12.valueOf(), 60)
      assert.equal(balance13.valueOf(), 60)
      assert.equal(balance14.valueOf(), 60)
      assert.equal(balance15.valueOf(), 60)
      assert.equal(balance16.valueOf(), 60)
      assert.equal(balance17.valueOf(), 57)
      assert.equal(balance18.valueOf(), 54)
      assert.equal(tokenDistributed.valueOf(), 671)
    })

  })

  it('should limit the wallet to 100 tokens', () => {
    let dist

    const iterate = account => {
      return dist.sendTransaction({from: account, value: 0}).then(() => {
        return iterate(account)
      }).catch(() => {
        return Promise.resolve()
      })
    }

    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return iterate(accounts[18])
    }).then(() => {
      return dist.tokenBalanceOf(accounts[18])
    }).then(balance18 => {
      assert.equal(balance18.valueOf(), 100)
    })

  })

  it('should change the duration', () => {
    let dist

    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      endBlock = web3.eth.blockNumber + 5
      duration = endBlock - startBlock
      return dist.changeDuration(duration)
    }).then(result => {


      assert(true)
    })
  })

  it('should end the distribution', () => {

    let dist

    const iterate = () => {
      // iterates until the transaction fails
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

  it('should hasEnded return true', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.hasEnded()
    }).then(result => {
      assert.equal(result.valueOf(), true)
    })
  })

  it('should tip the artist', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.giveTipToArtist()
    }).then(() => {
      return Promise.all([
        dist.tokenBalanceOf(artist),
        dist.tokenDistributed.call()
      ])
    }).then(([balance, tokenDistributed]) => {
      assert.equal(balance, Math.floor(tokenDistributed.valueOf() / 7));
    })
  })

  it('should throw if trying to tip the artist again', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.giveTipToArtist()
    }).catch(() => {
      assert(true)
    })
  })

  it('should throw if distribution has ended', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[2], value: 0})
    }).catch(() => {
      assert(true)
    })
  })

  it('should throw an error trying to change the duration after ended', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      duration = 300
      return dist.changeDuration(duration)
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
      duration = 200
      return dist.startDistribution(startBlock, duration, artist)
    }).catch(err => {
      assert(true)
    })
  })

})
