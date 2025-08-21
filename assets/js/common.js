/*! common.js — layer include + 공통 close only */
(function () {
    "use strict";
    const $ = (s,c)=> (c||document).querySelector(s);

    const Layer = {
        base: "layers/",                 // 조각 HTML 폴더
        root: null,
        cache: new Map(),

        init(){
            this.root = $("#layer-root") || (()=> {
                const d=document.createElement("div"); d.id="layer-root"; document.body.appendChild(d); return d;
            })();
            document.addEventListener("keydown", e=>{
                if(e.key==="Escape") this.close(); // top-most
            });
        },

        _url(name){ return this.base + name + ".layer.html"; },

        async _load(name){
            if(this.cache.has(name)) return this.cache.get(name).cloneNode(true);
            const res = await fetch(this._url(name), { cache:"no-store" });
            if(!res.ok) throw new Error("Layer load fail: "+name);
            const html = await res.text();
            const t = document.createElement("template");
            t.innerHTML = html.trim();
            const node = t.content.firstElementChild;
            this.cache.set(name, node);
            return node.cloneNode(true);
        },

        async open(name, ctx){
            const el = await this._load(name);
            this.root.appendChild(el);

            // 공통 close
            $(".layer-mask", el)?.addEventListener("click", ()=> this.close(el));
            $(".layer-close", el)?.addEventListener("click", ()=> this.close(el));

            requestAnimationFrame(()=> el.classList.add("is-open"));
            document.body.classList.add("is-locked");

            // 컨트롤러가 후킹할 수 있도록 알림
            document.dispatchEvent(new CustomEvent("layer:opened", { detail:{ name, el, ctx }}));
            return el;
        },

        close(el){
            if(!el) el = this.root.lastElementChild;
            if(!el) return;
            document.dispatchEvent(new CustomEvent("layer:closing", { detail:{ el }}));
            el.classList.remove("is-open");
            setTimeout(()=>{
                el.remove();
                if(!this.root.children.length) document.body.classList.remove("is-locked");
                document.dispatchEvent(new CustomEvent("layer:closed", { detail:{ el }}));
            }, 120);
        }
    };

    Layer.init();
    window.Layer = Layer; // 전역 노출
})();
