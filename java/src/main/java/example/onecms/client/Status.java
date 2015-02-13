package example.onecms.client;

public class Status {
    private final int httpCode;
    private final int detailCode;

    public Status(int httpCode, int detailCode) {
        this.httpCode = httpCode;
        this.detailCode = detailCode;
    }

    public int getHttpCode() {
        return httpCode;
    }

    public int getDetailCode() {
        return detailCode;
    }

    public boolean isOk() {
        return httpCode == 200 || httpCode == 201;
    }
}
