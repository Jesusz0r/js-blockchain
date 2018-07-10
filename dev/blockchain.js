const SHA256 = require('sha256');
const uuid = require('uuid/v4');
const url = process.argv[3];

class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.currentNodeUrl = url;
    this.networkNodes = [];

    this.createNewBlock(100, '0', '0');
  }

  /**
   *
   * @param {Number} nonce
   * @param {String: hash} previousBlockHash
   * @param {String: hash} hash
   */
  createNewBlock(nonce, previousBlockHash, hash) {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce,
      hash,
      previousBlockHash
    };

    this.pushNewBlock(newBlock);

    return newBlock;
  }

  pushNewBlock(newBlock) {
    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   *
   * @param {Number} amount
   * @param {String: uuid} sender
   * @param {String: uuid} recipient
   */
  createNewTransaction(amount, sender, recipient) {
    const id = uuid().split('-').join('');
    const newTransaction = {
      id,
      amount,
      sender,
      recipient
    };

    return newTransaction;
  }

  /**
   *
   * @param {Object} newTransaction
   */
  addTransactionToPrendingTransactions(newTransaction) {
    this.pendingTransactions.push(newTransaction);

    return this.getLastBlock()['index'] + 1;
  }

  hashBlock(previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + JSON.stringify(currentBlockData) + nonce.toString();

    return SHA256.x2(dataAsString);
  }

  /**
   *
   * @param {String: hash} previousBlockHash
   * @param {Object: newBlock} currentBlockData
   */
  proofOfWork(previousBlockHash, currentBlockData) {
      let nonce = 0;
      let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
      const firstFourDigits = generateRandomDigits();

      while (hash.toString().substring(0, 4) !== firstFourDigits) {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
      }

      return nonce;
  }
}

function generateRandomDigits() {
  let digits = '';
  const randomDigits = ['a', '2', 'f', '4', '1', 'c', '7', '9', '3', 'b', '6', 'e', '5', '8', '0'];

  while (digits.length < 4) {
    const length = randomDigits.length;
    const randomNumber = Math.floor(Math.random() * (length - 0) + 0);

    digits += randomDigits[randomNumber];
  }

  return digits;
}

module.exports = Blockchain;
