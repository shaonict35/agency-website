$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "===================================================="
    Write-Host "Insight Creative Studio Website is LIVE at http://localhost:$port/"
    Write-Host "Admin Panel is LIVE at http://localhost:$port/admin/"
    Write-Host "===================================================="
} catch {
    Write-Host "Could not bind to port $port, trying 8080..."
    $port = 8080
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
    Write-Host "Insight Creative Studio Website is LIVE at http://localhost:$port/"
    Write-Host "Admin Panel is LIVE at http://localhost:$port/admin/"
}

$mimeTypes = @{
    '.html'  = 'text/html; charset=utf-8'
    '.css'   = 'text/css; charset=utf-8'
    '.js'    = 'application/javascript; charset=utf-8'
    '.json'  = 'application/json'
    '.png'   = 'image/png'
    '.jpg'   = 'image/jpeg'
    '.jpeg'  = 'image/jpeg'
    '.gif'   = 'image/gif'
    '.svg'   = 'image/svg+xml'
    '.webp'  = 'image/webp'
    '.ico'   = 'image/x-icon'
    '.mp4'   = 'video/mp4'
    '.webm'  = 'video/webm'
    '.ogg'   = 'video/ogg'
    '.mov'   = 'video/quicktime'
    '.m4v'   = 'video/mp4'
    '.xml'   = 'application/xml; charset=utf-8'
    '.txt'   = 'text/plain; charset=utf-8'
    '.woff'  = 'font/woff'
    '.woff2' = 'font/woff2'
    '.ttf'   = 'font/ttf'
    '.eot'   = 'application/vnd.ms-fontobject'
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
        $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        $response.KeepAlive = $false

        # Global CORS and Auto Cache-Clean headers (never serve stale favicon or CMS edits)
        $response.Headers.Add('Access-Control-Allow-Origin', '*')
        $response.Headers.Add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        $response.Headers.Add('Access-Control-Allow-Headers', 'Content-Type')
        $response.Headers.Add('Cache-Control', 'no-cache, no-store, must-revalidate')
        $response.Headers.Add('Pragma', 'no-cache')
        $response.Headers.Add('Expires', '0')

    if ($request.HttpMethod -eq 'OPTIONS') {
        $response.StatusCode = 200
        $response.OutputStream.Close()
        continue
    }

    # Admin Panel API Endpoints
    if ($urlPath -like '/api/*') {
        $response.ContentType = 'application/json; charset=utf-8'

        # Admin Login Authentication API
        if ($urlPath -eq '/api/auth/login' -and $request.HttpMethod -eq 'POST') {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            $payload = ConvertFrom-Json $body
            $u = ($payload.username + '').Trim().ToLower()
            $p = ($payload.password + '').Trim()

            $validUsers = @('admin', 'insightadmin', 'shaon')
            $validPass = @('admin', 'insight@2026', 'insight2026', 'admin123')

            if ($validUsers -contains $u -and $validPass -contains $p) {
                $token = "cf_auth_" + [System.Guid]::NewGuid().ToString("N")
                $resp = @{ success = $true; user = $u; token = $token }
                $json = ConvertTo-Json -InputObject $resp
                $b = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.OutputStream.Write($b, 0, $b.Length)
            } else {
                $response.StatusCode = 401
                $resp = @{ success = $false; error = "Invalid username or password" }
                $json = ConvertTo-Json -InputObject $resp
                $b = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.OutputStream.Write($b, 0, $b.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        if ($urlPath -eq '/api/pages') {
            $pages = @(
                @{ id = 'home'; title = 'Home Page'; path = 'index.html'; icon = '🏠'; url = '/' },
                @{ id = 'about'; title = 'About Us'; path = 'about/index.html'; icon = 'ℹ️'; url = '/about/' },
                @{ id = 'interior-design'; title = 'Interior Design'; path = 'interior-design/index.html'; icon = '🛋️'; url = '/interior-design/' },
                @{ id = 'digital-marketing'; title = 'Digital Marketing'; path = 'digital-marketing/index.html'; icon = '📈'; url = '/digital-marketing/' },
                @{ id = 'graphic-design'; title = 'Graphic Design'; path = 'graphic-design/index.html'; icon = '🎨'; url = '/graphic-design/' },
                @{ id = 'video-editing'; title = 'Video Editing'; path = 'video-editing/index.html'; icon = '🎬'; url = '/video-editing/' },
                @{ id = 'branding'; title = 'Branding & Identity'; path = 'branding/index.html'; icon = '✨'; url = '/branding/' },
                @{ id = 'pricing'; title = 'Pricing Plans'; path = 'pricing/index.html'; icon = '💰'; url = '/pricing/' },
                @{ id = 'team'; title = 'Team Members'; path = 'team/index.html'; icon = '👥'; url = '/team/' },
                @{ id = 'faqs'; title = 'FAQs'; path = 'faqs/index.html'; icon = '❓'; url = '/faqs/' },
                @{ id = 'testimonial'; title = 'Testimonials'; path = 'testimonial/index.html'; icon = '⭐'; url = '/testimonial/' },
                @{ id = 'features'; title = 'Features & Process'; path = 'features/index.html'; icon = '⚡'; url = '/features/' },
                @{ id = 'blog'; title = 'Blog'; path = 'blog/index.html'; icon = '📝'; url = '/blog/' },
                @{ id = 'contact'; title = 'Contact Us'; path = 'contact/index.html'; icon = '📞'; url = '/contact/' },
                @{ id = 'privacy-policy'; title = 'Privacy Policy'; path = 'privacy-policy/index.html'; icon = '🔒'; url = '/privacy-policy/' },
                @{ id = 'terms-and-conditions'; title = 'Terms & Conditions'; path = 'terms-and-conditions/index.html'; icon = '⚖️'; url = '/terms-and-conditions/' },
                @{ id = 'cookie-policy'; title = 'Cookie Policy'; path = 'cookie-policy/index.html'; icon = '🍪'; url = '/cookie-policy/' }
            )
            $json = ConvertTo-Json -InputObject $pages -Compress
            $b = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($b, 0, $b.Length)
            $response.OutputStream.Close()
            continue
        }

        if ($urlPath -eq '/api/page') {
            $reqPath = $request.QueryString['path']
            if (-not $reqPath) { $reqPath = 'index.html' }
            $reqPath = $reqPath.TrimStart('/').Replace('/', '\')
            $target = Join-Path $PSScriptRoot $reqPath
            if (Test-Path $target -PathType Leaf) {
                $content = [System.IO.File]::ReadAllText($target, [System.Text.Encoding]::UTF8)
                $resObj = @{ path = $reqPath; content = $content }
                $json = ConvertTo-Json -InputObject $resObj
                $b = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.OutputStream.Write($b, 0, $b.Length)
            } else {
                $response.StatusCode = 404
                $b = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Page not found"}')
                $response.OutputStream.Write($b, 0, $b.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        if ($urlPath -eq '/api/save-page' -and $request.HttpMethod -eq 'POST') {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                $payload = ConvertFrom-Json $body
                
                $saveRelPath = ($payload.path + '').TrimStart('/').Replace('/', '\')
                if (-not $saveRelPath) { $saveRelPath = 'index.html' }
                $saveFile = Join-Path $PSScriptRoot $saveRelPath
                
                $content = "" + $payload.content
                if ($content.Length -lt 20) {
                    throw "Content payload is invalid or empty"
                }

                if (Test-Path $saveFile) {
                    [System.IO.File]::WriteAllText($saveFile, $content, [System.Text.Encoding]::UTF8)
                    Write-Host "[SAVE-PAGE] Successfully saved $saveRelPath ($($content.Length) bytes)"
                    $respObj = @{ success = $true; message = "Page saved successfully"; path = $saveRelPath.Replace('\', '/') }
                    $respJson = ConvertTo-Json -InputObject $respObj
                    $b = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                    $response.OutputStream.Write($b, 0, $b.Length)
                } else {
                    $response.StatusCode = 404
                    $b = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"error":"File not found: ' + $saveRelPath.Replace('\', '/') + '"}')
                    $response.OutputStream.Write($b, 0, $b.Length)
                }
            } catch {
                Write-Host "[SAVE-PAGE] Error: $($_.Exception.Message)"
                $response.StatusCode = 500
                $errMsg = $_.Exception.Message.Replace('"', '\"')
                $b = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"error":"' + $errMsg + '"}')
                $response.OutputStream.Write($b, 0, $b.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # Replace media reference on page directly
        if ($urlPath -eq '/api/replace-media' -and $request.HttpMethod -eq 'POST') {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            $payload = ConvertFrom-Json $body
            $pageRelPath = $payload.path.TrimStart('/').Replace('/', '\')
            $pageFile = Join-Path $PSScriptRoot $pageRelPath
            if (Test-Path $pageFile) {
                $html = [System.IO.File]::ReadAllText($pageFile, [System.Text.Encoding]::UTF8)
                $cleanOld = $payload.oldSrc.Trim()
                $noSlash = $cleanOld.TrimStart('/')
                $withSlash = '/' + $noSlash
                $newSrc = $payload.newSrc
                $pattern = "(src|href|data-background|data-heroImgUrl)=([`"'])(?:" + [regex]::Escape($cleanOld) + "|" + [regex]::Escape($withSlash) + "|" + [regex]::Escape($noSlash) + ")([`"'])"
                $html = [regex]::Replace($html, $pattern, "`$1=`$2$newSrc`$3")
                [System.IO.File]::WriteAllText($pageFile, $html, [System.Text.Encoding]::UTF8)
                $b = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Media source updated successfully"}')
                $response.OutputStream.Write($b, 0, $b.Length)
            } else {
                $response.StatusCode = 404
                $b = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Page file not found"}')
                $response.OutputStream.Write($b, 0, $b.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # All Site Media Scan (All pages images, videos, and video URLs)
        if ($urlPath -eq '/api/all-site-media') {
            $pages = @(
                @{ id = 'home'; title = 'Home Page'; path = 'index.html' },
                @{ id = 'about'; title = 'About Us'; path = 'about/index.html' },
                @{ id = 'interior-design'; title = 'Interior Design'; path = 'interior-design/index.html' },
                @{ id = 'digital-marketing'; title = 'Digital Marketing'; path = 'digital-marketing/index.html' },
                @{ id = 'graphic-design'; title = 'Graphic Design'; path = 'graphic-design/index.html' },
                @{ id = 'video-editing'; title = 'Video Editing'; path = 'video-editing/index.html' },
                @{ id = 'branding'; title = 'Branding & Identity'; path = 'branding/index.html' },
                @{ id = 'pricing'; title = 'Pricing Plans'; path = 'pricing/index.html' },
                @{ id = 'team'; title = 'Team Members'; path = 'team/index.html' },
                @{ id = 'faqs'; title = 'FAQs'; path = 'faqs/index.html' },
                @{ id = 'testimonial'; title = 'Testimonials'; path = 'testimonial/index.html' },
                @{ id = 'features'; title = 'Features & Process'; path = 'features/index.html' },
                @{ id = 'blog'; title = 'Blog'; path = 'blog/index.html' },
                @{ id = 'contact'; title = 'Contact Us'; path = 'contact/index.html' },
                @{ id = 'privacy-policy'; title = 'Privacy Policy'; path = 'privacy-policy/index.html' },
                @{ id = 'terms-and-conditions'; title = 'Terms & Conditions'; path = 'terms-and-conditions/index.html' },
                @{ id = 'cookie-policy'; title = 'Cookie Policy'; path = 'cookie-policy/index.html' }
            )

            $result = @()

            foreach ($p in $pages) {
                $filePath = Join-Path $PSScriptRoot $p.path.Replace('/', '\')
                if (-not (Test-Path $filePath)) { continue }

                $html = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
                
                $pageVideos = @()
                $pageImages = @()

                # Extract Video Iframes (YouTube, Vimeo, etc.)
                $iframeMatches = [regex]::Matches($html, '<iframe[^>]*\ssrc=["'']([^"'']+)["''][^>]*>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                foreach ($m in $iframeMatches) {
                    $src = $m.Groups[1].Value
                    if ($src -match 'youtube|vimeo|dailymotion|\.mp4|\.webm') {
                        $pageVideos += @{
                            type = if ($src -match 'youtube') { 'youtube' } elseif ($src -match 'vimeo') { 'vimeo' } else { 'iframe' }
                            src = $src
                            tag = 'iframe'
                        }
                    }
                }

                # Extract HTML5 <video> tags
                $videoMatches = [regex]::Matches($html, '<video[^>]*>([\s\S]*?)<\/video>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                foreach ($vm in $videoMatches) {
                    $inner = $vm.Groups[1].Value
                    $srcMatch = [regex]::Match($inner, 'src=["'']([^"'']+)["'']', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                    if ($srcMatch.Success) {
                        $src = $srcMatch.Groups[1].Value
                        $pageVideos += @{
                            type = 'html5'
                            src = $src
                            tag = 'video'
                        }
                    }
                }

                # Extract Video Links (<a href="...youtube|vimeo|.mp4">)
                $videoLinkMatches = [regex]::Matches($html, '<a[^>]*\shref=["'']([^"'']*(?:youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm)[^"'']*)["''][^>]*>([\s\S]*?)<\/a>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                foreach ($vlm in $videoLinkMatches) {
                    $src = $vlm.Groups[1].Value
                    $pageVideos += @{
                        type = 'videolink'
                        src = $src
                        tag = 'a'
                    }
                }

                # Extract Images
                $imgMatches = [regex]::Matches($html, '<img[^>]*\ssrc=["'']([^"'']+)["''][^>]*>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                $seenImages = @{}
                foreach ($im in $imgMatches) {
                    $fullTag = $im.Value
                    $src = $im.Groups[1].Value
                    if (-not $src -or $seenImages.ContainsKey($src)) { continue }
                    $seenImages[$src] = $true

                    # Extract alt
                    $alt = ''
                    $altMatch = [regex]::Match($fullTag, 'alt=["'']([^"'']*)["'']', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                    if ($altMatch.Success) { $alt = $altMatch.Groups[1].Value }

                    $pageImages += @{
                        src = $src
                        alt = $alt
                    }
                }

                $result += @{
                    id = $p.id
                    title = $p.title
                    path = $p.path
                    videos = $pageVideos
                    images = $pageImages
                }
            }

            $json = ConvertTo-Json -InputObject $result -Depth 5 -Compress
            $b = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($b, 0, $b.Length)
            $response.OutputStream.Close()
            continue
        }

        # Media listing (Images & Videos)
        if ($urlPath -eq '/api/media') {
            $media = @()
            # Images
            $imagesDir = Join-Path $PSScriptRoot "assets\images"
            if (Test-Path $imagesDir) {
                $files = Get-ChildItem -Path $imagesDir -File | Where-Object { $_.Extension -match '(?i)\.(png|jpg|jpeg|webp|svg|gif|ico)$' }
                foreach ($f in $files) {
                    $media += @{
                        name = $f.Name
                        type = 'image'
                        size = $f.Length
                        url = "/assets/images/$($f.Name)"
                    }
                }
            }
            # Videos
            $videosDir = Join-Path $PSScriptRoot "assets\videos"
            if (Test-Path $videosDir) {
                $files = Get-ChildItem -Path $videosDir -File | Where-Object { $_.Extension -match '(?i)\.(mp4|webm|ogg|mov|m4v)$' }
                foreach ($f in $files) {
                    $media += @{
                        name = $f.Name
                        type = 'video'
                        size = $f.Length
                        url = "/assets/videos/$($f.Name)"
                    }
                }
            }
            $json = ConvertTo-Json -InputObject $media -Compress
            $b = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($b, 0, $b.Length)
            $response.OutputStream.Close()
            continue
        }

        # Upload Media (Supports both Images and Videos)
        if ($urlPath -eq '/api/upload-media' -and $request.HttpMethod -eq 'POST') {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            $payload = ConvertFrom-Json $body
            $filename = [System.IO.Path]::GetFileName($payload.filename)
            $base64 = $payload.data
            if ($base64 -match '^data:[^;]+;base64,(.*)$') {
                $base64 = $matches[1]
            }
            $rawBytes = [System.Convert]::FromBase64String($base64)
            
            $ext = [System.IO.Path]::GetExtension($filename).ToLower()
            $isVid = ($ext -match '\.(mp4|webm|ogg|mov|m4v)$')
            $folder = if ($isVid) { "assets\videos" } else { "assets\images" }
            $targetDir = Join-Path $PSScriptRoot $folder
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            $dest = Join-Path $targetDir $filename
            [System.IO.File]::WriteAllBytes($dest, $rawBytes)
            $webUrl = "/$($folder.Replace('\', '/'))/$filename"
            $respJson = ConvertTo-Json @{ success = $true; url = $webUrl; isVideo = $isVid; filename = $filename }
            $b = [System.Text.Encoding]::UTF8.GetBytes($respJson)
            $response.OutputStream.Write($b, 0, $b.Length)
            $response.OutputStream.Close()
            continue
        }
    }

    if ($urlPath -eq '/' -or $urlPath -eq '') {
        $urlPath = '/index.html'
    }

    $relativePath = $urlPath.TrimStart('/').Replace('/', '\')
    $filePath = Join-Path $PSScriptRoot $relativePath

    # Fallback for assets: if any sub-path requests /assets/..., resolve directly to root assets
    if (-not (Test-Path $filePath) -and $urlPath -match '(?i)/assets/(.*)$') {
        $subAsset = $matches[1].Replace('/', '\')
        $rootAsset = Join-Path $PSScriptRoot "assets\$subAsset"
        if (Test-Path $rootAsset -PathType Leaf) {
            $filePath = $rootAsset
        }
    }

    if (Test-Path $filePath -PathType Container) {
        $filePath = Join-Path $filePath 'index.html'
    }

    if (-not (Test-Path $filePath) -and (Test-Path (Join-Path $filePath 'index.html'))) {
        $filePath = Join-Path $filePath 'index.html'
    }

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) {
            $contentType = 'application/octet-stream'
        }

        $response.ContentType = $contentType

        try {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $response.StatusCode = 500
        }
    } else {
        $response.StatusCode = 404
        $errPage = Join-Path $PSScriptRoot "404.html"
        try {
            if (Test-Path $errPage) {
                $response.ContentType = 'text/html; charset=utf-8'
                $bytes = [System.IO.File]::ReadAllBytes($errPage)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $notFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $notFoundMsg.Length
                $response.OutputStream.Write($notFoundMsg, 0, $notFoundMsg.Length)
            }
        } catch {}
    }
    } catch {
        try { $response.StatusCode = 500 } catch {}
    } finally {
        try { $response.OutputStream.Close() } catch {}
        try { $response.Close() } catch {}
    }
}
