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
	"strings"
)

type Token struct {
	Token  string `json:"token"`
	UserId string `json:"userId"`
}

type Content struct {
	Id          string                 `json:"id,omitempty"`
	Version     string                 `json:"version,omitempty"`
	Meta        map[string]interface{} `json:"meta,omitempty"`
	ContentData map[string]interface{} `json:"contentData"`
}

const (
	PATH_AUTH            = "/security/token"
	PATH_CREATE          = "/content/"
	PATH_READ_CONTENTID  = "/content/contentid/"
	PATH_READ_EXTERNALID = "/content/externalid/"
	PATH_SEARCH          = "/search/"
)

type DataAPI struct {
	Host string
	Port string
	Path string
}

func getContentIdPath(contentId, variant string) (path string) {
	isContentId, _ := regexp.Match("\\d+\\.\\d+", []byte(contentId))
	variantQuery := ""
	if variant != "" {
		variantQuery = "?variant=" + variant
	}

	if isContentId {
		return PATH_READ_CONTENTID + contentId + variantQuery
	}

	return PATH_READ_EXTERNALID + contentId + variantQuery
}
func keepHeaderOnRedirect(req *http.Request, via []*http.Request) error {
	req.Header = via[0].Header
	return nil
}
func makeRequest(method, url string, data []byte, token *Token, extraHeaders *map[string]string) (body []byte, err error, etag string) {
	client := &http.Client{CheckRedirect: keepHeaderOnRedirect}

	req, err := http.NewRequest(method, url, bytes.NewReader(data))
	if err != nil {
		return nil, err, ""
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
		return nil, err, ""
	}
	etag = resp.Header.Get("ETag")
	switch resp.StatusCode {
	case 204:
		body = []byte("")
		return
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
		return nil, errors.New(err.Error() + string(b)), etag
	}

	body, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err, etag
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

	resp, err, _ := makeRequest("POST", dApi.getUrl(PATH_AUTH), data, nil, nil)
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
	_, err, _ = makeRequest("DELETE", dApi.getUrl(PATH_AUTH), nil, &token, nil)
	return
}

/*
	Retrieves a content from the server.
*/
func (dApi DataAPI) Read(token Token, contentId, variant string) (content Content, err error, etag string) {
	path := getContentIdPath(contentId, variant) + "?format=json+allTypes"

	resp, err, etag := makeRequest("GET", dApi.getUrl(path), nil, &token, nil)
	if err != nil {
		return
	}
	//fmt.Println(string(resp))
	d := json.NewDecoder(strings.NewReader(string(resp)))
	d.UseNumber()
	err = d.Decode(&content)
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
	resp, err, _ := makeRequest("POST", dApi.getUrl(path), data, &token, nil)
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
func (dApi DataAPI) Update(token Token, variant string, content Content, etag string) (respContent Content, err error) {
	path := getContentIdPath(content.Id, variant)
	content.Id = ""
	content.Meta = nil
	content.Version = ""

	jsonData, err := json.Marshal(content)
	if err != nil {
		return
	}
	//prettyPrintData, _ := json.MarshalIndent(content, "", "    ")
	//fmt.Println("PUT", dApi.getUrl(path), string(prettyPrintData))
	resp, err, _ := makeRequest("PUT", dApi.getUrl(path), jsonData, &token, &map[string]string{"If-Match": etag})
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
func (dApi DataAPI) Search(token Token, variant, index, expression string, maxResults int) (resp map[string]interface{}, err error, etag string) {
	path := PATH_SEARCH + url.QueryEscape(index) + "/select?q=" + url.QueryEscape(expression) + "&wt=json"

	if maxResults > 0 {
		path += fmt.Sprintf("&rows=%v", maxResults)
	}

	if variant != "" {
		path += "&variant=" + url.QueryEscape(variant)
	}

	req, err, _ := makeRequest("GET", dApi.getUrl(path), nil, &token, nil)
	if err != nil {
		return
	}

	d := json.NewDecoder(strings.NewReader(string(req)))
	d.UseNumber()
	err = d.Decode(&resp)
	if err != nil {
		return
	}

	return
}
