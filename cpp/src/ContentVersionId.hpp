#ifndef ATEX_EXAMPLE_CONTENT_VERSION_ID_HPP
#define ATEX_EXAMPLE_CONTENT_VERSION_ID_HPP

#include "ContentId.hpp"
#include <string>
#include <sstream>

namespace atex {
    namespace example {

        class ContentVersionId {
        public:
            ContentVersionId() {}

            ContentVersionId(ContentId contentId, std::string version)
                :contentId(contentId),
                 version(version)
            {
            }

            std::string toVersionString() {
                return contentId.delegationId + ":" + contentId.key + ":" + version;
            }

            ContentId contentId;
            std::string version;

            static ContentVersionId fromVersionString(std::string str) {
                std::vector<std::string> parts;
                std::stringstream ss(str);
                std::string item;
                while (std::getline(ss, item, ':')) {
                    parts.push_back(item);
                }

                if(parts.size() != 3) {
                    throw std::runtime_error("Invalid version string: " + str);
                }

                return ContentVersionId(ContentId(parts[0], parts[1]), parts[2]);
            }
        };

    }
}

#endif
