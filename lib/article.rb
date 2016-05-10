require 'time'
require 'yaml'
require 'digest/sha1'

class Article
  attr_accessor :content, :slug, :sha1, :created_at, :updated_at, :title, :meta, :tldr

  THEMES = [
    'one',
    'two',
    'three',
    'four'
  ]

  @@articles = []

  class << self
    def init(glob)
      clear!

      Dir[glob].each do |file|
        all << Article.new_from_file(file)
      end

      sort!
    end

    def clear!
      self.articles = []
    end

    def articles=(articles)
      @@articles = articles
    end

    def all
      @@articles
    end

    def count
      self.all.count
    end

    def for_year(year)
      self.all.select { |article| article.year == year }
    end

    def published
      all.select { |article| article.published? }
    end

    def last_modified
      all.sort { |a, b| b.updated_at <=> a.updated_at }.first
    end

    def sort!
      all.sort_by! { |a| a.created_at }
      all.reverse!
    end

    def new_from_file(f)
      file = File.read f

      meta, content = file.split("\n\n", 2)

      article = Article.new

      article.meta = YAML.load(meta)
      article.created_at = Time.parse(article.meta['date'].to_s)
      article.title = article.meta['title']
      article.content = content
      article.slug = File.basename(f, '.md')
      article.sha1 = Digest::SHA1.hexdigest file
      article.updated_at = File.mtime(f)
      article.tldr = article.meta.fetch('tldr', nil)

      article
    end
  end

  def preview
    @preview ||= tldr || content[0..200] + '...'
  end

  def year
    created_at.year
  end

  def path
    "/#{year}/#{slug}"
  end

  def prev
    # find self in Article.all. return the next one or false
    Article.published.each_with_index do |article, index|
      if article.sha1 == self.sha1
        break Article.all[index + 1] || false
      end
    end
  end

  def next
    Article.published.each_with_index do |article, index|
      if article.sha1 == self.sha1
        i = index - 1
        break (i >= 0) ? Article.all[i] : false
      end
    end
  end

  def published?
    created_at < Time.now
  end

  # js_created_at / js_updated_at
  %W[updated_at created_at].each do |m|
    name = "js_#{m}"
    define_method(name) { eval("@#{name} ||= #{m}.to_i * 1000") }
  end

  # article 'id' is article position in articles. Used to work out which colour
  # to use in article
  def id
    Article.all.index self
  end

  # returns 0..3
  def out_of_four
    Article.count - id - ((10 - id) / THEMES.count)
  end

  def theme_class
    "theme-#{THEMES[out_of_four]}"
  end

end
