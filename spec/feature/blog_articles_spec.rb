require 'feature_spec_helper'

describe 'articles', feature: true do

  let(:article) do
    article = Article.new

    article.title = 'title'
    article.slug = 'slug'
    article.updated_at = Time.now
    article.updated_at = Time.now
    article.sha1 = 'hash'
    article.content = 'content'

    article
  end

  let(:articles) { [article] }

  # TODO: stub articles_glob in here, not in blog

  describe 'GET /' do
    it 'sets etag based on published articles'
    it 'sets updated at based on latest article'
  end

  context 'unpublished' do
    subject { get '/unpublished' }

    it 'doesent get a page' do
      subject
      expect(last_response.status).to be 404
    end

    it 'is not listed on home page' do
      get '/'
      expect(last_response.body).to_not match 'unpublished'
    end
  end

  describe 'GET /:article_hash' do
    subject { get '/article' }

    it 'is successful' do
      subject
      expect(last_response.status).to eq 200
    end

    it 'sets etag' do
      subject
      expect(last_response.header['ETag']).to eq 'af349a21af611014814f215bc3b60b81521efe33'
    end

    it 'sets last_changed'

    it 'renders article' do
      subject
      expect(last_response.body).to match article.content
    end
  end
end

