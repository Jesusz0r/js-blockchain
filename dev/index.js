const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v4');

const nodeAddress = uuid().split('-').join('');
const block = new Blockchain();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  res.send({ Hello: 'World' });
});

app.get('/blockchain', async (req, res) => {
  res.status(200).send({ block });
});

app.post('/transaction', async (req, res) => {
  try {
    const {
      amount,
      sender,
      recipient
    } = req.body;
    
    if (!amount) throw 'Amount is required';
    if (!sender) throw 'Sender address is required';
    if (!recipient) throw 'Recepient address is required';

    const blockIndex = await block.createNewTransaction(amount, sender, recipient);

    res.status(200).send({ message: 'Money sent correctly.', blockIndex });
  } catch(error) {
    res.status(400).send({ error });
  }
});

app.get('/mine', async (req, res) => {
  const previousBlock = block.getLastBlock();
  const previousBlockHash = previousBlock.hash;
  const currentBlockData = {
    transaction: block.pendingTransactions,
    index: previousBlock.index + 1,
  };
  const nonce = block.proofOfWork(previousBlockHash, currentBlockData);
  const hash = block.hashBlock(previousBlockHash, currentBlockData, nonce);
  const newBlock = block.createNewBlock(nonce, previousBlockHash, hash);

  block.createNewTransaction(12.5, '00', nodeAddress);

  res.status(200).send({ block: newBlock });
});

app.listen(5000, (err) => {
  if (err) throw new Error(err);

  console.log('Server is up and running on port 5000');

});