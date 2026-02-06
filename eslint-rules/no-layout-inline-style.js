/**
 * ESLint rule: no-layout-inline-style
 *
 * Flags inline style={{}} props that contain layout properties.
 * These should use Tailwind classes or Stack components instead.
 *
 * Flagged properties:
 *   display, flexDirection, gap, padding, paddingTop/Right/Bottom/Left,
 *   margin, marginTop/Right/Bottom/Left, width, height, minWidth, maxWidth,
 *   minHeight, maxHeight, borderRadius, gridTemplateColumns, gridTemplateRows,
 *   alignItems, justifyContent, flexGrow, flexShrink, overflow
 *
 * Allowed properties (not flagged):
 *   color, backgroundColor, borderColor, background, opacity,
 *   backgroundImage, boxShadow, transform, transition, animation,
 *   cursor, pointerEvents, zIndex, position, top, left, right, bottom,
 *   whiteSpace, textOverflow, letterSpacing, fontSize, lineHeight, fontWeight
 */

const LAYOUT_PROPERTIES = new Set([
  'display',
  'flexDirection',
  'gap',
  'rowGap',
  'columnGap',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'borderRadius',
  'gridTemplateColumns',
  'gridTemplateRows',
  'alignItems',
  'alignSelf',
  'justifyContent',
  'justifySelf',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'flexWrap',
  'overflow',
  'overflowX',
  'overflowY',
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow inline style for layout properties — use Tailwind classes or Stack components',
    },
    messages: {
      noLayoutStyle:
        'Avoid inline style "{{property}}" for layout. Use Tailwind classes (e.g., flex, gap-6, p-4, w-10) or <VStack>/<HStack> components instead.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'style') return;

        const value = node.value;
        if (!value || value.type !== 'JSXExpressionContainer') return;

        const expr = value.expression;
        if (expr.type !== 'ObjectExpression') return;

        for (const prop of expr.properties) {
          if (prop.type !== 'Property') continue;

          const key =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : prop.key.type === 'Literal'
                ? String(prop.key.value)
                : null;

          if (key && LAYOUT_PROPERTIES.has(key)) {
            context.report({
              node: prop,
              messageId: 'noLayoutStyle',
              data: { property: key },
            });
          }
        }
      },
    };
  },
};
