package example.onecms.client;

import com.google.gson.JsonObject;

public class Aspect {
    private String name;
    private JsonObject data;
    private ContentVersionId version;

    public Aspect(final String name, final JsonObject data, final ContentVersionId version) {
        this.name = name;
        this.data = data;
        this.version = version;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public JsonObject getData() {
        return data;
    }

    public void setData(final JsonObject data) {
        this.data = data;
    }

    public ContentVersionId getVersion() {
        return version;
    }

    public void setVersion(final ContentVersionId version) {
        this.version = version;
    }
}
