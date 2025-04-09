
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

# Regular expression to find the versionCode line
$regex = '^\s*versionCode\s+"([^"]+)"'

# Find the line matching the pattern
$versionCodeLine = $content | Where-Object { $_ -match $regex }

if ($versionCodeLine) {
    Write-Host "Found the versionCodeLine line: '$versionCodeLine'"

    # Extract the current version name
    $versionCode = $Matches[1]
    Write-Host "Current versionCode: '$versionCode'"

    # Try to increment the version name
    if ($currentVersion -match '^(\d+)\') {
        $newVersion = $currentVersion + 1
        Write-Host "Incremented minor version to: '$newVersion'"
    }

    # Create the new versionName line
    $newVersionCodeLine = '    versionCode "' + $versionCodeLine + '"'
    Write-Host "New versionName line will be: '$newVersionNameLine'"

    # Replace the old line with the new line
    $newContent = $content -replace $versionCodeLine, $newVersionCodeLine

    # Write the updated content back to the file
    $newContent | Set-Content $FilePath
    Write-Host "Successfully wrote the updated content to '$FilePath'."
    Write-Host "versionName has been incremented from '$currentVersion' to '$newVersion'."
} else {
    Write-Warning "Could not find the 'versionName' property in '$FilePath'."
}