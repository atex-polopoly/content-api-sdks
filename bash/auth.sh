#!/bin/bash
. conf.sh

curl $CURL_PARAMS -d @credentials.json -X POST -H 'Content-Type: application/json' $BASE_URL/security/token > $TOKEN_JSON 2>/dev/null
cat $TOKEN_JSON
echo 
