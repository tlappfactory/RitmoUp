
Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param([string]$InputFile, [string]$OutputFile, [int]$Width, [int]$Height)

    if (-not (Test-Path $InputFile)) {
        Write-Host "Error: File not found: $InputFile"
        return
    }

    try {
        $img = [System.Drawing.Image]::FromFile($InputFile)
        $res = new-object System.Drawing.Bitmap $Width, $Height
        $graph = [System.Drawing.Graphics]::FromImage($res)
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graph.DrawImage($img, 0, 0, $Width, $Height)
        $img.Dispose()
        $res.Save($OutputFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $res.Dispose()
        $graph.Dispose()
        Write-Host "Successfully created $OutputFile ($Width x $Height)"
    } catch {
        Write-Host "Error processing $InputFile : $_"
    }
}

$basePath = "$PSScriptRoot\google_play_assets"

# Resize Icon
Resize-Image "$basePath\icon.png" "$basePath\icon_fixed.png" 512 512

# Resize Feature Graphic
Resize-Image "$basePath\feature_graphic.png" "$basePath\feature_graphic_fixed.png" 1024 500
