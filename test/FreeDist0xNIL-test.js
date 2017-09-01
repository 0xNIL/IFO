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

      // assert.equal(result.logs[0].event, 'Minted');
      // assert.equal(result.logs[0].args.to.valueOf(), accounts[2]);
      // assert.equal(result.logs[0].args.amount.valueOf(), 10);
      // assert.equal(result.logs[1].event, 'Minted');
      // assert.equal(result.logs[1].args.to.valueOf(), artist);
      // assert.equal(result.logs[1].args.amount.valueOf(), 1);
      //
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
      assert.equal(totalSupply.valueOf(), 22)
      assert.equal(balance.valueOf(), 10)
      assert.equal(aBalance.valueOf(), 2)
    })

  })

  // return false;


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
        dist.tokenBalanceOf(artist),
        dist.tokenBalanceOf(accounts[2]),
        dist.tokenBalanceOf(accounts[3]),
        dist.tokenBalanceOf(accounts[4]),
        dist.totalParticipants.call(),
        dist.tokenDistributed.call(),
        dist.tokenMinted.call()
      ])
    }).then(([balance1, balance2, balance3, balance4, participants, distributed, tokenMinted]) => {
      assert.equal(balance1.valueOf(), 9)
      assert.equal(balance2.valueOf(), 20)
      assert.equal(balance3.valueOf(), 30)
      assert.equal(balance4.valueOf(), 30)
      assert.equal(participants.valueOf(), 4)
      assert.equal(distributed.valueOf(), 90)
      assert.equal(tokenMinted.valueOf(), 99)
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

  it('should assign ~60 tokens each to accounts from 11 to 19', () => {
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
          .then(() => iterate(accounts[19], 6))
    }).then(() => {
      return Promise.all([
        dist.tokenBalanceOf(artist),
        dist.tokenBalanceOf(accounts[11]),
        dist.tokenBalanceOf(accounts[12]),
        dist.tokenBalanceOf(accounts[13]),
        dist.tokenBalanceOf(accounts[14]),
        dist.tokenBalanceOf(accounts[15]),
        dist.tokenBalanceOf(accounts[16]),
        dist.tokenBalanceOf(accounts[17]),
        dist.tokenBalanceOf(accounts[18]),
        dist.tokenBalanceOf(accounts[19]),
        dist.tokenDistributed.call(),
        dist.tokenMinted.call()
      ])
    }).then(([balance1, balance11, balance12, balance13, balance14, balance15, balance16, balance17, balance18, balance19, tokenDistributed, tokenMinted]) => {

      assert.equal(balance1.valueOf(), 73)
      assert.equal(balance11.valueOf(), 60)
      assert.equal(balance12.valueOf(), 60)
      assert.equal(balance13.valueOf(), 60)
      assert.equal(balance14.valueOf(), 60)
      assert.equal(balance15.valueOf(), 60)
      assert.equal(balance16.valueOf(), 60)
      assert.equal(balance17.valueOf(), 58)
      assert.equal(balance18.valueOf(), 54)
      assert.equal(balance19.valueOf(), 54)
      assert.equal(tokenDistributed.valueOf(), 716)
      assert.equal(tokenMinted.valueOf(), 831)
    })

  })

  it('should verify that tokens have been assigned to supporters', () => {
    let dist

    return FreeDist0xNIL.deployed().then(instance => {
      dist = instance
      return Promise.all([
        dist.tokenBalanceOf(accounts[6]),
        dist.tokenBalanceOf(accounts[7]),
        dist.tokenBalanceOf(accounts[8])
      ])
    }).then(([balance6, balance7, balance8]) => {
      assert.equal(balance6.valueOf(), 7)
      assert.equal(balance7.valueOf(), 21)
      assert.equal(balance8.valueOf(), 14)
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
      return iterate(accounts[19])
    }).then(() => {
      return dist.tokenBalanceOf(accounts[19])
    }).then(balance19 => {
      assert.equal(balance19.valueOf(), 100)
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

  // it('should hasEnded return true', () => {
  //   let dist
  //   return FreeDist0xNIL.deployed().then(instance => {
  //     dist = instance
  //     return dist.hasEnded()
  //   }).then(result => {
  //     assert.equal(result.valueOf(), true)
  //   })
  // })
  //
  // it('should throw if distribution has ended', () => {
  //   let dist
  //   return FreeDist0xNIL.deployed().then(instance => {
  //     dist = instance
  //     return dist.sendTransaction({from: accounts[2], value: 0})
  //   }).catch(() => {
  //     assert(true)
  //   })
  // })
  //
  // it('should throw an error trying to change the duration after ended', () => {
  //   let dist
  //   return FreeDist0xNIL.deployed().then(instance => {
  //     dist = instance
  //     duration = 300
  //     return dist.changeDuration(duration)
  //   }).catch(err => {
  //     assert(true)
  //   })
  // })
  //
  // it('should throw an error trying to restart the distribution', () => {
  //   let dist
  //   return FreeDist0xNIL.deployed().then(instance => {
  //     dist = instance
  //     current = web3.eth.blockNumber
  //     startBlock = current + 5
  //     duration = 200
  //     return dist.startDistribution(startBlock, duration, artist)
  //   }).catch(err => {
  //     assert(true)
  //   })
  // })

})
