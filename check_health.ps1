$ServerIP = "203.30.185.197"
$User = "root"

Write-Host "Checking server health..." -ForegroundColor Yellow

$cmd = "
    echo '--- Docker Containers ---';
    docker ps -a;
    echo '--- Local Connection Check ---';
    curl -I http://localhost || echo 'Curl failed';
"
# Sanitize
$cmd = $cmd -replace "`r", ""

ssh "${User}@${ServerIP}" $cmd
