# Assistente IA Financeiro

Aplicação de gestão financeira com backend Rust/Axum/PostgreSQL e frontend React/Vite. As transações, categorias, metas e relatórios são separados entre os perfis Pessoal (PF) e Empresarial (PJ).

## Ativar o assistente de IA

O assistente usa o Gemini 3.1 Flash-Lite pelo backend. O modelo tem cota gratuita, sujeita aos limites do projeto no Google AI Studio. O modo gratuito pode usar o conteúdo para melhorar produtos do Google; evite dados pessoais ou sensíveis nas descrições e revise os termos antes de disponibilizar para terceiros.

1. Crie uma chave em https://aistudio.google.com/apikey usando um projeto com cota gratuita. Não é necessário colocar a chave no frontend.
2. No Render, abra `assistente-ia-financeiro-api` → **Environment** e configure `GEMINI_API_KEY` com a chave. Nunca envie a chave pelo chat ou faça commit dela.
3. Configure `GEMINI_MODEL=gemini-3.1-flash-lite` (também é o padrão do backend) e salve com deploy.
4. No site, abra o assistente, desmarque **Registrar automaticamente** e teste `Comprei um bombom por 1 real hoje`. Confira a análise sem salvar um registro fictício.

Com **Registrar automaticamente** marcado, uma movimentação única com valor, data e tipo válidos é salva ao enviar. A categoria é escolhida entre as categorias do usuário e do perfil ativo; se a IA não encontrar uma adequada, cria uma categoria neutra (`Outras despesas` ou `Outras receitas`) no perfil correto antes de salvar. Com o modo desmarcado, a tela pede revisão e não cria nem salva nada. Projetos só são vinculados quando mencionados e pertencentes ao usuário. Frases ambíguas pedem esclarecimento. Parcelas, assinaturas, transferências e várias movimentações na mesma frase não são registradas automaticamente nesta versão.

Erros de configuração, modelo indisponível, cota esgotada e falhas de conexão têm mensagens distintas. O assistente não repete automaticamente o salvamento após uma falha de rede: confira a tela Lançamentos antes de reenviar.

Preços e limites: https://ai.google.dev/gemini-api/docs/pricing e https://ai.google.dev/gemini-api/docs/rate-limits. O serviço não garante uso gratuito ilimitado.

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
