#
# Client library for the Polopoly Content APi, tested compatible with Polopoly v10.12.
# Refer to content-api-test.rb for usage examples
#

require 'rest_client'
require 'forwardable'
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

  def get(content_id, variant = nil)
    variant = variant.nil? ? '' : '?variant=' + variant
    raw = RestClient.get(@base_url + "/content/contentid/" + content_id + variant, @headers)
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

    def modified_at
      time = json()['meta']['modificationTime']
      Time.at(time.to_i/1000)
    end

    def created_at
      time = json()['meta']['originalCreationTime']
      Time.at(time.to_i/1000)
    end

  end


  class Aspect

    def initialize(json)
       @json=json
       @data = AspectData.new json['data']
    end

    def json; @json; end

    def method_missing(meth, *args, &block)
      @data.send(meth, *args, &block)
    end

    def version
      @json['version']
    end

    def type
      @json['data']['_type']
    end

    def to_s; @json; end

  end

  class AspectData
    extend Forwardable
    def_delegators :@json, :[], :size

    def initialize(json); @json=json; end

    def json; @json; end

    def each
      @json.each { |e| yield(AspectData.new(e)) } if block_given?
    end

    def method_missing(meth, *args, &block)
      field = meth.to_s.gsub(/=$/,"")
      unless @json[field].nil?
        if (meth.to_s.end_with? "=")
          @json[field] = args[0]
        else
          process @json[field]
        end
      else
        nil
      end
    end

    def to_s; @json; end

    private
    def process(node)
      return AspectData.new(node) if (node.kind_of?(Hash) || node.kind_of?(Array))
      node
    end

  end


end
