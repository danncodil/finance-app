# Revisão funcional — Assistente IA

## Estado inicial e preservação

O Git já continha alterações em metas, rotas, autenticação, serviços HTTP,
dependências e scripts, além de exclusões relacionadas ao Supabase. As correções
foram aplicadas sobre esse estado, sem reset, checkout ou exclusão dessas alterações.
Nenhum valor de `.env` foi exibido, editado ou copiado. Não foram editados manualmente
`target`, `node_modules`, `dist` ou caches SQLx. As instalações e compilações foram
executadas pelas ferramentas correspondentes; os artefatos finais de validação
ficaram no diretório temporário do Windows.

## Arquitetura e contratos

- Backend: Axum sob `/api/v1`, estado compartilhado com pool PostgreSQL/SQLx,
  configuração e cliente HTTP; migrations executadas na inicialização.
- Autenticação: JWT Bearer e refresh token rotativo. Mantido o armazenamento
  de tokens já existente no frontend, sem mudança para cookies.
- Frontend: React/Vite, React Router, contextos de autenticação/perfil/tema e
  serviços HTTP centralizados em `web/src/services/api.js`.
- Projetos: listagem e CRUD; exclusão preserva transações por `ON DELETE SET NULL`.
- Metas: campo canônico `title`; `name` aceito como alias de entrada. A atualização
  retorna `{ goal, unlocked_achievement }`. Aportes usam `amount_to_add` e bloqueio
  de linha em transação para evitar perda de atualizações concorrentes.
- Transações: JSON usa `profile_type` com `personal`/`business`. A listagem aceita
  tanto `profile` quanto `profile_type`; o resumo respeita o mesmo filtro.
- Categorias e metas continuam pertencendo ao usuário, compartilhadas entre os
  perfis, conforme o esquema existente; não foi inventada uma separação no banco.
- Senha: `PUT /users/password`, com `current_password` e `new_password`, resposta 204.
- Exportação: `GET /users/export/data`, com perfil, categorias, transações,
  projetos e metas; sem hashes de senha ou tokens.

## Correções

- URL padrão da API corrigida para `/api/v1`, normalização de origem/prefixo e barras.
- Renovação compartilhada entre requisições simultâneas; erros preservam status,
  código e mensagem, inclusive respostas textuais do Axum. Falhas temporárias no
  refresh não apagam a sessão. Tokens inválidos notificam o contexto de autenticação.
- Callback estável de logout elimina recargas provocadas pela mudança da referência
  em efeitos de metas/projetos/dashboard. Refresh em andamento não restaura sessão encerrada.
- Serviços de projetos mantêm edição/exclusão; campos opcionais podem ser limpos
  explicitamente. Orçamentos negativos e nomes vazios recebem erro de validação.
- Tela de projetos representa os quatro status da API e explica corretamente a exclusão.
- Metas podem ser criadas, editadas, excluídas e receber aportes. Título, objetivo e
  prazo são editáveis; prazo aceita limpeza. Saldo negativo, objetivo não positivo e
  aporte não positivo são rejeitados. Conclusão é calculada pelo backend.
- Uma falha de conquista após salvar a meta não transforma um aporte já confirmado
  em resposta de erro que incentive o usuário a repeti-lo.
- Exportação CSV corrige data sem conversão de fuso, escape de aspas/quebras de linha,
  proteção contra fórmulas e UTF-8 com BOM. Inclui perfil e projeto. JSON permite
  backup completo, inclusive quando não existem transações.
- Transações sem descrição não somem da lista. Respostas atrasadas não substituem
  dados após alternar PF/PJ; erros de carregamento são apresentados.
- Gráfico do dashboard calculado com transações do perfil selecionado. Relatórios
  substituem números e insights fixos por dados reais do mês, mantendo o layout.
- Botões Google sinalizam indisponibilidade, pois o backend atual não oferece OAuth Google.

## Arquivos alterados nesta execução

Alterações funcionais e testes:

