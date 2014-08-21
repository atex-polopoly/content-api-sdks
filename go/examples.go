package main

import "github.com/atex-polopoly/data-api-toolkit/go/dataapi"

import "fmt"

import "encoding/json"

func toPrettyPrint(data map[string]interface{}) string {
	prettyPrintData, _ := json.MarshalIndent(data, "", "    ")
	return string(prettyPrintData)
}

func exampleAuth(api dataapi.DataAPI) dataapi.Token {
	fmt.Println("--- Authenticate ---")

	token, err := api.Authenticate("edmund", "edmund")
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return *new(dataapi.Token)
	}

	fmt.Println("Success! Authenticated as user:", token.UserId, "\n")
	return token
}

func exampleCreate(api dataapi.DataAPI, token dataapi.Token) string {
	fmt.Println("--- Create a content ---")
	jsonData, _ := json.Marshal(map[string]interface{}{
		"contentData": map[string]interface{}{
			"_type":      "com.atex.standard.article.ArticleBean",
			"title":      "This is a Title",
			"title_type": "java.lang.String",
			"lead":       "This is a Lead",
			"lead_type":  "java.lang.String",
			"body":       "This is a Body",
			"body_type":  "java.lang.String",
		},
	})
	content, err := api.Create(token, "", jsonData)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return ""
	}

	fmt.Println("Success! A content is created with id:", content["id"], "\n")
	return content["id"].(string)
}

func exampleRetrieve(api dataapi.DataAPI, token dataapi.Token) {
	fmt.Println("--- Retrieve a content ---")
	newContent, err, _ := api.Read(token, "18.100", "")
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}

	fmt.Println("Success! Retrieved content ", "18.100", "with this data:\n", toPrettyPrint(newContent), "\n")
}

func exampleUpdate(api dataapi.DataAPI, token dataapi.Token, id string) {
	fmt.Println("--- Update a Content ---")
	contentToUpdate, _, etag := api.Read(token, id, "")
	contentToUpdate["contentData"].(map[string]interface{})["body"] = "This is my new body"
	updatedContent, err := api.Update(token, "", contentToUpdate, etag)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	newUpdatedContent, _, etag := api.Read(token, updatedContent["id"].(string), "") //Read again!

	fmt.Println("Success! Updated content", updatedContent["id"], "and it now contains this data:\n", toPrettyPrint(newUpdatedContent), "\n")
}

func exampleSearch(api dataapi.DataAPI, token dataapi.Token) {
	fmt.Println("-- Searching for 'Much' --")
	searchResult, err, _ := api.Search(token, "", "public", "text:much", 1)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}

	fmt.Println("Success! This is the search result (limited to 1 result):\n", toPrettyPrint(searchResult))
}

func exampleInvalidate(api dataapi.DataAPI, token dataapi.Token) {
	fmt.Println("-- Invalidate my token --")

	err := api.InvalidateToken(token)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}

	fmt.Println("Success! Token invalidated.")
}

func main() {
	api := dataapi.DataAPI{
		Host: "localhost",
		Port: "8080",
		Path: "/onecms",
	}

	token := exampleAuth(api)
	id := exampleCreate(api, token)
	exampleRetrieve(api, token)
	exampleUpdate(api, token, id)
	exampleSearch(api, token)
	exampleInvalidate(api, token)
}
