cd C:\Users\Felix\Documents\Projects\couple-task-manager\server

Write-Host "Make sure the phone is plugged in";
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown');

mvn package -D maven.test.skip=true
docker build . -t felixapelletierr/couple-task-manager
docker push felixapelletierr/couple-task-manager
./increment_back_end_version.ps1
cd ../client
ng build --configuration="production"
npx cap copy
npx cap open android
cd ../server