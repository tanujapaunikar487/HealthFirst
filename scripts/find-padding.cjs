const data = require('/tmp/figma-dashboard.json');
const doc = data.nodes['204:49595'].document;

function findPadding(node, depth = 0) {
  const indent = '  '.repeat(depth);

  if (node.paddingTop !== undefined || node.paddingLeft !== undefined) {
    console.log(`${indent}${node.name}: padding = top:${node.paddingTop || 0} right:${node.paddingRight || 0} bottom:${node.paddingBottom || 0} left:${node.paddingLeft || 0}`);
  }

  if (node.children) {
    node.children.forEach(c => findPadding(c, depth + 1));
  }
}

console.log('Looking for padding values:\n');
findPadding(doc);
