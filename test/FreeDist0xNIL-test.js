/* globals Promise */

const FreeDist0xNIL = artifacts.require('./FreeDist0xNIL.sol')

function toGwei(amount) {
  return amount * 1e9
}

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
      duration = 110
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
      assert.equal(tokenDistributed.valueOf(), 2800)
      assert.equal(totalParticipants.valueOf(), 2)
      assert.equal(totalSupply.valueOf(), 2800 * 1e9)
      assert.equal(balance.valueOf(), toGwei(1400))
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
      assert.equal(balance2.valueOf(), toGwei(2800))
      assert.equal(balance3.valueOf(), toGwei(4200))
      assert.equal(balance4.valueOf(), toGwei(5600))
      assert.equal(participants.valueOf(), 4)
      assert.equal(distributed.valueOf(), 14000)
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
      assert.equal(balance.valueOf(), toGwei(Math.floor(tokenDistributed.valueOf() / 5)))
    })
  })

  it('should throw if sending more than 1 wei', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.sendTransaction({from: accounts[2], value: 10})
    }).catch(() => {
      assert(true)
    })
  })

  it('should assign < 100 tokens each to accounts from 10 to 19', () => {
    let dist

    const iterate = (account, counter) => {
      return dist.sendTransaction({from: account, value: 0}).then(() => {
        if (--counter > 0) {
          return iterate(account, counter)
        } else {
          return Promise.resolve(true)
        }
      })
          .catch(err => {
            console.log(account, counter)
            console.log(err.stack)
          })
    }

    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return iterate(accounts[10], 7)
          .then(() => iterate(accounts[11], 7))
          .then(() => iterate(accounts[12], 7))
          .then(() => iterate(accounts[13], 7))
          .then(() => iterate(accounts[14], 8))
          .then(() => iterate(accounts[15], 8))
          .then(() => iterate(accounts[16], 8))
          .then(() => iterate(accounts[17], 8))
          .then(() => iterate(accounts[18], 9))
          .then(() => iterate(accounts[19], 9))
    }).then(() => {
      return Promise.all([
        dist.tokenBalanceOf(accounts[10]),
        dist.tokenBalanceOf(accounts[11]),
        dist.tokenBalanceOf(accounts[12]),
        dist.tokenBalanceOf(accounts[13]),
        dist.tokenBalanceOf(accounts[14]),
        dist.tokenBalanceOf(accounts[15]),
        dist.tokenBalanceOf(accounts[16]),
        dist.tokenBalanceOf(accounts[17]),
        dist.tokenBalanceOf(accounts[18]),
        dist.tokenBalanceOf(accounts[19]),
        dist.tokenDistributed.call()
      ])
    }).then(([balance10, balance11, balance12, balance13, balance14, balance15, balance16, balance17, balance18, balance19, tokenDistributed]) => {
      assert.equal(balance10.valueOf(), toGwei(9800))
      assert.equal(balance11.valueOf(), toGwei(9800))
      assert.equal(balance12.valueOf(), toGwei(9800))
      assert.equal(balance13.valueOf(), toGwei(9000))
      assert.equal(balance14.valueOf(), toGwei(9600))
      assert.equal(balance15.valueOf(), toGwei(9600))
      assert.equal(balance16.valueOf(), toGwei(9600))
      assert.equal(balance17.valueOf(), toGwei(9600))
      assert.equal(balance18.valueOf(), toGwei(9000))
      assert.equal(balance19.valueOf(), toGwei(9000))
      assert.equal(tokenDistributed.valueOf(), 108800)
    })

  })

  it('should limit the wallet to 10000 tokens', () => {
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
      return iterate(accounts[2])
    }).then(() => {
      return dist.tokenBalanceOf(accounts[2])
    }).then(balance2 => {
      assert.equal(balance2.valueOf(), toGwei(10000))
    })
  })

  it('should change the duration', () => {
    let dist

    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      endBlock = web3.eth.blockNumber + 5
      duration = endBlock - startBlock
      return dist.changeDuration(duration)
    }).then(() => {
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

  it('should verify minting has not finished', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.isMintingFinished()
    }).then(result => {
      assert.equal(result.valueOf(), false)
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
      assert.equal(tokenDistributed.valueOf(), 120000)
      assert.equal(balance.valueOf(), toGwei(24000))
    })
  })

  it('should verify minting has finished', () => {
    let dist
    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return dist.isMintingFinished()
    }).then(result => {
      assert.equal(result.valueOf(), true)
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
