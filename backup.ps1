# Script de Backup de Base de Datos Supabase
# Genera backups SQL completos con timestamp automático

Write-Host "🔄 Iniciando backup de base de datos..." -ForegroundColor Cyan

# Crear directorio de backups si no existe
$backupDir = "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "📁 Directorio 'backups' creado" -ForegroundColor Green
}

# Generar nombre de archivo con timestamp
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupFile = "$backupDir/backup_$timestamp.sql"

Write-Host "📦 Creando backup: $backupFile" -ForegroundColor Yellow

# Ejecutar pg_dump
try {
    pg_dump -h aws-0-sa-east-1.pooler.supabase.com -p 6543 -U postgres.pvmdbqbhzmofbqqelyfh -d postgres > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "✅ Backup completado exitosamente!" -ForegroundColor Green
        Write-Host "📊 Tamaño: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        Write-Host "📍 Ubicación: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al crear el backup" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "⚠️  Asegúrate de que PostgreSQL esté instalado y pg_dump disponible en PATH" -ForegroundColor Yellow
}

Write-Host "`n🎯 Presiona cualquier tecla para cerrar..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
