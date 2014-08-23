require 'time'
require 'yaml'
require 'digest/sha1'

class Article
  attr_accessor :date, :content, :slug, :sha1, :mtime, :title, :meta

  def self.new_from_file(f)
    file = File.read f

    meta, content = file.split("\n\n", 2)

    article = Article.new

    article.meta = YAML.load(meta)
    article.date = Time.parse article.meta['date'].to_s
    article.title = article.meta['title']
    article.content = content
    article.slug = File.basename(f, '.md')
    article.sha1 = Digest::SHA1.hexdigest file
    article.mtime = File.mtime(f)

    article
  end
end

