#!/usr/bin/python

import contentapi
import time
import sys

client = contentapi.ContentApiClient("localhost", 8080, "/onecms")
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

    try:
        print "-- Reading content 1.116..."
        content, etag = client.read(token, "1.116", None)
        print "-- Successfully read content! {0}.{1}".format(content["id"], content["version"])
    except Exception, Argument:
        print "-- Failed to read content: {0}".format(Argument)
        sys.exit(1)

    if content:
        content["contentData"]["title"] = "An updated article {0}".format(int(time.time()))

        # this cannot be included when creating/updating content
        del content["meta"]

        try:
            print "-- Updating content..."
            response, etag = client.update(token, content, etag)
            print "-- Successfully updated content! {0}.{1}".format(response["id"], response["version"])
        except Exception as e:
            print "-- Failed to update content: {0}".format(e)
            sys.exit(1)

        try:
            print "-- Creating content..."
            content["contentData"]["title"] = "A created article {0}".format(int(time.time()))
            response, etag = client.create(token, content)
            print "-- Successfully created content! {0}.{1}".format(response["id"], response["version"])
        except Exception as e:
            print "-- Failed to create content: {0}".format(e)
            sys.exit(1)

        try:
            print "-- Searching for content..."
            response = client.search(token, "public", "text:science")
            print "-- Successfully searched for content! Got {0} hits.".format(response["response"]["numFound"])
        except Exception as e:
            print "-- Failed to search for content: {0}".format(e)
            sys.exit(1)

        try:
            print "-- Invalidating token..."
            response = client.invalidateToken(token)
            print "-- Successfully invalidated token!"
        except Exception as e:
            print "-- Failed to invalidate token: {0}".format(e)
            sys.exit(1)
