import type postgres from 'postgres';

/**
 * The context object that is passed to each route handler.
 */
export interface RouteContext {
  sql: postgres.Sql;

  /**
   * Limits are never changed, thus we can cache the result of the limit query.
   */
  limit_cache: { [clientId: number]: number };
}

export type Callback<T, R = void> = (err: string | null, result?: T) => R;

export interface DbClient {
  id: number;
  name: string;
  balance: number;
  limit: number;
}

export interface DbTransaction {
  id: number;
  client_id: number;
  value: number;
  type: string;
  description: string;
  performed_at: Date;
}

export type ITransacaoBody = {
  valor: number;
  tipo: 'c' | 'd';
  descricao: string;
};
