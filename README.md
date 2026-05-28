# Analise ASN

Repositório organizado em formato monorepo, com frontend e backend no mesmo projeto usando a pasta `apps/`.

## Estrutura

```txt
.
|-- apps/
|   |-- api/   -> backend FastAPI
|   |-- web/   -> frontend Next.js
|-- docker-compose.yaml
|-- Dockerfile
|-- package.json
```

## Apps

### `apps/api`

Backend responsável por:

* coletar anúncios BGP;
* detectar ASN mitigadores no AS-PATH;
* persistir os resultados;
* expor endpoints analíticos via FastAPI;
* oferecer filtros reutilizáveis para investigação e dashboard.

Arquivos principais:

* `apps/api/app/main.py`
* `apps/api/app/services/`
* `apps/api/collect_bgp.py`
* `apps/api/requirements.txt`

### `apps/web`

Frontend Next.js responsável por:

* dashboard analítico;
* filtros por ASN e período;
* gráficos e indicadores operacionais;
* interface padronizada com `shadcn/ui`;
* visualizações com `recharts`.

Arquivos principais:

* `apps/web/src/app/page.tsx`
* `apps/web/src/app/layout.tsx`
* `apps/web/package.json`

## Como rodar

### Backend

```bash
pip install -r apps/api/requirements.txt
uvicorn apps.api.app.main:app --reload
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

Ou pela raiz:

```bash
npm run dev:web
```

### Docker Compose

```bash
docker-compose up --build
```

Serviços expostos:

* API em `http://localhost:8000`
* Web em `http://localhost:3000`

## Filtros da API

Os endpoints de rotas e analytics compartilham o mesmo mecanismo de filtragem via query string.

Filtros disponíveis:

* `start`: data inicial em formato ISO 8601
* `end`: data final em formato ISO 8601
* `prefix`: busca parcial por prefixo
* `origin_asn`: ASN de origem exato
* `mitigator_asn`: ASN mitigador exato
* `is_mitigated`: `true` ou `false`
* `source_id`: origem exata do snapshot
* `community_contains`: busca parcial em `community`
* `as_path_contains`: busca parcial em `as_path`

O endpoint `/routes` também aceita:

* `limit`: quantidade de registros, de `1` a `500`
* `offset`: deslocamento para paginação

### Endpoints com filtros

* `GET /routes`
* `GET /analytics/summary`
* `GET /analytics/top-mitigators`
* `GET /analytics/hourly-incidence`
* `GET /analytics/weekday-incidence`
* `GET /analytics/top-prefixes`
* `GET /analytics/top-as-paths`
* `GET /analytics/volume-by-origin-asn`
* `GET /analytics/mitigation-frequency`

### Exemplos

Resumo filtrado por período e mitigador:

```txt
GET /analytics/summary?start=2026-05-01T00:00:00&end=2026-05-28T23:59:59&mitigator_asn=3356
```

Rotas mitigadas de um ASN de origem específico:

```txt
GET /routes?origin_asn=64512&is_mitigated=true&limit=50
```

Ranking de prefixos com filtro textual:

```txt
GET /analytics/top-prefixes?prefix=203.0.113&is_mitigated=true
```

Busca por recorrência em AS-PATH:

```txt
GET /analytics/top-as-paths?as_path_contains=64512
```

## Ambiente

Crie um arquivo `.env` na raiz baseado em `.env.example`:

```txt
DATABASE_URL=postgresql+psycopg2://usuario:senha@localhost:5432/analise_asn
```

## Coleta automática

O workflow `.github/workflows/hourly-collector.yml` executa a coleta de hora em hora e também permite disparo manual.
