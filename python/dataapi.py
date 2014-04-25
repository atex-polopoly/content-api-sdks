#!/usr/bin/python

import urllib
import httplib
import json
import re

class Client:

    _auth = "/security/token"
    _readContentId = "/content/contentid/"
    _readExternalId = "/content/externalid/"
    _create = "/content"
    _search = "/search"

    def __init__(self, host, port, path):
        self._host = host
        self._port = port
        self._path = path

    def _makeRequest(self, method, path, token=None, payload=None, customHeaders=None):
        connection = httplib.HTTPConnection(self._host, self._port)

        headers = {
          "Content-Type": "application/json",
        }

        if customHeaders != None: headers.update(customHeaders)
        if token != None: headers['X-Auth-Token'] = token

        connection.request(
            method=method,
            url=path,
            body=json.dumps(payload),
            headers=headers
        )

        response = connection.getresponse()

        if response.status == 204:
          return None, response.getheader('ETag')
        else:
          jsonData = json.loads(response.read())
          if response.status in [401, 403, 404, 400, 409, 500]:
              raise Exception("HTTP {0}: {1}".format(response.status, jsonData["message"]))
          elif response.status == 303:
              return self._makeRequest(method,
                                       jsonData["location"],
                                       token,
                                       payload,
                                       customHeaders)
          else:
              return jsonData, response.getheader('ETag')

    def authenticate(self, username, password):
        payload = {
            "username": username,
            "password": password
        }

        return self._makeRequest(
            "POST",
            self._path+self._auth,
            payload=payload
        )[0]

    def invalidateToken(self, token):
        return self._makeRequest(
            "DELETE",
            self._path+self._auth,
            token
        )[0]

    def search(self, token, index, searchExpression, variant=None, rows=None):
        path = "{0}{1}/{2}/select?q={3}&wt=json".format(
            self._path,
            self._search,
            urllib.quote(index),
            urllib.quote(searchExpression)
        )

        if rows != None: path += "&rows={0}".format(urllib.quote(rows))
        if variant != None: path += "&variant={0}".format(urllib.quote(variant))

        return self._makeRequest(
            "GET",
            path,
            token
        )[0]

    def create(self, token, payload, variant):
        path = self._path+self._create

        if variant:
            path += "?variant={0}".format(variant)

        return self._makeRequest(
            "POST",
            path,
            token,
            payload
        )

    def read(self, token, contentId, variant):
        path = ""
        if re.search("\\d+\\.\\d+", contentId) != None:
            path = self._path+self._readContentId
        else:
            path = self._path+self._readExternalId

        path += contentId
        if variant:
            path += "?variant={0}".format(variant)

        return self._makeRequest(
            "GET",
            path,
            token
        )

    def update(self, token, payload, etag, variant):
        path = ""
        if re.search("\\d+\\.\\d+", payload["id"]) != None:
            path = self._path+self._readContentId
        else:
            path = self._path+self._readExternalId

        path += payload["id"]
        if variant:
            path += "?variant={0}".format(variant)

        return self._makeRequest(
            "PUT",
            path,
            token,
            payload,
            { "If-Match": "{0}".format(etag) }
        )
