var isPasswordVisible = false;

function togglePassword(input) {


    var hideshow = document.querySelector("#hideShow"+input)
      var passwordInput = document.getElementById(input);
        
      isPasswordVisible = !isPasswordVisible;
    
      if (isPasswordVisible) {
        passwordInput.type = 'text';
        hideshow.innerHTML = "Hide"
        hideshow.classList.add('hideShowUnder')
      } else {
        passwordInput.type = 'password';
        hideshow.innerHTML = "Show"
        hideshow.classList.remove('hideShowUnder')
      }
    }