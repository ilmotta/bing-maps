class UsersController < ApplicationController
  
  def index
    if params[:tl] && params[:br]
      @users = User.narrowed_by(params[:tl], params[:br])
    else
      @users = User.all(:order => :name)
    end
    
    respond_to do |format|
      format.html do
        @categories = Category.all(:order => :name)
        params[:map] ||= { :culture => 'en-US' }
        @culture = params[:map][:culture]
        
      end
      format.json { render :json => @users.to_json(:only => [:id, :latitude, :longitude, :role, :category_id]) }
    end
  end
  
  def show
    @user = User.find(params[:id])
    respond_to do |format|
      format.html { render :layout => false }
    end
  end
  
end