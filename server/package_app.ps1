cd C:\Users\Felix\Documents\Projects\couple-task-manager\server

Write-Host "Make sure the phone is plugged in";
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown');

mvn package -D maven.test.skip=true
docker build . -t felixapelletierr/couple-task-manager
docker push felixapelletierr/couple-task-manager
$headers=@{}
$headers.Add("accept", "application/json")
$headers.Add("content-type", "application/json")
$headers.Add("authorization", "Bearer rnd_hdKj06DAnaUnyZEWaIJhDw09mVTS")
$response = Invoke-WebRequest -Uri 'https://api.render.com/v1/services/srv-cvedd6bv2p9s73dlmt90/deploys' -Method POST -Headers $headers -ContentType 'application/json' -Body '{"clearCache":"do_not_clear"}'
cd ../client
ng build --configuration="production"
npx cap copy
npx cap open android