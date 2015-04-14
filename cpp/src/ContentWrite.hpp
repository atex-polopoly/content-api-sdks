#ifndef ATEX_EXAMPLE_CONTENT_WRITE_HPP
#define ATEX_EXAMPLE_CONTENT_WRITE_HPP

#include <jsoncpp/json/value.h>
#include <string>
#include "Content.hpp"
#include "ContentId.hpp"

namespace atex {
    namespace example {

        class ContentWrite {
        public:
            ContentWrite(const Content &content)
                :contentId(content.version.contentId),
                 etag(content.etag),
                 type(content.type)
            {
            }

            ContentWrite(std::string type, Json::Value mainAspectData)
                :type(type)
            {
                aspects[type] = mainAspectData;
            }

            ContentWrite &aspect(std::string name, Json::Value data) {
                aspects[name] = data;
                return *this;
            }

            ContentId contentId;
            std::string etag;
            std::string type;
            std::map<std::string, Json::Value> aspects;
        };

    }
}

#endif
