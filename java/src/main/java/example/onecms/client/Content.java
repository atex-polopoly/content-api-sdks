package example.onecms.client;

import java.util.Collections;
import java.util.Map;

public class Content {
    private final String etag;
    private final ContentVersionId version;
    private final String variant;
    private final String type;
    private final Map<String, Aspect> aspects;

    public Content(final String etag,
                   final ContentVersionId version,
                   final String variant,
                   final String type,
                   final Map<String, Aspect> aspects)
    {
        this.etag = etag;
        this.version = version;
        this.variant = variant;
        this.type = type;
        this.aspects = (aspects == null) ? null : Collections.unmodifiableMap(aspects);
    }

    public String getEtag() {
        return etag;
    }

    public ContentVersionId getVersion() {
        return version;
    }

    public String getVariant() {
        return variant;
    }

    public String getType() {
        return type;
    }

    public Aspect getMainAspect() {
        return aspects.get(type);
    }

    public Map<String, Aspect> getAspects() {
        return aspects;
    }

    public ContentWrite update() {
        return new ContentWrite(this);
    }
}
