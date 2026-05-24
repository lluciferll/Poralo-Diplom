# Деплой ArenaPulse на Amvera

## Важно

- Amvera **не поддерживает** `docker-compose.yml` — только **Dockerfile** (и опционально `amvera.yml`).
- Локально используйте `docker compose` для разработки с PostgreSQL.
- На Amvera приложение работает в **одном контейнере** с SQLite в `/data` (persistent volume).

## Шаги

1. Создайте приложение в [Amvera Cloud](https://amvera.ru) → окружение **Docker**.
2. Подключите Git-репозиторий с этим проектом (корень = папка с `Dockerfile`).
3. Файлы в корне:
   - `Dockerfile` — сборка frontend + backend
   - `amvera.yml` — порт **8080**, persistence **`/data`**
4. Переменные окружения в панели Amvera:

   | Переменная | Значение |
   |------------|----------|
   | `SECRET_KEY` | длинная случайная строка |
   | `DATABASE_URL` | `sqlite:///./arena.db` (по умолчанию в `/data`) |
   | `DATA_DIR` | `/data` |
   | `STATIC_DIR` | `static` |

5. После деплоя откройте URL проекта — seed создаст демо-данные при первом запуске.

## Локальная проверка production-образа

```powershell
.\scripts\build.ps1
docker run -p 8080:8080 -e SECRET_KEY=test -v arenapulse-data:/data arenapulse:latest
```

## PostgreSQL на Amvera

Если подключите managed PostgreSQL Amvera, задайте `DATABASE_URL=postgresql://...` — приложение автоматически переключится с SQLite.
