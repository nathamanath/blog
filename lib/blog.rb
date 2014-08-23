require 'sinatra/base'
require 'ostruct'
require 'time'
require 'yaml'

$LOAD_PATH.unshift 'lib'

require 'app_updater'

class Blog < Sinatra::Base
  use AppUpdater

  set :root, File.expand_path('../../', __FILE__)
  set :articles, []
  set :app_file, __FILE__

  Dir.glob "#{root}/articles/*.md" do |f|
    meta, content = File.read(f).split("\n\n", 2)

    article = OpenStruct.new YAML.load(meta)

    article.date = Time.parse article.date.to_s
    article.content = content
    article.slug = File.basename(f, '.md')

    get "/#{article.slug}" do
      erb :post, locals: {article: article}
    end

    articles << article
  end

  articles.sort_by! { |a| a.date }
  articles.reverse!

  get '/' do
    erb :index
  end

  run!
end

