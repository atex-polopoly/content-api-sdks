cmake_minimum_required(VERSION 2.8.4)
project(contentapi)

set(SOURCE_FILES
src/main.cpp
src/ContentApiClient.cpp
src/ContentId.hpp
src/ContentVersionId.hpp
src/ContentApiClient.hpp
src/Aspect.hpp
src/Content.hpp
src/ContentResult.hpp
src/ContentWrite.hpp
src/contentapi.hpp
)

add_executable(contentapi ${SOURCE_FILES})

find_path(CURL_PATH curl/curl.h)
find_path(JSON_PATH json/features.h PATH_SUFFIXES jsoncpp)
include_directories(${JSON_PATH} ${CURL_PATH})

find_library(CURL_LIB NAMES curl libcurl)
find_library(JSON_LIB jsoncpp)

target_link_libraries(contentapi ${JSON_LIB} ${CURL_LIB})
