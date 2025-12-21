document.addEventListener('DOMContentLoaded', function() {

    // ======================================================
    // 1. REPARĂM BUTOANELE DIN STÂNGA SUS (Istoric, Share)
    // ======================================================
    const leftButtons = [
        {
            text: 'Istoric',
            // Iconița pătrată
            icon: `<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>`,
            action: () => console.log("Click Istoric")
        },
        {
            text: 'Share',
            // Iconița de share
            icon: `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`,
            action: () => console.log("Click Share")
        }
    ];

    const leftContainer = document.getElementById('toolbar-left');

    // Verificăm dacă există containerul înainte să punem butoane
    if (leftContainer) {
        // Curățăm containerul ca să nu le dublăm din greșeală
        leftContainer.innerHTML = '';

        leftButtons.forEach(btn => {
            const button = document.createElement('button');
            button.className = "group relative p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors mr-2";
            button.onclick = btn.action;

            // HTML-ul pentru buton + Tooltip
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${btn.icon}</svg>

                <span class="pointer-events-none absolute top-full mt-2 left-0 whitespace-nowrap rounded-lg bg-white border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-50">
                    ${btn.text}<span class="absolute -top-1 left-2 border-4 border-transparent border-b-white"></span>
                </span>
            `;
            leftContainer.appendChild(button);
        });
    }

    // ======================================================
    // 2. DESENĂM BARA DE FORMATARE NOUĂ (Bold, Italic, Undo...)
    // ======================================================
    const formattingConfig = [
        { type: 'icon', icon: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>', title: 'Undo' },
        { type: 'icon', icon: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>', title: 'Redo' },
        { type: 'divider' },
        { type: 'text-dropdown', label: 'Normal Text' },
        { type: 'divider' },
        { type: 'icon', icon: '<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>', title: 'Bold' },
        { type: 'icon', icon: '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>', title: 'Italic' },
        { type: 'icon', icon: '<path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/>', title: 'Underline' },
        { type: 'divider' },
        { type: 'icon', icon: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', title: 'Listă cu puncte' },
        { type: 'icon', icon: '<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>', title: 'Listă numerotată' },
        { type: 'divider' },
        { type: 'icon', icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', title: 'Link' },
        { type: 'icon', icon: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>', title: 'Text Color', colorIndicator: true },
        { type: 'icon', icon: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>', title: 'Quote' },
        { type: 'icon', icon: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>', title: 'Code' },
    ];

    const formatContainer = document.getElementById('formatting-toolbar');

    if (formatContainer) {
        formatContainer.innerHTML = ''; // Curățăm containerul

        formattingConfig.forEach(item => {
            if (item.type === 'divider') {
                const div = document.createElement('div');
                div.className = "w-[1px] h-5 bg-gray-200 mx-1";
                formatContainer.appendChild(div);

            } else if (item.type === 'text-dropdown') {
                const btn = document.createElement('button');
                btn.className = "flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-sm text-gray-700 font-medium transition-colors mx-1";
                btn.innerHTML = `${item.label} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                formatContainer.appendChild(btn);

            } else if (item.type === 'icon') {
                const btn = document.createElement('button');
                btn.className = "p-1.5 text-gray-600 hover:bg-gray-100 hover:text-black rounded transition-colors";
                btn.title = item.title;
                let content = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>`;
                if (item.colorIndicator) {
                    content = `<div class="flex flex-col items-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg><div class="w-3 h-0.5 bg-red-500 mt-0.5 rounded-full"></div></div>`;
                }
                btn.innerHTML = content;
                formatContainer.appendChild(btn);
            }
        });
    }

    // ======================================================
    // 3. ACTIVAREA MENIULUI DREAPTA (3 Puncte)
    // ======================================================
    const actionBtn = document.getElementById('action-btn');
    const actionMenu = document.getElementById('action-menu');

    if(actionBtn && actionMenu) {
        actionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            actionMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!actionMenu.contains(e.target) && !actionBtn.contains(e.target)) {
                actionMenu.classList.add('hidden');
            }
        });
    }

    // ======================================================
    // 4. ACTIVAREA EDITORULUI
    // ======================================================
    const editor = new EditorJS({
        holder: 'editor-area',
        placeholder: 'Scrie ceva aici...',
        tools: {
            header: { class: Header, config: { levels: [1, 2, 3], defaultLevel: 2 } },
            list: { class: List, inlineToolbar: true },
            quote: { class: Quote, inlineToolbar: true },
            code: CodeTool,
            image: SimpleImage
        },
        data: {
            blocks: [
                { type: "header", data: { text: "Titlu Nou", level: 2 } },
                { type: "paragraph", data: { text: "Scrie aici..." } }
            ]
        }
    });
});