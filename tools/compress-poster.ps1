Add-Type -AssemblyName System.Drawing
$src = 'images\galeria\hero-poster.jpg'
$tmp = 'images\galeria\__tmp.jpg'
$fullSrc = (Resolve-Path $src).Path
$fullTmp = Join-Path (Split-Path $fullSrc -Parent) '__tmp.jpg'

$img = [System.Drawing.Image]::FromFile($fullSrc)
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 70L)

$scale = 1600.0 / $img.Width
$newW = [int]($img.Width * $scale)
$newH = [int]($img.Height * $scale)

$bmp = New-Object System.Drawing.Bitmap($newW, $newH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $newW, $newH)
$g.Dispose()
$bmp.Save($fullTmp, $jpegCodec, $params)
$bmp.Dispose()
$img.Dispose()

Remove-Item $fullSrc -Force
Rename-Item $fullTmp 'hero-poster.jpg'
$fs = (Get-Item 'images\galeria\hero-poster.jpg').Length
Write-Output "Optimized: $([math]::Round($fs/1MB,2)) MB"
