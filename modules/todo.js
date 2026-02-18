// 📝 할일 모듈 (Todo Module)
export class TodoModule {
    constructor(settings, saveCallback) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.idCounter = Date.now();
        this.moduleName = 'todo';
        if (!this.settings.todo) {
            this.settings.todo = { items: [] };
        }
    }

    // 마감임박 건수 가져오기 (대시보드 요약용)
    getUrgentCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.settings.todo.items.filter(item => {
            if (item.status === 'done') return false;
            const deadline = new Date(item.deadline);
            const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            return daysLeft <= 1;
        }).length;
    }

    // D-day 계산
    calculateDday(deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysLeft === 0) return 'D-day';
        if (daysLeft < 0) return `D+${Math.abs(daysLeft)}`;
        return `D-${daysLeft}`;
    }

    // 할일 항목 분류
    categorizeItems() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const urgent = [];
        const inProgress = [];
        const completed = [];

        this.settings.todo.items.forEach(item => {
            if (item.status === 'done') {
                completed.push(item);
            } else {
                const deadline = new Date(item.deadline);
                const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 1) {
                    urgent.push(item);
                } else {
                    inProgress.push(item);
                }
            }
        });

        // 완료된 항목은 최근 5건만
        completed.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        
        return { urgent, inProgress, completed: completed.slice(0, 5) };
    }

    // 할일 추가
    addItem(data) {
        const newItem = {
            id: ++this.idCounter,
            title: data.title,
            deadline: data.deadline,
            estimatedTime: data.estimatedTime || '',
            memo: data.memo || '',
            status: 'todo',
            completedAt: null,
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        this.settings.todo.items.push(newItem);
        this.saveCallback();
        return newItem;
    }

    // 할일 수정
    updateItem(id, data) {
        const item = this.settings.todo.items.find(i => i.id === id);
        if (item) {
            Object.assign(item, data);
            this.saveCallback();
        }
        return item;
    }

    // 할일 완료
    completeItem(id) {
        const item = this.settings.todo.items.find(i => i.id === id);
        if (item) {
            item.status = 'done';
            item.completedAt = new Date().toISOString().split('T')[0];
            this.saveCallback();
        }
        return item;
    }

    // 할일 삭제
    deleteItem(id) {
        const index = this.settings.todo.items.findIndex(i => i.id === id);
        if (index !== -1) {
            this.settings.todo.items.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }

    // UI 렌더링
    render(container) {
        const { urgent, inProgress, completed } = this.categorizeItems();
        const urgentCount = urgent.length;

        // Preserve accordion state
        const contentEl = container.querySelector('.sstssd-module-content');
        let isOpen = contentEl ? contentEl.classList.contains('sstssd-module-open') : false;
        
        // Check global settings if available
        if (!contentEl && this.settings.getGlobalSettings) {
            const globalSettings = this.settings.getGlobalSettings();
            isOpen = globalSettings.openModules.includes(this.moduleName);
        }

        container.innerHTML = `
            <div class="sstssd-module-header" data-module="${this.moduleName}">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📝</span>
                    <span>할일</span>
                    ${urgentCount > 0 ? `<span class="sstssd-badge sstssd-badge-urgent">${urgentCount}⚠️</span>` : ''}
                </div>
                <button class="sstssd-module-toggle">${isOpen ? '▲' : '▼'}</button>
            </div>
            <div class="sstssd-module-content ${isOpen ? 'sstssd-module-open' : ''}" data-module="${this.moduleName}">
                ${urgent.length > 0 ? `
                    <div class="sstssd-section">
                        <div class="sstssd-section-title">⚠️ 마감임박</div>
                        ${urgent.map(item => this.renderItem(item, true)).join('')}
                    </div>
                ` : ''}
                
                ${inProgress.length > 0 ? `
                    <div class="sstssd-section">
                        <div class="sstssd-section-title">📋 진행중</div>
                        ${inProgress.map(item => this.renderItem(item, false)).join('')}
                    </div>
                ` : ''}
                
                ${urgent.length === 0 && inProgress.length === 0 ? `
                    <div class="sstssd-empty">할일이 없습니다</div>
                ` : ''}
                
                <button class="sstssd-btn sstssd-btn-add" data-action="add-todo">+ 할일 추가</button>
                
                ${completed.length > 0 ? `
                    <div class="sstssd-section">
                        <div class="sstssd-section-title">✅ 최근 완료</div>
                        ${completed.map(item => this.renderCompletedItem(item)).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.attachEventListeners(container);
        
        // Update summary after rendering
        if (typeof window.sstsdUpdateSummary === 'function') {
            window.sstsdUpdateSummary();
        }
    }

    // 할일 항목 렌더링
    renderItem(item, isUrgent) {
        const dday = this.calculateDday(item.deadline);
        return `
            <div class="sstssd-todo-item ${isUrgent ? 'sstssd-todo-urgent' : ''}" data-id="${item.id}">
                <div class="sstssd-todo-header">
                    <span class="sstssd-todo-title">${this.escapeHtml(item.title)}</span>
                </div>
                <div class="sstssd-todo-meta">
                    <span class="sstssd-todo-dday">${dday}</span>
                    ${item.estimatedTime ? `<span class="sstssd-todo-time">⌛ ${this.escapeHtml(item.estimatedTime)}</span>` : ''}
                </div>
                ${item.memo ? `<div class="sstssd-todo-memo">메모: ${this.escapeHtml(item.memo)}</div>` : ''}
                <div class="sstssd-todo-actions">
                    <button class="sstssd-btn sstssd-btn-sm sstssd-btn-complete" data-id="${item.id}">✅ 완료</button>
                    <button class="sstssd-btn sstssd-btn-sm sstssd-btn-delete" data-id="${item.id}">🗑 삭제</button>
                </div>
            </div>
        `;
    }

    // 완료된 항목 렌더링
    renderCompletedItem(item) {
        return `
            <div class="sstssd-completed-item">
                <span>☑ ${this.escapeHtml(item.title)}</span>
                <span class="sstssd-completed-date">(${item.completedAt})</span>
            </div>
        `;
    }

    // 이벤트 리스너 추가
    attachEventListeners(container) {
        // 할일 추가 버튼
        const addBtn = container.querySelector('[data-action="add-todo"]');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddModal());
        }

        // 완료 버튼
        container.querySelectorAll('.sstssd-btn-complete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.completeItem(id);
                this.render(container);
            });
        });

        // 삭제 버튼
        container.querySelectorAll('.sstssd-btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 할일을 삭제하시겠습니까?')) {
                    this.deleteItem(id);
                    this.render(container);
                }
            });
        });

        // 할일 항목 클릭 (편집)
        container.querySelectorAll('.sstssd-todo-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                this.showEditModal(id);
            });
        });
    }

    // 추가 모달 표시
    showAddModal() {
        const modal = this.createModal(`
            <h3>할일 추가</h3>
            <form id="sstssd-todo-form">
                <div class="sstssd-form-group">
                    <label>제목 <span class="sstssd-required">*</span></label>
                    <input type="text" name="title" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>마감일 <span class="sstssd-required">*</span></label>
                    <input type="date" name="deadline" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>예상 소요시간</label>
                    <input type="text" name="estimatedTime" placeholder="예: 3시간" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>메모</label>
                    <textarea name="memo" rows="3" class="sstssd-input"></textarea>
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-todo-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.addItem({
                title: formData.get('title'),
                deadline: formData.get('deadline'),
                estimatedTime: formData.get('estimatedTime'),
                memo: formData.get('memo')
            });
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="todo"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    // 편집 모달 표시
    showEditModal(id) {
        const item = this.settings.todo.items.find(i => i.id === id);
        if (!item) return;

        const modal = this.createModal(`
            <h3>할일 수정</h3>
            <form id="sstssd-todo-form">
                <div class="sstssd-form-group">
                    <label>제목 <span class="sstssd-required">*</span></label>
                    <input type="text" name="title" value="${this.escapeHtml(item.title)}" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>마감일 <span class="sstssd-required">*</span></label>
                    <input type="date" name="deadline" value="${item.deadline}" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>예상 소요시간</label>
                    <input type="text" name="estimatedTime" value="${this.escapeHtml(item.estimatedTime || '')}" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>메모</label>
                    <textarea name="memo" rows="3" class="sstssd-input">${this.escapeHtml(item.memo || '')}</textarea>
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-todo-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.updateItem(id, {
                title: formData.get('title'),
                deadline: formData.get('deadline'),
                estimatedTime: formData.get('estimatedTime'),
                memo: formData.get('memo')
            });
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="todo"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    // 모달 생성 헬퍼
    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                ${content}
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.sstssd-modal-overlay').addEventListener('click', () => modal.remove());
        
        return modal;
    }

    // HTML 이스케이프
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
