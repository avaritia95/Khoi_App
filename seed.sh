#! /bin/bash

sudo mongoimport --host '192.168.1.106' --db mydb --collection Email --type json --file /email.json --jsonArray
sudo mongoimport --host '192.168.1.106' --db mydb --collection Project --type json --file /project.json