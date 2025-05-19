#Requires -Version 5.1 # Specify minimum PowerShell version if needed

# --- Configuration ---
$gradleFilePath = "C:\Users\Felix\Documents\Projects\couple-task-manager\client\android\app\build.gradle"
$jsonFilePath = "C:\Users\Felix\Documents\Projects\couple-task-manager\client\version.json"
$baseApiUrl = "https://server.coupletaskmanager.com/version" # Base URL for the API endpoint

# --- 0. Display Current Versions ---
Write-Host "--- Current Version Information ---" -ForegroundColor Yellow

# Get version from API
try {
    # Set a timeout for the web request (e.g., 15 seconds)
    $apiResponse = Invoke-RestMethod -Uri $baseApiUrl -Method Get -ErrorAction Stop -TimeoutSec 15
    $apiVersionDisplay = "" # Initialize to an empty string

    if ($null -ne $apiResponse) {
        # Try to determine the version from the API response
        if ($apiResponse -is [string] -and $apiResponse -match '^\d+(\.\d+)*$') {
            # Case 1: API returns the version as a plain string that looks like a version
            $apiVersionDisplay = $apiResponse
        } elseif ($apiResponse.PSObject.Properties.Name -contains 'version' -and $null -ne $apiResponse.version) {
            # Case 2: API returns JSON like {"version": "1.2.3"}
            $potentialVersionFromJson = "$($apiResponse.version)"
            if ($potentialVersionFromJson -match '^\d+(\.\d+)*$') {
                $apiVersionDisplay = $potentialVersionFromJson
            } else {
                Write-Warning "API response contained a 'version' property, but its value '$potentialVersionFromJson' does not look like a standard version."
                $apiVersionDisplay = "N/A (API 'version' property invalid format)"
            }
        } else {
            # Case 3: API response is not a direct string or known JSON object.
            # Try converting the whole response to a string and check if it looks like a version.
            # This handles cases where the API returns a number (e.g., 2.04) directly.
            $potentialVersionDirect = "$($apiResponse)"
            if ($potentialVersionDirect -match '^\d+(\.\d+)*$') {
                $apiVersionDisplay = $potentialVersionDirect
            } else {
                # If none of the above, then it's an unknown format
                $responsePreview = $apiResponse | ConvertTo-Json -Depth 1 -Compress -WarningAction SilentlyContinue
                Write-Warning "API response at $baseApiUrl was in an unexpected format. Response preview: $responsePreview"
                $apiVersionDisplay = "N/A (Unknown API format)"
            }
        }

        # Display the parsed API version with appropriate color
        if (-not ([string]::IsNullOrWhiteSpace($apiVersionDisplay)) -and $apiVersionDisplay -notlike "N/A*") {
             Write-Host " - Current version from API ($baseApiUrl): $apiVersionDisplay" -ForegroundColor Green
        } else {
             Write-Host " - Current version from API ($baseApiUrl): $apiVersionDisplay" -ForegroundColor Yellow # Or Red if it's a critical failure
        }

    } else {
        # Handle cases where $apiResponse is $null (e.g. API returns empty body with 200 OK)
        Write-Host " - Current version from API ($baseApiUrl): No content returned." -ForegroundColor Yellow
        $apiVersionDisplay = "N/A (No content from API)" # Ensure $apiVersionDisplay is set
    }
} catch {
    Write-Warning "Failed to fetch or process version from API: $baseApiUrl"
    Write-Warning "  Error details: $($_.Exception.Message)"
    Write-Host " - Current version from API ($baseApiUrl): Error fetching." -ForegroundColor Red
    $apiVersionDisplay = "N/A (Error fetching)" # Ensure $apiVersionDisplay is set on error
}

