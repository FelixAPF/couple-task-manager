cd client
ng build --configuration=production
cd ..
cd server
docker build . -t felixapelletierr/couple-task-manager
docker push felixapelletierr/couple-task-manager
pause