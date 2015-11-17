#!/bin/bash
# $1 = solr_query; $2 = variant
# (try with variant=com.atex.plugins.grid.teaserable)
. conf.sh

FORMAT=json


if [[ -n $2 ]]; then
  VARIANT="&variant=$2"
fi

curl -v $CURL_PARAMS -L -H "X-Auth-Token: $TOKEN" -H "Accept: application/$FORMAT;pretty=true" "$BASE_URL/search/public/select?q=$1$VARIANT"

