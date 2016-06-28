#!/usr/bin/python

import contentapi
import time
import sys

client = contentapi.ContentApiClient("localhost", 8081, "/content-hub/onecms")
content = None
etag = None
result = None
token = None

try:
    print "-- searching..."
    result = client.search(token, "internal", "inputTemplate:com.polopoly.data.Variant.config",
                           variant="atex.onecms.variantmodel"); #"inputTemplate:com.atex.onecms.content.ContentManager.config")
    print "-- Successful search! found {0}: \n{1}".format(result["response"]["numFound"], result)
except Exception, Argument:
    print "-- Failed to search content: {0}".format(Argument)
    sys.exit(1)

