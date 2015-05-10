require 'feature_spec_helper'

describe 'AppUpdater', feature: true do

  let(:http_auth) { 'wrong' }
  let(:travis_slug) { 'wrong' }

  subject { post '/update', {}, { HTTP_AUTHORIZATION: http_auth, HTTP_TRAVIS_REPO_SLUG: travis_slug } }

  context 'invalid secret' do
    let(:secret) { 'wrong' }

    it 'is restricted' do
      pending
      subject
      expect(last_response.status).to be 401
    end
  end

  context 'valid secret' do
    before(:each) { Article.articles = [build(:article, content: 'old')] }

    it 'is successful' do
      subject
      expect(last_response.status).to be 200
    end

    it 'reloads articles' do
      article = build :article, slug: 'new-article'

      Article.articles = [article]

      get article.path
      expect(last_response.status).to_not be 200

      subject

      get article.path
      expect(last_response.status).to be 200
    end
  end
end

