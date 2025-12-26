
let notes = [];
let currentNoteId = null;
let undoStack = [];
let redoStack = [];


const editorArea = document.getElementById('editor-area');
const historyBtn = document.getElementById('history-btn');
const historySidebar = document.getElementById('history-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const notesList = document.getElementById('notes-list');
const actionBtn = document.getElementById('action-btn');
const actionMenu = document.getElementById('action-menu');
const newNoteBtn = document.getElementById('new-note-btn');
const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-input');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const printBtn = document.getElementById('print-btn');
const exportBtn = document.getElementById('export-btn');
const deleteBtn = document.getElementById('delete-btn');
const shareBtn = document.getElementById('share-btn');

// Formatting buttons
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const underlineBtn = document.getElementById('underline-btn');
const bulletListBtn = document.getElementById('bullet-list-btn');
const numberedListBtn = document.getElementById('numbered-list-btn');
const linkBtn = document.getElementById('link-btn');



async function fetchNotes() {
    try {
        const response = await fetch('/api/notes');
        if (response.ok) {
            notes = await response.json();
            renderNotesList();

            if (notes.length === 0) {
                await createNewNote();
            } else {
                loadNote(notes[0].id);
            }
        }
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
}

async function createNewNote() {
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Notiță nouă',
                content: ''
            })
        });

        if (response.ok) {
            const newNote = await response.json();
            notes.unshift(newNote);
            loadNote(newNote.id);
            renderNotesList();
        }
    } catch (error) {
        console.error('Error creating note:', error);
    }
}

async function saveCurrentNote() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    const content = editorArea.value;
    const firstLine = content.split('\n')[0].trim();
    const title = firstLine || 'Notiță nouă';

    try {
        const response = await fetch(`/api/notes/${currentNoteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });

        if (response.ok) {
            const updatedNote = await response.json();
            const index = notes.findIndex(n => n.id === currentNoteId);
            if (index !== -1) {
                notes[index] = updatedNote;
            }
            renderNotesList();
        }
    } catch (error) {
        console.error('Error saving note:', error);
    }
}

async function deleteCurrentNote() {
    if (!currentNoteId) return;

    if (!confirm('Ești sigur că vrei să ștergi această notiță?')) {
        return;
    }

    try {
        const response = await fetch(`/api/notes/${currentNoteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            notes = notes.filter(n => n.id !== currentNoteId);

            if (notes.length === 0) {
                await createNewNote();
            } else {
                loadNote(notes[0].id);
            }

            renderNotesList();
            actionMenu.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}



function loadNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        currentNoteId = noteId;
        editorArea.value = note.content || '';
        undoStack = [];
        redoStack = [];
        renderNotesList();
    }
}

