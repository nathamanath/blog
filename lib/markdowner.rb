require 'redcarpet'
require 'coderay'
require 'coderay_bash'

module Markdowner

  extend self

  def render(text)
    coderayified = CodeRayify.new(
      # filter_html: true,
      hard_wrap: true,
      with_toc_data: true
    )

    options = {
      autolink: true,
      fenced_code_blocks: true,
      footnotes: true,
      highlight: true,
      no_intra_emphasis: true,
      superscript: true,
      space_after_headers: true,
      strikethrough: true,
      tables: true,
      underline: true
    }

    markdown_to_html = Redcarpet::Markdown.new(coderayified, options)

    # coderayified introduces line breaks.
    # These are needed to make syntax highlighting work.
    # Appart from that they are not wanted. So kill them all!
    markdown_to_html.render(text).gsub /<br>/, ''

  end

  private

  class CodeRayify < Redcarpet::Render::HTML
    def block_code(code, language)
      CodeRay.scan(code, language).div(
        # line_numbers: :inline,
        css: :class,
        line_number_anchors: false
      )
    end
  end

end
