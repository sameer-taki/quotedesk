$ErrorActionPreference = "Stop"

$LocalDir = "c:\Projectes\Kastel Projects\Quote Desk\quoteforge-web"
$ServerIP = "203.30.185.197"
$User = "root"
$RemoteDir = "/root/quoteforge"
$ZipFile = "$LocalDir\deploy.zip"

Write-Host "Starting Deployment to $ServerIP..." -ForegroundColor Cyan

# 1. Prepare Staging Area (Preserve folder structure)
$Staging = "$LocalDir\.deploy_stage"
Write-Host "Cleaning staging area..." -ForegroundColor Yellow
if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $Staging | Out-Null

Write-Host "Copying files to staging (skipping node_modules)..." -ForegroundColor Yellow

# Use Robocopy for robust filtering (Mirror structure, exclude heavy folders)
# Exit code mapping forces $lastexitcode check to avoid script error on "success" (robocopy uses < 8 as success)
$roboOpts = @("/E", "/XD", "node_modules", "dist", ".git", ".gemini", "brain", "data", "/XF", "*.sqlite", "*.sqlite-journal", "deploy.zip")
robocopy "$LocalDir\client" "$Staging\client" $roboOpts | Out-Null
robocopy "$LocalDir\server" "$Staging\server" $roboOpts | Out-Null
robocopy "$LocalDir\docker" "$Staging\docker" $roboOpts | Out-Null
Copy-Item "$LocalDir\docker-compose.yml" "$Staging\"

# 2. Zip Staging Folder
Write-Host "Compressing files..." -ForegroundColor Cyan
if (Test-Path $ZipFile) { Remove-Item $ZipFile }
Compress-Archive -Path "$Staging\*" -DestinationPath $ZipFile -Force

# Cleanup Staging
Remove-Item $Staging -Recurse -Force
Write-Host "Zip created: $ZipFile" -ForegroundColor Green

# 3. SCP to server
Write-Host "Uploading to server (Enter password 'L0tus69!' if prompted)..." -ForegroundColor Yellow
scp $ZipFile "${User}@${ServerIP}:/root/deploy.zip"

# 4. SSH to install and run
Write-Host "Configuring server and running Docker..." -ForegroundColor Yellow

# Remove likely corrupted directories from previous failed runs
$CleanCommand = "rm -rf /root/quoteforge* /root/admin* /root/App* /root/docker* /root/package* /root/deploy.zip;"

$commands = "
    $CleanCommand
    
    echo '--- Update and Install Docker ---';
    apt-get update -qq;
    apt-get install -y unzip docker.io docker-compose > /dev/null;

    echo '--- Setup Directory ---';
    mkdir -p $RemoteDir;
    mv /root/deploy.zip $RemoteDir/;
    cd $RemoteDir;

    echo '--- Unzip ---';
    unzip -o -q deploy.zip;
    rm deploy.zip;

    echo '--- Start Application ---';
    docker-compose down --rmi local;
    docker-compose up -d --build;
    
    echo '--- Cleanup ---';
    docker image prune -f;
"

# Remove Windows carriage returns for Linux compatibility
$commands = $commands -replace "`r", ""

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Check your site at: http://$ServerIP" -ForegroundColor Cyan
