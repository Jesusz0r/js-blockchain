const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require('morgan');
const request = require("request-promise");
const Blockchain = require("./blockchain");
const uuid = require("uuid/v4");
const port = process.argv[2];

const nodeAddress = uuid()
  .split("-")
  .join("");
const block = new Blockchain();
const networkService = require("./services");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));

app.get("/", (req, res) => {
  res.send({ message: "API is working." });
});

app.get("/blockchain", (req, res) => {
  res.status(200).send({ block });
});

app.post("/transaction", async (req, res) => {
  try {
    const { amount, sender, recipient } = req.body;

    if (!amount) throw "Amount is required";
    if (!sender) throw "Sender address is required";
    if (!recipient) throw "Recepient address is required";

    const blockIndex = await block.createNewTransaction(
      amount,
      sender,
      recipient
    );

    res.status(200).send({ message: "Money sent correctly.", blockIndex });
  } catch (error) {
    res.status(400).send({ error });
  }
});

app.get("/mine", (req, res) => {
  const previousBlock = block.getLastBlock();
  const previousBlockHash = previousBlock.hash;
  const currentBlockData = {
    transaction: block.pendingTransactions,
    index: previousBlock.index + 1
  };
  const nonce = block.proofOfWork(previousBlockHash, currentBlockData);
  const hash = block.hashBlock(previousBlockHash, currentBlockData, nonce);
  const newBlock = block.createNewBlock(nonce, previousBlockHash, hash);

  block.createNewTransaction(12.5, "00", nodeAddress);

  res.status(200).send({ block: newBlock });
});

app.post("/register-and-broadcast-node", (req, res) => {
  const registerNodePromises = [];
  const newNodeUrl = req.body.newNodeUrl;
  
  if (block.networkNodes.indexOf(newNodeUrl) === -1) block.networkNodes.push(newNodeUrl);
  
  block.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: `${networkNodeUrl}/register-node`,
      method: 'POST',
      body: {
        newNodeUrl,
      },
      json: true,
    };

    registerNodePromises.push(
      request(requestOptions)
    );
  });

  Promise.all(registerNodePromises)
    .then(() => {
      const bulkRequestOptions = {
        uri: `${newNodeUrl}/register-nodes-bulk`,
        method: 'POST',
        body: {
          allNetworkNodes: [...block.networkNodes, block.currentNodeUrl],
        },
        json: true
      };

      return request(bulkRequestOptions);
    })
    .then(() => {
      res.status(200).send({ message: "New node added successfuly." });
    })
    .catch((error) => {
      throw new Error(error);
    });
});

app.post("/register-node", (req, res) => {
  const { newNodeUrl } = req.body;
  const isValid = networkService.isValidNodeUrl(newNodeUrl, block);

  if (isValid) {
    block.networkNodes.push(newNodeUrl);
    res.status(200).send({ message: "New node registered successfuly." });
  } else {
    res.status(200).send({ message: "Node already exists in our network." });
  }
});

app.post("/register-nodes-bulk", (req, res) => {
  const { allNetworkNodes } = req.body;
  
  allNetworkNodes.forEach(networkNodeUrl => {
    const isValid = networkService.isValidNodeUrl(networkNodeUrl, block);

    if (isValid) {
      block.networkNodes.push(networkNodeUrl);
    }
  });

  res.status(200).send({ message: "Nodes registered in bulk successfuly." });
});

app.listen(port, err => {
  if (err) throw new Error(err);

  console.log(`Server is up and running on port ${port}`);
});
