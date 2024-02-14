import type http from 'http';
import type { RouteContext } from '../types.js';

export function getTransacoes(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: { userId?: string },
  store: RouteContext
) {
  res.end(JSON.stringify(params));
}
