# BD AND DOCKER SECTION GUIDE 

## Deploying an image 
For using DB you need to deploy the docker image by running `docker compose up` command, you have to be in a directory where `docker-compose.yml` file is.

## Backend API was changed
You have to *rebuild* your docker image *every time* the *backend* API was *changed*, using `docker compose up --build api`

## Models in DB were changed
### You have relevant migrations
If models in the DB were changed then you have new migrations, in most cases you do. If that's true, you need to go to .csproj directory and run `dotnet ef database update` command, it changes your docker-deployed DB accordingly to the migrations.

### You don't have relevant migrations
...

---
# PG ADMIN

pgAdmin is provided through docker deploying. At the first time deploying docker image with pgAdmin in it, docker will pull image of pgAding from it's catalog - Docker Hub.

## How to use pgAdmin
There is pgAdmin's web version so you need to:
1. Deploy docker the docker image
2. Go to browser and search for ***http://localhost:1488*** URL

Now, if everything is correct, you're at the login screen, here is data for you to log in:
- Email: tutunberg@eco.com 
- Password: meteo