# Get version from local version.json
if (Test-Path $jsonFilePath -PathType Leaf) {
    try {
        $localJsonContent = Get-Content $jsonFilePath -Raw
        $localJsonObject = $localJsonContent | ConvertFrom-Json -ErrorAction Stop
        if ($localJsonObject.PSObject.Properties.Name -contains 'version') {
            $localFileVersion = $localJsonObject.version
            Write-Host " - Current version from local ${jsonFilePath}: $localFileVersion" -ForegroundColor Green
        } else {
            Write-Warning "Property 'version' not found in ${jsonFilePath}."
            Write-Host " - Current version from local ${jsonFilePath}: 'version' property missing." -ForegroundColor Yellow
        }
    } catch {
        Write-Warning "Failed to read or parse ${jsonFilePath}."
        Write-Warning "  Error details: $($_.Exception.Message)"
        Write-Host " - Current version from local ${jsonFilePath}: Error reading/parsing." -ForegroundColor Red
    }
} else {
    Write-Warning "Local version file not found: ${jsonFilePath}"
    Write-Host " - Current version from local ${jsonFilePath}: File not found." -ForegroundColor Yellow
}
Write-Host "---------------------------------" -ForegroundColor Yellow
Write-Host "" # Add a blank line for better separation


$newVersion = Read-Host -Prompt "Enter the new version number (e.g., 1.99)"

# Basic validation
if ([string]::IsNullOrWhiteSpace($newVersion)) {
    Write-Error "Version number cannot be empty."
    exit 1
}
# Regex to validate format like X.Y or X.Y.Z (allows for minor versions too)
if ($newVersion -notmatch '^\d+(\.\d+){1,2}$') { # Expects X.Y or X.Y.Z
    Write-Warning "Version format '$newVersion' might not be standard (expected X.Y or X.Y.Z, e.g., 1.99 or 1.0.0)."
    # Consider making this an error and exiting if strict format is required:
    # Write-Error "Invalid version format. Please use X.Y or X.Y.Z (e.g., 1.99 or 1.0.0)."
    # exit 1
}


Write-Host "Updating to version: $newVersion" -ForegroundColor Cyan

# --- 2. Make POST Call ---
$apiUrlPost = "$baseApiUrl/$newVersion" # For POST, the new version is appended to the base URL
Write-Host "Making POST request to: $apiUrlPost" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri $apiUrlPost -Method Post -ErrorAction Stop
    Write-Host "POST request successful." -ForegroundColor Green
} catch {
    Write-Warning "Failed to make POST request to $apiUrlPost."
    Write-Warning "Error: $($_.Exception.Message)"
    # exit 1 # Uncomment to stop script on API failure
}

# --- 3. Update build.gradle ---
Write-Host "Updating ${gradleFilePath}..." -ForegroundColor Cyan
try {
    if (-not (Test-Path $gradleFilePath -PathType Leaf)) {
        throw "Gradle file not found at ${gradleFilePath}"
    }

    $gradleContent = Get-Content $gradleFilePath -Raw
    $pattern = '(\s*versionName\s+")([^"]+)("\s*)'

    if ($gradleContent -match $pattern) {
        $newGradleContent = $gradleContent -replace $pattern, ('${1}' + $newVersion + '${3}')
        $utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($gradleFilePath, $newGradleContent, $utf8NoBomEncoding)
        Write-Host "${gradleFilePath} updated successfully (UTF8 without BOM)." -ForegroundColor Green
    } else {
        Write-Warning "Pattern 'versionName ""...""' not found in ${gradleFilePath}. File not updated."
    }
} catch {
    Write-Error "Failed to update ${gradleFilePath}."
    Write-Error "Error: $($_.Exception.Message)"
    exit 1
}

# --- 4. Update version.json ---
Write-Host "Updating ${jsonFilePath}..." -ForegroundColor Cyan
try {
    if (-not (Test-Path $jsonFilePath -PathType Leaf)) {
        throw "JSON file not found at ${jsonFilePath}"
    }

    $jsonContent = Get-Content $jsonFilePath -Raw
    $jsonObject = $jsonContent | ConvertFrom-Json
    $jsonObject.version = $newVersion
    $newJsonContent = $jsonObject | ConvertTo-Json -Depth 5
    $utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($jsonFilePath, $newJsonContent, $utf8NoBomEncoding)
    Write-Host "${jsonFilePath} updated successfully (UTF8 without BOM)." -ForegroundColor Green

} catch {
    Write-Error "Failed to update ${jsonFilePath}."
    Write-Error "Error: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "Version update process completed for version $newVersion." -ForegroundColor Green
