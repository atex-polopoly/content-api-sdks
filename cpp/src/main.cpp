#include <iostream>
#include "contentapi.hpp"

using namespace atex::example;

int main(int argc, char *argv[])
{
    // Connect
    ContentApiClient client("http://localhost:8080/onecms", "sysadmin", "sysadmin");

    // Create content
    Json::Value initial(Json::objectValue);
    initial["title"] = "An image from C++";
    initial["description"] = "My image.";

    ContentResult createResult = client.create(ContentWrite("com.atex.standard.image.ImageContentDataBean", initial));

    // Get content
    ContentResult result = client.get(createResult.version);
    Aspect &contentData = result.content.getMainAspect();

    // Update
    Json::Value updated = contentData.data;
    updated["title"] = "An updated title";

    ContentWrite write(result.content);
    write.aspect(result.content.type, updated);

    ContentResult updateResult = client.update(write);

    // Search
    Json::Value searchResponse = client.search("public", "*:*", "inputTemplate:standard.Article");
    int numFound = searchResponse["response"]["numFound"].asInt();
    Json::Value docs = searchResponse["response"]["docs"];
    ContentId firstContent("policy", docs[0]["contentId"].asString());

    // Output some stuff
    std::cout << "type: "            << result.content.type << std::endl;
    std::cout << "version: "         << result.version.toVersionString() << std::endl;
    std::cout << "modified: "        << result.meta.modificationTime << std::endl;
    std::cout << "created: "         << result.meta.originalCreationTime << std::endl;
    std::cout << "aspect_name: "     << contentData.name << std::endl;
    std::cout << "aspect_type: "     << contentData.data["_type"].asString() << std::endl;
    std::cout << "aspect_version: "  << contentData.version.toVersionString() << std::endl;

    std::cout << "updated_version: " << updateResult.version.toVersionString() << std::endl;
    std::cout << "searchResult:    " << firstContent.toIdString() << std::endl;

    return 0;
}
