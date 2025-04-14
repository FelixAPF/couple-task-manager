mvn package -D maven.test.skip=true
docker build . -t felixapelletierr/couple-task-manager
docker push felixapelletierr/couple-task-manager