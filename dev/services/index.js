module.exports = {
  isValidNodeUrl,
  isValidBlock
};

/**
 *
 * @param {String} newNodeUrl
 * @param {Object} block
 */
function isValidNodeUrl(newNodeUrl, block) {
  return (
    newNodeUrl &&
    block.networkNodes.indexOf(newNodeUrl) === -1 &&
    newNodeUrl !== block.currentNodeUrl
  );
}

/**
 *
 * @param {Object} newBlock
 * @param {Object} lastBlock
 */
function isValidBlock(newBlock, lastBlock) {
  return (
    lastBlock.hash === newBlock.previousBlockHash &&
    lastBlock.index + 1 === newBlock.index
  );
}
