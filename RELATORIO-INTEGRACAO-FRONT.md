# Relatório de Integração – ManualiFront ↔ APIManuali

**Data:** 27/11/2026  
**Backend:** APIManuali (`C:\Users\geral\Desktop\Projetos\FACULDADE\MANUALI\APIManuali`)  
**Front alvo:** ManualiFront (`C:\Users\geral\Desktop\Projetos\FACULDADE\MANUALI\ManualiFront\manuali-front`)  
**Branch backend:** `dio`

## 1. Resumo

O backend APIManuali foi preparado com uma camada de compatibilidade em `/api/v1` (arquivo `src/routes/compat.js`) e endpoints de IA em `/api/recomendacoes/ia/*`. Para o ManualiFront consumir o backend real, são necessárias as mudanças abaixo.

> **Status:** o backend precisa ser **reiniciado** após alterações em `compat.js`/`.env` para carregar as rotas.

---

## 2. Configuração de ambiente (obrigatória)

No ManualiFront, configurar a URL base da API para apontar para o APIManuali:

```env
# ManualiFront/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Observação: `services/api.ts` já possui fallback para `http://localhost:3001/api/v1`, mas o `.env.local` deve ser definido explicitamente para evitar apontar para outro backend.

**Antes (`services/api.ts`):** já estava correto como default, mas confirmar ambiente:
```ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  headers: { "Content-Type": "application/json" },
});
export default api;
```

---

## 3. Correção de build (já aplicada na cópia local)

### `services/productsService.ts` – import do cliente API

**Erro:** `Export api doesn't exist in target module` (Turbopack/Next.js).  
**Causa:** `services/api.ts` exporta `api` como **default**, mas o service importava como named export.

**Antes:**
```ts
import { api } from "./api";
import type { ProductApiData, ProductSearchParams } from "@/types/product";
```

**Depois:**
```ts
import api from "./api";
import type { ProductApiData, ProductSearchParams } from "@/types/product";
```

---

## 4. Incompatibilidades de contrato identificadas (ação necessária)

O `productsService.ts` atual do ManualiFront chama rotas em inglês (`/products`), enquanto a compatibilidade adicionada no backend expõe rotas em português (`/produtos`). É necessário alinhar **front ou back**. Recomenda-se o backend adicionar aliases em inglês **ou** o front ajustar os paths.

### 4.1. Mapeamento de endpoints

| Front chama (atual) | Backend compat atual | Status | Ação recomendada |
|---|---|---|---|
| `GET /products` | `GET /produtos` | **Mismatch de path** | Alterar front para `/produtos` **ou** backend criar alias `/products` |
| `GET /products/:id` | `GET /produtos/:id` | **Mismatch de path** | Alterar front para `/produtos/:id` **ou** backend criar alias `/products/:id` |
| `GET /products/search?nome=&categoria=&ativo=` | *Não existe* | **Faltando no backend** | Backend implementar `/produtos/search` (ou `/products/search`) **ou** front filtrar via `GET /produtos?busca=&categoria=` |
| — | `GET /recomendacoes/destaque` | Disponível | Front pode consumir para destaques/home |
| — | `GET /produtos/:id/recomendacoes` | Disponível | Front pode consumir na página de produto |

### 4.2. Ajuste sugerido no front (se optar por alinhar ao backend atual)

**`services/productsService.ts`:**

```ts
import api from "./api";
import type { ProductApiData, ProductSearchParams } from "@/types/product";

export async function getAllProducts(limite?: number): Promise<ProductApiData[]> {
  const { data } = await api.get<ProductApiData[]>("/produtos");
  return limite === undefined ? data : data.slice(0, limite);
}

export async function getProductById(id: string): Promise<ProductApiData> {
  const { data } = await api.get<ProductApiData>(`/produtos/${encodeURIComponent(id)}`);
  return data;
}

export async function searchProducts(
  params: ProductSearchParams = {},
  signal?: AbortSignal,
): Promise<ProductApiData[]> {
  const nome = params.nome?.trim();
  const categoria = params.categoria?.trim();

  // Backend atual: GET /produtos?busca=...&categoria=...
  // (ajustar quando /produtos/search for implementado)
  const { data } = await api.get<ProductApiData[] | { data: ProductApiData[] }>(
    "/produtos",
    {
      signal,
      params: {
        busca: nome || undefined,
        categoria: categoria || undefined,
        incluirInativos: params.ativo === false ? "true" : undefined,
      },
    },
  );

  const lista = Array.isArray(data) ? data : (data?.data ?? []);
  // filtro de ativo no client se necessário
  if (typeof params.ativo === "boolean") return lista.filter(p => p.ativo === params.ativo);
  return lista;
}
```