function renderNotesList() {
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="text-gray-400 text-sm text-center py-8">Nu există notițe salvate</div>';
        return;
    }

    notesList.innerHTML = notes.map(note => {
        const date = new Date(note.updatedAt);
        const preview = note.content ? note.content.substring(0, 100) : 'Notiță goală';
        const isActive = note.id === currentNoteId;

        return `
            <div class="note-item p-3 rounded-lg cursor-pointer border ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} mb-2 transition-all hover:bg-gray-50"
                 data-note-id="${note.id}">
                <div class="font-medium text-sm text-gray-800 mb-1 truncate">${note.title}</div>
                <div class="text-xs text-gray-500 mb-2">${date.toLocaleDateString('ro-RO')}</div>
                <div class="text-xs text-gray-600 line-clamp-2">${preview}</div>
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', () => {
            const noteId = parseInt(item.dataset.noteId);
            loadNote(noteId);
        });
    });
}



function insertTextAtCursor(before, after = '') {
    const start = editorArea.selectionStart;
    const end = editorArea.selectionEnd;
    const selectedText = editorArea.value.substring(start, end);
    const beforeText = editorArea.value.substring(0, start);
    const afterText = editorArea.value.substring(end);

    editorArea.value = beforeText + before + selectedText + after + afterText;

    // Set cursor position
    if (selectedText) {
        editorArea.selectionStart = start + before.length;
        editorArea.selectionEnd = start + before.length + selectedText.length;
    } else {
        const newPos = start + before.length;
        editorArea.selectionStart = newPos;
        editorArea.selectionEnd = newPos;
    }

    editorArea.focus();
    pushToUndoStack();
    saveCurrentNote();
}

function applyBold() {
    insertTextAtCursor('**', '**');
}

function applyItalic() {
    insertTextAtCursor('*', '*');
}

function applyUnderline() {
    insertTextAtCursor('<u>', '</u>');
}

function applyBulletList() {
    const start = editorArea.selectionStart;
    const beforeText = editorArea.value.substring(0, start);
    const afterText = editorArea.value.substring(start);

    // Check if we're at start of line
    const lastNewline = beforeText.lastIndexOf('\n');
    const isStartOfLine = lastNewline === beforeText.length - 1 || beforeText.length === 0;

    if (isStartOfLine) {
        editorArea.value = beforeText + '• ' + afterText;
        editorArea.selectionStart = editorArea.selectionEnd = start + 2;
    } else {
        editorArea.value = beforeText + '\n• ' + afterText;
        editorArea.selectionStart = editorArea.selectionEnd = start + 3;
    }

    editorArea.focus();
    pushToUndoStack();
    saveCurrentNote();
}

function applyNumberedList() {
    const start = editorArea.selectionStart;
    const beforeText = editorArea.value.substring(0, start);
    const afterText = editorArea.value.substring(start);

    // Find what number to use by counting existing numbered lists
    const lines = beforeText.split('\n');
    let number = 1;

    for (let i = lines.length - 1; i >= 0; i--) {
        const match = lines[i].match(/^(\d+)\.\s/);
        if (match) {
            number = parseInt(match[1]) + 1;
            break;
        }
        if (lines[i].trim() === '') break;
    }

    const lastNewline = beforeText.lastIndexOf('\n');
    const isStartOfLine = lastNewline === beforeText.length - 1 || beforeText.length === 0;

    if (isStartOfLine) {
        editorArea.value = beforeText + `${number}. ` + afterText;
        editorArea.selectionStart = editorArea.selectionEnd = start + `${number}. `.length;
    } else {
        editorArea.value = beforeText + `\n${number}. ` + afterText;
        editorArea.selectionStart = editorArea.selectionEnd = start + `\n${number}. `.length;
    }

    editorArea.focus();
    pushToUndoStack();
    saveCurrentNote();
}

function insertLink() {
    const url = prompt('Introduceți URL-ul:');
    if (url) {
        const text = prompt('Introduceți textul linkului:', url);
        if (text) {
            insertTextAtCursor(`[${text}](${url})`);
        }
    }
}



function pushToUndoStack() {
    undoStack.push(editorArea.value);
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(editorArea.value);
        editorArea.value = undoStack.pop();
        saveCurrentNote();
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(editorArea.value);
        editorArea.value = redoStack.pop();
        saveCurrentNote();
    }
}



function printNote() {
    window.print();
}

function exportNote() {
    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        const blob = new Blob([note.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

function shareNote() {
    const note = notes.find(n => n.id === currentNoteId);
    if (note && navigator.share) {
        navigator.share({
            title: note.title,
            text: note.content
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(editorArea.value);
        alert('Conținutul a fost copiat în clipboard!');
    }
}

function importFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            editorArea.value = e.target.result;
            saveCurrentNote();
        };
        reader.readAsText(file);
    }
}



function toggleHistorySidebar() {
    const isHidden = historySidebar.classList.contains('hidden');

    if (isHidden) {
        historySidebar.classList.remove('hidden');
        historySidebar.classList.add('sidebar-enter');
        sidebarOverlay.classList.remove('hidden');
    } else {
        historySidebar.classList.add('sidebar-exit');
        setTimeout(() => {
            historySidebar.classList.add('hidden');
            historySidebar.classList.remove('sidebar-exit', 'sidebar-enter');
        }, 300);
        sidebarOverlay.classList.add('hidden');
    }
}



// Sidebar
historyBtn.addEventListener('click', toggleHistorySidebar);
closeSidebarBtn.addEventListener('click', toggleHistorySidebar);
sidebarOverlay.addEventListener('click', toggleHistorySidebar);

// Action menu
actionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    actionMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!actionMenu.contains(e.target) && !actionBtn.contains(e.target)) {
        actionMenu.classList.add('hidden');
    }
});

// Note actions
newNoteBtn.addEventListener('click', createNewNote);
importBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', importFile);
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
printBtn.addEventListener('click', printNote);
exportBtn.addEventListener('click', exportNote);
deleteBtn.addEventListener('click', deleteCurrentNote);
shareBtn.addEventListener('click', shareNote);

// Formatting buttons
if (boldBtn) boldBtn.addEventListener('click', applyBold);
if (italicBtn) italicBtn.addEventListener('click', applyItalic);
if (underlineBtn) underlineBtn.addEventListener('click', applyUnderline);
if (bulletListBtn) bulletListBtn.addEventListener('click', applyBulletList);
if (numberedListBtn) numberedListBtn.addEventListener('click', applyNumberedList);
if (linkBtn) linkBtn.addEventListener('click', insertLink);

// Auto-save
let saveTimeout;
editorArea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        pushToUndoStack();
        saveCurrentNote();
    }, 1000);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
            e.preventDefault();
            redo();
        } else if (e.key === 'p') {
            e.preventDefault();
            printNote();
        } else if (e.key === 's') {
            e.preventDefault();
            saveCurrentNote();
        } else if (e.key === 'b') {
            e.preventDefault();
            applyBold();
        } else if (e.key === 'i') {
            e.preventDefault();
            applyItalic();
        } else if (e.key === 'u') {
            e.preventDefault();
            applyUnderline();
        }
    }
});



window.addEventListener('load', async () => {
    await fetchNotes();
    editorArea.focus();
});