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

// Endpoint para crear una nueva transacción (puede recibir una nueva transacción de /transaction/broadcast o una petición directa)
app.post("/transaction", (req, res) => {
  // recibe la transacción en el body
  const { newTransaction } = req.body;
  // Agrega la transacción al array de transacciones pendientes
  const blockIndex = block.addTransactionToPrendingTransactions(newTransaction);

  res.status(200).send({ message: `Transaction will be added in block ${blockIndex}` });
});

// Endpoint para crear y distribuir una transacción a través de toda la red de nodos
app.post("/transaction/broadcast", (req, res) => {
  try {
    // Recibe la cantidad, el id y el recipient en el body
    const { amount, sender, recipient } = req.body;
    const registerNodePromises = [];

    // Si no hay amount, sender o recipient lanza un error
    if (!amount) throw "Amount is required";
    if (!sender) throw "Sender address is required";
    if (!recipient) throw "Recepient address is required";

    // Crea una nueva transacción
    const newTransaction = block.createNewTransaction(
      amount,
      sender,
      recipient
    );

    // Agrega la transacción al array de transacciones pendientes
    block.addTransactionToPrendingTransactions(newTransaction);
    // Hace un loop en el array que contiene todos los nodos que hay actualmente en la red de nodos
    block.networkNodes.forEach(networkNodeUrl => {
      // Crea la información necesaria para hacer el request y envía la nueva transacción en el body a networkNodeUrl/transaction
      const requestOptions = {
        uri: `${networkNodeUrl}/transaction`,
        method: 'POST',
        body: {
          newTransaction
        },
        json: true
      };

      // Guarda todas las promesas de request en un array
      registerNodePromises.push(request(requestOptions));
    });

    // Ejecuta todas las promesas que hay en el array y cuando se han ejecutado satisfactoriamente envía una respuesta
    Promise.all(registerNodePromises)
      .then(() => {
        res.status(200).send({ message: 'Transaction broadcasted successfuly.' });
      })
      .catch(error => { throw new Error(error); });
  } catch(error) {
    res.status(400).send({ error })
  }
});

// Endpoint para minar
app.get("/mine", (req, res) => {
  const registerNodePromises = [];
  // Obtiene el último bloque
  const previousBlock = block.getLastBlock();
  // Obtiene el hash del último bloque
  const previousBlockHash = previousBlock.hash;
  // Crea los datos actuales para el nuevo bloque (donde se le asigna las transacciones pendientes al array de transacciones y el index se le aumenta por 1)
  const currentBlockData = {
    transaction: block.pendingTransactions,
    index: previousBlock.index + 1
  };
  // usa el método proofOfWork que determina si el bloque es válido
  const nonce = block.proofOfWork(previousBlockHash, currentBlockData);
  // crea el nuevo hash para el bloque nuevo
  const hash = block.hashBlock(previousBlockHash, currentBlockData, nonce);
  // crea el nuevo bloque una vez se tenga toda la información
  const newBlock = block.createNewBlock(nonce, previousBlockHash, hash);

  // Hace un loop en el array que contiene todos los nodos que hay actualmente en la red de nodos
  block.networkNodes.forEach(networkNodeUrl => {
    // Crea la información necesaria para hacer el request y envíar el nuevo bloque en el body a networkNodeUrl/receive-new-block
    const requestOptions = {
      uri: `${networkNodeUrl}/receive-new-block`,
      method: 'POST',
      body: {
        newBlock
      },
      json: true
    };

    // Guarda todas las promesas de request en un array
    registerNodePromises.push(request(requestOptions));
  });

  // Ejecuta todas las promesas del array
  Promise.all(registerNodePromises)
    .then(() => {
      // Una vez se hayan ejecutado todas las promesas del array se hace una petición a block.currentNodeUrl/transaction/broadcast
      // donde se envía un "reward" al usuario por haber minado un bloque
      const requestOptions = {
        uri: `${block.currentNodeUrl}/transaction/broadcast`,
        method: 'POST',
        body: {
          sender: '00',
          recipient: nodeAddress,
          amount: 12.5
        },
        json: true
      };

      return request(requestOptions);
    })
    .then(() => {
      res.status(200).send({
        message: 'New block was mined and broadcasted successfuly',
        block: newBlock
      });
    })
    .catch((error) => {
      res.status(400).send({ error: error.message });
    });
});

// Endpoint para recibir y registrar los bloques en todos los nodos de la red actual
app.post("/receive-new-block", (req, res) => {
  // recibimos el nuevo bloque
  const { newBlock } = req.body;
  // obtenemos el último bloque
  const lastBlock = block.getLastBlock();
  // Validamos que el hash del último bloque sea igual al hash del bloque anterior guardado en el nuevo bloque
  const isValidBlock = networkService.isValidBlock(newBlock, lastBlock);

  // si es valido lo introducimos en la cadena de bloques
  if (isValidBlock) {
    block.pushNewBlock(newBlock);
    res.status(200).send({ message: 'New block received successfuly.' });
  } else {
    res.status(400).send({ message: 'Block is not valid.' });
  }
});

// endpoint para registrar y enviar nodos a todos los nodos de la red actual
app.post("/register-and-broadcast-node", (req, res) => {
  const registerNodePromises = [];
  // obtenemos la url del nodo que queremos registrar
  const { newNodeUrl } = req.body;

  // si el nodo no existe en el array donde están todos los nodos de la red de nodos actual lo introducimos
  if (block.networkNodes.indexOf(newNodeUrl) === -1) block.networkNodes.push(newNodeUrl);

  // hacemos un loop por la url de todos los nodos de la red actual de nodos
  block.networkNodes.forEach(networkNodeUrl => {
    // creamos la información necesaria para hacer un request a cada url de nodos y enviamos la nueva url del nodo que queremos registrar
    const requestOptions = {
      uri: `${networkNodeUrl}/register-node`,
      method: 'POST',
      body: {
        newNodeUrl,
      },
      json: true,
    };

    // Guarda todas las promesas de request en un array
    registerNodePromises.push(
      request(requestOptions)
    );
  });

  // Ejecutamos el array de promesas de request
  Promise.all(registerNodePromises)
    .then(() => {
      // Creamos la información necesaria para registrar la url de todos los nodos que tenemos en nuestra red actual en todos los nodos de nuestra red
      // Y le enviamos la lista de urls en un array
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

// endpoint para registrar nodos
app.post("/register-node", (req, res) => {
  const { newNodeUrl } = req.body;
  // verificamos si el nuevo nodo es válido
  const isValid = networkService.isValidNodeUrl(newNodeUrl, block);

  // si es válido lo introducimos en el array de nodos
  if (isValid) {
    block.networkNodes.push(newNodeUrl);
    res.status(200).send({ message: "New node registered successfuly." });
  } else {
    res.status(200).send({ message: "Node already exists in our network." });
  }
});

// endpoint para registrar nodos en todos los nodos de nuestra red de nodos
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
