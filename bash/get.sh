#!/bin/bash
# $1 = 1.123 || my.article
. conf.sh

FORMAT=json

if [[ -z $PREFIX ]]; then
    PREFIX="externalid"
  if [[ $1 =~ [0-9]+\.[0-9]+$ ]]; then 
    PREFIX="contentid"
  fi
  if [[ $1 =~ onecms  ]]; then 
    PREFIX="contentid"
  fi
fi


if [[ -n $2 ]]; then
  VARIANT="?variant=$2"
fi

curl $CURL_PARAMS -H "X-Auth-Token: $TOKEN" -H "Accept: application/$FORMAT;pretty=true" "$BASE_URL/content/$PREFIX/$1$VARIANT" 
