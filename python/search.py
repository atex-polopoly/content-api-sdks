#!/usr/bin/python

import contentapi
import time
import sys

client = contentapi.ContentApiClient("localhost", 8081, "/content-hub")
token = None
try:
    print "-- Authenticating..."
    response = client.authenticate('edmund', 'edmund')
    token = response['token']
    print "-- Successfully authenticated!"
except Exception as e:
    print "-- Failed to authenticate: {0}".format(e)

if token:
    content = None
    etag = None
    result = None

    try:
        print "-- searching..."
        result = client.search(token, "internal", "inputTemplate:com.polopoly.data.Variant.config"); #"inputTemplate:com.atex.onecms.content.ContentManager.config")
        print "-- Successful search! found {0}: \n{1}".format(result["response"]["numFound"], result)
    except Exception, Argument:
        print "-- Failed to search content: {0}".format(Argument)
        sys.exit(1)

