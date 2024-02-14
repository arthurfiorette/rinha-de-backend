-- Alguns comandos para simplificar o banco
SET client_encoding = 'UTF8';
SET default_tablespace = '';
SET default_table_access_method = heap;
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET row_security = off;
SET client_min_messages = warning;

CREATE UNLOGGED TABLE client (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    balance INTEGER NOT NULL,
    "limit" INTEGER NOT NULL
);

CREATE UNLOGGED TABLE transaction (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    type CHAR(1) NOT NULL,
    description VARCHAR(10) NOT NULL,
    performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_client_transaction_id
        FOREIGN KEY (client_id) REFERENCES client(id)
);

CREATE INDEX ix_transaction_client_id ON transaction
(
    client_id ASC
);

DO $$
BEGIN
    INSERT INTO client (name, "limit", balance)
    VALUES
        -- Completely not random names btw XD
        ('Arthur', 100000, 0),
        ('Bruno', 80000, 0),
        ('Cabral', 1000000, 0),
        ('Wellington', 10000000, 0),
        ('Sena', 500000, 0);
END;
$$;

-- Função para debitar uma transação
CREATE OR REPLACE FUNCTION debit(
    tx_client_id INT,  -- ID do cliente
    tx_value INT,      -- Valor da transação
    tx_description VARCHAR(10)  -- Descrição da transação
)
RETURNS TABLE (
    new_balance INT,  -- Novo saldo do cliente
    error BOOL,       -- Indica se houve erro na transação
    message VARCHAR(20)  -- Mensagem de retorno
)
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance int;  -- Saldo atual do cliente
    current_limit int;    -- Limite de saldo do cliente
BEGIN
    -- Obtém um lock exclusivo no cliente para garantir a consistência dos dados durante a transação
    PERFORM pg_advisory_xact_lock(tx_client_id);
    
    -- Obtém o limite atual e o saldo atual do cliente
    SELECT 
        c."limit",
        COALESCE(c.balance, 0)
    INTO
        current_limit,
        current_balance
    FROM client c
    WHERE c.id = tx_client_id;

    -- Verifica se o saldo disponível é suficiente para realizar a transação
    IF current_balance - tx_value >= current_limit * -1 THEN
        -- Insere uma nova entrada na tabela de transações
        INSERT INTO transaction
            VALUES(DEFAULT, tx_client_id, tx_value, 'd', tx_description, NOW());
        
        -- Atualiza o saldo do cliente após o débito
        UPDATE client
        SET balance = balance - tx_value
        WHERE id = tx_client_id;

        -- Retorna o novo saldo, indicando que a transação foi bem-sucedida
        RETURN QUERY
            SELECT
                balance,
                FALSE,
                'ok'::VARCHAR(20)
            FROM client
            WHERE id = tx_client_id;
    ELSE
        -- Se o saldo for insuficiente, retorna uma mensagem de erro
        RETURN QUERY
            SELECT
                balance,
                TRUE,
                'insufficient balance'::VARCHAR(20)
            FROM client
            WHERE id = tx_client_id;
    END IF;
END;
$$;

-- Função para creditar uma transação
CREATE OR REPLACE FUNCTION credit(
    tx_client_id INT,  -- ID do cliente
    tx_value INT,      -- Valor da transação
    tx_description VARCHAR(10)  -- Descrição da transação
)
RETURNS TABLE (
    new_balance INT,  -- Novo saldo do cliente
    error BOOL,       -- Indica se houve erro na transação
    message VARCHAR(20)  -- Mensagem de retorno
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Obtém um lock exclusivo no cliente para garantir a consistência dos dados durante a transação
    PERFORM pg_advisory_xact_lock(tx_client_id);

    -- Insere uma nova entrada na tabela de transações para representar o crédito
    INSERT INTO transaction
        VALUES(DEFAULT, tx_client_id, tx_value, 'c', tx_description, NOW());

    -- Atualiza o saldo do cliente após o crédito e retorna o novo saldo
    RETURN QUERY
        UPDATE client
        SET balance = balance + tx_value
        WHERE id = tx_client_id
        RETURNING balance, FALSE, 'ok'::VARCHAR(20);
END;
$$;
