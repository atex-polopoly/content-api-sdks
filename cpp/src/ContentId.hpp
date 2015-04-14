#ifndef ATEX_EXAMPLE_CONTENT_ID_HPP
#define ATEX_EXAMPLE_CONTENT_ID_HPP

#include <string>

namespace atex {
    namespace example {

        class ContentId {
        public:
            ContentId() {}

            ContentId(std::string delegationId, std::string key)
                :delegationId(delegationId),
                 key(key)
            {
            }

            std::string toIdString() {
                return delegationId + ":" + key;
            }

            std::string delegationId;
            std::string key;

            static ContentId fromIdString(std::string str) {
                std::vector<std::string> parts;
                std::stringstream ss(str);
                std::string item;
                while (std::getline(ss, item, ':')) {
                    parts.push_back(item);
                }

                if(parts.size() != 2) {
                    throw std::runtime_error("Invalid id string: " + str);
                }

                return ContentId(parts[0], parts[1]);
            }
        };

    }
}

#endif
