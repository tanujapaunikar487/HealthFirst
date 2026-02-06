/**
 * ESLint rule: no-arbitrary-classname
 *
 * Flags arbitrary Tailwind values in className props:
 *   - [Xpx] patterns like p-[13px], w-[200px], gap-[8px]
 *   - [#hex] patterns like bg-[#f00], text-[#333]
 *
 * Exempts:
 *   - text-[Xpx] (typography — handled separately)
 *   - Radix data attributes or non-Tailwind bracket usage
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow arbitrary Tailwind values (raw px/hex) in className',
    },
    messages: {
      noArbitraryPx:
        'Avoid arbitrary px value "{{value}}" in className. Use a Tailwind spacing token or a custom theme token instead.',
      noArbitraryHex:
        'Avoid arbitrary hex color "{{value}}" in className. Use a semantic color token (text-foreground, bg-primary, etc.) instead.',
    },
    schema: [],
  },

  create(context) {
    // Matches Tailwind arbitrary px: p-[13px], w-[200px], gap-[8px], etc.
    // Captures the full class like "p-[13px]"
    const arbitraryPxPattern = /(?<!\w)((?!text-)\w[\w-]*-\[\d+px\])/g;

    // Matches Tailwind arbitrary hex: bg-[#f00], text-[#333333], border-[#ccc]
    const arbitraryHexPattern = /(?<!\w)(\w[\w-]*-\[#[0-9a-fA-F]+\])/g;

    function checkStringValue(node, value) {
      if (typeof value !== 'string') return;

      let match;

      // Check for arbitrary px values (excluding text-[Xpx])
      arbitraryPxPattern.lastIndex = 0;
      while ((match = arbitraryPxPattern.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'noArbitraryPx',
          data: { value: match[1] },
        });
      }

      // Check for arbitrary hex colors
      arbitraryHexPattern.lastIndex = 0;
      while ((match = arbitraryHexPattern.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'noArbitraryHex',
          data: { value: match[1] },
        });
      }
    }

    return {
      JSXAttribute(node) {
        if (
          node.name.name !== 'className' &&
          node.name.name !== 'class'
        ) {
          return;
        }

        const value = node.value;
        if (!value) return;

        // String literal: className="p-[13px]"
        if (value.type === 'Literal' && typeof value.value === 'string') {
          checkStringValue(node, value.value);
        }

        // Template literal: className={`p-[13px] ${...}`}
        if (
          value.type === 'JSXExpressionContainer' &&
          value.expression.type === 'TemplateLiteral'
        ) {
          for (const quasi of value.expression.quasis) {
            checkStringValue(node, quasi.value.raw);
          }
        }

        // cn() or clsx() call: className={cn("p-[13px]", ...)}
        if (
          value.type === 'JSXExpressionContainer' &&
          value.expression.type === 'CallExpression'
        ) {
          const callee = value.expression.callee;
          const calleeName =
            callee.type === 'Identifier' ? callee.name : null;

          if (calleeName === 'cn' || calleeName === 'clsx' || calleeName === 'twMerge') {
            for (const arg of value.expression.arguments) {
              if (arg.type === 'Literal' && typeof arg.value === 'string') {
                checkStringValue(node, arg.value);
              }
              if (arg.type === 'TemplateLiteral') {
                for (const quasi of arg.quasis) {
                  checkStringValue(node, quasi.value.raw);
                }
              }
            }
          }
        }
      },
    };
  },
};
