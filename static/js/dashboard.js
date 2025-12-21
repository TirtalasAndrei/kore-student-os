document.addEventListener('DOMCountentLoaded', function() {

    const editor = new EditorJS({
        holder: 'editor-area',
        placeholder: 'Scrie ceva sau apasa "Tab" pentru comenzi...',

        tools: {
            header: {
                class: Header,
                config: {
                    levels: [1, 2, 3],
                    defaultLevel: 2
                }
            },
            list: {
                class: List,
                inlineToolbar: true
            },
            image: ImageTool,
            quote: Quote,
            code: CodeTool,
        },

        data: {
            blocks: [
                {
                    type: "paragraph",
                    data: {
                        text: "Incepe sa scrii notitele tale aici..."
                    }
                }
            ]
        }
    });

    const actionBtn = document.getElementById('action-btn');
    const actionMenu = document.getElementById('action-menu');

    if (actionBtn && actionMenu) {
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


});