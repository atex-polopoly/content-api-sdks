#!/bin/bash
# $1 = solr_query; $2 = variant
# (try with variant=com.atex.plugins.grid.teaserable)
. conf.sh

FORMAT=json

if [[ -z $INDEX ]]; then
  INDEX="onecms"
fi

if [[ -n $2 ]]; then
  VARIANT="&variant=$2"
fi

curl $CURL_PARAMS -L -H "X-Auth-Token: $TOKEN" -H "Accept: application/$FORMAT;pretty=true" "$BASE_URL/search/$INDEX/select?q=$1$VARIANT"

