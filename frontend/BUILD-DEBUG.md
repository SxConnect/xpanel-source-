# 🐛 Frontend Build Debug

## Problema

O build do frontend está falhando no Docker com `exit code: 1`, mas o erro real do Vite não está sendo mostrado nos logs do GitHub Actions.

## Arquivos Corrigidos

Já foram corrigidos os seguintes problemas:

- ✅ `tsconfig.json` - estava corrompido (binário)
- ✅ `lib/utils.ts` - estava corrompido
- ✅ `pages/DNS.tsx` - estava corrompido
- ✅ `pages/Docker.tsx` - estava corrompido
- ✅ `pages/Email.tsx` - estava corrompido
- ✅ `store/authStore.ts` - estava corrompido
- ✅ `types/index.ts` - estava corrompido
- ✅ `App.tsx` - removido `initAuth()` inexistente
- ✅ `.dockerignore` - não exclui mais `package-lock.json`

## Como Testar Localmente

### Opção 1: Build direto (requer Node.js 20+)

```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

Se funcionar localmente mas falhar no Docker, o problema é específico do ambiente Alpine Linux.

### Opção 2: Build no Docker (teste)

```bash
cd frontend
docker build -f Dockerfile.test -t xpanel-frontend-test .
```

Este Dockerfile de teste não falha se o build der erro, apenas mostra o resultado.

### Opção 3: Build no Docker (produção)

```bash
cd frontend
docker build -t xpanel-frontend .
```

## Possíveis Causas

1. **Dependência nativa faltando no Alpine** - Algumas dependências npm precisam de bibliotecas do sistema
2. **Erro de sintaxe TypeScript** - Que só aparece no build de produção
3. **Path aliases (@/)** - Podem não estar resolvendo corretamente
4. **Memória insuficiente** - Vite pode precisar de mais memória
5. **Problema com ESLint** - O eslint.config.js pode ter problemas

## Próximos Passos

1. Testar build localmente para ver o erro real
2. Se funcionar localmente, o problema é o ambiente Docker
3. Se falhar localmente, o erro será visível e poderemos corrigir

## Status Atual

- Backend: ✅ Buildando e publicando com sucesso
- Frontend: ❌ Build falhando (desabilitado temporariamente no CI/CD)
