# Слатислат Муромский: Берестяной Путь

Небольшая браузерная игра-история о легендарном первом князе Мурома — Слатислате. Вы принимаете решения, балансируя между культурой, союзами и властью.

## Запуск локально

Откройте `index.html` двойным кликом — всё работает без сборки и зависимостей.

## Публикация на GitHub Pages

1. Создайте новый репозиторий на GitHub, например `slatislat-adventure`.
2. Склонируйте его и скопируйте файлы из этой папки (`index.html`, `style.css`, `game.js`, `README.md`, `LICENSE`).
3. Коммить и пуш:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Slatislat adventure"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/slatislat-adventure.git
   git push -u origin main
   ```
4. В настройках репозитория (Settings → Pages) выберите **Deploy from a branch**, ветка **main**, папка **/** (root). Сохраните.
5. Через минуту-две страница будет доступна по адресу `https://<YOUR_USERNAME>.github.io/slatislat-adventure/`

## Игровая механика

- **Влияние**, **союзы (0–5)**, **береста** — простые показатели состояния.
- Выборы ветвятся и приводят к одним из **трёх финалов**: культурный, военный, личный.
- Прогресс сохраняется в `localStorage` автоматически.

## Лицензия

MIT. См. `LICENSE`.
