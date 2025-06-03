let boardData = {
    lists: []
};

let currentEditingCard = null;
let draggedCard = null;
let draggedList = null;

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function saveToLocalStorage() {
    localStorage.setItem('kanbanBoard', JSON.stringify(boardData));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('kanbanBoard');
    if (saved) {
        boardData = JSON.parse(saved);
    } else {
        boardData = {
            lists: [
                {
                    id: generateId(),
                    title: 'To Do',
                    cards: [
                        { id: generateId(), content: 'サンプルタスク1' },
                        { id: generateId(), content: 'サンプルタスク2' }
                    ]
                },
                {
                    id: generateId(),
                    title: 'In Progress',
                    cards: []
                },
                {
                    id: generateId(),
                    title: 'Done',
                    cards: []
                }
            ]
        };
        saveToLocalStorage();
    }
}

function createCardElement(card, listId) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.draggable = true;
    cardEl.dataset.cardId = card.id;
    cardEl.dataset.listId = listId;
    cardEl.textContent = card.content;
    
    cardEl.addEventListener('click', () => openCardModal(card, listId));
    cardEl.addEventListener('dragstart', handleCardDragStart);
    cardEl.addEventListener('dragend', handleCardDragEnd);
    
    return cardEl;
}

function createListElement(list) {
    const listEl = document.createElement('div');
    listEl.className = 'list';
    listEl.dataset.listId = list.id;
    listEl.draggable = true;
    
    const listHeader = document.createElement('div');
    listHeader.className = 'list-header';
    
    const listTitle = document.createElement('div');
    listTitle.className = 'list-title';
    listTitle.textContent = list.title;
    listTitle.contentEditable = false;
    
    listTitle.addEventListener('click', () => {
        listTitle.contentEditable = true;
        listTitle.classList.add('editing');
        listTitle.focus();
        
        const range = document.createRange();
        range.selectNodeContents(listTitle);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    });
    
    listTitle.addEventListener('blur', () => {
        listTitle.contentEditable = false;
        listTitle.classList.remove('editing');
        const newTitle = listTitle.textContent.trim();
        if (newTitle && newTitle !== list.title) {
            list.title = newTitle;
            saveToLocalStorage();
        } else {
            listTitle.textContent = list.title;
        }
    });
    
    listTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            listTitle.blur();
        }
    });
    
    const listMenu = document.createElement('button');
    listMenu.className = 'list-menu';
    listMenu.innerHTML = '⋯';
    listMenu.addEventListener('click', () => deleteList(list.id));
    
    listHeader.appendChild(listTitle);
    listHeader.appendChild(listMenu);
    
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';
    
    list.cards.forEach(card => {
        cardsContainer.appendChild(createCardElement(card, list.id));
    });
    
    const addCardContainer = document.createElement('div');
    addCardContainer.className = 'add-card-container';
    
    const addCardBtn = document.createElement('button');
    addCardBtn.className = 'add-card-btn';
    addCardBtn.textContent = '+ カードを追加';
    
    const cardComposer = document.createElement('div');
    cardComposer.className = 'card-composer hidden';
    
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'このカードのタイトルを入力';
    
    const composerButtons = document.createElement('div');
    composerButtons.className = 'card-composer-buttons';
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'add-card-submit';
    submitBtn.textContent = 'カードを追加';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'add-card-cancel';
    cancelBtn.textContent = '×';
    
    composerButtons.appendChild(submitBtn);
    composerButtons.appendChild(cancelBtn);
    
    cardComposer.appendChild(textarea);
    cardComposer.appendChild(composerButtons);
    
    addCardBtn.addEventListener('click', () => {
        addCardBtn.classList.add('hidden');
        cardComposer.classList.remove('hidden');
        textarea.focus();
    });
    
    cancelBtn.addEventListener('click', () => {
        textarea.value = '';
        addCardBtn.classList.remove('hidden');
        cardComposer.classList.add('hidden');
    });
    
    submitBtn.addEventListener('click', () => {
        const content = textarea.value.trim();
        if (content) {
            const newCard = {
                id: generateId(),
                content: content
            };
            list.cards.push(newCard);
            cardsContainer.appendChild(createCardElement(newCard, list.id));
            saveToLocalStorage();
            
            textarea.value = '';
            addCardBtn.classList.remove('hidden');
            cardComposer.classList.add('hidden');
        }
    });
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitBtn.click();
        }
    });
    
    addCardContainer.appendChild(addCardBtn);
    addCardContainer.appendChild(cardComposer);
    
    listEl.appendChild(listHeader);
    listEl.appendChild(cardsContainer);
    listEl.appendChild(addCardContainer);
    
    listEl.addEventListener('dragstart', handleListDragStart);
    listEl.addEventListener('dragend', handleListDragEnd);
    listEl.addEventListener('dragover', handleListDragOver);
    listEl.addEventListener('drop', handleListDrop);
    listEl.addEventListener('dragleave', handleListDragLeave);
    
    cardsContainer.addEventListener('dragover', handleCardDragOver);
    cardsContainer.addEventListener('drop', handleCardDrop);
    
    return listEl;
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    boardData.lists.forEach(list => {
        boardEl.appendChild(createListElement(list));
    });
}