> **Atenção:** validar o shape retornado por `GET /produtos` com o backend. A compat atual do backend possui `produtoToManualiFront(...)` (shape compatível com `ProductApiData`) e `produtoToFrontend(...)` (shape Origem). Confirmar qual shape o endpoint `/produtos` está retornando após o restart do backend.

---

## 5. Shape esperado do produto (ManualiFront)

`types/product.ts` espera:

```ts
export interface ProductApiData {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  categoria: string;
  fotos: string[];
  descricao: string;
  historia: string;
  artesaoId: string;
}
```

O backend possui mapeamento `produtoToManualiFront` compatível com esse shape. Garantir que os endpoints consumidos pelo front retornem esse formato (ou `{ data: ... }` onde o front já trata).

---

## 6. Endpoints de IA disponíveis (backend pronto)

Testáveis via Swagger (`http://localhost:3001/api-docs`) após restart do backend. Requerem configuração de IA no `.env` do backend.

### `GET /api/recomendacoes/ia/produto/:id?limite=4`
Retorna recomendações de produtos relacionados/complementares com justificativa.

**Resposta:**
```json
{
  "produto": { "id": "...", "nome": "...", "preco": 0, "categoria": "...", "estoque": 0 },
  "recomendacoes": [
    { "id": "...", "nome": "...", "preco": 0, "categoria": "...", "estoque": 0, "motivo": "..." }
  ],
  "justificativa": "...",
  "modelo": "llama3.2"
}
```

### `POST /api/recomendacoes/ia/busca`
Busca semântica/recomendação por texto.

**Request:**
```json
{
  "consulta": "quero um presente artesanal de cerâmica para decoração",
  "limite": 4
}
```

**Resposta:**
```json
{
  "consulta": "...",
  "recomendacoes": [ { "id": "...", "nome": "...", "motivo": "..." } ],
  "justificativa": "...",
  "modelo": "llama3.2"
}
```

### Configuração IA no backend (`.env`)
```env
# Ollama (local, gratuito)
AI_API_KEY="ollama"
AI_BASE_URL="http://localhost:11434/v1"
AI_MODEL="llama3.2"
```

> O serviço suporta qualquer API OpenAI-compatible (OpenAI, Groq, OpenRouter, Ollama). Basta trocar `AI_BASE_URL`, `AI_MODEL` e `AI_API_KEY`.

---

## 7. Endpoints de destaque já disponíveis (compat)

| Endpoint | Resposta | Uso sugerido |
|---|---|---|
| `GET /api/v1/recomendacoes/destaque?limite=8` | `{ data: [{ produto: { id, nome, preco, imagem, categoria, estoque, mediaAvaliacoes, totalAvaliacoes, artesaoId } }] }` | Home/destaques |
| `GET /api/v1/produtos/:id/recomendacoes?limite=4` | `{ data: [{ produto: ... }] }` | Produtos relacionados na página de produto |

---

## 8. Checklist para o time de front

- [ ] Definir `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1` no `.env.local`.
- [ ] Corrigir import em `services/productsService.ts`: `import api from "./api";`.
- [ ] Alinhar paths de produto (`/products` vs `/produtos`) com o backend.
- [ ] Implementar/ajustar `searchProducts` para o endpoint disponível no backend.
- [ ] Validar shape de `ProductApiData` retornado pelo backend (campos `fotos`, `estoque`, `ativo`, `artesaoId`, `historia`).
- [ ] Reiniciar dev server do Next.js após alterações (`cache do Turbopack` pode manter erro antigo).
- [ ] (Opcional) Integrar destaques: `GET /recomendacoes/destaque`.
- [ ] (Opcional) Integrar recomendação por IA na página de produto: `GET /recomendacoes/ia/produto/:id`.
- [ ] (Opcional) Integrar busca IA: `POST /recomendacoes/ia/busca`.

---

## 9. Observações

- **CORS/auth:** confirmar se o backend aceita origem do front e se endpoints protegidos exigem `Authorization: Bearer <token>`.
- **Backend precisa reiniciar** para carregar mudanças de rota/env.
- **Não foram feitas mudanças estruturais no ManualiFront** além da correção de import indicada; as demais mudanças são recomendações de alinhamento de contrato.
- Os endpoints de IA dependem de um provedor OpenAI-compatible configurado e ativo (Ollama local por padrão).
