
module.exports = async (err, promise) => {
  try {
    await promise;
    assert.fail('Expected fail not received');
  } catch (error) {
    const revertFound = error.message.search(err) >= 0;
    assert(revertFound, `Expected "${err}", got ${error} instead`);
  }
};
