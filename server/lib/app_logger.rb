require 'logger'

class AppLogger < Sinatra::Base
  Logger.class_eval { alias :write :'<<' }

  log_file = File.new(File.expand_path("../../log/#{settings.environment}.log", __FILE__), "a+")
  log_file.sync = true

  logger = Logger.new(log_file, 10, 1024000)
  logger.level = Logger::DEBUG

  before { env["rack.errors"] = log_file }

  configure :production, :staging do
    logger.level = Logger::WARN
  end

  configure do
    use Rack::CommonLogger, logger
  end
end

