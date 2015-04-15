#ifndef ATEX_EXAMPLE_CONTENT_RESULT_ID_HPP
#define ATEX_EXAMPLE_CONTENT_RESULT_ID_HPP

#include <jsoncpp/json/value.h>
#include "ContentVersionId.hpp"
#include "Content.hpp"

namespace atex {
    namespace example {

        class ContentResult {
        public:
            class Meta {
            public:
                long long modificationTime;
                long long originalCreationTime;
            };

            Meta meta;
            ContentVersionId version;
            Content content;
            bool success;
        };

    }
}

#endif
