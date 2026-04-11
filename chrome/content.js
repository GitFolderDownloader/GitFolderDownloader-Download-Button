(() => {
  const MODAL_ID = "GitFolderDownloader-modal";
  const STYLE_ID = "GitFolderDownloader-styles";
  let __dg_prevOverflow = null;
  let modalInitialized = false;
  const processedMenus = new WeakSet();
  const idle = (fn) =>
    (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));

  function lockBodyScroll() {
    __dg_prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  function unlockBodyScroll() {
    document.body.style.overflow = __dg_prevOverflow || "";
  }

  function createDownloadSvg() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.className = "octicon octicon-download";
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "currentColor");
    svg.style.verticalAlign = "text-bottom";

    const path1 = document.createElementNS(SVG_NS, "path");
    path1.setAttribute(
      "d",
      "M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"
    );

    const path2 = document.createElementNS(SVG_NS, "path");
    path2.setAttribute(
      "d",
      "M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"
    );

    svg.appendChild(path1);
    svg.appendChild(path2);
    return svg;
  }

  function createMenuItem(kind, ctxName, ctxType) {
    const li = document.createElement("li");
    li.className = "prc-ActionList-ActionListItem-So4vC";

    const a = document.createElement("a");
    a.className = "prc-ActionList-ActionListContent-KBb8- prc-Link-Link-9ZwDx";
    a.setAttribute("role", "menuitem");
    a.setAttribute("tabindex", "-1");
    a.dataset.GitFolderDownloader = kind;
    a.style.padding = kind === "repo" ? "revert-layer" : "0";

    const spacer = document.createElement("span");
    spacer.className = "prc-ActionList-Spacer-4tR2m";

    const leading = document.createElement("span");
    leading.className = "prc-ActionList-LeadingVisual-NBr28 prc-ActionList-VisualWrap-bdCsS";
    if (kind === "repo") leading.appendChild(createDownloadSvg());
    else {
      const emptySvg = document.createElement("svg");
      emptySvg.style.width = "0";
      emptySvg.style.height = "0";
      leading.appendChild(emptySvg);
    }

    const subContent = document.createElement("span");
    subContent.className = "prc-ActionList-ActionListSubContent-gKsFp";
    subContent.setAttribute("data-component", "ActionList.Item--DividerContainer");

    const labelWrap = document.createElement("span");
    labelWrap.className = "prc-ActionList-ItemLabel-81ohH";
    labelWrap.textContent = kind === "repo" ? "Download Repo" : kind === "folder" ? "Download Folder" : "Download";

    subContent.appendChild(labelWrap);
    a.appendChild(spacer);
    a.appendChild(leading);
    a.appendChild(subContent);

    // pointerdown handler uses captured ctxName/ctxType to avoid recomputing
    a.addEventListener("pointerdown", (evt) => {
      if (evt.button !== 0) return;
      evt.preventDefault();
      evt.stopPropagation();
      showModalAndOpen(ctxName, ctxType);
    });

    li.appendChild(a);
    return li;
  }

  // Create and attach modal + styles once, reuse it
  function ensureModalExists() {
    if (modalInitialized) return;
    modalInitialized = true;

    // styles (one-time)
    if (!document.getElementById(STYLE_ID)) {
      const css = `
#${MODAL_ID} {position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center;}
#${MODAL_ID} .modal-overlay {display: block; position: fixed; width: -webkit-fill-available; height: -webkit-fill-available; left:0; top:0;}
.dg-box {
  background:var(--overlay-bgColor,var(--color-canvas-overlay));
  color: var(--fgColor-default);
  width: 340px; padding: 16px;
  border-radius: 12px; border: 1px solid var(--color-border-default);
  box-shadow:var(--shadow-floating-small,var(--color-overlay-shadow));
  font-family: system-ui;
  animation:prc-Overlay-overlay-appear-JpFey .2s cubic-bezier(.33,1,.68,1); z-index:10001;
}
.dg-box h3 { text-align: center; margin: 0 auto 10px; font-size:18px; }
.dg-label { font-size: 12px; margin-top: 8px; display: block; }
.dg-box input { width: 100%; padding: 8px; margin-top: 4px; border-radius: 8px; background: var(--bgColor-disabled); border: 1px solid var(--control-borderColor-rest, var(--color-border-default)); outline: none; color: var(--fgColor-default); }
.dg-box input:focus { outline: 2px solid var(--color-accent-fg); }
.dg-row { display: flex; gap: 10px; }
.dg-col { flex: 1; }
.dg-actions { margin-top: 20px; display: flex; justify-content: space-around; }
.dg-actions button { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; }
.dg-cancel { background: var(--button-default-bgColor-rest); }
.dg-cancel:hover { background: var(--button-default-bgColor-hover); }
.dg-confirm { background: var(--button-primary-bgColor-rest); color:var(--button-primary-fgColor-rest,var(--color-btn-primary-text)); }
.dg-confirm:hover { background: var(--button-primary-bgColor-hover); }
`;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
    }

    // modal container (hidden by default)
    const container = document.createElement("div");
    container.id = MODAL_ID;
    container.style.display = "none";

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const box = document.createElement("div");
    box.className = "dg-box";

    const h3 = document.createElement("h3");
    h3.textContent = "Prepare Before Download";

    const labelName = document.createElement("label");
    labelName.className = "dg-label";
    labelName.textContent = "Set Name";

    const inputName = document.createElement("input");
    inputName.id = "dg-name";
    inputName.placeholder = "File name";

    box.appendChild(h3);
    box.appendChild(labelName);
    box.appendChild(inputName);

    const rangeContainer = document.createElement("div");
    rangeContainer.id = "dg-range-container";
    rangeContainer.style.display = "none";

    const h5 = document.createElement("h5");
    h5.textContent = "Set files range";
    h5.style.margin = "10px auto 0";

    const row = document.createElement("div");
    row.className = "dg-row";

    const col1 = document.createElement("div");
    col1.className = "dg-col";
    const labelFrom = document.createElement("label");
    labelFrom.className = "dg-label";
    labelFrom.textContent = "From";
    const inputSt = document.createElement("input");
    inputSt.id = "dg-st";
    inputSt.type = "number";
    inputSt.min = "0";
    inputSt.placeholder = "from 0";
    col1.appendChild(labelFrom);
    col1.appendChild(inputSt);

    const col2 = document.createElement("div");
    col2.className = "dg-col";
    const labelTo = document.createElement("label");
    labelTo.className = "dg-label";
    labelTo.textContent = "To";
    const inputMx = document.createElement("input");
    inputMx.id = "dg-mx";
    inputMx.type = "number";
    inputMx.min = "0";
    inputMx.placeholder = "to all";
    col2.appendChild(labelTo);
    col2.appendChild(inputMx);

    row.appendChild(col1);
    row.appendChild(col2);

    rangeContainer.appendChild(h5);
    rangeContainer.appendChild(row);

    box.appendChild(rangeContainer);

    const actions = document.createElement("div");
    actions.className = "dg-actions";

    const btnCancel = document.createElement("button");
    btnCancel.className = "dg-cancel";
    btnCancel.textContent = "Cancel";

    const btnConfirm = document.createElement("button");
    btnConfirm.className = "dg-confirm";
    btnConfirm.textContent = "Download";

    actions.appendChild(btnCancel);
    actions.appendChild(btnConfirm);
    box.appendChild(actions);

    container.appendChild(overlay);
    container.appendChild(box);
    document.body.appendChild(container);

    // event wiring (use closures to access inputs)
    overlay.addEventListener("click", hideModal);
    btnCancel.addEventListener("click", hideModal);
    btnConfirm.addEventListener("click", onConfirm);
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") hideModal();
    });

    // helpers stored on container for reuse
    container._inputs = { inputName, inputSt, inputMx, rangeContainer };
    container._show = function (defaultName, type) {
      inputName.value = defaultName || "";
      container._inputs.rangeContainer.style.display = type !== "file" ? "" : "none";
      container.style.display = "flex";
      lockBodyScroll();
      // focus name input after paint
      requestAnimationFrame(() => inputName.focus());
    };
    container._hide = function () {
      container.style.display = "none";
      unlockBodyScroll();
    };

    function hideModal() {
      container._hide();
    }

    function onConfirm() {
      const nameVal = (inputName.value || "").trim();
      const stVal = (inputSt.value || "").trim();
      const mxVal = (inputMx.value || "").trim();
      container._hide();

      let finalUrl = `https://GitFolderDownloader.github.io/api/?url=${encodeURIComponent(
        location.href
      )}&name=${encodeURIComponent(nameVal || "download")}`;
      if (stVal) finalUrl += `&st=${encodeURIComponent(stVal)}`;
      if (mxVal) finalUrl += `&mx=${encodeURIComponent(mxVal)}`;
      window.open(finalUrl, "_blank");
    }
  }

  function showModalAndOpen(defaultName, type = "repo") {
    ensureModalExists();
    const container = document.getElementById(MODAL_ID);
    if (!container) return;
    container._show(defaultName, type === "file" ? "file" : "folder");
  }

  // Debounce helper
  function debounce(fn, wait) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // Inject items into a single menu element (fast path)
  function injectIntoMenu(menu) {
    if (!menu || processedMenus.has(menu)) return;
    // quick text check to determine kind
    const text = menu.innerText || "";
    const kind =
      text.includes("Download ZIP")
        ? "repo"
        : text.includes("Copy path") && !text.includes("Raw file")
          ? "folder"
          : text.includes("Raw file content")
            ? "file"
            : null;
    if (!kind) return;

    // compute ctx once
    const parts = location.pathname.split("/").filter(Boolean);
    const ctx =
      parts.length === 2
        ? { type: "repo", name: `${parts[0]}-${parts[1]}` }
        : parts.includes("tree")
          ? { type: "folder", name: parts[parts.length - 1] }
          : parts.includes("blob")
            ? { type: "file", name: parts[parts.length - 1] }
            : { type: "unknown", name: "github-download" };

    // avoid duplicate insertion
    if (menu.querySelector(`[data-GitFolderDownloader="${kind}"]`)) {
      processedMenus.add(menu);
      return;
    }

    // create item and insert at top
    const item = createMenuItem(kind, ctx.name, ctx.type);
    // Use fragment to minimize reflow
    const frag = document.createDocumentFragment();
    frag.appendChild(item);
    const first = menu.firstElementChild;
    menu.insertBefore(frag, first);
    processedMenus.add(menu);
  }

  // Main injector (runs in idle)
  const runInjector = debounce(() => {
    idle(() => {
      // find menus once
      const menus = document.querySelectorAll("ul.prc-ActionList-ActionList-rPFF2");
      if (!menus || menus.length === 0) return;
      menus.forEach((menu) => injectIntoMenu(menu));
    });
  }, 180);

  // MutationObserver callback: only process added nodes that might contain menus
  const observer = new MutationObserver((mutations) => {
    let found = false;
    for (const m of mutations) {
      if (m.type !== "childList") continue;
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        // quick checks: if node itself is a menu or contains one
        if (node.matches && node.matches("ul.prc-ActionList-ActionList-rPFF2")) {
          injectIntoMenu(node);
          found = true;
        } else if (node.querySelector && node.querySelector("ul.prc-ActionList-ActionList-rPFF2")) {
          // schedule injector for subtree
          found = true;
        }
      }
    }
    if (found) runInjector();
  });

  // Start observing with minimal overhead
  observer.observe(document.body, { childList: true, subtree: true });

  // Also run once at startup (idle)
  runInjector();

  // keyboard shortcut (fast path)
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d")) return;
    if (/input|textarea/i.test(document.activeElement?.tagName)) return;

    const path = location.pathname.split("/").filter(Boolean);
    const isFolder = path.includes("tree");
    const isFile = path.includes("blob");
    if (!isFolder && !isFile) return;

    e.preventDefault();
    e.stopPropagation();

    const name = path[path.length - 1];
    showModalAndOpen(name, isFile ? "file" : "folder");
  });
})();
