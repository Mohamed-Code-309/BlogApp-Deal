# BlogApp-Deal
Deal App - Repository

### Database Dump File:

- check mongodb dump file ```blog-dump.gzip``` contain the same data as ```blog_sample-db.gzip``` except that all users passwords are encrypted using ```bcrypt``` with salt rounds equal to ```10``` 

- you can restore the data on your local mongodb datbase using the command:
```mongorestore --host localhost:27017 --gzip --archive=blog-dump.gzip --db blog``` just make sure that databse name is ```blog``` and you have ```mongorestore``` utility tool on your machine


### How to run/test the application:
- to run the application: ```npm start```
- install dependencies: ```npm install```
- to run integration tests ```npm test```
- server is running on: http://localhost:3000/
- swagger API documentation can be found on: http://localhost:3000/api-docs/
- all normal users have the same password: ```123456```
- admin should login via **email**: ```admin@deal.com``` - **password**: ```deal123```

