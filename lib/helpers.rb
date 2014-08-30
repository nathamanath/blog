module Helpers
  def link_to_unless_current(text, location)
    if request.path_info == location
      text
    else
      "<a href=\"#{location}\">#{text}</a>"
    end
  end

  def page_title
    title = settings.title
    (@title) ? "#{@title} | #{title}" : title
  end
end

