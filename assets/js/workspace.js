/*! workspace.js — vanilla, Layer(공통) 기반 */
(function(){
    "use strict";
    const $  = (s,c)=> (c||document).querySelector(s);
    const $$ = (s,c)=> Array.from((c||document).querySelectorAll(s));
    const nav = url => { try{ location.assign(url); }catch{ location.href = url; } };

    /* ========================
     * 기본 선택/하이라이트
     * ======================== */
    document.addEventListener("click", e=>{
        const btn = e.target.closest(".overlay .btn");
        if(btn) return; // 오버레이 버튼은 아래에서 처리
        const card = e.target.closest(".card");
        if(!card) return;
        $$(".card.selected").forEach(c=>c.classList.remove("selected"));
        card.classList.add("selected");
    });

    /* ========================
     * 상단: 이용 연장 -> 구매 레이어
     * ======================== */
    $("#btn-extend")?.addEventListener("click", ()=> Layer.open("purchase"));

    /* ========================
     * '숏폼 생성' 카드 -> (지금은) 구매 레이어
     *   - 나중에 이용권 보유 여부에 따라 분기하면 됨
     * ======================== */
    $("#card-add")?.addEventListener("click", ()=>{
        // TODO: hasLicense 값으로 분기
        const hasLicense = false;
        if(hasLicense) nav("edit.html");
        else Layer.open("purchase");
    });

    /* ========================
     * 카드 오버레이 버튼
     * ======================== */
    document.addEventListener("click", e=>{
        const btn  = e.target.closest(".overlay .btn"); if(!btn) return;
        const card = e.target.closest(".card");
        const date = card?.querySelector(".date")?.textContent?.trim() || "";
        const act  = btn.dataset.act;

        if(act === "play"){
            Layer.open("player", { title: date, card });
        }else if(act === "edit"){
            nav("edit.html");
        }else if(act === "download"){
            // TODO: 실제 다운로드 연결
            alert("다운로드 준비중입니다.");
        }else if(act === "delete"){
            Layer.open("delete-video", { card });
        }
    });

    /* ========================
     * 레이어별 동작 (이 파일에서 처리)
     * ======================== */
    document.addEventListener("layer:opened", e=>{
        const { name, el, ctx } = e.detail;

        // 1) 구매 레이어
        if(name === "purchase"){
            el.addEventListener("click", ev=>{
                const b = ev.target.closest("[data-act]"); if(!b) return;
                const act = b.dataset.act;
                if(act === "purchase"){
                    // TODO: 실제 결제/상품 페이지 이동
                    alert("이용권 구매 페이지로 이동(더미)");
                    Layer.close(el);
                }else if(act === "cancel"){
                    Layer.close(el);
                }
            });
        }

        // 2) 플레이어 레이어
        if(name === "player"){
            if(ctx?.title){
                const t = el.querySelector(".topbar-title");
                if(t) t.textContent = ctx.title;
            }
            // TODO: 실제 플레이어 mount/play 코드 위치
        }

        // 3) 삭제 확인 레이어
        if(name === "delete-video"){
            el.addEventListener("click", ev=>{
                const b = ev.target.closest("[data-act]"); if(!b) return;
                if(b.dataset.act === "confirm-delete"){
                    ctx?.card?.remove();     // 실제 삭제
                    Layer.close(el);
                }else if(b.dataset.act === "cancel"){
                    Layer.close(el);
                }
            });
        }
    });

    // 플레이어 레이어 닫힐 때 정리
    document.addEventListener("layer:closing", e=>{
        const el = e.detail.el;
        if(el && el.matches('.layer-full')) {
            // TODO: player stop/dispose
        }
    });

    // 초기 체감속도용 프리로드 (선택)
    Layer.preload?.(["purchase","delete-video"]);
})();
