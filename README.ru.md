# Cubed Launcher

Форк [Millida Launcher](https://github.com/millida/launcher), изменённый 1 ноября 2026 года.
Лицензия исходного кода — GPL-3.0-only. Уведомления об авторстве сохранены в NOTICE.

## Возможности

- Создание, импорт, удаление и настройка сборок Minecraft.
- Загрузчики Fabric, Quilt, Forge и NeoForge; управление Java и памятью в настройках сборки.
- Главная с фоном, выбором сборки и кнопкой запуска; анимированные сцены, свои изображения/видео и смена цвета без подписки.
- Прямой каталог Modrinth: сборки, моды, ресурспаки, шейдеры и датапаки.
- Вход Microsoft по коду устройства и хранение сессий в хранилище ядра.

Основная оболочка не подключает аккаунты Millida, магазин, боевой пропуск,
платную валюту, друзей, чаты, звонки, хостинг, помощника Millida и рекламные разделы.
CurseForge исключён. Телеметрия, отчёты об удалении, сигналы активности,
загрузка удалённого интерфейса, исправлений переводов и обновлений от Millida отключены.
Загрузки Minecraft и Modrinth используют исходные сервисы без прокси Millida.
Старые модули исходного проекта местами ещё существуют как зависимости общего кода;
удалённые разделы не зарегистрированы в навигации, их загрузчики заменены заглушками,
а команды входа Millida, хостинга, звонков и CurseForge исключены из IPC.

## Запуск на этой машине

```sh
cd ~/Projects/Cubed-Launcher
./start.sh
```

Собранный Linux-файл находится в `src-tauri/target/debug/cubed-launcher`.
В него встроена веб-часть (`custom-protocol`): отдельный Vite-сервер не нужен.
`start.sh` также подключает локальный WebKit из `work/sysroot`, подготовленный
из кешированных пакетов Arch, если системная библиотека отсутствует.
Локальная копия WebKit использует путь `./work/webkit-process` для дочерних процессов.
Этот локальный runtime не добавляется в Git и не предназначен для распространения.

## Настройка Microsoft

Без собственной регистрации приложения Microsoft вход форка не заработает.
ID исходного лаунчера не используется. Пароль и client secret вводить в Cubed не нужно.

1. Открой [регистрации приложений Microsoft Entra](https://entra.microsoft.com/).
2. Зарегистрируй Cubed Launcher с поддержкой личных аккаунтов Microsoft.
3. В Authentication включи public client flows для входа по коду устройства.
4. Скопируй Application (client) ID в настройки Cubed Launcher и сохрани.
5. Открой раздел аккаунта и нажми «Войти через Microsoft».

[Официальная инструкция регистрации](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app).
[Протокол входа по коду](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code).
Доступ нового приложения к Xbox/Minecraft Services определяется Microsoft/Mojang;
сама регистрация не гарантирует его предоставление. Полный вход и запуск игры
с лицензией ещё не проверены: собственного разрешённого Client ID пока нет.

Client ID можно также передать через `CUBED_MS_CLIENT_ID` при сборке или запуске.
Токены пользователя не попадают в веб-интерфейс. При смене Client ID нужно
повторно войти в добавленные Microsoft-аккаунты.

## Сборка

Нужны Bun, Rust stable и системные зависимости Tauri 2 (на Linux — GTK3,
WebKitGTK 4.1, ALSA, OpenSSL, средства компиляции).

```sh
bun install --frozen-lockfile
bun run build:web
cargo build --manifest-path src-tauri/Cargo.toml --features custom-protocol --bin cubed-launcher
./start.sh
```

Данные Cubed хранятся отдельно: `~/.local/share/io.github.glob876.cubed-launcher`.
Данные исходного Millida Launcher не изменяются. Существующие сборки можно импортировать.
