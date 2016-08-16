BASE_URL=${BASE_URL:-"http://localhost:8080/ace"}
TOKEN_JSON=token.json
TOKEN=`cat $TOKEN_JSON | sed -E 's/.*token":\"([^"]*).*/\1/'`
CURL_PARAMS="-L"   #add -v for debug
