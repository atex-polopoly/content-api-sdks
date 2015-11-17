#!/bin/bash
# $1=versioned|unversionedContentId
# $2=Etag
# $3=data_file_json
. conf.sh

if [ "$#" -ne 3 ]; then
    echo "arguments: versioned|unversionedContentId Etag data_file_json"
fi

curl -L -d @$3 -X PUT -H "X-Auth-Token: $TOKEN" -H "Content-Type: application/json" -H "If-Match: \"$2\"" "$BASE_URL/content/contentid/$1"
