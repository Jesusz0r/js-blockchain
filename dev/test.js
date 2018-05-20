const Blockchain = require('./blockchain');
const block = new Blockchain();

const currentBlockData = block.getLastBlock().transactions;
const previousBlockHash = block.getLastBlock().hash;
const nonce = block.proofOfWork(previousBlockHash, currentBlockData);
const hash = block.hashBlock(previousBlockHash, currentBlockData, nonce);

block.createNewBlock(nonce, previousBlockHash, hash);

const newCurrentBlockData = block.getLastBlock().transactions;
const newPreviousBlockHash = block.getLastBlock().hash;
const newNonce = block.proofOfWork(newPreviousBlockHash, newCurrentBlockData);
const newHash = block.hashBlock(newPreviousBlockHash, newCurrentBlockData, newNonce);

block.createNewBlock(newNonce, newPreviousBlockHash, newHash);

const currentBlockData1 = block.getLastBlock().transactions;
const previousBlockHash1 = block.getLastBlock().hash;
const nonce1 = block.proofOfWork(previousBlockHash1, currentBlockData1);
const hash1 = block.hashBlock(previousBlockHash1, currentBlockData1, nonce1);

block.createNewBlock(nonce1, previousBlockHash1, hash1);

console.log(block);