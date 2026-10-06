import sanitizeHtml from 'sanitize-html';

/**
 * Allow only the markup produced by the blog and lesson editors.
 *
 * Rich text is stored as HTML, so treating an admin account as the only
 * security boundary would leave public pages open to stored XSS if content
 * is imported, an account is compromised, or old data contains unsafe
 * markup. This shared allow-list is applied both when saving and rendering:
 * saving keeps new records clean, while rendering protects existing data.
 */
const OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 's', 'u', 'code', 'pre',
    'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    p: ['class'],
    pre: ['class'],
    ol: ['start'],
    li: ['value'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedClasses: {
    p: ['callout', 'callout-info', 'callout-warning', 'callout-tip'],
    pre: ['lesson-code-block'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    // Links opened in a new tab must not receive a reference to this page.
    a: (tagName, attributes) => ({
      tagName,
      attribs: attributes.target === '_blank'
        ? { ...attributes, rel: 'noopener noreferrer' }
        : attributes,
    }),
  },
};

export function sanitizeRichHtml(value) {
  return sanitizeHtml(String(value || ''), OPTIONS);
}
