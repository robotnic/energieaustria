REST mit angular-nvd3 frontend. 
Die Daten werden aus diversen (copyright?) Quellen bezogen und in einer Postgres gelagert. 

# API
There is REST API to query Data.
If the Data are not available in the Database, they will be retrieved from the original source.
All data are Cached as bson postgres table.


# Data sources
There are some unstructured function to retrieve the data. Copyright is unclear.


# Install
* clone repository
* npm install
* initialize postgres database

```
psql energy < config/energy.sql
```

# Start
node index.js

## swagger
To use the /openapi you can use a browser plugin like
https://github.com/mshauneu/chrome-swagger-ui

You can also use
http://petstore.swagger.io/ and paste
http://localhost:3000/openapi to the input field (cors is anabled for /openapi);
