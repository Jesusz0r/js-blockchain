module.exports = {
  isValidNodeUrl,
};

function isValidNodeUrl(newNodeUrl, block) {
  return newNodeUrl && block.networkNodes.indexOf(newNodeUrl) <= -1 && newNodeUrl !== block.currentNodeUrl;
}