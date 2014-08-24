require 'article'

describe Article do
  let(:article) { build :article }
  subject { article }

  %W[created_at content sha1 updated_at title meta].each do |m|
    it { is_expected.to respond_to m }
  end

  let(:time) { Time.parse('2014-08-24 12:58:33 +0100') }
  let(:js_time) { 1408881513000 }

  %W[created_at updated_at].each do |m|
    js_method = "js_#{m}"

    it { is_expected.to respond_to js_method }

    describe ".#{js_method}" do
      let(:article) { build :article, m.to_sym => time }
      subject { article.send(js_method) }

      it { is_expected.to eq js_time }
    end
  end

  describe '#new_from_file' do
    let(:file) { File.expand_path('../../fixtures/articles/article.md', __FILE__) }
    subject { Article.new_from_file(file) }

    it 'creates new instance from file' do
      expect(subject).to be_an_instance_of Article
    end

    it 'assigns sha1' do
      expect(subject.sha1).to eq Digest::SHA1.hexdigest(File.read(file))
    end

    it 'assigns created_at' do
      expect(subject.created_at).to be_an_instance_of Time
    end

    it 'assigns updated_at' do
      expect(subject.updated_at).to be_an_instance_of Time
    end

    it 'assigns title' do
      expect(subject.title).to eq 'title'
    end

    it 'assigns meta' do
      expect(subject.meta).to be_an_instance_of Hash
    end
  end
end

