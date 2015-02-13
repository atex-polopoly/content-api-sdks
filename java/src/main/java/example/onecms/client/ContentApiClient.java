package example.onecms.client;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.EntityTag;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.client.ClientProperties;

public class ContentApiClient {
    private final URI endpoint;
    private final String username;
    private final String password;
    private String token;
    private Client client;
    private Client clientNoRedirect;

    public ContentApiClient(final URI endpoint,
                            final String username,
                            final String password) {
        this.endpoint = endpoint;
        this.username = username;
        this.password = password;
        this.token = null;

        client = ClientBuilder.newClient();

        ClientConfig clientConfig = new ClientConfig();
        clientConfig.property(ClientProperties.FOLLOW_REDIRECTS, false);
        clientNoRedirect = ClientBuilder.newClient(clientConfig);

        reauthenticate();
    }

    public void reauthenticate() {
        token = null;
        Gson gson = new GsonBuilder().create();

        WebTarget target = client.target(endpoint).path("security/token");

        JsonObject req = new JsonObject();
        req.addProperty("username", username);
        req.addProperty("password", password);
        String json = gson.toJson(req);

        Response response = target.request(MediaType.APPLICATION_JSON_TYPE)
            .post(Entity.entity(json, MediaType.APPLICATION_JSON_TYPE));

        int status = response.getStatus();
        if(status != 200) {
            throw new RuntimeException("Failed to authenticate. Status: " + status);
        }
        JsonElement element = gson.fromJson(response.readEntity(String.class), JsonElement.class);
        token = element.getAsJsonObject().get("token").getAsString();
    }

    public ContentVersionId resolve(String externalId) {
        WebTarget target = clientNoRedirect.target(endpoint).path("content/externalid/" + externalId);
        Response response = target.request(MediaType.APPLICATION_JSON_TYPE).header("X-Auth-Token", token).get();
        if(response.getStatus() != 303) {
            return null;
        }
        URI location = response.getLocation();
        String[] split = location.getPath().split("/");
        String idString = split[split.length-1];
        return ContentVersionId.fromVersionString(idString);
    }

    public ContentResult get(ContentId id) {
        return get(id, null);
    }

    public ContentResult get(ContentId id, String variant) {
        WebTarget target = client.target(endpoint).path("content/contentid/" + id.toIdString());
        if(variant != null) {
            target = target.queryParam("variant", variant);
        }

        Response response = target.request(MediaType.APPLICATION_JSON_TYPE).header("X-Auth-Token", token).get();
        return getContentResult(variant, response);
    }

    public ContentResult update(ContentWrite write) {
        Content source = write.getSource();
        ContentVersionId version = source.getVersion();
        if(version == null) {
            throw new IllegalArgumentException("Update must have a source version.");
        }

        JsonObject body = new JsonObject();
        if(write.getAspects() != null) {
            JsonObject aspects = new JsonObject();
            for(Map.Entry<String,JsonObject> entry : write.getAspects().entrySet()) {
                JsonObject aspect = new JsonObject();
                JsonObject data = entry.getValue();
                data.addProperty("_type", entry.getKey());
                aspect.add("data", data);
                if(source.getType().equals(entry.getKey())) {
                    aspects.add("contentData", aspect);
                }
                else {
                    aspects.add(entry.getKey(), aspect);
                }
            }

            body.add("aspects", aspects);
        }

        WebTarget target = client.target(endpoint).path("content/contentid/" + version.getContentId().toIdString());

        Gson gson = new GsonBuilder().create();

        Response response = target.request(MediaType.APPLICATION_JSON_TYPE)
            .header("X-Auth-Token", token)
            .header("If-Match", new EntityTag(source.getEtag()))
            .put(Entity.entity(gson.toJson(body), MediaType.APPLICATION_JSON_TYPE));

        return getContentResult(null, response);
    }

    public ContentResult create(ContentWrite write) {
        ContentVersionId source = write.getSource().getVersion();
        if(source != null) {
            throw new IllegalArgumentException("Create must not have a source content.");
        }

        JsonObject body = new JsonObject();
        if(write.getAspects() != null) {
            JsonObject aspects = new JsonObject();
            for(Map.Entry<String,JsonObject> entry : write.getAspects().entrySet()) {
                JsonObject aspect = new JsonObject();
                JsonObject data = entry.getValue();
                data.addProperty("_type", entry.getKey());
                aspect.add("data", data);
                if(write.getSource().getType().equals(entry.getKey())) {
                    aspects.add("contentData", aspect);
                }
                else {
                    aspects.add(entry.getKey(), aspect);
                }
            }

            body.add("aspects", aspects);
        }

        WebTarget target = client.target(endpoint).path("content");

        Gson gson = new GsonBuilder().create();

        Response response = target.request(MediaType.APPLICATION_JSON_TYPE)
            .header("X-Auth-Token", token)
            .post(Entity.entity(gson.toJson(body), MediaType.APPLICATION_JSON_TYPE));

        return getContentResult(null, response);
    }

    private ContentResult getContentResult(final String variant, final Response response) {
        int status = response.getStatus();

        Gson gson = new GsonBuilder().create();
        String json = response.readEntity(String.class);
        if(status != 200 && status != 201) {
            int detail = 0;
            try {
                JsonElement element = gson.fromJson(json, JsonElement.class);
                detail = element.getAsJsonObject().get("statusCode").getAsInt();
            } catch (JsonSyntaxException e) {
                // Nothing to do.
            }
            return new ContentResult(null, null, null, new Status(status, detail));
        }
        JsonElement element = gson.fromJson(json, JsonElement.class);
        String versionString = element.getAsJsonObject().get("version").getAsString();
        ContentVersionId vid = ContentVersionId.fromVersionString(versionString);

        Map<String, Aspect> aspects = new HashMap<>();
        String type = null;
        for(Map.Entry<String, JsonElement> entry : element.getAsJsonObject().getAsJsonObject().get("aspects").getAsJsonObject().entrySet()) {
            JsonObject aspectElement = entry.getValue().getAsJsonObject();
            JsonObject data = aspectElement.get("data").getAsJsonObject();
            String name = data.get("_type").getAsString();
            if("contentData".equals(entry.getKey())) {
                type = name;
            }
            ContentVersionId version = ContentVersionId.fromVersionString(aspectElement.get("version").getAsString());
            Aspect aspect = new Aspect(name, data, version);
            aspects.put(aspect.getName(), aspect);
        }

        Content content = new Content(response.getEntityTag().getValue(), vid, variant, type, aspects);

        JsonObject metaElement = element.getAsJsonObject().get("meta").getAsJsonObject();
        ContentResult.Meta meta = new ContentResult.Meta(metaElement.get("modificationTime").getAsLong(),
                                                         metaElement.get("originalCreationTime").getAsLong());

        return new ContentResult(meta, vid, content, new Status(status, status*100));
    }
}
