#ifndef ATEX_EXAMPLE_ASPECT_HPP
#define ATEX_EXAMPLE_ASPECT_HPP

#include <jsoncpp/json/value.h>
#include "ContentVersionId.hpp"

namespace atex {
    namespace example {

        class Aspect {
        public:
            Aspect() {}

            Aspect(std::string name, const Json::Value &data, ContentVersionId version)
                :name(name),
                 data(data),
                 version(version)
            {
            }

            Aspect(const Aspect &other)
                :name(other.name),
                 data(other.data),
                 version(other.version)
            {
            }

            std::string name;
            Json::Value data;
            ContentVersionId version;
        };

    }
}

#endif
