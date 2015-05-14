require 'feature_spec_helper'

describe 'AppUpdater', feature: true do

  let(:http_auth) { 'wrong' }
  let(:travis_slug) { 'wrong' }

  subject { post('/update', {}, { 'HTTP_AUTHORIZATION' => http_auth, 'HTTP_TRAVIS_REPO_SLUG' => travis_slug } ) }

  context 'invalid secret' do
    it 'is restricted' do
      subject
      expect(last_response.status).to be 401
    end
  end

  context 'valid secret' do
    before(:each) do
      ENV['TRAVIS_TOKEN'] = 'token'
      Article.articles = [build(:article, content: 'old')]
    end

    let(:http_auth) { '6019d51eeab27d2e9d3d0f6b144ddb5ebe7c1e97593813cb203e453a9048953f' }
    let(:travis_slug) { 'nathamanath/blog' }

    it 'is successful' do
      subject
      expect(last_response.status).to be 200
    end

    it 'reloads articles' do
      pending
      a = build :article, slug: 'new-article'

      Article.articles = [a]

      get a.path
      expect(last_response.status).to_not be 200

      subject

      get a.path
      expect(last_response.status).to be 200
    end
  end
end

