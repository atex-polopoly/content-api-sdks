#
# Client library for the Polopoly Content APi, tested compatible with Polopoly v10.12.
# Refer to content-api-test.rb for usage examples
#

require 'rest_client'
require 'json'


class ContentApi

  def initialize
    @base_url="http://localhost:8080/onecms"
    @credentials = <<-json
    {
      "username": "sysadmin",
      "password": "sysadmin"
    }
    json
  end

  def base_url(base_url)
    @base_url = base_url
    self
  end

  def user(name, pwd)
    @credentials = <<-json
    {
      "username": "#{name}",
      "password": "#{pwd}"
    }
    json
    self
  end

  def auth
    response = RestClient.post(@base_url + "/security/token",
    @credentials,
    :content_type => :json,
    :accept => :json)
    token = JSON.parse(response)['token']
    @headers = {:content_type => :json, :accept => :json, :'X-Auth-Token' => token}
    self
  end

  def get(content_id)
    raw = RestClient.get(@base_url + "/content/contentid/" + content_id, @headers)
    Content.new raw
  end

  def create(json)
    response = RestClient.post(@base_url + "/content", json, @headers)
    return JSON.parse(response)['id']
  end

  def update(content_id, etag, json)
    RestClient.put(@base_url + "/content/contentid/" + content_id, json.to_s, @headers.merge({:'If-Match' => etag}))
  end

  def search(params, index = 'public')
    RestClient.get(@base_url + "/search/#{index}/select", @headers.merge({ :params => params }))
  end


  class Content

    def initialize(data); @raw=data; end

    def etag; @raw.headers[:etag]; end

    def aspect(aspect)
      Aspect.new json()['aspects'][aspect]
    end

    def content_id; json()['id']; end

    def json; @json = JSON.parse(@raw) if @json.nil?; @json; end

    def to_s; @raw.to_s; end

  end


  class Aspect

    def initialize(json); @json=json; end

    def json; @json; end

    def method_missing(meth, *args, &block)
      field = meth.to_s.gsub(/=$/,"")
      unless @json['data'][field].nil?
        if (meth.to_s.end_with? "=")
          @json['data'][field] = args[0]
        else
          @json['data'][field]
        end
      else
        super
      end
    end

    def version 
      @json['version']
    end

    def type 
      @json['data']['_type']
    end

    def to_s; @json; end

  end



end
