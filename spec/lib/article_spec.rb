require 'article'

describe Article do
  let(:time) { Time.parse('2014-08-24 12:58:33 +0100') }
  let(:js_time) { 1408881513000 }

  let(:article) { build :article, created_at: time }
  subject { article }

  %W[created_at content sha1 updated_at title meta preview tldr].each do |m|
    it { is_expected.to respond_to m }
  end

  %W[created_at updated_at].each do |m|
    js_method = "js_#{m}"

    it { is_expected.to respond_to js_method }

    describe ".#{js_method}" do
      let(:article) { build :article, m.to_sym => time }
      subject { article.send(js_method) }

      it { is_expected.to eq js_time }
    end
  end

  describe '#id' do
    subject { article.id }
    let(:prev) { build :article }
    before { Article.articles = [prev, article] }

    it { is_expected.to eq 1 }
  end

  describe '#theme_class' do
    subject { article.theme_class }
    before { Article.articles = [article] }

    it { is_expected.to eq 'theme-one' }
  end

  describe 'out_of_four' do
    let(:one) { build :article }
    let(:two) { build :article }
    let(:three) { build :article }
    let(:four) { build :article }

    before { Article.articles = [one, two, three, four] }

    it 'has number out of 4' do
      expect(one.out_of_four).to eq 0
      expect(two.out_of_four).to eq 1
      expect(three.out_of_four).to eq 2
      expect(four.out_of_four).to eq 3
    end
  end


  describe '#year' do
    let(:time) { Time.parse('2015-06-09') }
    subject { article.year }

    it { is_expected.to eq 2015 }
  end

  describe '#published?' do
    subject { article.published? }

    context 'is pre dated' do
      let(:time) { Time.now - 1 * 60 }
      it { is_expected.to be true }
    end

    context 'is post dated' do
      let(:time) { Time.now + 1 * 60 }
      it { is_expected.to be false }
    end
  end

  describe '#prev' do
    subject { article.prev }

    context 'not last' do
      let(:nxt) { build :article, sha1: 'next' }
      before { Article.articles = [article, nxt] }

      it { is_expected.to be nxt }
    end

    context 'last' do
      before { Article.articles = [article] }
      it { is_expected.to be false }
    end
  end

  describe '#next' do
    subject { article.next }

    context 'not first' do
      let(:prev) { build :article, sha1: 'prev' }
      before { Article.articles = [prev, article] }

      it { is_expected.to be prev }
    end

    context 'first' do
      before { Article.articles = [article] }
      it { is_expected.to be false }
    end
  end

  describe '#preview' do
    subject { article.preview }

    context 'with tldr' do
      let(:article) { build :article, tldr: 'hi there' }
      it { is_expected.to eq article.tldr }
    end

    context 'without tldr' do
      let(:article) {build :article, tldr: nil, content: 'bla'}
      it { is_expected.to eq article.content[0..100] + '...'}
    end
  end

  describe '.published'

  describe '.all'

  describe '.sort!' do
    let(:newer) { build :article, created_at: Time.parse('2015-06-09') }
    let(:older) { build :article, created_at: Time.parse('2010-06-09') }
    let(:oldest) { build :article, created_at: Time.parse('2000-06-09') }

    before { Article.articles = [older, newer, oldest] }

    subject { Article.sort! }

    it 'sorts articles by created_at DESC' do
      expect(subject).to eq [newer, older, oldest]
    end
  end

  describe '.last_modified' do
    let(:newer) { build :article, updated_at: Time.parse('2015-06-09') }
    let(:older) { build :article, updated_at: Time.parse('2010-06-09') }

    before { Article.articles = [older, newer] }

    subject { Article.last_modified }

    it 'returns article with most recent updated_at' do
      expect(subject).to be newer
    end
  end

  describe '.new_from_file' do
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

