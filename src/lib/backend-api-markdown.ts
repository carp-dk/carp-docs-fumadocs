import type { OpenAPIV3_2 } from 'fumadocs-openapi';
import type { SourcePage } from './source';

type Document = OpenAPIV3_2.Document;
type Schema = OpenAPIV3_2.SchemaObject | OpenAPIV3_2.ReferenceObject | boolean;

// Endpoint pages as Markdown, for the .md route, Copy Markdown, llms-full.txt and Ask AI: the
// operation, then the component schemas it uses. Kotlin types can reference long chains of
// schemas, so the list stops at maxSchemas and names the rest.
const maxSchemas = 25;

export function backendApiMarkdown(page: Extract<SourcePage, { type: 'openapi' }>) {
  const { bundled } = page.data.getSchema();
  const { operations = [] } = page.data.getOpenAPIPageProps();
  const out = [`# ${page.data.title} (${page.url})`];
  const schemas = new Set<string>();
  for (const { path, method } of operations) {
    const pathItem = bundled.paths?.[path];
    const operation = pathItem?.[method];
    if (operation) out.push(...operationMarkdown(bundled, path, method, { ...operation, parameters: [...pathItem.parameters ?? [], ...operation.parameters ?? []] }, schemas));
  }
  const names = [...schemas];
  if (names.length) out.push('## Schemas', ...names.slice(0, maxSchemas).map(name => `### ${name}\n\n${json(bundled.components?.schemas?.[name])}`));
  if (names.length > maxSchemas) out.push(`Also used: ${names.slice(maxSchemas).map(name => `\`${name}\``).join(', ')}.`);
  return out.join('\n\n');
}

function operationMarkdown(document: Document, path: string, method: string, operation: OpenAPIV3_2.OperationObject, schemas: Set<string>) {
  const out = [`\`${method.toUpperCase()} ${document.servers?.[0]?.url ?? ''}${path}\``];
  if (operation.deprecated) out.push('Deprecated.');
  if (operation.description) out.push(operation.description);
  const security = operation.security ?? document.security ?? [];
  const schemes = [...new Set(security.flatMap(requirement => Object.keys(requirement)))];
  const scopes = [...new Set(security.flatMap(requirement => Object.values(requirement).flat()))];
  if (schemes.length) out.push(`Authorization: ${schemes.map(name => schemeMarkdown(name, document.components?.securitySchemes?.[name])).join(' or ')}.${scopes.length ? ` Scopes: \`${scopes.join(' ')}\`.` : ''}`);
  else if (operation.security) out.push('Authorization: none.');

  const parameters = operation.parameters?.map(item => resolve<OpenAPIV3_2.ParameterObject>(document, item)).filter(item => item !== undefined) ?? [];
  if (parameters.length) out.push('## Parameters', table(['Name', 'In', 'Type', 'Required', 'Description'], parameters.map(item => [
    `\`${item.name}\``, item.in ?? '—', typeName(item.schema, schemas), item.required ? 'Yes' : 'No', cell(item.description),
  ])));

  // Schemas written out in the operation (such as a multipart upload's fields) have no name to
  // look up, so they follow their table in full.
  const inline: string[] = [];
  const body = resolve<OpenAPIV3_2.RequestBodyObject>(document, operation.requestBody);
  if (body?.content) {
    out.push('## Request body');
    if (body.description) out.push(body.description);
    out.push(table(['Content type', 'Schema', 'Required'], Object.entries(body.content).map(([type, content]) => {
      const schema = resolve<OpenAPIV3_2.MediaTypeObject>(document, content)?.schema;
      if (isStructured(schema)) inline.push(`The \`${type}\` schema:\n\n${json(schema)}`);
      return [`\`${type}\``, typeName(schema, schemas), body.required ? 'Yes' : 'No'];
    })), ...inline.splice(0));
  }

  const responses = Object.entries(operation.responses ?? {});
  if (responses.length) out.push('## Responses', table(['Status', 'Description', 'Content'], responses.map(([status, item]) => {
    const response = resolve<OpenAPIV3_2.ResponseObject>(document, item);
    const content = Object.entries(response?.content ?? {}).map(([type, value]) => {
      const schema = resolve<OpenAPIV3_2.MediaTypeObject>(document, value)?.schema;
      if (isStructured(schema)) inline.push(`The ${status} \`${type}\` schema:\n\n${json(schema)}`);
      return `\`${type}\`: ${typeName(schema, schemas)}`;
    });
    return [status, cell(response?.description), content.join('<br/>') || '—'];
  })), ...inline.splice(0));

  // The schemas the operation uses, and the schemas those use.
  for (const parameter of parameters) collectSchemas(parameter.schema, schemas);
  collectSchemas(body?.content, schemas);
  for (const [, item] of responses) collectSchemas(resolve<OpenAPIV3_2.ResponseObject>(document, item)?.content, schemas);
  for (const name of schemas) collectSchemas(document.components?.schemas?.[name], schemas);
  return out;
}

