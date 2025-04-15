# Path to the version.json file
$jsonFilePath = "C:\Users\Felix\Documents\Projects\couple-task-manager\client\version.json"
# Path to the build.gradle file
$gradleFilePath = "C:\Users\Felix\Documents\Projects\couple-task-manager\client\android\app\build.gradle"
# API endpoint for updating the version
$apiEndpoint = "https://couple-task-manager.duckdns.org/version"

# Function to increment the version number
function Increment-Version {
    param(
        [string]$version
    )

    # Split the version string by the decimal point
    $parts = $version.Split(".")

    if ($parts.Count -gt 0) {
        # Increment the last part (minor version)
        $lastPart = [int]$parts[-1]
        $parts[-1] = ($lastPart + 1).ToString()
        return ($parts -join ".")
    } else {
        # Handle cases where the version format is unexpected
        Write-Error "Invalid version format: $version"
        return $null
    }
}

# Function to read version name from build.gradle
function Get-GradleVersion {
    param(
        [string]$gradlePath
    )
    try {
        $content = Get-Content -Path $gradlePath -Raw
        # Use regex to find the versionName
        $versionNameRegex = 'versionName\s+"([^"]+)"'
        $match = [regex]::Match($content, $versionNameRegex)
        if ($match.Success) {
            return $match.Groups[1].Value  # Return the captured version name
        }
        else {
            Write-Error "versionName not found in build.gradle"
            return $null
        }
    } catch {
        Write-Error "Error reading or parsing the build.gradle file: $_"
        return $null
    }
}

# Function to update versionName in build.gradle
function Update-GradleVersion {
    param(
        [string]$gradlePath,
        [string]$newVersion
    )

    try {
        $content = Get-Content -Path $gradlePath -Raw
        $versionNameRegex = 'versionName\s+"([^"]+)"'
        $content = $content -replace $versionNameRegex, "versionName `"$newVersion`""
        $content | Out-File -FilePath $gradlePath -Encoding UTF8
    } catch {
        Write-Error "Error updating versionName in build.gradle: $_"
        return $false
    }
    return $true
}



# Get the current version from build.gradle
$currentVersion = Get-GradleVersion -gradlePath $gradleFilePath
if ($currentVersion -eq $null) {
    exit 1
}

# Increment the version
$newVersion = Increment-Version -version $currentVersion

if ($newVersion -eq $null) {
    exit 1
}

# Update the version in the build.gradle file
$gradleUpdateResult = Update-GradleVersion -gradlePath $gradleFilePath -newVersion $newVersion
if (!$gradleUpdateResult)
{
    exit 1
}
Write-Host "Version updated in '$gradleFilePath' to: $newVersion"

# Update the version in the version.json file
try {
    $jsonContent = Get-Content -Path $jsonFilePath -Raw | ConvertFrom-Json
    $jsonContent.version = $newVersion
$updatedJson = $jsonContent | ConvertTo-Json -Depth 10
$updatedJson | Out-File -FilePath $jsonFilePath -Encoding UTF8
Write-Host "Version updated in '$jsonFilePath' to: $newVersion"
} catch {
    Write-Error "Error updating version.json: $_"
    exit 1
}

# Send a POST request to the API with the new version
$apiUri = "$apiEndpoint/$newVersion"

try {
    Invoke-RestMethod -Uri $apiUri -Method Post
    Write-Host "Successfully sent POST request to '$apiUri'"
} catch {
    Write-Error "Error sending POST request to '$apiUri': $_"
}