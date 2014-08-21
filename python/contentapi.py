#!/usr/bin/python

import urllib
import httplib
import json
import re

class ContentApiClient:
    """
    This is a stateless class which provides methods for communicating with
    the Content API present in a Polopoly 10.10 or 10.10.1 installation. It is
    not compatible with Polopoly versions earlier than 10.10.

    All methods, if the operation was successful, will generally return the
    response body as returned from the server.

    An operation will be deemed unsuccessful if the server responds with an
    HTTP status code of 4XX or 5XX. In that case, the method will raise an
    exception containing error details.
    """

    _auth = "/security/token"
    _readContentId = "/content/contentid/"
    _readExternalId = "/content/externalid/"
    _create = "/content"
    _search = "/search"

    def __init__(self, host, port, path):
        """
        Constructs a new instance of ContentApiClient.

        Args:
            host (string): host to where the Content API is hosted
            port (integer): port where the Content API is listening
            path (string): path to the Content API relative to the host
                (should include leading slash)

        Example:
            ContentApiClient("localhost", 8080, "/onecms")
        """

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
          if str(response.status).startswith('4') or str(response.status).startswith('5'):
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
        """
        Performs authentication using the given username and password. The token
        contained by the response must be used in further communication with the
        Content API.

        Args:
            username (string)
            password (string)

        Returns:
            The payload as returned from the server
        """

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
        """
        Invalidates a token. After calling this method, the token can no longer
        be used in communication with the Content API.

        Args:
            token (string): the token to invalidate

        Returns:
            The payload as returned from the server
        """

        return self._makeRequest(
            "DELETE",
            self._path+self._auth,
            token
        )[0]

    def search(self, token, index, searchExpression, variant=None, rows=None):
        """
        Performs a search in the Content API.

        Args:
            token (string): a previously acquired authentication token
            index (string): an index name for which to perform the search in
            searchExpression (string): a Solr search expression
            [variant] (string): if provided, data from Polopoly with be inlined
                using this variant
            [rows] (integer): number of rows included in the result

        Returns:
            The payload as returned from the server
        """

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

    def create(self, token, payload):
        """
        Creates a content.

        Args:
            token (string): a previously acquired authentication token
            payload (dict): the payload

        Returns:
            The payload as returned from the server
        """

        return self._makeRequest(
            "POST",
            self._path+self._create,
            token,
            payload
        )

    def read(self, token, contentId, variant):
        """
        Reads a content.

        Args:
            token (string): a previously acquired authentication token
            contentId (string): a contentId (e.g. '1.200' or 'PolopolyPost.d')
            [variant] (string): a variant to use when reading the content

        Returns:
            The payload as returned from the server
        """

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

    def update(self, token, payload, etag):
        """
        Updates a content. Which content to update is derived from the id
        property in the payload.

        Args:
            token (string): a previously acquired authentication token
            payload (dict): the payload
            etag (string): the etag receieved when previously reading the content

        Returns:
            The payload as returned from the server
        """

        path = ""
        if re.search("\\d+\\.\\d+", payload["id"]) != None:
            path = self._path+self._readContentId
        else:
            path = self._path+self._readExternalId

        path += payload["id"]

        return self._makeRequest(
            "PUT",
            path,
            token,
            payload,
            { "If-Match": "{0}".format(etag) }
        )