function schemeMarkdown(name: string, value: OpenAPIV3_2.SecuritySchemeObject | OpenAPIV3_2.ReferenceObject | undefined) {
  if (!value || '$ref' in value) return `\`${name}\``;
  if (value.type === 'oauth2') {
    const flows = Object.entries(value.flows ?? {}).map(([flow, config]) => `${flow} flow${'tokenUrl' in config && config.tokenUrl ? ` with the token URL ${config.tokenUrl}` : ''}`);
    return `\`${name}\`, OAuth 2.0${flows.length ? ` ${flows.join(' or ')}` : ''}`;
  }
  if (value.type === 'http') return `\`${name}\` (HTTP ${value.scheme})`;
  if (value.type === 'apiKey') return `\`${name}\` (API key in ${value.in} \`${value.name}\`)`;
  return `\`${name}\` (${value.type})`;
}

function resolve<T>(document: Document, value: T | OpenAPIV3_2.ReferenceObject | undefined): T | undefined {
  if (!value || typeof value !== 'object' || !('$ref' in value)) return value;
  const target = value.$ref.replace(/^#\//, '').split('/').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], document);
  return resolve(document, target as T | OpenAPIV3_2.ReferenceObject | undefined);
}

const refName = (ref: string) => ref.startsWith('#/components/schemas/') ? ref.slice('#/components/schemas/'.length) : undefined;

/** A short type for tables: a schema name, `string (date-time)`, `Item[]` or a union. */
function typeName(schema: Schema | undefined, schemas: Set<string>): string {
  if (schema === undefined || schema === true) return 'any';
  if (schema === false) return 'never';
  if ('$ref' in schema) {
    const name = refName(schema.$ref);
    if (name) schemas.add(name);
    return `\`${name ?? schema.$ref}\``;
  }
  const union = schema.oneOf ?? schema.anyOf;
  if (union) return [...new Set(union.map(item => typeName(item, schemas)))].join(' or ');
  if (schema.allOf) return schema.allOf.map(item => typeName(item, schemas)).join(' and ');
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (types.includes('array') && 'items' in schema) return `${typeName(schema.items, schemas)}[]`;
  const name = types.join(' or ') || 'object';
  return schema.format ? `${name} (${schema.format})` : name;
}

/** An inline schema with properties of its own, which typeName() reduces to "object". */
function isStructured(schema: Schema | undefined): boolean {
  if (!schema || typeof schema !== 'object' || '$ref' in schema) return false;
  if (schema.properties || (schema.additionalProperties && typeof schema.additionalProperties === 'object')) return true;
  return 'items' in schema && isStructured(schema.items as Schema | undefined);
}

function collectSchemas(node: unknown, schemas: Set<string>) {
  if (Array.isArray(node)) for (const item of node) collectSchemas(item, schemas);
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const name = key === '$ref' && typeof value === 'string' ? refName(value) : undefined;
      if (name) schemas.add(name);
      else collectSchemas(value, schemas);
    }
  }
}

function table(header: string[], rows: string[][]) {
  return [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`, ...rows.map(row => `| ${row.join(' | ')} |`)].join('\n');
}

const cell = (text?: string) => text?.trim().replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|') || '—';

const json = (value: unknown) => `\`\`\`json\n${JSON.stringify(value ?? null, null, 2)}\n\`\`\``;
