package main

import "github.com/atex-polopoly/data-api-toolkit/go/dataapi"

import "fmt"
import "encoding/json"

func main() {

	api := dataapi.DataAPI{
		Host: "localhost",
		Port: "8080",
		Path: "/data-api",
	}

	fmt.Println("--- Authenticate ---")
	token, err := api.Authenticate("edmund", "edmund")
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	fmt.Println("Success! Authenticated as user:", token.UserId, "\n")

	fmt.Println("--- Create a content ---")
	jsonData, _ := json.Marshal(map[string]interface{}{
		"contentData": map[string]interface{}{
			"_type":     "example.data.act.StandardArticleBean",
			"body":      "This is a body!",
			"resources": []interface{}{},
			"author":    "Wikipedia",
			"name":      "This is a title!",
		},
	})
	content, err := api.Create(token, "act", jsonData)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	fmt.Println("Success! A content is created with id:", content.Id, "\n")

	fmt.Println("--- Retrieve a content ---")
	newContent, err := api.Read(token, content.Id, "act")
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	fmt.Println("Success! Retrieved content ", newContent.Id, "with this data:\n", newContent.ContentData, "\n")

	fmt.Println("--- Update a Content ---")
	newContent.ContentData["body"] = "This is my new body"
	updatedContent, err := api.Update(token, "act", newContent)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	newUpdatedContent, _ := api.Read(token, content.Id, "act") //Read again!
	fmt.Println("Success! Updated content", updatedContent.Id, "and it now contains this data:\n", newUpdatedContent.ContentData, "\n")

	fmt.Println("-- Searching for 'Much' --")
	searchResult, err := api.Search(token, "act", "public", "text:much", 1)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	fmt.Println("Success! This is the search result (limited to 1 result):\n", string(searchResult))

	fmt.Println("-- Invalidate my token --")
	err := api.InvalidateToken(token)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	fmt.Println("Success! Token invalidated.")

}
