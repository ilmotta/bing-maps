# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_simple-app_session',
  :secret      => '3fd66b2df670fd30105d39b813734ed303fa3893f7e718e45bf708a213d53cb244f03467e32ea367f0efdacf38a72f3e915bf06b58fc19427e5ae7a3e390af79'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
