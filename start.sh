#!/bin/bash
set -e

echo "=== 1. Iniciando Banco de Dados ==="
sudo /etc/init.d/postgresql start || true

echo "=== 2. Configurando Banco de Dados (ignorar se já existir) ==="
# Configura a senha do postgres e cria o banco, ignorando erros se já existirem
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" || true
sudo -u postgres psql -c "CREATE DATABASE gestao_financeira;" || true

echo "=== 3. Carregando ferramentas (Rust e Node) ==="
source ~/.nvm/nvm.sh
source ~/.cargo/env

echo "=== 4. Iniciando Frontend (React) em Background ==="
cd web
npm install
npm run dev &
cd ..

echo "=== 5. Iniciando Backend (Rust) em Background ==="
export HOST=0.0.0.0
cargo run &

echo ""
echo "🚀 TUDO PRONTO! O sistema está rodando."
echo "🔗 Acesse agora no seu navegador: http://localhost:5173"
echo " (Para desligar os servidores depois, basta fechar este terminal ou usar CTRL+C)"
wait
