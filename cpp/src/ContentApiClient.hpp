#ifndef ATEX_EXAMPLE_CONTENT_API_CLIENT_HPP
#define ATEX_EXAMPLE_CONTENT_API_CLIENT_HPP

#include <string>
#include <curl/curl.h>
#include <stdexcept>
#include <jsoncpp/json/json.h>
#include <iostream>
#include <sstream>
#include <unistd.h>

#include "ContentId.hpp"
#include "ContentVersionId.hpp"
#include "ContentResult.hpp"
#include "ContentWrite.hpp"

namespace atex {
    namespace example {

        class ContentApiClient {
        public:
            ContentApiClient(std::string endpoint, std::string username, std::string password)
                :endpoint(endpoint),
                 username(username),
                 password(password)
            {
                curl = curl_easy_init();
                if(!curl) {
                    throw std::runtime_error("Failed to initialize libcurl");
                }
                authenticate();
            }

            ~ContentApiClient() {
                curl_easy_cleanup(curl);
            }

            void authenticate() {
                Json::Value value;
                value["username"] = username;
                value["password"] = password;

                Json::Value body = call("/security/token", std::vector<std::string>(), false, value);

                token = body["token"].asString();
            }

            ContentResult create(ContentWrite write) {
                std::vector<std::string> headers;
                headers.push_back("X-Auth-Token: " + token);

                Json::Value body = toJson(write);

                Json::Value response = call("/content", headers, false, body);
                ContentResult result = getResult(response, "");

                return result;
            }

            ContentResult get(ContentId contentId) {
                std::vector<std::string> headers;
                headers.push_back("X-Auth-Token: " + token);

                Json::Value body = call("/content/contentid/" + contentId.toIdString(), headers, true, Json::nullValue);
                ContentResult result = getResult(body, "");

                return result;
            }

            ContentResult get(ContentVersionId versionId) {
                std::vector<std::string> headers;
                headers.push_back("X-Auth-Token: " + token);

                Json::Value body = call("/content/contentid/" + versionId.toVersionString(), headers, true, Json::nullValue);
                ContentResult result = getResult(body, "");

                return result;
            }

            ContentResult update(ContentWrite write) {
                std::vector<std::string> headers;
                headers.push_back("X-Auth-Token: " + token);
                headers.push_back("If-Match: \"" + write.etag + "\"");

                Json::Value body = toJson(write);

                Json::Value response = call("/content/contentid/" + write.contentId.toIdString(), headers, false, body);
                ContentResult result = getResult(response, "");

                return result;
            }

            Json::Value search(std::string index, std::string q, std::string fq) {
                std::vector<std::string> headers;
                headers.push_back("X-Auth-Token: " + token);

                Json::Value body = call("/search/" + index + "/select?q="+q+"&fq="+fq, headers, false, Json::nullValue);
                return body;
            }

        private:
            std::string endpoint;
            std::string username;
            std::string password;
            std::string token;

            Json::FastWriter writer;
            Json::Reader reader;
            CURL *curl;

            template<class T>
            T from_string(const std::string &str) {
                std::istringstream is(str);
                T t = T();
                is >> t;
                return t;
            }

            template<class T>
            std::string to_string(const T& t) {
                std::ostringstream os;
                os << t;
                return os.str();
            }

            ContentResult getResult(Json::Value &body, std::string variant) {
                if(body.isMember("statusCode")) {
                    std::string msg = "Operation failed (" + body["statusCode"].asString() + "): "
                                          + body["message"].asString();
                    throw std::runtime_error(msg);
                }

                ContentResult result;
                Json::Value &aspectJson = body["aspects"];
                std::string type;

                for(Json::ValueIterator it = aspectJson.begin(); it != aspectJson.end(); ++it) {
                    Aspect aspect;
                    if((*it).isMember("version")) {
                        aspect.version = ContentVersionId::fromVersionString((*it)["version"].asString());
                    }
                    aspect.data = (*it)["data"];
                    aspect.name = aspect.data["_type"].asString();
                    result.content.aspects[aspect.name] = aspect;
                    if(it.key().asString() == "contentData") {
                        type = aspect.name;
                    }
                }

                result.content.version = ContentVersionId::fromVersionString(body["version"].asString());
                result.version = result.content.version;
                result.success = true;
                result.content.variant = variant;
                result.content.type = type;
                result.content.etag = result.version.toVersionString(); // TODO: ETag should be read from the response header.

                result.meta.modificationTime = from_string<long long>(body["meta"]["modificationTime"].asString());
                result.meta.originalCreationTime = from_string<long long>(body["meta"]["originalCreationTime"].asString());

                return result;
            }

            Json::Value toJson(ContentWrite &write) {
                Json::Value body(Json::objectValue);
                body["aspects"] = Json::Value(Json::objectValue);

                for(std::map<std::string, Json::Value>::iterator a = write.aspects.begin(); a != write.aspects.end(); ++a) {
                    std::string key = (a->first == write.type) ? "contentData" : a->first;
                    Json::Value &aspect = body["aspects"][key];
                    aspect["data"] = a->second;
                    aspect["data"]["_type"] = a->first;
                }
                return body;
            }

            Json::Value call(std::string path, std::vector<std::string> headers, bool followRedirects, const Json::Value &value) {
                std::string json = writer.write(value);

                std::string body;

                std::string url = endpoint + path;

                struct curl_slist *headerList = curl_slist_append(NULL, "Content-Type: application/json");
                curl_slist_append(headerList, "Accept: application/json");

                for(std::vector<std::string>::iterator h = headers.begin(); h != headers.end(); ++h) {
                    curl_slist_append(headerList, h->c_str());
                }

                curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
                curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, followRedirects ? 1 : 0);
                if(value.type() != Json::nullValue) {
                    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, json.length());
                    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json.c_str());
                    curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");
                    if(headers.size() == 2) {
                        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "PUT");
                    }
                }
                else {
                    curl_easy_setopt(curl, CURLOPT_HTTPGET, 1);
                    curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "GET"); // Perhaps we shuld use a new CURL for each request.
                }
                curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headerList);
                curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, &ContentApiClient::recv);
                curl_easy_setopt(curl, CURLOPT_WRITEDATA, static_cast<void*>(&body));

                CURLcode code = curl_easy_perform(curl);

                curl_slist_free_all(headerList);

                if(code != CURLE_OK) {
                    throw std::runtime_error("Request failed with code " + to_string<>(code));
                }

                // FIXME: Check HTTP status code.

                Json::Value response;
                std::istringstream is(body);
                if(!reader.parse(is, response, false)) {
                    throw std::runtime_error("Failed to parse response: " + body);
                }

                //std::cout << body << std::endl;

                return response;
            }

            static size_t recv(void *contents, size_t size, size_t nmemb, void *userp) {
                std::string &data = *static_cast<std::string*>(userp);
                std::string newData(static_cast<char*>(contents), size*nmemb);
                data = data + newData;
                return size*nmemb;
            }
        };

    }
}

#endif
