package dataapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
)

type Token struct {
	Token  string `json:"token"`
	UserId string `json:"userId"`
}

type Content struct {
	Id          string                 `json:"id"`
	Version     string                 `json:"version"`
	Meta        MetaType               `json:"meta"`
	ContentData map[string]interface{} `json:"contentData"`
}

type MetaType struct {
	CreationTime     string `json:"originalCreationTime"`
	ModificationTime string `json:"modificationTime"`
	LatestVersion    string `json:"latestVersion"`
}

const (
	PATH_AUTH            = "/ws/security/token"
	PATH_CREATE          = "/ws/content/"
	PATH_READ_CONTENTID  = "/ws/content/contentid/"
	PATH_READ_EXTERNALID = "/ws/content/externalid/"
	PATH_SEARCH          = "/ws/search/"
)

type DataAPI struct {
	Host string
	Port string
	Path string
}

func getContentIdPath(contentId, variant string) (path string) {
	isContentId, _ := regexp.Match("\\d+\\.\\d+", []byte(contentId))

	if isContentId {
		return PATH_READ_CONTENTID + contentId + "?variant=" + variant
	}

	return PATH_READ_EXTERNALID + contentId + "?variant=" + variant
}
func keepHeaderOnRedirect(req *http.Request, via []*http.Request) error {
	req.Header = via[0].Header
	return nil
}
func makeRequest(method, url string, data []byte, token *Token, extraHeaders *map[string]string) (body []byte, err error) {
	client := &http.Client{CheckRedirect: keepHeaderOnRedirect}

	req, err := http.NewRequest(method, url, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	req.Header.Add("Content-Type", "application/json")
	if token != nil {
		req.Header.Add("X-Auth-Token", token.Token)
	}
	if extraHeaders != nil {
		for k, v := range *extraHeaders {
			req.Header.Add(k, v)
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	switch resp.StatusCode {
	case 401:
		err = errors.New("401 Unauthorized")
	case 403:
		err = errors.New("403 Forbidden")
	case 404:
		err = errors.New("404 Not Found")
	case 400:
		err = errors.New("400 Bad Request")
	case 500:
		err = errors.New("500 Internal Server Error")
	}
	if err != nil {
		b, _ := ioutil.ReadAll(resp.Body)
		return nil, errors.New(err.Error() + string(b))
	}

	body, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return
}

func (dApi DataAPI) getUrl(callPath string) (url string) {
	return "http://" + dApi.Host + ":" + dApi.Port + dApi.Path + callPath
}

/*
	Authenticates with the data API, returning a token used to authenticate with the other data API functions.
*/
func (dApi DataAPI) Authenticate(username, password string) (token Token, err error) {

	data, err := json.Marshal(map[string]string{"username": username, "password": password})
	if err != nil {
		return
	}

	resp, err := makeRequest("POST", dApi.getUrl(PATH_AUTH), data, nil, nil)
	if err != nil {
		return
	}

	err = json.Unmarshal(resp, &token)
	return
}

/*
	Invalidates a token. After this command is run, the token can no long longer be used to authenticate with the other API functions.
*/
func (dApi DataAPI) InvalidateToken(token Token) (err error) {
	_, err = makeRequest("DELETE", dApi.getUrl(PATH_AUTH), nil, &token, nil)
	return
}

/*
	Retrieves a content from the server.
*/
func (dApi DataAPI) Read(token Token, contentId, variant string) (content Content, err error) {
	path := getContentIdPath(contentId, variant)

	resp, err := makeRequest("GET", dApi.getUrl(path), nil, &token, nil)
	if err != nil {
		return
	}

	err = json.Unmarshal(resp, &content)
	if err != nil {
		return
	}

	return
}

/*
	Creates a content with the data sent in. If no Data is sent, a empty content will be created.
*/
func (dApi DataAPI) Create(token Token, variant string, data []byte) (content Content, err error) {
	path := PATH_CREATE + "?variant=" + variant
	resp, err := makeRequest("POST", dApi.getUrl(path), data, &token, nil)
	if err != nil {
		return
	}

	err = json.Unmarshal(resp, &content)
	if err != nil {
		return
	}

	return
}

/*
	Updates a content.
*/
func (dApi DataAPI) Update(token Token, variant string, content Content) (respContent Content, err error) {
	path := getContentIdPath(content.Id, variant)
	jsonData, err := json.Marshal(content)
	if err != nil {
		return
	}

	resp, err := makeRequest("PUT", dApi.getUrl(path), jsonData, &token, &map[string]string{"If-Match": content.Id + "." + content.Version})
	if err != nil {
		return
	}

	err = json.Unmarshal(resp, &respContent)
	if err != nil {
		return
	}

	return
}

/*
	Searches the SOLR database
*/
func (dApi DataAPI) Search(token Token, variant, index, expression string, maxResults int) (resp []byte, err error) {
	path := PATH_SEARCH + url.QueryEscape(index) + "/select?q=" + url.QueryEscape(expression) + "&wt=json"

	if maxResults > 0 {
		path += fmt.Sprintf("&rows=%v", maxResults)
	}

	if variant != "" {
		path += "&variant=" + url.QueryEscape(variant)
	}

	return makeRequest("GET", dApi.getUrl(path), nil, &token, nil)
}
