#!/bin/bash
# $1 = 1.123 || my.article
. conf.sh

FORMAT=json

PREFIX="externalid"
if [[ $1 =~ [0-9]+\.[0-9]+$ ]]; then 
  PREFIX="contentid"
fi


if [[ -n $2 ]]; then
  VARIANT="?variant=$2"
fi

curl -v $CURL_PARAMS -H "X-Auth-Token: $TOKEN" -H "Accept: application/$FORMAT;pretty=true" "$BASE_URL/content/$PREFIX/$1$VARIANT" 
