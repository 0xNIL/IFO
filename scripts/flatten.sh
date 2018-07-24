#!/usr/bin/env bash

contracts=(
"IFOSecondRound"
"Whitelist"
)

for c in "${contracts[@]}"
do
  truffle-flattener "contracts/$c.sol" > "flattened/$c-flattened.sol"
done
