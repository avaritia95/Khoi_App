#! /bin/bash
mongoimport --host '127.0.0.1' --db mydb --collection Project --type json --file /docker-entrypoint-initdb.d/project.json --jsonArray
mongoimport --host '127.0.0.1' --db mydb --collection Email --type json --file /docker-entrypoint-initdb.d/email.json --jsonArray
