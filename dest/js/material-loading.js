ml_state = false;
ml_ready = false;
function materialLoading(state){
  if(state && ml_ready) document.getElementById('materialLoading').className = 'show';
  else if(ml_ready) document.getElementById('materialLoading').className = 'hide';
  ml_state = state;
}

