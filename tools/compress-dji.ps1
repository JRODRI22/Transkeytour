Add-Type -AssemblyName System.Drawing

$backupDir = 'tools\_backup_assets\dji_photos'
$destDir = 'images\galeria'

$files = Get-ChildItem $backupDir -Filter '*.JPG'

foreach ($f in $files) {
    $dest = Join-Path $destDir $f.Name
    $tmp = Join-Path $destDir ('__tmp_' + $f.Name)
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 75L)

    $scale = 1600.0 / $img.Width
    $newW = [int]($img.Width * $scale)
    $newH = [int]($img.Height * $scale)

    $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $newW, $newH)
    $g.Dispose()
    $bmp.Save($tmp, $jpegCodec, $params)
    $bmp.Dispose()
    $img.Dispose()

    if (Test-Path $dest) { Remove-Item $dest -Force }
    Rename-Item $tmp $f.Name
    $fs = (Get-Item $dest).Length
    Write-Output "$($f.Name): $([math]::Round($fs/1MB,2)) MB"
}
