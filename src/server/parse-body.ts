import type Ajv from 'ajv';
import type http from 'http';
import secureJson from 'secure-json-parse';
import { error } from '../util/log.js';
import type { Callback } from '../schemas/types.js';

const SECURE_JSON_OPTIONS = { protoAction: 'error', constructorAction: 'error' } as const;

/**
 * Adapted from fastify's `rawBody` implementation
 *
 * @see https://github.com/fastify/fastify/blob/f4b9a2a848da3620697d4bd8731fe6dc14f60e42/lib/contentTypeParser.js#L205
 */
export function parseRequestBody<T>(
  request: http.IncomingMessage,
  parser: Ajv.ValidateFunction<T>,
  done: Callback<T>
) {
  if (request.headers['content-type'] !== 'application/json') {
    error('Content-Type is not application/json');
    return done('Content-Type is not application/json');
  }

  let receivedLength = 0;
  let body = '';

  request.setEncoding('utf8');

  request.on('data', onData);
  request.on('end', onEnd);
  request.on('error', onEnd);
  request.resume();

  function onData(chunk: string) {
    receivedLength += chunk.length;
    body += chunk;
  }

  function onEnd(err?: Error) {
    request.removeListener('data', onData);
    request.removeListener('end', onEnd);
    request.removeListener('error', onEnd);

    if (err !== undefined) {
      done(JSON.stringify(err));
    }

    receivedLength = Buffer.byteLength(body);

    return jsonBodyParser(body, parseSchema);
  }

  function parseSchema(err: string | null, parsedBody?: object) {
    if (err !== null) {
      return done(String(err) || 'Invalid JSON');
    }

    if (!parser(parsedBody)) {
      error('Invalid JSON:', parser.errors);
      return done(
        parser.errors
          ?.map((e) => `${e.schemaPath} ${e.message || 'Invalid JSON'}`)
          .join(', ') || 'Invalid JSON'
      );
    }

    return done(null, parsedBody);
  }
}

/**
 * Adapted from fastify's default json parser
 *
 * @see https://github.com/fastify/fastify/blob/f4b9a2a848da3620697d4bd8731fe6dc14f60e42/lib/contentTypeParser.js#L290
 */
export function jsonBodyParser<T>(body: string, done: Callback<T>) {
  if (body === '' || body == null || (Buffer.isBuffer(body) && body.length === 0)) {
    return done('Request body is empty');
  }

  try {
    return done(null, secureJson.parse(body, null, SECURE_JSON_OPTIONS));
  } catch (err) {
    error(err);
    return done(String(err) || 'Invalid JSON');
  }
}
