#!/usr/bin/ruby
require_relative 'content-api'
require 'test/unit'

class IntegrationTestDataApi < Test::Unit::TestCase

  def setup
    @api = ContentApi.new
    @api.user('admin','123456').auth
    @content_id = create_fixture() if @content_id.nil?
  end

  def create_fixture
    article_json = <<-ARTICLE
    { "aspects": {
      "contentData": {
        "data": {
          "_type": "article",
          "body": "\u003cp\u003eButcher mumblecore cred sriracha, four dollar toast chambray fashion axe deep v Godard direct trade selfies Pinterest. Godard quinoa drinking vinegar, fanny pack health goth biodiesel Wes Anderson deep v locavore. Hashtag sriracha hoodie synth McSweeney\u0027s scenester, fap yr jean shorts chambray beard. Meggings lomo DIY scenester Etsy, keffiyeh pop-up. Mlkshk disrupt authentic, chillwave plaid cliche wayfarers. Normcore lumbersexual iPhone, Carles art party salvia Austin mlkshk bitters Shoreditch fixie sustainable gluten-free semiotics.\u003c/p\u003e\r\n",
          "title": "Hipster Ipsum",
          "publishingTime": 1427032849000,
          "lead": "Retro cardigan tousled twee, DIY cornhole before they sold out keffiyeh hoodie fap scenester pop-up Carles cray chambray."
        }
      },
      "editorial-note": {
        "data": {
          "_type": "editorial-note",
          "text": "picture missing, review dates please"
        }
      }
    } }
    ARTICLE
    response = @api.create(article_json)
    return ContentApi::Util.parseId(response)
  end

  def test_simple_get
    data = @api.get @content_id
    assert_not_nil(data)
    assert_not_nil(data.etag)
    assert_equal(data.content_id, @content_id)
  end

  def test_get_aspect
    data = @api.get @content_id
    assert_not_nil(data.aspect('editorial-note'))
  end


  def test_upate_from_json
    data = @api.get @content_id
    data.aspect('contentData').title = 'made of steel'
    @api.update(data.content_id, data.etag, data.json.select { |key,_| key =~ /aspects/ })
  end

  def test_search
    data = @api.search({ :q => '*:*', :fq => 'type:article' })
    assert_not_nil(data)
  end

end
