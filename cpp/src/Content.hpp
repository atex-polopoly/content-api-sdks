#ifndef ATEX_EXAMPLE_CONTENT_HPP
#define ATEX_EXAMPLE_CONTENT_HPP

#include <jsoncpp/json/value.h>
#include "ContentVersionId.hpp"
#include "Aspect.hpp"
#include <map>
#include <string>
#include <stdexcept>

namespace atex {
    namespace example {

        class Content {
        public:
            Aspect &getMainAspect() {
                std::map<std::string, Aspect>::iterator main = aspects.find(type);
                if(type.empty() || main == aspects.end()) {
                    throw std::runtime_error("Tried to get non-existing main aspect");
                }
                return main->second;
            }

            std::string etag;
            std::string variant;
            std::string type;
            ContentVersionId version;
            std::map<std::string, Aspect> aspects;
        };

    }
}

#endif
