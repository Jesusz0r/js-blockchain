const SHA256 = require('sha256');
const url = process.argv[3];

class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeUrl = url;
    this.networkNodes = [];

    this.createNewBlock(100, '0', '0');
  }

  createNewBlock(nonce, previousBlockHash, hash) {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce,
      hash,
      previousBlockHash
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  createNewTransaction(amount, sender, recipient) {
    return new Promise((resolve) => {
      const newTransaction = {
        amount,
        sender,
        recipient
      };
  
      this.pendingTransactions.push(newTransaction);
  
      resolve(this.getLastBlock()['index'] + 1);
    });
  }

  hashBlock(previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + JSON.stringify(currentBlockData) + nonce.toString();

    return SHA256.x2(dataAsString);
  }

  proofOfWork(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    
    const firstFourDigits = generateRandomDigits();

    while (hash.substring(0, 6) !== firstFourDigits) {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
  }
}

function generateRandomDigits() {
  let digits = '';
  const randomDigits = ['a', '2', 'f', '4', '1', 'c', '7', '9', '3', 'b', '6', 'e', '5', '8', '0'];

  while (digits.length < 6) {
    const length = randomDigits.length;
    const randomNumber = Math.floor(Math.random() * (length - 0) + 0);

    digits += randomDigits[randomNumber];
  }

  return digits;
}

module.exports = Blockchain;