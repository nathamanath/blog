require 'feature_spec_helper'

describe 'articles', feature: true do
  let(:article) { build :article, created_at: created_at, updated_at: updated_at }
  let(:time) { Time.now - 1000 }
  let(:updated_at) { time }
  let(:created_at) { time }

  let(:articles) { [article] }

  # Load articles into app
  before(:each) do
    allow(Article).to receive(:all) { articles }

    app.settings.reset!
    load app.settings.app_file
  end

  describe 'GET /' do
    subject { get '/' }

    it 'is success' do
      subject
      expect(last_response.status).to be 200
    end

    it 'sets etag' do
      subject
      expect(last_response.header['ETag']).to_not be nil
    end

    it 'sets updated at' do
      subject
      expect(last_response.header['Last-Modified']).to_not be nil
    end

    it 'renders article previews' do
      subject
      expect(last_response.body).to match article.preview
    end
  end

  describe 'GET /:article_path' do
    subject { get article.path }

    context 'published' do
      let(:time) { Time.now - 1000 }

      it 'is successful' do
        subject
        expect(last_response.status).to be 200
      end

      it 'sets etag' do
        subject
        expect(last_response.header['ETag']).to_not be ''
      end

      it 'sets last_changed' do
        subject
        expect(last_response.header['Last-Modified']).to_not be ''
      end

      it 'renders article' do
        subject
        expect(last_response.body).to match article.content.strip
      end
    end

    context 'not published' do
      let(:time) { Time.now + 60 }

      it 'is not found' do
        subject
        expect(last_response.status).to be 404
      end
    end

  end
end

