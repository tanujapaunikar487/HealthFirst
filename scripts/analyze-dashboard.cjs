const data = require('/tmp/figma-dashboard.json');
const node = data.nodes['204:49595'].document;

function extractTextAndSpacing(n, path = '', depth = 0) {
  const indent = '  '.repeat(depth);

  if (n.type === 'TEXT') {
    console.log(`${indent}TEXT: ${n.name}`);
    console.log(`${indent}  characters: ${n.characters}`);
    console.log(`${indent}  fontSize: ${n.style?.fontSize}`);
    console.log(`${indent}  fontWeight: ${n.style?.fontWeight}`);
    console.log(`${indent}  lineHeight: ${n.style?.lineHeightPx}`);
    console.log(`${indent}  letterSpacing: ${n.style?.letterSpacing}`);
  }

  if (n.itemSpacing !== undefined) {
    console.log(`${indent}${n.name}: itemSpacing = ${n.itemSpacing}px`);
  }

  if (n.paddingTop || n.paddingLeft) {
    console.log(`${indent}${n.name}: padding = ${n.paddingTop || 0}px ${n.paddingRight || 0}px ${n.paddingBottom || 0}px ${n.paddingLeft || 0}px`);
  }

  if (n.children) {
    n.children.forEach(c => extractTextAndSpacing(c, path + '/' + n.name, depth + 1));
  }
}

console.log('Dashboard Design Analysis:\n');
extractTextAndSpacing(node);
