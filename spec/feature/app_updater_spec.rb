require 'feature_spec_helper'

describe 'AppUpdater', feature: true do

  before(:all) { ENV['SECRET'] = 'right' }

  let(:secret) { nil }
  subject { post '/update', config: { secret: secret } }

  context 'invalid secret' do
    let(:secret) { 'wrong' }

    it 'is restricted' do
      pending
      subject
      expect(last_response.status).to be 401
    end
  end

  context 'valid secret' do
    let(:secret) { 'right' }

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

