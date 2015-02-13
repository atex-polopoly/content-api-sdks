package example.onecms.client;

public class ContentResult
{
    private final Meta meta;
    private final ContentVersionId contentId;
    private final Content content;
    private final Status status;

    public ContentResult(final Meta meta,
                         final ContentVersionId contentId,
                         final Content content,
                         final Status status)
    {
        this.meta = meta;
        this.contentId = contentId;
        this.content = content;
        this.status = status;
    }

    /**
     * Return the updated content data, or null if the content was not found.
     *
     * @return result of the content operation.
     */
    public Content getContent() {
        return this.content;
    }

    /**
     * Get content version information, or null if the content was not found.
     */
    public Meta getMeta()
    {
        return meta;
    }

    public Status getStatus() {
        return status;
    }

    public ContentVersionId getContentId()
    {
        return contentId;
    }

    /**
     * Content version information.
     */
    public static class Meta {
        private final long modificationTime;
        private final long originalCreationTime;

        public Meta(long modificationTime, long originalCreationTime) {
            this.modificationTime = modificationTime;
            this.originalCreationTime = originalCreationTime;
        }

        /**
         * @return time this version was created, in milliseconds since the Unix epoch
         */
        public long getModificationTime()
        {
            return modificationTime;
        }

        /**
         * @return time the content was created, in milliseconds since the Unix epoch
         */
        public long getOriginalCreationTime()
        {
            return originalCreationTime;
        }
    }
}
