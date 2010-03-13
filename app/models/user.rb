class User < ActiveRecord::Base
  
  belongs_to :category
  
  CULTURES = [
    ['Czech - Czech Republic', 'cs-CZ'],
    ['Danish - Denmark', 'da-DK'],
    ['Dutch - Netherlands', 'nl-NL'],
    ['English - Australia', 'en-AU'],
    ['English - Canada', 'en-CA'],
    ['English - India', 'en-IN'],
    ['English - United Kingdom', 'en-GB'],
    ['English - United States', 'en-US'],
    ['Finnish -Finland', 'fi-FI'],
    ['French - Canada', 'fr-CA'],
    ['French - France', 'fr-FR'],
    ['German - Germany', 'de-DE'],
    ['Italian - Italy', 'it-IT'],
    ['Japanese - Japan', 'ja-JP'],
    ['Norwegian (Bokmal) - Norway', 'nb-NO'],
    ['Portuguese - Brazil', 'Pt-BR'],
    ['Portuguese - Portugal', 'pt-PT'],
    ['Spanish - Mexico', 'es-MX'],
    ['Spanish - Spain', 'es-ES'],
    ['Spanish - United States', 'es-US'],
    ['Swedish - Sweden', 'sv-SE']
  ]

  named_scope :narrowed_by, lambda { |tl, br|
    {
      :select => 'id, latitude, longitude, role, category_id',
      :conditions => [
        '(latitude <= :top_lat AND latitude >= :bottom_lat) AND (longitude >= :left_long AND longitude <= :right_long)',
        { :top_lat => tl[0].to_f, :bottom_lat => br[0].to_f, :left_long => tl[1].to_f, :right_long => br[1].to_f }
      ]
    }
  }
  
end