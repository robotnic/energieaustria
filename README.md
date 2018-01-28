REST mit angular-nvd3 frontend. 
Die Daten werden aus diversen (copyright?) Quellen bezogen und in einer Postgres gelagert. 

Hier kann man sehen wie die Stromerzeugung ausschauen würde, wenn man PV *10 und Wind *3 einstellt
![modified chart](https://raw.githubusercontent.com/robotnic/energieaustria/master/doc/screenshots/energyaustriaexmaplechart.png)

Das Ziel dieses Projektes ist es, einen Plan zu bekommen wie unsere nachhaltige Energiezukunft ausschauen könnte.

# API
There is REST API to query Data.
If the Data are not available in the Database, they will be retrieved from the original source.
All data are Cached as bson in postgres table.


# Data sources
There are some unstructured function to retrieve the data. Copyright is unclear.


# Install
* clone repository
* npm install
* initialize postgres database

```
psql energy < config/energy.sql
```
Feel free to host a live version.

# Start
node index.js

## swagger
To use the [/openapi](http://localhost:3000/openapi) you can use a browser plugin like
https://github.com/mshauneu/chrome-swagger-ui .
You can find it in the 
[chrome store](https://chrome.google.com/webstore/detail/swagger-ui-console/ljlmonadebogfjabhkppkoohjkjclfai?utm_source=chrome-app-launcher-info-dialog).

![swagger](https://raw.githubusercontent.com/robotnic/energieaustria/master/doc/screenshots/swagger.png)
