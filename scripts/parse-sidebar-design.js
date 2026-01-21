#!/usr/bin/env node

/**
 * Parse Figma sidebar design and extract specifications
 */

import fs from 'fs';

const data = JSON.parse(fs.readFileSync('/Users/tanujapaunikar/Desktop/Health Care/figma-sidebar-data.json', 'utf8'));
const sidebarNode = data.nodes['177:39958'].document;

console.log('=== SIDEBAR DESIGN SPECIFICATIONS ===\n');

// Main container
console.log('MAIN CONTAINER:');
console.log(`  Name: ${sidebarNode.name}`);
console.log(`  Type: ${sidebarNode.type}`);
console.log(`  Width: ${sidebarNode.absoluteBoundingBox.width}px`);
console.log(`  Height: ${sidebarNode.absoluteBoundingBox.height}px`);

// Background color
if (sidebarNode.background && sidebarNode.background[0]) {
  const bg = sidebarNode.background[0];
  if (bg.color) {
    console.log(`  Background: rgba(${Math.round(bg.color.r * 255)}, ${Math.round(bg.color.g * 255)}, ${Math.round(bg.color.b * 255)}, ${bg.color.a})`);
  }
}

// Layout variables (padding, spacing)
console.log('\nLAYOUT VARIABLES:');
if (sidebarNode.boundVariables) {
  Object.entries(sidebarNode.boundVariables).forEach(([key, value]) => {
    console.log(`  ${key}: ${value.id}`);
  });
}

// Children structure
console.log(`\nCHILDREN (${sidebarNode.children.length} items):`);
sidebarNode.children.forEach((child, i) => {
  console.log(`\n${i + 1}. ${child.name} (${child.type})`);

  if (child.absoluteBoundingBox) {
    console.log(`   Size: ${child.absoluteBoundingBox.width} x ${child.absoluteBoundingBox.height}px`);
  }

  if (child.layoutMode) {
    console.log(`   Layout: ${child.layoutMode}`);
  }

  if (child.itemSpacing !== undefined) {
    console.log(`   Item Spacing: ${child.itemSpacing}px`);
  }

  // Check for navigation items
  if (child.children && child.children.length > 0) {
    console.log(`   Children: ${child.children.length}`);

    // Look for nav pills
    child.children.forEach((navItem, j) => {
      if (navItem.name.includes('Sidenav-pills') || navItem.name.includes('pill')) {
        console.log(`\n   ${j + 1}. ${navItem.name}`);

        if (navItem.componentProperties && navItem.componentProperties.States) {
          console.log(`      State: ${navItem.componentProperties.States.value}`);
        }

        if (navItem.absoluteBoundingBox) {
          console.log(`      Size: ${navItem.absoluteBoundingBox.width} x ${navItem.absoluteBoundingBox.height}px`);
        }

        // Get padding
        if (navItem.paddingLeft !== undefined) {
          console.log(`      Padding: ${navItem.paddingTop || 0}px ${navItem.paddingRight || 0}px ${navItem.paddingBottom || 0}px ${navItem.paddingLeft || 0}px`);
        }

        // Get corner radius
        if (navItem.cornerRadius !== undefined) {
          console.log(`      Corner Radius: ${navItem.cornerRadius}px`);
        }

        // Get background
        if (navItem.fills && navItem.fills[0] && navItem.fills[0].color) {
          const c = navItem.fills[0].color;
          console.log(`      Background: rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`);
        }

        // Get text content
        if (navItem.children) {
          navItem.children.forEach((element) => {
            if (element.type === 'TEXT' && element.characters) {
              console.log(`      Text: "${element.characters}"`);
              if (element.style) {
                console.log(`      Font Size: ${element.style.fontSize}px`);
                console.log(`      Font Weight: ${element.style.fontWeight}`);
              }
            }
          });
        }
      }
    });
  }
});

// Extract all colors used
console.log('\n\nCOLORS USED:');
const colors = new Set();

function extractColors(node) {
  if (node.fills) {
    node.fills.forEach(fill => {
      if (fill.type === 'SOLID' && fill.color) {
        const c = fill.color;
        colors.add(`rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`);
      }
    });
  }

  if (node.background) {
    node.background.forEach(bg => {
      if (bg.type === 'SOLID' && bg.color) {
        const c = bg.color;
        colors.add(`rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`);
      }
    });
  }

  if (node.children) {
    node.children.forEach(child => extractColors(child));
  }
}

extractColors(sidebarNode);
colors.forEach(color => console.log(`  ${color}`));

console.log('\n=== END ===\n');
