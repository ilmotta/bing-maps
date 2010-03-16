if Rails.env == 'development'
  [Category, User].each(&:destroy_all)
  
  Category.create :name => 'Automotive'
  Category.create :name => 'Cooking'
  Category.create :name => 'Design'
  Category.create :name => 'Sports'
  
  User.create :name => 'User A', :latitude => -30.15700, :longitude => -51.22395, :role => 0, :category_id => 1
  User.create :name => 'User B', :latitude => -30.15696, :longitude => -51.21931, :role => 0, :category_id => 2
  User.create :name => 'User C', :latitude => -30.15594, :longitude => -51.22363, :role => 1, :category_id => 3
  User.create :name => 'User D', :latitude => -30.15641, :longitude => -51.22167, :role => 1, :category_id => 4
  User.create :name => 'User E', :latitude => -30.15401, :longitude => -51.21889, :role => 0, :category_id => 1
  User.create :name => 'User F', :latitude => -30.15414, :longitude => -51.21800, :role => 1, :category_id => 2
  User.create :name => 'User F', :latitude => -30.15614, :longitude => -51.21900, :role => 1, :category_id => 2
end
