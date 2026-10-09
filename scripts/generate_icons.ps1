Add-Type -AssemblyName System.Drawing

$srcPath = "d:\ENS\OASE MEDIKA\sidorav2\public\logo-sidora.png"
$src = [System.Drawing.Image]::FromFile($srcPath)

function MakeSquareIcon($size, $destPath, $padPercent) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background putih bersih sesuai permintaan user
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $brush.Dispose()

    # Hitung posisi agar logo 2:1 berada pas di tengah
    $availW = $size * (1 - ($padPercent * 2))
    $availH = $availW / 2
    $x = ($size - $availW) / 2
    $y = ($size - $availH) / 2

    $g.DrawImage($src, [int]$x, [int]$y, [int]$availW, [int]$availH)
    $g.Dispose()

    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Successfully generated: $destPath ($size x $size)"
}

MakeSquareIcon 192 "d:\ENS\OASE MEDIKA\sidorav2\public\icons\icon-192.png" 0.08
MakeSquareIcon 512 "d:\ENS\OASE MEDIKA\sidorav2\public\icons\icon-512.png" 0.08
MakeSquareIcon 512 "d:\ENS\OASE MEDIKA\sidorav2\public\icons\icon-maskable.png" 0.15
MakeSquareIcon 180 "d:\ENS\OASE MEDIKA\sidorav2\public\icons\apple-touch-icon.png" 0.08
MakeSquareIcon 64 "d:\ENS\OASE MEDIKA\sidorav2\public\favicon.png" 0.06

$src.Dispose()
Write-Output "All icons successfully created!"