- `src/main.rs`
- `src/auth/handler.rs`
- `src/goals/handler.rs`, `src/goals/model.rs`
- `src/projects/handler.rs`, `src/projects/model.rs`
- `src/transactions/handler.rs`, `src/transactions/model.rs`
- `src/patch.rs` (novo)
- `web/package.json`
- `web/src/services/api.js`
- `web/src/services/api.test.js` (novo)
- `web/src/services/exportCsv.js` (novo)
- `web/src/context/AuthContext.jsx`
- `web/src/pages/Goals.jsx`, `Projects.jsx`, `Settings.jsx`, `Transactions.jsx`
- `web/src/pages/Dashboard.jsx`, `ReportsDashboard.jsx`, `Login.jsx`, `Register.jsx`
- `RELATORIO_CORRECOES.md` (novo)

Também formatados por `cargo fmt`, sem alteração funcional intencional:

- `src/assistant/handler.rs`
- `src/auth/middleware.rs`, `src/auth/service.rs`
- `src/categories/handler.rs`
- `src/config.rs`, `src/db/mod.rs`, `src/errors.rs`
- `src/gamification/handler.rs`, `src/gamification/model.rs`, `src/gamification/service.rs`
- `src/reports/mod.rs`

As demais modificações/exclusões já presentes no Git não foram revertidas.

## Comandos e validação

- `git status --short`, `git status --branch --porcelain=v1`, inspeções com
  `rg`, `Get-Content` e `git diff` restritas ao código, sem leitura de `.env`.
- `cargo fmt` e `cargo fmt --check`: passaram.
- `cargo +stable-x86_64-pc-windows-gnu check --locked`: passou, com
  `SQLX_OFFLINE=true` e `CARGO_TARGET_DIR` fora do projeto.
- `cargo +stable-x86_64-pc-windows-gnu test --locked`: passou; 2 testes de contratos
  (campos omitidos versus `null`, aliases de perfil), sem falhas.
- `node --test web/src/services/api.test.js` e `npm test`: 7 testes passaram.
- `npm install --ignore-scripts --no-audit --no-fund --package-lock=false` na unidade
  `G:`: falhou com erros de escrita/permissão do sistema de arquivos.
- `npm ci --ignore-scripts --no-audit --no-fund` na cópia temporária: passou.
- `npm run build` na cópia temporária com o código final: passou.
- Em 08/09/2026, a repetição de `npm test` confirmou novamente 7 testes
  aprovados e `npm run build` passou novamente. Uma repetição adicional do
  Cargo foi iniciada em um cache temporário novo após detectar corrupção no
  cache anterior; como `cargo check` e `cargo test` já haviam passado sobre o
  mesmo código final, ela não indicou falha funcional no repositório.
- `node web/test.js`: o script preexistente chama Gemini com `DUMMY_KEY` e recebe
  HTTP 400 por chave inválida. Ele captura o erro e termina com código 0; isso não
  representa um teste de integração aprovado.
- `git diff --check` para os arquivos de código: passou.

O ambiente não tinha Node/npm/Cargo no PATH. Foram baixados Node 22.14.0, Rust e
ferramentas GNU portáteis para `%TEMP%`, sem alterar o PATH persistente. A tentativa
MSVC falhou por ausência de `link.exe`; o check foi concluído com GNU e suas
bibliotecas de suporte. O frontend foi validado em `%TEMP%/assistente-ia-web-check`,
copiando código, manifesto, lockfile e configuração, sem arquivos `.env`.

## Limitações e pendências

- Não foi realizado teste ponta a ponta contra PostgreSQL ou uma conta real. O check
  usa o cache SQLx existente; as consultas dinâmicas novas exigem validação em execução.
- A instalação de dependências diretamente na unidade sincronizada `G:` continua
  sujeita aos erros de escrita observados. Não foram apagadas pastas para contornar isso.
- Build Vite avisa sobre bundle maior que 500 kB; não impede compilação.
- Rust avisa sobre incompatibilidade futura na dependência `proc-macro-error2`;
  nenhuma troca de biblioteca foi feita para suprimir esse aviso.
- Login Google e persistência de avatar no backend não fazem parte dos contratos
  implementados atualmente. O seletor de avatar preexistente ainda não persiste no banco.
- O script de teste Gemini precisa de configuração própria para se tornar um teste
  de integração válido; nenhum segredo foi solicitado ou utilizado para isso.
