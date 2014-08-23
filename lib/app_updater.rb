require 'sinatra/base'
require 'json'
require 'time'

class AppUpdater < Sinatra::Base
  def self.parse_git
    sha1, date = `git log HEAD~1..HEAD --pretty=format:%h^%ci`.strip.split('^')
    set :commit_hash, sha1
    set :commit_date, Time.parse(date)
  end

  set(:autopull) { production? }

  before do
    cache_control :public, :must_revalidate
    etag settings.commit_hash
    last_modified settings.commit_date
  end

  post '/update' do
    settings.parse_git

    app.settings.reset!
    load app.settings.app_file

    content_type :json

    if settings.autopull?
      { response: `git pull 2>&1` }.to_json
    else
      { response: :ok }.to_json
    end
  end
end