function handleCardDragStart(e) {
    draggedCard = e.target;
    draggedCard.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleCardDragEnd(e) {
    draggedCard.classList.remove('dragging');
    
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.remove();
    });
    
    draggedCard = null;
}

function handleCardDragOver(e) {
    e.preventDefault();
    
    if (!draggedCard) return;
    
    const container = e.currentTarget;
    const afterElement = getDragAfterElement(container, e.clientY);
    
    if (!container.querySelector('.drop-zone')) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        
        if (afterElement == null) {
            container.appendChild(dropZone);
        } else {
            container.insertBefore(dropZone, afterElement);
        }
    }
}

function handleCardDrop(e) {
    e.preventDefault();
    
    if (!draggedCard) return;
    
    const container = e.currentTarget;
    const afterElement = getDragAfterElement(container, e.clientY);
    
    const oldListId = draggedCard.dataset.listId;
    const newListId = container.parentElement.dataset.listId;
    const cardId = draggedCard.dataset.cardId;
    
    const oldList = boardData.lists.find(l => l.id === oldListId);
    const newList = boardData.lists.find(l => l.id === newListId);
    
    const cardIndex = oldList.cards.findIndex(c => c.id === cardId);
    const card = oldList.cards.splice(cardIndex, 1)[0];
    
    if (afterElement == null) {
        newList.cards.push(card);
        container.appendChild(draggedCard);
    } else {
        const afterCardId = afterElement.dataset.cardId;
        const newIndex = newList.cards.findIndex(c => c.id === afterCardId);
        newList.cards.splice(newIndex, 0, card);
        container.insertBefore(draggedCard, afterElement);
    }
    
    draggedCard.dataset.listId = newListId;
    saveToLocalStorage();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleListDragStart(e) {
    if (e.target.classList.contains('list')) {
        draggedList = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    }
}

function handleListDragEnd(e) {
    if (e.target.classList.contains('list')) {
        e.target.style.opacity = '';
        draggedList = null;
    }
}

function handleListDragOver(e) {
    e.preventDefault();
    
    if (!draggedList || !e.currentTarget.classList.contains('list')) return;
    
    const draggingList = draggedList;
    const targetList = e.currentTarget;
    
    if (draggingList !== targetList) {
        const board = document.getElementById('board');
        const lists = [...board.querySelectorAll('.list')];
        const draggingIndex = lists.indexOf(draggingList);
        const targetIndex = lists.indexOf(targetList);
        
        if (draggingIndex < targetIndex) {
            targetList.parentNode.insertBefore(draggingList, targetList.nextSibling);
        } else {
            targetList.parentNode.insertBefore(draggingList, targetList);
        }
        
        const newOrder = [...board.querySelectorAll('.list')].map(el => el.dataset.listId);
        boardData.lists.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
        saveToLocalStorage();
    }
}

function handleListDrop(e) {
    e.preventDefault();
}

function handleListDragLeave(e) {
    if (e.currentTarget.classList.contains('list')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function openCardModal(card, listId) {
    currentEditingCard = { card, listId };
    const modal = document.getElementById('card-modal');
    const textarea = document.getElementById('card-edit-textarea');
    
    textarea.value = card.content;
    modal.classList.add('active');
    textarea.focus();
}

function closeCardModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('active');
    currentEditingCard = null;
}

function saveCard() {
    if (!currentEditingCard) return;
    
    const textarea = document.getElementById('card-edit-textarea');
    const newContent = textarea.value.trim();
    
    if (newContent) {
        currentEditingCard.card.content = newContent;
        saveToLocalStorage();
        renderBoard();
    }
    
    closeCardModal();
}

function deleteCard() {
    if (!currentEditingCard) return;
    
    const list = boardData.lists.find(l => l.id === currentEditingCard.listId);
    const cardIndex = list.cards.findIndex(c => c.id === currentEditingCard.card.id);
    
    if (cardIndex !== -1) {
        list.cards.splice(cardIndex, 1);
        saveToLocalStorage();
        renderBoard();
    }
    
    closeCardModal();
}

function addNewList() {
    const newList = {
        id: generateId(),
        title: '新しいリスト',
        cards: []
    };
    
    boardData.lists.push(newList);
    saveToLocalStorage();
    renderBoard();
}

function deleteList(listId) {
    if (confirm('このリストを削除してもよろしいですか？')) {
        boardData.lists = boardData.lists.filter(l => l.id !== listId);
        saveToLocalStorage();
        renderBoard();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderBoard();
    
    document.getElementById('add-list-btn').addEventListener('click', addNewList);
    
    const modal = document.getElementById('card-modal');
    const closeBtn = document.querySelector('.close');
    const saveBtn = document.getElementById('save-card-btn');
    const deleteBtn = document.getElementById('delete-card-btn');
    
    closeBtn.addEventListener('click', closeCardModal);
    saveBtn.addEventListener('click', saveCard);
    deleteBtn.addEventListener('click', deleteCard);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCardModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeCardModal();
        }
    });
});