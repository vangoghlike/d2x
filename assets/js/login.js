
(function(){
    "use strict";
    function $(s,c){return (c||document).querySelector(s);}

    // Social buttons
    ["google","kakao","naver"].forEach(function(id){
        var el = document.getElementById("s-"+id);
        if(el) el.addEventListener("click", function(){ alert(id.toUpperCase()+" 로그인 준비중입니다."); });
    });

    // Form enable/submit
    var email = $("#login-email");
    var pass  = $("#login-pass");
    var btn   = $("#btn-login");

    function validate(){
        var ok = !!(email.value.trim() && pass.value.length >= 6);
        btn.disabled = !ok;
    }
    email.addEventListener("input", validate);
    pass.addEventListener("input", validate);
    validate();

    $("#login-form").addEventListener("submit", function(e){
        e.preventDefault();
        if(btn.disabled) return;
        alert("로그인 준비중입니다.");
    });
})();
