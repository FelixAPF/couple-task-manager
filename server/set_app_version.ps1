# --- Configuration ---
$gradleFilePath = "C:\Users\Felix\Documents\Projects\couple-task-manager\client\android\app\build.gradle"
$jsonFilePath = "C:\Users\Felix\Documents\Projects\couple-task-manager\client\version.json"
$baseApiUrl = "https://server.coupletaskmanager.com/version" # Base URL for the API endpoint

# --- 1. Ask for Version Input ---
Write-Host "Current files to be updated:"
Write-Host " - Gradle: $gradleFilePath"
Write-Host " - JSON:   $jsonFilePath"
Write-Host "API endpoint base: $baseApiUrl"
Write-Host ""

$newVersion = Read-Host -Prompt "Enter the new version number (e.g., 1.99)"

# Basic validation (optional but recommended)
if ([string]::IsNullOrWhiteSpace($newVersion)) {
    Write-Error "Version number cannot be empty."
    exit 1
}
# You could add more validation here (e.g., regex for format X.Y.Z)

Write-Host "Updating to version: $newVersion" -ForegroundColor Cyan

# --- 2. Make POST Call ---
$apiUrl = "$baseApiUrl/$newVersion"
Write-Host "Making POST request to: $apiUrl" -ForegroundColor Cyan
try {
    # Using Invoke-RestMethod for simplicity, assuming no complex headers/body needed beyond the URL path
    # Use -Method POST. If the endpoint expects data, add -Body or adjust ContentType
    Invoke-RestMethod -Uri $apiUrl -Method Post -ErrorAction Stop 
    Write-Host "POST request successful." -ForegroundColor Green
} catch {
    Write-Warning "Failed to make POST request to $apiUrl."
    Write-Warning "Error: $($_.Exception.Message)"
    # Decide if you want to stop the script or continue
    # exit 1 # Uncomment to stop script on API failure
}

# --- 3. Update build.gradle ---
Write-Host "Updating $gradleFilePath..." -ForegroundColor Cyan
try {
    # Check if file exists
    if (-not (Test-Path $gradleFilePath -PathType Leaf)) {
        throw "Gradle file not found at $gradleFilePath"
    }

    # Read the file content
    $gradleContent = Get-Content $gradleFilePath -Raw

    # Define the regex pattern to find: versionName "some.version"
    # It captures the part before the version, the version itself, and the part after
    $pattern = '(\s*versionName\s+")([^"]+)("\s*)'

    # Check if the pattern exists
    if ($gradleContent -match $pattern) {
        # Replace the captured version part (group 2) with the new version
        $newGradleContent = $gradleContent -replace $pattern, ('${1}' + $newVersion + '${3}') # Use captured groups $1 and $3

        # Write the modified content back to the file
        Set-Content -Path $gradleFilePath -Value $newGradleContent -Force -Encoding UTF8
        Write-Host "build.gradle updated successfully." -ForegroundColor Green
    } else {
        Write-Warning "Pattern 'versionName ""...""' not found in $gradleFilePath. File not updated."
    }
} catch {
    Write-Error "Failed to update $gradleFilePath."
    Write-Error "Error: $($_.Exception.Message)"
    exit 1 # Stop script on file update failure
}

# --- 4. Update version.json ---
Write-Host "Updating $jsonFilePath..." -ForegroundColor Cyan
try {
    # Check if file exists
    if (-not (Test-Path $jsonFilePath -PathType Leaf)) {
        throw "JSON file not found at $jsonFilePath"
    }

    # Read the JSON file content
    $jsonContent = Get-Content $jsonFilePath -Raw

    # Parse the JSON content
    $jsonObject = $jsonContent | ConvertFrom-Json

    # Update the version property
    $jsonObject.version = $newVersion

    # Convert back to JSON format (with indentation)
    $newJsonContent = $jsonObject | ConvertTo-Json -Depth 5 # Adjust depth if needed

    # Write the modified JSON back to the file
    Set-Content -Path $jsonFilePath -Value $newJsonContent -Force -Encoding UTF8
    Write-Host "version.json updated successfully." -ForegroundColor Green

} catch {
    Write-Error "Failed to update $jsonFilePath."
    Write-Error "Error: $($_.Exception.Message)"
    exit 1 # Stop script on file update failure
}

Write-Host ""
Write-Host "Version update process completed for version $newVersion." -ForegroundColor Green
