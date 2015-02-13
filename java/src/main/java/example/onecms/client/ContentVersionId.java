package example.onecms.client;

public class ContentVersionId {
    private final ContentId contentId;
    private final String version;

    public ContentVersionId(final ContentId contentId, final String version) {
        this.contentId = contentId;
        this.version = version;
    }

    public ContentVersionId(final String delegationId,
                            final String key,
                            final String version)
    {
        if(delegationId == null || key == null || version == null) {
            throw new IllegalArgumentException("Null is not a valid value.");
        }
        this.contentId = new ContentId(delegationId, key);
        this.version = version;
    }

    public ContentId getContentId() {
        return contentId;
    }

    public String getVersion() {
        return version;
    }

    public String toVersionString() {
        return String.format("%s:%s:%s", contentId.getDelegationId(), contentId.getKey(), version);
    }

    public static ContentVersionId fromVersionString(final String string) {
        String[] parts = string.split(":");
        if(parts.length != 3) {
            throw new IllegalArgumentException("Unparsable version string: " + string);
        }
        return new ContentVersionId(parts[0], parts[1], parts[2]);
    }

}
