import type { ThemeRegistration } from 'shiki';

// Syntax colours are CSS custom properties (--docs-code-*) defined per theme in
// src/styles/color-roles.css, so code follows the theme palette and its contrast is
// checked with the other colour roles. One registration serves both themes.
const role = (name: string) => `var(--docs-code-${name})`;

export const codeTheme: ThemeRegistration = {
  name: 'material-docs',
  type: 'light',
  colors: {
    'editor.foreground': role('text'),
    'editor.background': 'var(--md-sys-color-surface-container-low)',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment', 'string.comment', 'string.quoted.docstring.multi', 'string.quoted.docstring.multi punctuation.definition.string'], settings: { foreground: role('comment'), fontStyle: 'italic' } },
    { scope: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier', 'keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.word', 'keyword.operator.logical.python', 'punctuation.definition.keyword'], settings: { foreground: role('keyword') } },
    { scope: ['keyword.operator', 'punctuation', 'meta.brace', 'punctuation.separator.key-value'], settings: { foreground: role('punctuation') } },
    { scope: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string', 'markup.inline.raw', 'markup.fenced_code'], settings: { foreground: role('string') } },
    // Markdown/MDX emphasis, link and expression markers are scoped as strings; show them as punctuation.
    { scope: ['string.other.strong', 'string.other.emphasis', 'string.other.strikethrough', 'string.other.begin.link', 'string.other.begin.image', 'string.other.begin.mdx', 'string.other.end.mdx', 'string.other.begin.footnote', 'string.other.end.footnote', 'string.other.begin.destination', 'string.other.end.destination', 'string.other.begin.expression'], settings: { foreground: role('punctuation') } },
    { scope: ['constant', 'constant.numeric', 'constant.language', 'constant.character', 'constant.other', 'support.constant', 'variable.other.constant', 'variable.language', 'variable.other.enummember', 'string.regexp', 'constant.character.escape', 'keyword.other.unit', 'punctuation.definition.constant'], settings: { foreground: role('constant') } },
    { scope: ['entity.name.type', 'entity.name.class', 'entity.name.namespace', 'entity.other.inherited-class', 'support.type', 'support.class', 'storage.type.primitive'], settings: { foreground: role('constant') } },
    { scope: ['support.type.property-name', 'meta.object-literal.key', 'entity.name.tag.yaml', 'support.type.property-name.json'], settings: { foreground: role('text') } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function', 'meta.function-call.generic', 'variable.function'], settings: { foreground: role('function') } },
    { scope: ['entity.name.tag', 'support.class.component', 'punctuation.definition.tag', 'meta.selector entity.other.attribute-name'], settings: { foreground: role('function') } },
    { scope: ['entity.other.attribute-name', 'variable.parameter', 'meta.parameters variable'], settings: { foreground: role('parameter') } },
    { scope: ['variable', 'variable.other.readwrite', 'meta.definition.variable', 'variable.other.property', 'variable.other.object'], settings: { foreground: role('text') } },
    { scope: ['markup.heading', 'markup.heading entity.name', 'markup.bold'], settings: { foreground: role('keyword'), fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { scope: ['markup.underline.link', 'string.other.link'], settings: { foreground: role('function'), fontStyle: 'underline' } },
    { scope: ['markup.inserted', 'punctuation.definition.inserted'], settings: { foreground: role('inserted') } },
    { scope: ['markup.deleted', 'punctuation.definition.deleted', 'invalid', 'invalid.illegal', 'invalid.broken'], settings: { foreground: role('deleted') } },
    { scope: ['markup.changed', 'punctuation.definition.changed'], settings: { foreground: role('changed') } },
  ],
};

// Fumadocs highlights with a light/dark pair; the roles switch with the theme class.
export const codeThemes = { light: codeTheme, dark: codeTheme };
