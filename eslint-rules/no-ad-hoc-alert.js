/**
 * ESLint rule: no-ad-hoc-alert
 *
 * Flags ad-hoc alert-like divs that should use the <Alert> component.
 * Detects inline style={{ backgroundColor: 'hsl(var(--warning|destructive|info|success ...))' }}
 * on block-level elements that look like alert banners.
 *
 * Excludes:
 *   - Elements with rounded-full (icon circles, dots, badges)
 *   - Elements with data-slot="alert" or inside Alert component
 *   - --primary token (used for branding everywhere, not just alerts)
 *   - <span> elements (inline indicators, not banners)
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow ad-hoc alert-like divs with status-colored inline backgrounds. Use <Alert> component instead.',
    },
    messages: {
      useAlertComponent:
        'Use the <Alert> component instead of ad-hoc styled divs for status messages. Import from \'@/Components/ui/alert\'.',
    },
    schema: [],
  },

  create(context) {
    // Only status tokens that indicate alert intent (not --primary which is used broadly)
    const statusTokenPattern =
      /hsl\(var\(--(?:warning|destructive|info|success)\b/;

    function getClassNameValue(node) {
      const classAttr = node.attributes.find(
        (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'className'
      );
      if (!classAttr || !classAttr.value) return '';

      // String literal
      if (classAttr.value.type === 'Literal') return classAttr.value.value || '';

      // Expression container with string
      if (
        classAttr.value.type === 'JSXExpressionContainer' &&
        classAttr.value.expression.type === 'Literal'
      ) {
        return classAttr.value.expression.value || '';
      }

      // cn() or template literal — extract string parts
      if (classAttr.value.type === 'JSXExpressionContainer') {
        const expr = classAttr.value.expression;

        // Template literal
        if (expr.type === 'TemplateLiteral') {
          return expr.quasis.map((q) => q.value.raw).join(' ');
        }

        // cn("...", "...")
        if (expr.type === 'CallExpression') {
          return expr.arguments
            .filter((a) => a.type === 'Literal' && typeof a.value === 'string')
            .map((a) => a.value)
            .join(' ');
        }
      }

      return '';
    }

    function hasDataSlotAlert(node) {
      if (!node.openingElement || !node.openingElement.attributes) return false;
      return node.openingElement.attributes.some(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name.name === 'data-slot' &&
          attr.value &&
          attr.value.type === 'Literal' &&
          attr.value.value === 'alert'
      );
    }

    function isInsideAlertComponent(node) {
      let current = node.parent;
      while (current) {
        if (current.type === 'JSXElement' && hasDataSlotAlert(current)) {
          return true;
        }
        current = current.parent;
      }
      return false;
    }

    return {
      JSXOpeningElement(node) {
        // Only check block-level native elements (div, section), not span/components
        if (node.name.type !== 'JSXIdentifier') return;
        const tagName = node.name.name;
        if (tagName !== 'div' && tagName !== 'section') return;

        // Skip if this element or an ancestor has data-slot="alert"
        if (isInsideAlertComponent(node.parent)) return;

        // Skip icon circles and dots (rounded-full elements are never alerts)
        const classValue = getClassNameValue(node);
        if (classValue.includes('rounded-full')) return;

        // Look for inline style prop with backgroundColor containing status tokens
        const styleAttr = node.attributes.find(
          (attr) =>
            attr.type === 'JSXAttribute' && attr.name.name === 'style'
        );

        if (!styleAttr || !styleAttr.value) return;

        // style={{ backgroundColor: '...' }}
        const expr =
          styleAttr.value.type === 'JSXExpressionContainer'
            ? styleAttr.value.expression
            : null;

        if (!expr || expr.type !== 'ObjectExpression') return;

        const bgProp = expr.properties.find(
          (prop) =>
            prop.type === 'Property' &&
            prop.key &&
            (prop.key.name === 'backgroundColor' ||
              prop.key.value === 'backgroundColor')
        );

        if (!bgProp || !bgProp.value) return;

        // Check if the value is a string literal with a status token
        if (
          bgProp.value.type === 'Literal' &&
          typeof bgProp.value.value === 'string' &&
          statusTokenPattern.test(bgProp.value.value)
        ) {
          context.report({
            node,
            messageId: 'useAlertComponent',
          });
        }

        // Check template literals: `hsl(var(--warning) / 0.1)`
        if (bgProp.value.type === 'TemplateLiteral') {
          for (const quasi of bgProp.value.quasis) {
            if (statusTokenPattern.test(quasi.value.raw)) {
              context.report({
                node,
                messageId: 'useAlertComponent',
              });
              break;
            }
          }
        }
      },
    };
  },
};
