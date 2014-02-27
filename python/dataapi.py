#!/usr/bin/python

import urllib
import httplib
import json
import re

class Client:

    _host = ""
    _port = 0
    _path = ""

    _auth = "/ws/security/token"
    _readContentId = "/ws/content/contentid/"
    _readExternalId = "/ws/content/externalid/"
    _create = "/ws/content"
    _search = "/ws/search"

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
          return
        else:
          jsonData = json.loads(response.read())
          if response.status in [401, 403, 404, 400, 500]:
              raise Exception("HTTP {0}: {1}".format(response.status, jsonData["message"]))
          elif response.status == 303:
              return self._makeRequest(
                  method,
                  jsonData["location"],
                  token,
                  payload,
                  customHeaders
              )
          else:
              return jsonData

    def authenticate(self, username, password):
        payload = {
            "username": username,
            "password": password
        }

        return self._makeRequest(
            "POST",
            self._path+self._auth,
            None,
            payload
        )

        return data

    def invalidateToken(self, token):
        return self._makeRequest(
            "DELETE",
            self._path+self._auth,
            token
        )

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
        )

    def create(self, token, payload, variant):
        return self._makeRequest(
            "POST",
            self._path+self._create+"?variant={0}".format(variant),
            token,
            payload
        )

    def read(self, token, contentId, variant):
        path = ""
        if re.search("\\d+\\.\\d+", contentId) != None:
            path = self._path+self._readContentId
        else:
            path = self._path+self._readExternalId
        path += "{0}?variant={1}".format(contentId, variant)

        return self._makeRequest(
            "GET",
            path,
            token
        )

    def update(self, token, payload, variant):
        path = ""
        if re.search("\\d+\\.\\d+", payload["id"]) != None:
            path = self._path+self._readContentId
        else:
            path = self._path+self._readExternalId
        path += "{0}?variant={1}".format(payload["id"], variant)

        return self._makeRequest(
            "PUT",
            path,
            token,
            payload,
            { "If-Match": "{0}.{1}".format(payload["id"], payload["version"]) }
        )
