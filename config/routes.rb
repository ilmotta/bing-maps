ActionController::Routing::Routes.draw do |map|
  
  map.root :controller => 'users'
  
  map.resources :users, :only => [:index, :show]
  
end
