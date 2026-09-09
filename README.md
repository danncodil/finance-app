# Assistente IA Financeiro

Aplicação de gestão financeira com backend Rust/Axum/PostgreSQL e frontend React/Vite. As transações, categorias, metas e relatórios são separados entre os perfis Pessoal (PF) e Empresarial (PJ).

## Pré-requisitos

- Rust estável e PostgreSQL 16 para execução local; ou Docker Compose.
- Node.js 22 e npm para o frontend.

## Configuração local

1. Copie `.env.example` para `.env` e informe uma `DATABASE_URL` local e um `JWT_SECRET` forte.
2. Instale as dependências do frontend com `npm ci` dentro de `web`.
3. Inicie o backend com `cargo run` na raiz e o frontend com `npm run dev` dentro de `web`.

O backend executa as migrations automaticamente ao iniciar. Não versione arquivos `.env` nem chaves de API.

## Docker Compose

Defina variáveis temporárias ou em um arquivo `.env` local antes de iniciar:

```bash
POSTGRES_PASSWORD=uma_senha_local_forte
JWT_SECRET=uma_chave_aleatoria_com_pelo_menos_32_caracteres
docker compose up --build
```

O Compose usa PostgreSQL, backend na porta `3333` e frontend na porta `80`.

## Validação

```bash
cargo fmt --check
cargo check --locked
cargo test --locked
cargo clippy --locked -- -D warnings

cd web
npm test
npm run build
```

O pipeline em `.github/workflows/ci.yml` executa essas verificações em pull requests e na branch `main`.
