#!/usr/bin/ruby
require_relative 'content-api'
require 'test/unit'

class IntegrationTestDataApi < Test::Unit::TestCase

  def setup
    @api = ContentApi.new
    @api.user('edmund','edmund').auth
    @content_id = create_fixture() if @content_id.nil?
  end

  def create_fixture
    article_json = <<-ARTICLE
    {
      "contentData": {
        "_type": "com.atex.standard.article.ArticleBean",
        "title": "Hipster Ipsum",
        "body": "Butcher mumblecore cred sriracha, four dollar toast chambray fashion axe deep v Godard direct trade selfies Pinterest. Godard quinoa drinking vinegar, fanny pack health goth biodiesel Wes Anderson deep v locavore. Hashtag sriracha hoodie synth McSweeney's scenester, fap yr jean shorts chambray beard. Meggings lomo DIY scenester Etsy, keffiyeh pop-up. Mlkshk disrupt authentic, chillwave plaid cliche wayfarers. Normcore lumbersexual iPhone, Carles art party salvia Austin mlkshk bitters Shoreditch fixie sustainable gluten-free semiotics.",
        "lead": "Retro cardigan tousled twee, DIY cornhole before they sold out keffiyeh hoodie fap scenester pop-up Carles cray chambray."
      }
    }
    ARTICLE
    return @api.create(article_json)
  end

  def test_simple_get
    data = @api.get @content_id
    assert_not_nil(data)
    assert_not_nil(data.etag)
    assert_equal(data.content_id, @content_id)
  end

  def test_get_aspect
    data = @api.get @content_id
    assert_not_nil(data.aspect('p.InsertionInfo'))
  end

  def test_upate_from_json
    data = @api.get @content_id
    data.aspect('contentData').title = 'made of steel'
    @api.update(data.content_id, data.etag, data.json.select { |key,_| key =~ /contentData/ })
  end

  def test_search
    data = @api.search({ :q => '*:*', :fq => 'inputTemplate:standard.Article' })
    assert_not_nil(data)
  end

end
