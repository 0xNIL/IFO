# 0xNIL factory

Contracts for the NIL token and the related free distribution

More info at [0xNIL.org](http://0xNIL.org)

### Testing

Install `testrpc` and `truffle`:

```
npm install -g testrpc truffle
```

Install the dependencies
```
npm install
```

Run `testrpc` generating 20 accounts:
```
testrpc -a 20 -g 20000000000 -l 0x47E7C4
```

Run the tests:
```
truffle test

```
The results should look like this:

![test-results](https://raw.githubusercontent.com/0xNIL/initial-free-distribution/master/testresults.png)
