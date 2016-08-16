#!/bin/bash
# $1 = 1.123 || my.article
. conf.sh

FORMAT=json

curl -v $CURL_PARAMS -H "X-Auth-Token: $TOKEN" -H "Accept: application/$FORMAT;pretty=true" "$BASE_URL/contentinfo/externalid/$1" 
