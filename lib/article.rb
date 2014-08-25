require 'time'
require 'yaml'
require 'digest/sha1'

class Article
  attr_accessor :content, :slug, :sha1, :created_at, :updated_at, :title, :meta

  def self.new_from_file(f)
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

    article
  end

  def js_updated_at
    @js_updated_at ||= date_to_js(updated_at)
  end

  def published?
    Time.now > created_at
  end

  %W[updated_at created_at].each do |m|
    name = "js_#{m}"
    define_method(name) { eval("@#{name} ||= #{m}.to_i * 1000") }
  end
end

