$ServerIP = "203.30.185.197"
$User = "root"

Write-Host "Connecting to server to update and rebuild..." -ForegroundColor Cyan
Write-Host "You will be asked for the password ('L0tus69!')" -ForegroundColor Yellow

# Commands to run on server
# 1. Pull latest code (includes 'privileged: true' fix)
# 2. Rebuild and force recreate containers
# 3. Wait 10s and show logs to verify startup
$cmd = "
    echo '--- pulling latest changes ---';
    cd ~/quoteforge;
    git pull;
    
    echo '--- rebuilding containers ---';
    docker-compose down --rmi local;
    docker-compose up -d --build --force-recreate;
    
    echo '--- waiting for startup (10s) ---';
    sleep 10;
    
    echo '--- checking api logs ---';
    docker logs quoteforge_api;
    
    echo '--- checking status ---';
    docker ps;
"

# Sanitize
$cmd = $cmd -replace "`r", ""

ssh "${User}@${ServerIP}" $cmd

Write-Host "Done!" -ForegroundColor Green
