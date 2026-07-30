$p = 'index-final.html'
$c = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)

$c = $c.Replace("Para" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xAD + "so", "Para" + [char]0xC3 + [char]0xAD + "so")
$c = $c.Replace("para" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xAD + "so", "para" + [char]0xC3 + [char]0xAD + "so")
$c = $c.Replace("caribe" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xB1 + "a", "caribe" + [char]0xC3 + [char]0xB1 + "a")
$c = $c.Replace("caribe" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xB1 + "as", "caribe" + [char]0xC3 + [char]0xB1 + "as")
$c = $c.Replace("h" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xA1 + "bitat", "h" + [char]0xC3 + [char]0xA1 + "bitat")
$c = $c.Replace([char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBA + "nica", [char]0xC3 + [char]0xBA + "nica")
$c = $c.Replace([char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBA + "nico", [char]0xC3 + [char]0xBA + "nico")
$c = $c.Replace("s" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBA + "per", "s" + [char]0xC3 + [char]0xBA + "per")
$c = $c.Replace("f" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xA1 + "cil", "f" + [char]0xC3 + [char]0xA1 + "cil")
$c = $c.Replace("gu" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xAD + "as", "gu" + [char]0xC3 + [char]0xAD + "as")
$c = $c.Replace("rinc" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xB3 + "n", "rinc" + [char]0xC3 + [char]0xB3 + "n")
$c = $c.Replace([char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBA + "ltima", [char]0xC3 + [char]0xBA + "ltima")
$c = $c.Replace("afrocaribe" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xB1 + "as", "afrocaribe" + [char]0xC3 + [char]0xB1 + "as")
$c = $c.Replace("ind" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xAD + "genas", "ind" + [char]0xC3 + [char]0xAD + "genas")
$c = $c.Replace("Celebraci" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xB3 + "n", "Celebraci" + [char]0xC3 + [char]0xB3 + "n")
$c = $c.Replace("m" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBA + "sica", "m" + [char]0xC3 + [char]0xBA + "sica")
$c = $c.Replace("Ng" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xA4 + "be-Bugl" + [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xA9, "Ng" + [char]0xC3 + [char]0xA4 + "be-Bugl" + [char]0xC3 + [char]0xA9)

[System.IO.File]::WriteAllText($p, $c, (New-Object System.Text.UTF8Encoding $false))
$c2 = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
$remaining = ([regex]::Matches($c2, [regex]::Escape([char]0xC3) + [char]0x83)).Count
Write-Output "Remaining C3 83 (double-encoded): $remaining"
