# LA Control

Sistema de gestão completo para profissionais de design de unhas.

## 🚀 Funcionalidades

- **Autenticação**: Login e cadastro com Supabase Auth
- **Estoque**: Cadastro de produtos, controle de quantidade e estoque mínimo
- **Entradas**: Registro de entradas de estoque com geração automática de despesas
- **Serviços**: Tipos de serviço com produtos vinculados
- **Atendimentos**: Registro de serviços com baixa automática de estoque
- **Financeiro**: Receitas e despesas automáticas, resumo mensal
- **Relatórios**: Exportação em PDF e Excel
- **PWA**: Instalável no celular com suporte offline parcial

## 📱 Tecnologias

- **Frontend**: React + Vite
- **Estilização**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, RLS)
- **PWA**: Vite PWA Plugin

## 🛠️ Instalação

### 1. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/schema.sql`
3. Copie a **URL** e **anon key** do projeto

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Iniciar Desenvolvimento

```bash
npm run dev
```

### 5. Build para Produção

```bash
npm run build
```

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
├── features/         # Funcionalidades por domínio
│   ├── auth/         # Autenticação
│   ├── estoque/      # Produtos e entradas
│   ├── servicos/     # Tipos de serviço e atendimentos
│   └── financeiro/   # Registros financeiros
├── lib/              # Configurações (Supabase)
├── pages/            # Páginas da aplicação
└── utils/            # Funções utilitárias
```

## 🗄️ Banco de Dados

### Tabelas

- `products` - Produtos do estoque
- `stock_entries` - Entradas de estoque
- `service_types` - Tipos de serviço
- `service_products` - Produtos por tipo de serviço
- `services` - Serviços realizados
- `financial_records` - Registros financeiros

### RLS (Row Level Security)

Todas as tabelas possuem políticas RLS que garantem que cada usuário só acessa seus próprios dados.

## 📄 Licença

MIT License - Veja o arquivo [LICENSE](LICENSE) para detalhes.
