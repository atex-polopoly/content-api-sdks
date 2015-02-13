package example.onecms.client;

import java.net.URI;
import java.net.URISyntaxException;

import com.google.gson.JsonObject;

public class Example {
    public static void main(String[] args) {
        URI endpoint;
        try {
            endpoint = new URI("http", "", "localhost", 8080, "/onecms", "", "");
        } catch (URISyntaxException e) {
            e.printStackTrace();
            return;
        }

        // Connect / authenticate
        ContentApiClient client = new ContentApiClient(endpoint, "edmund", "edmund");

        // Create content
        JsonObject contentData = new JsonObject();
        contentData.addProperty("title", "An article!");
        contentData.addProperty("body", "A body text.");
        ContentResult createResult = client.create(new ContentWrite("example.greenfieldtimes.adapter.ArticleBean",
                                                                contentData));

        // Resolve external id
        ContentVersionId resolved = client.resolve("example.demo.article.HybridCars");

        // Get content
        ContentResult result = client.get(resolved.getContentId());

        // Update main aspect on content
        ContentWrite update = result.getContent().update();
        JsonObject data = result.getContent().getMainAspect().getData();
        data.addProperty("title", "An updated title.");
        update.aspect(result.getContent().getType(), data);

        ContentResult updateResult = client.update(update);

        System.out.println("Status: " + updateResult.getStatus().getHttpCode());
    }
}
