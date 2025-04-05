param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

Write-Host "Running script to increment versionName in '$FilePath'"

# Check if the file exists
if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: '$FilePath'"
    exit 1
}

# Read the content of the file
$content = Get-Content $FilePath
Write-Host "Successfully read the content of '$FilePath'"

# Regular expression to find the versionName line
$regex = '^\s*versionName\s+"([^"]+)"'

# Find the line matching the pattern
$versionNameLine = $content | Where-Object { $_ -match $regex }

if ($versionNameLine) {
    Write-Host "Found the versionName line: '$versionNameLine'"

    # Extract the current version name
    $currentVersion = $Matches[1]
    Write-Host "Current versionName: '$currentVersion'"

    # Try to increment the version name
    if ($currentVersion -match '^(\d+)\.(\d+)$') {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        $newMinor = $minor + 1
        $newVersion = "$major.$newMinor"
        Write-Host "Incremented minor version to: '$newVersion'"
    } elseif ($currentVersion -match '^(\d+)$') {
        $major = [int]$Matches[1]
        $newVersion = "$($major + 1).0"
        Write-Host "Incremented major version to: '$newVersion'"
    } else {
        Write-Warning "Could not automatically increment versionName '$currentVersion'. Please update it manually."
        exit 0
    }

    # Create the new versionName line
    $newVersionNameLine = '    versionName "' + $newVersion + '"'
    Write-Host "New versionName line will be: '$newVersionNameLine'"

    # Replace the old line with the new line
    $newContent = $content -replace $versionNameLine, $newVersionNameLine

    # Write the updated content back to the file
    $newContent | Set-Content $FilePath
    Write-Host "Successfully wrote the updated content to '$FilePath'."
    Write-Host "versionName has been incremented from '$currentVersion' to '$newVersion'."
} else {
    Write-Warning "Could not find the 'versionName' property in '$FilePath'."
}