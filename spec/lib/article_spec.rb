require 'article'

describe Article do
  %W[date content sha1 mtime title meta].each do |meth|
    it { is_expected.to respond_to meth }
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

    it 'assigns date' do
      expect(subject.date).to be_an_instance_of Time
    end

    it 'assigns mtime' do
      expect(subject.mtime).to be_an_instance_of Time
    end

    it 'assigns title' do
      expect(subject.title).to eq 'title'
    end

    it 'assigns meta' do
      expect(subject.meta).to be_an_instance_of Hash
    end
  end
end

