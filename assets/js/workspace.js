
/* workspace.js - vanilla */
(function(){
    "use strict";
    function $(s, c){ return (c||document).querySelector(s); }
    function $$(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }
    function go(url){ try{ location.assign(url); }catch(e){ location.href = url; } }

    // Select card on click (except when clicking buttons)
    document.addEventListener("click", function(e){
        var btn = e.target.closest(".overlay .btn");
        if(btn) return; // handled separately
        var card = e.target.closest(".card");
        if(!card) return;
        $$(".card.selected").forEach(function(c){ c.classList.remove("selected"); });
        card.classList.add("selected");
    });

    // Delegate overlay button actions
    document.addEventListener("click", function(e){
        var btn = e.target.closest(".overlay .btn");
        if(!btn) return;
        var card = e.target.closest(".card");
        var act = btn.dataset.act;

        if(act === "edit"){
            go("edit.html"); // 이동
        }else if(act === "download"){
            alert("다운로드 준비중입니다.");
        }else if(act === "delete"){
            if(confirm("이 작업을 삭제할까요?")){
                card.remove();
            }
        }else if(act === "duplicate"){
            // duplicate card
            var clone = card.cloneNode(true);
            card.parentNode.insertBefore(clone, card.nextSibling);
        }
    });

    // Top button
    var extend = document.getElementById("btn-extend");
    if(extend){
        extend.addEventListener("click", function(){ alert("이용 연장 준비중입니다."); });
    }

    // '숏폼 생성' 카드
    var addCard = document.getElementById("card-add");
    if(addCard){
        addCard.addEventListener("click", function(){ go("edit.html"); });
    }
})();
