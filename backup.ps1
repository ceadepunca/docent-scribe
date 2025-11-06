# Script de Backup de Base de Datos Supabase
# Genera backups SQL completos con timestamp automático

$ErrorActionPreference = "Continue"

try {
    Write-Host "🔄 Iniciando backup de base de datos..." -ForegroundColor Cyan
    
    # Verificar si pg_dump está disponible
    Write-Host "🔍 Verificando pg_dump..." -ForegroundColor Yellow
    $pgDumpPath = (Get-Command pg_dump -ErrorAction SilentlyContinue).Source
    
    if (-not $pgDumpPath) {
        Write-Host "❌ ERROR: pg_dump no está disponible en el PATH" -ForegroundColor Red
        Write-Host "⚠️  Asegúrate de que PostgreSQL esté instalado correctamente" -ForegroundColor Yellow
        Write-Host "⚠️  Ruta típica: C:\Program Files\PostgreSQL\16\bin\" -ForegroundColor Yellow
        throw "pg_dump no encontrado"
    }
    
    Write-Host "✅ pg_dump encontrado en: $pgDumpPath" -ForegroundColor Green
    
    # Crear directorio de backups si no existe
    $backupDir = "backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
        Write-Host "📁 Directorio 'backups' creado" -ForegroundColor Green
    }
    
    # Generar nombre de archivo con timestamp
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupFile = "$backupDir/backup_$timestamp.sql"
    $errorFile = "$backupDir/backup_$timestamp.error.log"
    
    Write-Host "📦 Creando backup: $backupFile" -ForegroundColor Yellow
    Write-Host "🔐 Se solicitará la contraseña de la base de datos..." -ForegroundColor Cyan
    
    # Ejecutar pg_dump y capturar errores
    $process = Start-Process -FilePath "pg_dump" `
        -ArgumentList "-h", "aws-0-sa-east-1.pooler.supabase.com", `
                      "-p", "6543", `
                      "-U", "postgres.pvmdbqbhzmofbqqelyfh", `
                      "-d", "postgres", `
                      "-f", $backupFile `
        -NoNewWindow -Wait -PassThru -RedirectStandardError $errorFile
    
    # Verificar resultado
    if ($process.ExitCode -eq 0) {
        if (Test-Path $backupFile) {
            $fileSize = (Get-Item $backupFile).Length / 1MB
            Write-Host "✅ Backup completado exitosamente!" -ForegroundColor Green
            Write-Host "📊 Tamaño: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
            Write-Host "📍 Ubicación: $backupFile" -ForegroundColor Green
            
            # Limpiar archivo de error si está vacío
            if (Test-Path $errorFile) {
                if ((Get-Item $errorFile).Length -eq 0) {
                    Remove-Item $errorFile
                }
            }
        } else {
            Write-Host "⚠️  El proceso terminó pero no se encontró el archivo de backup" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Error al crear el backup (Exit Code: $($process.ExitCode))" -ForegroundColor Red
        
        # Mostrar contenido del archivo de error si existe
        if (Test-Path $errorFile) {
            $errorContent = Get-Content $errorFile -Raw
            if ($errorContent) {
                Write-Host "`n📋 Detalles del error:" -ForegroundColor Yellow
                Write-Host $errorContent -ForegroundColor Red
            }
        }
    }
    
} catch {
    Write-Host "`n❌ Error crítico: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📋 Stack trace:" -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
} finally {
    # SIEMPRE pausar al final, incluso si hay errores
    Write-Host "`n🎯 Presiona cualquier tecla para cerrar..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
