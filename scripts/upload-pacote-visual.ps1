# ===== Upload do Pacote Visual — MeuCorre Central de Divulgação =====
# Faz upload de todas as imagens da pasta para produção
# As imagens são vinculadas automaticamente às 450 postagens pelo nome do arquivo
#
# Compatível com PowerShell 5.1+ (Windows 10/11 padrão)
#
# Uso: salve este arquivo como upload-pacote-visual.ps1 e execute:
#   .\upload-pacote-visual.ps1
#
# Ou cole tudo no PowerShell e pressione Enter

Add-Type -AssemblyName System.Net.Http

# ===== Configurações =====
$BaseUrl = "https://meucorre.vercel.app"
$AdminEmail = "clodoaldo608@gmail.com"
$AdminPassword = "Silva88677488@#"
$FolderPath = "C:\Users\ACER\Downloads\pacote-visual"

# ===== Função para determinar Content-Type por extensão =====
function Get-ContentType($extension) {
    switch ($extension.ToLower()) {
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".webp" { return "image/webp" }
        ".gif"  { return "image/gif" }
        default { return "application/octet-stream" }
    }
}

# ===== Configurar HttpClient com cookies =====
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.CookieContainer = New-Object System.Net.CookieContainer
$client = New-Object System.Net.Http.HttpClient($handler)
$client.BaseAddress = New-Object System.Uri($BaseUrl)
$client.Timeout = [System.TimeSpan]::FromMinutes(10)

# ===== 1. Login =====
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 Upload do Pacote Visual — MeuCorre" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Fazendo login como admin..." -ForegroundColor Yellow

$loginJson = '{"email":"' + $AdminEmail + '","password":"' + $AdminPassword + '"}'
$loginContent = New-Object System.Net.Http.StringContent($loginJson, [System.Text.Encoding]::UTF8, "application/json")

try {
    $loginResponse = $client.PostAsync("/api/admin/login", $loginContent).Result
    if ($loginResponse.IsSuccessStatusCode) {
        Write-Host "   ✅ Login OK" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Login falhou: $($loginResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Erro de conexão: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ===== 2. Buscar todas as imagens recursivamente =====
Write-Host ""
Write-Host "📁 Buscando imagens em: $FolderPath" -ForegroundColor Yellow

if (-not (Test-Path $FolderPath)) {
    Write-Host "   ❌ Pasta não encontrada: $FolderPath" -ForegroundColor Red
    exit 1
}

$images = Get-ChildItem -Path $FolderPath -Recurse -File | Where-Object {
    $_.Extension -match "\.(png|jpg|jpeg|webp|gif)$"
}

$totalImages = $images.Count
Write-Host "   📦 $totalImages imagens encontradas" -ForegroundColor Green

if ($totalImages -eq 0) {
    Write-Host "   ⚠️  Nenhuma imagem encontrada. Verifique o caminho." -ForegroundColor Red
    exit 0
}

# ===== 3. Upload de cada imagem =====
Write-Host ""
Write-Host "📤 Iniciando upload..." -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed = 0
$skipped = 0
$errors = @()
$i = 0
$startTime = Get-Date

foreach ($image in $images) {
    $i++
    $fileName = $image.Name
    $relativePath = $image.FullName.Substring($FolderPath.Length).TrimStart('\', '/')

    # Barra de progresso
    $percent = [math]::Round(($i / $totalImages) * 100)
    $elapsed = (Get-Date) - $startTime
    if ($i -gt 1) {
        $avgTime = $elapsed.TotalSeconds / ($i - 1)
        $remaining = [math]::Round($avgTime * ($totalImages - $i))
        $eta = "{0:mm\:ss}" -f (New-TimeSpan -Seconds $remaining)
    } else {
        $eta = "?"
    }

    Write-Host ("`r   [{0}/{1}] {2}% | ETA: {3} | {4}                    " -f $i, $totalImages, $percent, $eta, $fileName) -NoNewline -ForegroundColor Gray

    try {
        # Construir multipart/form-data
        $content = New-Object System.Net.Http.MultipartFormDataContent

        # Arquivo
        $fileStream = [System.IO.File]::OpenRead($image.FullName)
        $fileContent = New-Object System.Net.Http.StreamContent($fileStream)
        $contentType = Get-ContentType $image.Extension
        $fileContent.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue($contentType)
        $content.Add($fileContent, "file", $fileName)

        # Campos adicionais
        $content.Add((New-Object System.Net.Http.StringContent($fileName)), "name")
        $content.Add((New-Object System.Net.Http.StringContent("upload_admin")), "source")

        # Enviar
        $response = $client.PostAsync("/api/admin/promotion/assets/upload", $content).Result

        # Fechar stream
        $fileStream.Close()
        $fileStream.Dispose()

        if ($response.IsSuccessStatusCode) {
            $success++
        } elseif ($response.StatusCode -eq [System.Net.HttpStatusCode]::Conflict) {
            $skipped++
        } else {
            $failed++
            $errorBody = $response.Content.ReadAsStringAsync().Result
            $errors += "$fileName : HTTP $($response.StatusCode) - $errorBody"
        }
    } catch {
        $failed++
        $errors += "$fileName : $($_.Exception.Message)"
        if ($fileStream) { $fileStream.Dispose() }
    }

    # Pequeno delay para não sobrecarregar o servidor
    Start-Sleep -Milliseconds 100
}

# ===== 4. Relatório final =====
$totalTime = (Get-Date) - $startTime
$timeStr = "{0:mm\:ss}" -f $totalTime

Write-Host ""
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📊 RELATÓRIO DE UPLOAD" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ✅ Sucesso:   $success" -ForegroundColor Green
Write-Host "   ♻️  Skip:      $skipped (já existiam)" -ForegroundColor Yellow
Write-Host "   ❌ Falha:     $failed" -ForegroundColor Red
Write-Host "   ⏱️  Tempo:     $timeStr" -ForegroundColor Gray
Write-Host "   📁 Total:     $totalImages imagens" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Primeiros 10 erros:" -ForegroundColor Red
    $errors | Select-Object -First 10 | ForEach-Object {
        Write-Host "   ❌ $_" -ForegroundColor DarkRed
    }
}

Write-Host ""
Write-Host "✅ Upload concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Valide em:" -ForegroundColor Yellow
Write-Host "   $BaseUrl/admin/divulgacao" -ForegroundColor White
Write-Host ""
Write-Host "💡 As imagens foram vinculadas às 450 postagens pelo nome do arquivo." -ForegroundColor Yellow
Write-Host "   Postagens sem imagem correspondente continuam com placeholder." -ForegroundColor Yellow

# Limpar
$client.Dispose()
