cd ../client
ng build --configuration="production"
npx cap copy
npx cap open android
.\increment_version.ps1 -FilePath ..\client\android\app\build.gradle