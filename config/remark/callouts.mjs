// config/remark/callouts.mjs

/**
 * A remark plugin that transforms blockquotes with specific markers
 * into Callout component usage
 */

import { visit } from 'unist-util-visit';

export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node, index, parent) => {
      const firstChild = node.children?.[0];

      if (firstChild && firstChild.type === 'paragraph') {
        const textNode = firstChild.children?.[0];

        if (textNode && textNode.type === 'text') {
          const text = textNode.value;
          // Check for callout pattern: "> [type]: [content]"
          const typeMatch = text.match(/^(>|!|i|tip|note|warning|danger|info):\s+(.*)/i);

          if (typeMatch) {
            const [, type, content] = typeMatch;

            // Map marker to callout type
            let calloutType = type.toLowerCase();
            switch (calloutType) {
              case '>': calloutType = 'note'; break;
              case '!': calloutType = 'warning'; break;
              case 'i': calloutType = 'info'; break;
            }

            // Remove the first paragraph that contains the marker
            firstChild.children.shift();

            // Add the content as a new paragraph
            firstChild.children.unshift({
              type: 'text',
              value: content,
            });

            // Convert to Callout component
            parent.children[index] = {
              type: 'html',
              value: `<Callout type="${calloutType}">\n${serializeChildren(node.children)}\n</Callout>`
            };
          }
        }
      }
    });
  };
}

// Helper function to serialize children nodes back to markdown
function serializeChildren(children) {
  if (!children || children.length === 0) return '';

  // Simple serialization for common node types
  return children.map(child => {
    if (child.type === 'paragraph') {
      return `<p>${serializeChildren(child.children)}</p>`;
    }
    if (child.type === 'text') {
      return child.value;
    }
    if (child.type === 'strong') {
      return `<strong>${serializeChildren(child.children)}</strong>`;
    }
    if (child.type === 'emphasis') {
      return `<em>${serializeChildren(child.children)}</em>`;
    }
    if (child.type === 'link') {
      return `<a href="${child.url}">${serializeChildren(child.children)}</a>`;
    }
    return '';
  }).join('\n');
}
