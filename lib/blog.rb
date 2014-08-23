require 'sinatra/base'
require 'ostruct'
require 'time'
require 'yaml'
require 'digest/sha1'

require 'app_updater'

class Blog < Sinatra::Base
  use AppUpdater

  set :root, File.expand_path('../../', __FILE__)
  set :articles, []
  set :app_file, __FILE__

  Dir.glob "#{root}/articles/*.md" do |f|
    file = File.read(f)

    meta, content = file.split("\n\n", 2)

    article = OpenStruct.new YAML.load(meta)

    article.date = Time.parse article.date.to_s
    article.content = content
    article.slug = File.basename(f, '.md')
    article.sha1 = Digest::SHA1.hexdigest file
    article.mtime = File.mtime(f)

    get "/#{article.slug}" do
      etag article.sha1
      last_modified article.mtime

      erb :post, locals: {article: article}
    end

    articles << article
  end

  articles.sort_by! { |a| a.date }
  articles.reverse!

  get '/' do
    erb :index
  end
end

