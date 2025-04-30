cd ../client
ng build --configuration="production"
npx cap copy
npx cap open android
docker build . -t felixapelletierr/couple-task-manager-front-end
docker push felixapelletierr/couple-task-manager-front-end
.\increment_version.ps1 -FilePath ..\client\android\app\build.gradle