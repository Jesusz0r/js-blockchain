module.exports = {
  isValidNodeUrl,
  isValidBlock
};

function isValidNodeUrl(newNodeUrl, block) {
  return newNodeUrl && block.networkNodes.indexOf(newNodeUrl) === -1 && newNodeUrl !== block.currentNodeUrl;
}

function isValidBlock(newBlock, lastBlock) {
  return lastBlock.hash === newBlock.previousBlockHash && lastBlock.index + 1 === newBlock.index;
}