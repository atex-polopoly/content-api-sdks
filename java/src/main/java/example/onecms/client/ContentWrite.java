package example.onecms.client;

import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonObject;

public class ContentWrite {
    private Content source = null;
    private Map<String, JsonObject> aspects = null;

    public ContentWrite(final Content source) {
        this.source = source;
    }

    public ContentWrite(final String type, final JsonObject contentData) {
        source = new Content(null, null, null, type, null);
        aspect(type, contentData);
    }

    public void aspect(final String name, final JsonObject data) {
        if(aspects == null) {
            aspects = new HashMap<>();
        }
        aspects.put(name, data);
    }

    public Content getSource() {
        return source;
    }

    public Map<String, JsonObject> getAspects() {
        return aspects;
    }
}
