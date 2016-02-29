#!/usr/bin/python

import contentapi
import time
import sys
import json

class ClipboardItem:
    def __init__(self, id, type):
        self._id = id
        self._type = type

#    def __repr__(self):
#        return json.dumps(self.__dict__)


class Clipboard:
    def __init__(self, host, port, path, user, password, userid):
        self._contentapi = contentapi.ContentApiClient(host, port, path)
        self._token = self.getToken(user, password)
        self._userid = userid

    def getToken(self, user, password):
        try:
            response = self._contentapi.authenticate(user, password)
            return response['token']
        except Exception as e:
            print "Failed to authenticate" + str(e)
            sys.exit(1)

    def copy(self, contentId):
        content = self.readContent(contentId)
#        print json.dumps(content["aspects"]["contentData"]["data"], indent=4)
        item = { 'id' : 'contentid/' + contentId, 'type': content["aspects"]["contentData"]["data"]["_type"] }
#        item = ClipboardItem(contentId, content["aspects"]["contentData"]["data"]["_type"])
        data = [ item ]
        
        creationData = {
            'operations': [
                {
                    '_type': 'com.atex.onecms.content.SetAliasOperation',
                    'namespace': 'externalId',
                    'alias': 'atex.onecms.Clipboard-' + self._userid
                }
            ],
            'aspects': {
#                'p.InsertionInfo': {
#                    'data': {
#                        '_type': 'p.InsertionInfo',
#                        'securityParentId': 'externalid/' + self._userid
#                    }
#                },
                'contentData': {
                    'data': {
                        '_type': 'com.atex.onecms.clipboard.OneCMSClipboardBean',

                        'description': 'Copied from a OneCMS application',
                        'content': data
                    }
                }
            }
        }
        print json.dumps(creationData, indent=4)
        result = self._contentapi.create(self._token, creationData)

    def readContent(self, contentId):
        try:
            print "-- Reading content..."
            content, etag = self._contentapi.read(self._token, contentId, None)
            print "-- Successfully read content! {0}".format(content["version"])
            return content
        except Exception, Argument:
            print "-- Failed to read content: {0}".format(Argument)
            sys.exit(1)


client = Clipboard("localhost", 8080, "/onecms", "edmund", "edmund", "3000")
client.copy("1.116")


