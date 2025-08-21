/*! Editor (vanilla, no jQuery) — 템플릿 복제 방식 */
(function () {
    "use strict";

    // ---------- helpers ----------
    function $(s, c) {
        return (c || document).querySelector(s);
    }

    function $$(s, c) {
        return Array.prototype.slice.call((c || document).querySelectorAll(s));
    }

    function clamp(t, n) {
        return t.length > n ? t.slice(0, n) : t;
    }

    function uuid() {
        try {
            if (crypto && crypto.randomUUID) return crypto.randomUUID();
        } catch (e) {}
        return "u" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    var CONFIG = {
        MAX_LINE: 40,
        STORAGE_KEY: "editor.clips",
        NAV_TARGET: "/"
    };

    // ---------- state ----------
    var State = {
        clips: [], // [{id,thumb,time,lines:[]}]
        active: {
            clip: 0,
            line: 0
        },
        ratio: "9:16",
        ai: {
            voice: "뉴스앵커",
            tone: "정색",
            speed: 1,
            hashtags: "",
            bgm: "밝고 경쾌함",
            sub: true,
            main: true,
            caption: false
        }
    };

    var clipList = $("#clipList");
    var tplClip = $("#tpl-clip");
    var tplLine = $("#tpl-line");
    var preview = $("#preview");
    var previewText = $("#previewText");

    // ---------- parse DOM -> state (초기 더미는 HTML에서 읽음) ----------
    function parseDOMToState() {
        var clips = [];
        $$(".clip", clipList).forEach(function (cEl, ci) {
            var time = $(".badge-time", cEl) ? $(".badge-time", cEl).textContent : '0"';
            var thumbImg = $(".thumb img", cEl);
            var thumb = thumbImg ? thumbImg.getAttribute("src") : "";
            var lines = [];
            $$(".line", cEl).forEach(function (lEl) {
                var inp = $(".input-line", lEl);
                lines.push(inp ? inp.value : "");
            });
            clips.push({
                id: uuid(),
                thumb: thumb,
                time: time,
                lines: lines
            });
            cEl.dataset.cidx = String(ci);
            $(".clip-index", cEl).textContent = String(ci + 1);
            $$(".line", cEl).forEach(function (lEl, li) {
                lEl.dataset.cidx = String(ci);
                lEl.dataset.lidx = String(li);
                var inp = $(".input-line", lEl);
                var counter = $(".counter", lEl);
                if (inp && counter) counter.textContent = (inp.value.length + "/" + CONFIG.MAX_LINE);
            });
        });
        State.clips = clips.length ? clips : [];
    }

    // ---------- template helpers ----------
    function cloneClip() {
        return document.importNode(tplClip.content, true).firstElementChild;
    }

    function cloneLine() {
        return document.importNode(tplLine.content, true).firstElementChild;
    }

    // ---------- preview ----------
    function setRatio(r) {
        State.ratio = r;
        if (preview) preview.className = "stage ratio-" + r.replace(":", "-");
        $$("#ratioRow .pill").forEach(function (p) {
            p.classList.toggle("active", p.getAttribute("data-ratio") === r);
        });
    }

    function renderPreview() {
        var a = State.active;
        var t = (State.clips[a.clip] && State.clips[a.clip].lines[a.line]) || "선택한 문장이 이곳에 표시됩니다.";
        if (previewText) previewText.textContent = clamp(t, CONFIG.MAX_LINE);
    }

    // ---------- DOM <-> State 동기화 ----------
    function syncStateFromDOM() {
        var clips = [];
        $$(".clip", clipList).forEach(function (cEl, ci) {
            var time = $(".badge-time", cEl) ? $(".badge-time", cEl).textContent : '0"';
            var thumbImg = $(".thumb img", cEl);
            var thumb = thumbImg ? thumbImg.getAttribute("src") : "";
            var lines = $$(".line", cEl).map(function (lEl) {
                return $(".input-line", lEl).value;
            });
            clips.push({
                id: uuid(),
                thumb: thumb,
                time: time,
                lines: lines
            });
        });
        State.clips = clips;
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(State.clips));
        renderPreview();
    }

    function rebuildDOMFromState() {
        // 전체 재구성: 템플릿만 복제
        clipList.innerHTML = "";
        State.clips.forEach(function (c, ci) {
            var cEl = cloneClip();
            cEl.dataset.cidx = String(ci);
            $(".clip-index", cEl).textContent = String(ci + 1);
            $(".badge-time", cEl).textContent = c.time || '0"';
            var tWrap = $(".thumb", cEl);
            if (c.thumb) {
                var img = document.createElement("img");
                img.src = c.thumb;
                tWrap.insertBefore(img, tWrap.firstChild);
                var span = tWrap.querySelector("span");
                if (span) span.remove();
            }
            var linesWrap = $(".lines", cEl);
            c.lines.forEach(function (text, li) {
                var lEl = cloneLine();
                lEl.dataset.cidx = String(ci);
                lEl.dataset.lidx = String(li);
                var inp = $(".input-line", lEl);
                var counter = $(".counter", lEl);
                if (inp) inp.value = clamp(text, CONFIG.MAX_LINE);
                if (counter) counter.textContent = (inp.value.length + "/" + CONFIG.MAX_LINE);
                linesWrap.appendChild(lEl);
            });
            clipList.appendChild(cEl);
        });
        renderPreview();
    }

    // ---------- interactions ----------
    // 탭
    $$(".tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
            $$(".tab").forEach(function (b) {
                b.classList.remove("active");
            });
            tab.classList.add("active");
            var id = tab.getAttribute("data-tab");
            $$(".tab-pane").forEach(function (p) {
                p.classList.remove("active");
            });
            var pane = $("#tab-" + id);
            if (pane) pane.classList.add("active");
        });
    });

    // URL 입력 닫기 버튼들
    $$(".close-link").forEach(function(btn){
        btn.addEventListener("click", handleClearUrl);
    });

    // 템플릿 변경 버튼
    var btnTmpl = document.getElementById("btn-template");
    if (btnTmpl) btnTmpl.addEventListener("click", handleTemplateChange);

    // 라인 입력/버튼(위임)
    clipList.addEventListener("input", function (e) {
        var inp = e.target.closest(".input-line");
        if (!inp) return;
        if (inp.value.length > CONFIG.MAX_LINE) inp.value = clamp(inp.value, CONFIG.MAX_LINE);
        var line = inp.closest(".line");
        var counter = $(".counter", line);
        if (counter) counter.textContent = (inp.value.length + "/" + CONFIG.MAX_LINE);
        $$(".line").forEach(function (x) {
            x.classList.remove("active");
        });
        line.classList.add("active");
        State.active = {
            clip: +line.dataset.cidx,
            line: +line.dataset.lidx
        };
        renderPreview();
        syncStateFromDOM();
    });

    clipList.addEventListener("click", function (e) {
        var btn = e.target.closest(".icon, .btn-del-clip");
        if (!btn) return;

        // 줄 추가/삭제
        if (btn.classList.contains("icon")) {
            var act = btn.getAttribute("data-act");
            var line = btn.closest(".line");
            var cIdx = +line.dataset.cidx,
                lIdx = +line.dataset.lidx;

            if (act === "add") {
                var lEl = cloneLine();
                lEl.dataset.cidx = String(cIdx);
                lEl.dataset.lidx = String(lIdx + 1);
                $(".input-line", lEl).value = "";
                $(".counter", lEl).textContent = "0/" + CONFIG.MAX_LINE;
                line.parentNode.insertBefore(lEl, line.nextSibling);

                // 이후 인덱스 갱신
                $$(".line", line.parentNode).forEach(function (el, i) {
                    el.dataset.lidx = String(i);
                });
            }
            if (act === "del") {
                var wrap = line.parentNode;
                wrap.removeChild(line);
                $$(".line", wrap).forEach(function (el, i) {
                    el.dataset.lidx = String(i);
                });
            }
            syncStateFromDOM();
            return;
        }

        // 클립 삭제
        if (btn.classList.contains("btn-del-clip")) {
            var clip = btn.closest(".clip");
            clip.parentNode.removeChild(clip);
            // 인덱스 리라벨
            $$(".clip", clipList).forEach(function (cEl, i) {
                cEl.dataset.cidx = String(i);
                $(".clip-index", cEl).textContent = String(i + 1);
                $$(".line", cEl).forEach(function (lEl, j) {
                    lEl.dataset.cidx = String(i);
                    lEl.dataset.lidx = String(j);
                });
            });
            syncStateFromDOM();
        }
    });

    // 썸네일 업로드(위임)
    clipList.addEventListener("change", function (e) {
        var file = e.target.closest('.thumb input[type="file"]');
        if (!file) return;
        var input = e.target;
        var f = input.files && input.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
            var label = input.closest(".thumb");
            var old = label.querySelector("img");
            if (old) old.remove();
            var img = document.createElement("img");
            img.src = reader.result;
            label.insertBefore(img, label.firstChild);
            var span = label.querySelector("span");
            if (span) span.remove();
            syncStateFromDOM();
        };
        reader.readAsDataURL(f);
    });

    // 드래그 정렬
    var draggingLine = null,
        draggingClip = null;
    clipList.addEventListener("dragstart", function (e) {
        var line = e.target.closest(".line");
        var clip = e.target.closest(".clip");
        if (line) {
            draggingLine = line;
            line.classList.add("dragging");
        }
        if (clip && !line){                     // 라인이 아니면 클립 드래그로 간주
            draggingClip = clip; clip.classList.add("dragging");
        }
    });
    clipList.addEventListener("dragend", function (e) {
        var node = e.target.closest(".line, .clip");
        if (!node) return;
        node.classList.remove("dragging");
        if (node.classList.contains("line")) draggingLine = null;
        if (node.classList.contains("clip")) draggingClip = null;
    });
    clipList.addEventListener("dragover", function (e) {
        e.preventDefault();
        var overClip = e.target.closest(".clip");
        if (draggingLine && overClip) {
            var wrap = $(".lines", overClip);
            var list = $$(".line:not(.dragging)", wrap);
            var before = null;
            for (var i = 0; i < list.length; i++) {
                var box = list[i].getBoundingClientRect();
                if (e.clientY < box.top + box.height / 2) {
                    before = list[i];
                    break;
                }
            }
            wrap.insertBefore(draggingLine, before || null);
            // 인덱스 재기록
            $$(".line", wrap).forEach(function (el, i) {
                el.dataset.lidx = String(i);
            });
        }
        if (draggingClip) {
            var listC = $$(".clip:not(.dragging)", clipList);
            var beforeC = null;
            for (var j = 0; j < listC.length; j++) {
                var bx = listC[j].getBoundingClientRect();
                if (e.clientY < bx.top + bx.height / 2) {
                    beforeC = listC[j];
                    break;
                }
            }
            clipList.insertBefore(draggingClip, beforeC || null);
            $$(".clip", clipList).forEach(function (cEl, k) {
                cEl.dataset.cidx = String(k);
                $(".clip-index", cEl).textContent = String(k + 1);
                $$(".line", cEl).forEach(function (lEl, m) {
                    lEl.dataset.cidx = String(k);
                    lEl.dataset.lidx = String(m);
                });
            });
        }
    });
    clipList.addEventListener("drop", function () {
        syncStateFromDOM();
    });
    clipList.addEventListener("focusin", (e)=>{
        const line = e.target.closest(".line"); if(!line) return;
        $$(".line").forEach(x=>x.classList.remove("active"));
        line.classList.add("active");
        $$(".clip").forEach(c=>c.classList.remove("active"));
        line.closest(".clip")?.classList.add("active");
        state.active = { clip:+line.dataset.cidx, line:+line.dataset.lidx };
        renderPreview();
    });

    // 클립 추가 버튼
    $("#btn-add-clip").addEventListener("click", function () {
        var ci = $$(".clip", clipList).length;
        var cEl = cloneClip();
        cEl.dataset.cidx = String(ci);
        $(".clip-index", cEl).textContent = String(ci + 1);
        $(".badge-time", cEl).textContent = '0"';
        clipList.appendChild(cEl);
        syncStateFromDOM();
    });

    // 드롭존으로 추가
    $("#dropZone").addEventListener("dragover", function (e) {
        e.preventDefault();
    });
    $("#dropZone").addEventListener("drop", function (e) {
        e.preventDefault();
        $("#btn-add-clip").click();
    });

    // 우측 옵션/비율
    $("#ratioRow").addEventListener("click", function (e) {
        var b = e.target.closest(".pill");
        if (!b) return;
        setRatio(b.getAttribute("data-ratio"));
    });


    /* ---------- nav/alert 핸들러들 ---------- */
    function go(url){ try{ location.assign(url); }catch(e){ location.href = url; } }

    function handleCreateClips(e){
        if(e) e.preventDefault();
        alert("준비중입니다.");
    }
    function handleMemberInfo(e){
        if(e) e.preventDefault();
        alert("준비중입니다.");
    }
    function handleLogout(e){
        if(e) e.preventDefault();
        go(CONFIG.NAV_TARGET);
    }
    function handleCancel(e){
        if(e) e.preventDefault();
        go(CONFIG.NAV_TARGET);
    }
    function handleGenerate(){
        if (confirm("저장하시겠습니까?")){
            syncStateFromDOM();   // 현재 DOM -> 상태 저장
            alert("저장됨");
        }
    }

    /* ===== URL 입력 닫기(내용 비우기) ===== */
    function handleClearUrl(e){
        e.preventDefault();
        var btn = e.currentTarget;
        // 가까운 input-wrap 안의 입력 찾기 → 없으면 #url-input
        var wrap = btn.closest(".input-wrap");
        var input = wrap ? wrap.querySelector("input, textarea") : document.getElementById("url-input");
        if (input){
            input.value = "";
            // 변경 이벤트 전파(필요 시 다른 로직이 듣도록)
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.focus();
        }
    }

    /* ===== 템플릿 변경(더미 동작) ===== */
    function handleTemplateChange(e){
        e.preventDefault();
        var field = document.getElementById("templateName");
        if (field){
            field.value = "템플릿 변경됨";
        }
        alert("템플릿이 변경되었습니다.");
    }


    /* ---------- sound preview helpers ---------- */
    function playSoundPreview(kind, value){
        // 실제 오디오 재생 대신, 우선 메시지만
        alert("사운드 실행: " + kind + (value ? " (" + value + ")" : ""));
    }

    /** select 옆의 .btn-icon에 미리듣기 바인딩 */
    function bindIconPreview(selectId, kindLabel){
        var sel = document.getElementById(selectId);
        if (!sel) return;
        var parent = sel.parentNode;
        if (!parent) return;
        var btn = parent.querySelector(".btn-icon");
        if (!btn) return;

        btn.addEventListener("click", function(){
            // 현재 선택값을 메시지에 같이 노출
            var val = sel.value || "";
            playSoundPreview(kindLabel, val);
        });
    }

    //* ===== 프리뷰 레이어 토글 ===== */
    function applyPreviewToggles(){
        var p = document.getElementById("preview"); if(!p) return;
        var sub = document.getElementById("opt-sub");
        var main = document.getElementById("opt-main");
        var cap = document.getElementById("opt-caption"); // 하단
        var logo = document.getElementById("opt-logo");   // 있으면 반영(없으면 무시)

        p.classList.toggle("hide-sub",    sub && !sub.checked);
        p.classList.toggle("hide-main",   main && !main.checked);
        p.classList.toggle("hide-bottom", cap && !cap.checked);
        if (logo) p.classList.toggle("hide-logo", !logo.checked);
    }

    /* ---------- 좌측: 클립 생성 / 계정 링크 ---------- */
    var btnMakeClips = document.getElementById("btn-make-clips");
    if (btnMakeClips) btnMakeClips.addEventListener("click", handleCreateClips);

    // footer의 '회원정보' / '로그아웃' 링크 바인딩 (텍스트 기준 매칭)
    var footerLinks = $$(".left-foot .links .link");
    footerLinks.forEach(function(a){
        var t = (a.textContent || "").trim();
        if (t === "회원정보") a.addEventListener("click", handleMemberInfo);
        if (t === "로그아웃") a.addEventListener("click", handleLogout);
    });

    /* ---------- 우측: 취소/생성 ---------- */
    var btnCancel = document.getElementById("btn-cancel");
    if (btnCancel) btnCancel.addEventListener("click", handleCancel);

    var btnGenerate = document.getElementById("btn-generate");
    if (btnGenerate) btnGenerate.addEventListener("click", handleGenerate);


    /* ---------- 사운드 미리듣기 바인딩 ---------- */
    bindIconPreview("ai-voice", "AI 목소리");
    bindIconPreview("ai-tone",  "AI 억투");
    bindIconPreview("bgm",      "배경음악");


    var _save = document.getElementById("btn-save");
    if (_save) _save.addEventListener("click", function(){ syncStateFromDOM(); alert("저장됨"); });

    var _load = document.getElementById("btn-load");
    if (_load) _load.addEventListener("click", function(){
        var raw = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!raw) return alert("저장 데이터 없음");
        try { State.clips = JSON.parse(raw)||[]; rebuildDOMFromState(); alert("불러옴"); }
        catch(e){ alert("불러오기 실패"); }
    });

    document.getElementById("opt-sub")    && document.getElementById("opt-sub")
        .addEventListener("change", function(e){ State.ai.sub = e.target.checked; applyPreviewToggles(); });
    document.getElementById("opt-main")   && document.getElementById("opt-main")
        .addEventListener("change", function(e){ State.ai.main = e.target.checked; applyPreviewToggles(); });
    document.getElementById("opt-caption")&& document.getElementById("opt-caption")
        .addEventListener("change", function(e){ State.ai.caption = e.target.checked; applyPreviewToggles(); });
    /* opt-logo 체크박스가 있으면 동일하게 바인딩 */
    var _logo = document.getElementById("opt-logo");
    if (_logo) _logo.addEventListener("change", function(){ applyPreviewToggles(); });


    /* === LAYER POPUP 트리거 === */
    // 클립 생성 진행(스텝퍼)
    $("#btn-make-clips")?.addEventListener("click", ()=> Layer.open("clips-progress"));

    // 이미지/비디오 선택 피커
    document.addEventListener("click", (e)=>{
        const b = e.target.closest("[data-open-picker]");
        if(!b) return;
        Layer.open("content-picker");
    });

    // 취소하기
    $("#btn-cancel")?.addEventListener("click", ()=> Layer.open("shortform-cancel"));

    /* === 레이어별 로직 (edit 전용) === */
    document.addEventListener("layer:opened", (e)=>{
        const { name, el } = e.detail;

        if(name === "clips-progress"){
            // TODO: 단계 진행 애니메이션/상태 갱신
        }

        if(name === "content-picker"){
            // 검색, 탭 전환, 썸네일 선택 등 바인딩
            // el.querySelector('.tabs') ... 구현 지점
            el.addEventListener("click", (ev)=>{
                const actBtn = ev.target.closest("[data-act]");
                if(!actBtn) return;
                if(actBtn.dataset.act === "apply"){
                    // TODO: 선택된 리소스 적용
                    Layer.close(el);
                }else if(actBtn.dataset.act === "cancel"){
                    Layer.close(el);
                }
            });
        }

        if(name === "shortform-cancel"){
            el.addEventListener("click", (ev)=>{
                const b = ev.target.closest("[data-act]"); if(!b) return;
                if(b.dataset.act === "continue"){
                    Layer.close(el); // 계속하기
                }else if(b.dataset.act === "cancel"){
                    Layer.close(el); // 팝업 닫기
                }
            });
        }
    });


    // 초기화
    (function init() {
        setRatio("9:16");
        parseDOMToState();
        renderPreview();
        applyPreviewToggles();

    })();
})();