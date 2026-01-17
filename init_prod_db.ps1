$ServerIP = "203.30.185.197"
$User = "root"

Write-Host "Initializing production database on server..." -ForegroundColor Cyan
Write-Host "You will be asked for the password ('L0tus69!')" -ForegroundColor Yellow

# Commands to run on server
$cmd = "
    echo '--- pulling latest changes ---';
    cd ~/quoteforge;
    git pull;

    echo '--- rebuilding containers ---';
    docker-compose down;
    docker-compose up -d --build --force-recreate;

    echo '--- waiting for startup (15s) ---';
    sleep 15;

    echo '--- initializing database ---';
    docker exec quoteforge-api node src/seed-prod.js;

    echo '--- checking api logs ---';
    docker logs --tail 30 quoteforge-api;

    echo '--- checking status ---';
    docker ps;
"

# Sanitize
$cmd = $cmd -replace "`r", ""

ssh "${User}@${ServerIP}" $cmd

Write-Host "Done!" -ForegroundColor Green
