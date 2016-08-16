#!/bin/bash
# $1=data_file_json
. conf.sh


curl -L -d @$1 -X POST -H "X-Auth-Token: $TOKEN" -H "Content-Type: application/json" $BASE_URL/content
