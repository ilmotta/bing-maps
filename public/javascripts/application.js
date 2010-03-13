$(function() {
  $('a.close-info-box').live('click', function() {
    Map.hideInfoBox();
    return false;
  });
});