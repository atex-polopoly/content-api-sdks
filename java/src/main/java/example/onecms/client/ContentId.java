package example.onecms.client;

public class ContentId {
    private final String delegationId;
    private final String key;

    public ContentId(final String delegationId, final String key) {
        this.delegationId = delegationId;
        this.key = key;
    }

    public String getDelegationId() {
        return delegationId;
    }

    public String getKey() {
        return key;
    }

    public String toIdString() {
        return String.format("%s:%s", delegationId, key);
    }

    public static ContentId fromIdString(final String string) {
        String[] parts = string.split(":");
        if(parts.length != 2) {
            throw new IllegalArgumentException("Unparsable id: " + string);
        }
        return new ContentId(parts[0], parts[1]);
    }
}
