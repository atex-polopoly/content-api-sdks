
# Client library for the Polopoly Content APi, tested compatible with Polopoly v10.16.
# Refer to content-api-test.rb for usage examples
#
require 'rest-client'
require 'forwardable'
require 'json'


# RestClient.log = 'stdout'


class ContentApi

  def initialize
    @view=nil
    @base_url="http://localhost:8080/ace"
    @credentials = <<-json
    {
      "username": "admin",
      "password": "123456"
    }
    json
  end

  #
  # set the Content-API REST server URL
  # if none set we will default to http://localhost:8080/onecms
  def base_url(base_url)
    @base_url = base_url
    self
  end


  #
  # set the view this client will be using when accessing content
  # setting view to nil will restore the defaults
  def view(view)
    @view=view
    self
  end

  #
  # set the user credentials for this client
  # if none set we will default to sysadmin/sysadmin
  def user(name, pwd)
    @credentials = <<-json
    {
      "username": "#{name}",
      "password": "#{pwd}"
    }
    json
    self
  end

  #
  # authenticate and hold authentication token in the client
  def auth
    response = RestClient.post(@base_url + "/security/token",
    @credentials,
    :content_type => :json,
    :accept => :json)
    token = JSON.parse(response)['token']
    @headers = {:content_type => :json, :accept => :json, :'X-Auth-Token' => token}
    self
  end


  #
  # map to the REST get method
  # if this client was initialised with a view then this method will get content from that view
  # content_id can be versioned or unversioned
  # variant is optional
  def get(content_id, variant = nil)
    content_id = Id.new(content_id) if content_id.is_a? String
    view = (@view.nil?) ? '' : "views/#{@view}/"
    variant = variant.nil? ? '' : '?variant=' + variant
    raw = RestClient.get(@base_url + "/content/" + view + content_id.to_url_string + variant, @headers)
    Content.new raw
  end

  def get_info(content_id) 
    content_id = Id.new(content_id) if content_id.is_a? String
    raw = RestClient.get(@base_url + "/contentinfo/"  + content_id.to_url_string, @headers)
    Content.new raw
  end
  
  #
  # create a content from a json data shuttle
  def create(json)
    response = RestClient.post(@base_url + "/content", json, @headers)
  end

  #
  # update/create a single aspect on an existing content
  # updates will abort if aspect.version and does not match latest aspect version
  def update_aspect(content_id, aspect_name, aspect)
    content =  get(content_id)
    server_version = content.aspect(aspect_name).version
    raise "conflict" unless (aspect.version.eql?(server_version) || aspect.version.nil?)
    update(content_id, content.etag, "{ aspects: { \"" + aspect_name + "\": " + aspect.json.to_s + "}}")
  end

  #
  # update a content
  # conflict resolution relies on known content ETAGS
  def update(content_id, etag, json)
    RestClient.put(@base_url + "/content/contentid/" + content_id, json.to_s, @headers.merge({:'If-Match' => etag}))
  end

  def assign_to_view(view_name, content_id)
   RestClient.put(@base_url + "/views/#{view_name}", content_id, @headers)
  end

  #
  # search
  # searching for a specific variant will effectively include the matching aspects in the search results
  def search(params, index = 'onecms')
    response = RestClient.get(@base_url + "/search/#{index}/select", @headers.merge({ :params => params }))
    SearchResults.new(response)
  end


  class Id

    def initialize(string_identifier)
      @id = string_identifier
    end


    def to_url_string
      'contentid/' + (@namespace.nil? ? '' : "#{@namespace}/") + @id
    end

  end


  class Alias < Id

    def to_url_string
      'externalid/' + (@namespace.nil? ? '' : "#{@namespace}/") + @id
    end

    def namespace(namespace)
      @namespace = namespace
      self
    end

  end

  class Content

    def initialize(data); @raw=data; end

    def etag; @raw.headers[:etag]; end

    def aspects
      json()['aspects'].collect{ |k,v| k }
    end

    def aspect(aspect)
      Aspect.new json()['aspects'][aspect]
    end

    def id; json()['id']; end

    def json; @json = JSON.parse(@raw) if @json.nil?; @json; end

    def to_s; JSON.pretty_generate(json); end

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

    def to_s; JSON.pretty_generate(@json); end

  end

  class Util
    def self.parseId(response)
      return JSON.parse(response)['id']
    end

    def self.parseVersionedId(response)
      return JSON.parse(response)['version']
    end
  end

  private
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


  class SearchResults
    extend Forwardable
    def_delegators :@json, :[], :size

    def initialize(response)
      @json=JSON.parse(response)
    end

    def entries
      return [] if @json['response']['docs'].size.eql?(0)
      return [] if !@json['response']['docs'][0].has_key?('_data')
      entries = []
      @json['response']['docs'].each do |entry|
        entries << ContentApi::SearchResult.new(entry['id'], Aspect.new(entry['_data']['aspects']['contentData']))
      end
      entries
    end

  end

  class SearchResult
    attr_accessor :id, :data

    def initialize(id, data)
      @id=id
      @data=data
    end

  end


end
