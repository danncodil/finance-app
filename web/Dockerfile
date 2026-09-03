# ══════════════════════════════════════════════════════════════
# ESTÁGIO 1 — Build (Node.js)
# Instala dependências e gera os arquivos estáticos com Vite.
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# ── Cache de dependências ────────────────────────────────────
# Copia apenas os arquivos de manifesto primeiro para que o
# Docker faça cache do npm ci (a etapa mais lenta).
COPY package.json package-lock.json* ./
RUN npm ci

# ── Build de produção ────────────────────────────────────────
COPY . .

# Em produção, as chamadas de API usam caminho relativo /api/v1
# porque o Nginx faz o proxy reverso para o backend.
ENV VITE_API_URL=/api/v1

RUN npm run build

# ══════════════════════════════════════════════════════════════
# ESTÁGIO 2 — Servidor Web (Nginx Alpine ~25MB)
# Serve apenas os arquivos estáticos do /dist gerado acima.
# ══════════════════════════════════════════════════════════════
FROM nginx:alpine

# Remove o conteúdo padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos de build do Vite para a pasta pública
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a nossa configuração do Nginx (SPA + Proxy Reverso)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
