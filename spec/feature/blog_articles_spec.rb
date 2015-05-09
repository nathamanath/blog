require 'feature_spec_helper'

describe 'articles', feature: true do
  # Uses fixture articles from /spec/fixtures/articles

  let(:article) { Article.new_from_file(File.expand_path('../../fixtures/articles/article.md', __FILE__)) }

  describe 'GET /' do

    subject { get '/' }

    it 'is success' do
      subject
      expect(last_response.status).to be 200
    end

    it 'sets etag based on sha' do
      subject
      expect(last_response.header['ETag']).to_not be nil
    end

    it 'sets updated at based git' do
      subject
      expect(last_response.header['Last-Modified']).to_not be nil
    end

    it 'renders article previews' do
      subject
      expect(last_response.body).to match article.preview
    end
  end

  describe 'GET /:article_hash' do
    subject { get article.path }

    it 'is successful' do
      subject
      expect(last_response.status).to be 200
    end

    it 'sets etag' do
      subject
      expect(last_response.header['ETag']).to eq '"af349a21af611014814f215bc3b60b81521efe33"'
    end

    it 'sets last_changed' do
      subject
      expect(last_response.header['Last-Modified']).to eq "Sat, 23 Aug 2014 21:02:57 GMT"
    end

    it 'renders article' do
      subject
      expect(last_response.body).to match article.content.strip!
    end
  end
end

