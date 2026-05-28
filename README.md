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
* expor endpoints analíticos via FastAPI.

Arquivos principais:

* `apps/api/app/main.py`
* `apps/api/app/services/`
* `apps/api/collect_bgp.py`
* `apps/api/requirements.txt`

### `apps/web`

Frontend Next.js responsável por:

* dashboard analítico;
* filtros por ASN e período;
* gráficos e indicadores operacionais.

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

## Ambiente

Crie um arquivo `.env` na raiz baseado em `.env.example`:

```txt
DATABASE_URL=postgresql+psycopg2://usuario:senha@localhost:5432/analise_asn
```

## Coleta automática

O workflow `.github/workflows/hourly-collector.yml` executa a coleta de hora em hora e também permite disparo manual.
