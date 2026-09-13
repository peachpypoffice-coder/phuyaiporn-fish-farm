$port = 3000
$prefix = "http://localhost:$port/"
$baseDir = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "Phu Yai Porn Fish Farm Server running at: $prefix"
    Start-Process $prefix
} catch {
    $port = 8080
    $prefix = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
    Write-Host "Phu Yai Porn Fish Farm Server running at: $prefix"
    Start-Process $prefix
}

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.xlsx' = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

$dataDir = Join-Path $baseDir 'data'
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}
$dbPath = Join-Path $dataDir 'db.json'

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.AddHeader('Access-Control-Allow-Origin', '*')
        $response.AddHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        $response.AddHeader('Access-Control-Allow-Headers', 'Content-Type')

        if ($request.HttpMethod -eq 'OPTIONS') {
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        $rawPath = $request.Url.AbsolutePath
        if ($rawPath -eq '/' -or $rawPath -eq '') {
            $rawPath = '/index.html'
        }

        if ($rawPath -eq '/api/health') {
            $json = '{"status":"ok"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = 'application/json; charset=utf-8'
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        if ($rawPath -eq '/api/state') {
            if ($request.HttpMethod -eq 'GET') {
                if (Test-Path $dbPath) {
                    $jsonContent = Get-Content $dbPath -Raw -Encoding UTF8
                    $respJson = '{"success":true,"data":' + $jsonContent + '}'
                } else {
                    $respJson = '{"success":false,"message":"No stored state"}'
                }
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                $response.ContentType = 'application/json; charset=utf-8'
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.Close()
                continue
            }
            elseif ($request.HttpMethod -eq 'POST') {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                [System.IO.File]::WriteAllText($dbPath, $body, [System.Text.Encoding]::UTF8)
                
                $respJson = '{"success":true,"message":"Saved"}'
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                $response.ContentType = 'application/json; charset=utf-8'
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.Close()
                continue
            }
        }

        $cleanRelPath = $rawPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $localPath = Join-Path $baseDir $cleanRelPath
        if (Test-Path $localPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
            
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }

        $response.Close()
    } catch {
        # Loop continues
    }
}
