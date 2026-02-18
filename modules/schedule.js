// 📅 스케줄 모듈 (Schedule Module)
export class ScheduleModule {
    static DAYS = ['일', '월', '화', '수', '목', '금', '토'];
    
    constructor(settings, saveCallback) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.idCounter = Date.now();
        this.moduleName = 'schedule';
        if (!this.settings.schedule) {
            this.settings.schedule = {
                mode: 'semester',
                timetable: {
                    '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': []
                },
                appointments: []
            };
        }
    }

    // 오늘 날짜의 요일 가져오기
    getTodayDay() {
        return ScheduleModule.DAYS[new Date().getDay()];
    }

    // 오늘 수업 가져오기
    getTodayClasses() {
        if (this.settings.schedule.mode === 'vacation') {
            return null;
        }
        const today = this.getTodayDay();
        return this.settings.schedule.timetable[today] || [];
    }

    // 다음 수업 정보 가져오기 (대시보드 요약용)
    getNextClass() {
        const classes = this.getTodayClasses();
        if (!classes || classes.length === 0) return null;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        for (const cls of classes) {
            const [hours, minutes] = cls.startTime.split(':').map(Number);
            const classTime = hours * 60 + minutes;
            if (classTime > currentTime) {
                return cls;
            }
        }

        return null;
    }

    // 다가오는 약속 가져오기
    getUpcomingAppointments() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.settings.schedule.appointments
            .filter(apt => {
                if (apt.status !== 'active') return false;
                const aptDate = new Date(apt.date);
                return aptDate >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // 약속 추가
    addAppointment(data) {
        const newAppointment = {
            id: ++this.idCounter,
            title: data.title,
            date: data.date,
            time: data.time || '',
            location: data.location || '',
            with: data.with || '',
            status: 'active',
            memo: data.memo || '',
            postponedTo: null
        };

        this.settings.schedule.appointments.push(newAppointment);
        this.saveCallback();
        return newAppointment;
    }

    // 약속 수정
    updateAppointment(id, data) {
        const apt = this.settings.schedule.appointments.find(a => a.id === id);
        if (apt) {
            Object.assign(apt, data);
            this.saveCallback();
        }
        return apt;
    }

    // 약속 미루기
    postponeAppointment(id, newDate) {
        const apt = this.settings.schedule.appointments.find(a => a.id === id);
        if (apt) {
            apt.postponedTo = newDate;
            apt.date = newDate;
            apt.status = 'active';
            this.saveCallback();
        }
        return apt;
    }

    // 약속 취소
    cancelAppointment(id) {
        const apt = this.settings.schedule.appointments.find(a => a.id === id);
        if (apt) {
            apt.status = 'cancelled';
            this.saveCallback();
        }
        return apt;
    }

    // 약속 삭제
    deleteAppointment(id) {
        const index = this.settings.schedule.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.settings.schedule.appointments.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }

    // 수업 추가
    addClass(day, classData) {
        const newClass = {
            id: ++this.idCounter,
            startTime: classData.startTime,
            endTime: classData.endTime,
            subject: classData.subject,
            location: classData.location || ''
        };

        if (!this.settings.schedule.timetable[day]) {
            this.settings.schedule.timetable[day] = [];
        }

        this.settings.schedule.timetable[day].push(newClass);
        this.settings.schedule.timetable[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
        this.saveCallback();
        return newClass;
    }

    // 수업 삭제
    deleteClass(day, id) {
        const classes = this.settings.schedule.timetable[day];
        if (!classes) return false;

        const index = classes.findIndex(c => c.id === id);
        if (index !== -1) {
            classes.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }

    // 수업 수정
    updateClass(day, id, data) {
        const classes = this.settings.schedule.timetable[day];
        if (!classes) return null;

        const cls = classes.find(c => c.id === id);
        if (cls) {
            Object.assign(cls, data);
            classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
            this.saveCallback();
        }
        return cls;
    }

    // 학기/방학 모드 전환
    toggleMode() {
        this.settings.schedule.mode = this.settings.schedule.mode === 'semester' ? 'vacation' : 'semester';
        this.saveCallback();
    }

    // UI 렌더링
    render(container) {
        const todayClasses = this.getTodayClasses();
        const appointments = this.getUpcomingAppointments();
        const today = new Date();
        const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
        const dayStr = this.getTodayDay();

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
                    <span class="sstssd-module-icon">📅</span>
                    <span>스케줄</span>
                </div>
                <button class="sstssd-module-toggle">${isOpen ? '▲' : '▼'}</button>
            </div>
            <div class="sstssd-module-content ${isOpen ? 'sstssd-module-open' : ''}" data-module="${this.moduleName}">
                <div class="sstssd-schedule-header">
                    <div class="sstssd-schedule-date">📅 오늘 ${dateStr} (${dayStr})</div>
                    <div class="sstssd-schedule-mode">
                        ${this.settings.schedule.mode === 'semester' ? '🎓 학기 중' : '🌴 방학 중'}
                        <button class="sstssd-btn sstssd-btn-sm" data-action="open-timetable">시간표⚙️</button>
                    </div>
                </div>

                <div class="sstssd-section">
                    <div class="sstssd-section-title">🕐 오늘 수업</div>
                    ${this.renderTodayClasses(todayClasses)}
                </div>

                <div class="sstssd-section">
                    <div class="sstssd-section-title">📌 다가오는 약속</div>
                    ${appointments.length > 0 
                        ? appointments.slice(0, 3).map(apt => this.renderAppointment(apt)).join('')
                        : '<div class="sstssd-empty">약속이 없습니다</div>'
                    }
                    <button class="sstssd-btn sstssd-btn-add" data-action="add-appointment">+ 약속 추가</button>
                </div>
            </div>
        `;

        this.attachEventListeners(container);
        
        // Update summary after rendering
        if (typeof window.sstsdUpdateSummary === 'function') {
            window.sstsdUpdateSummary();
        }
    }

    // 오늘 수업 렌더링
    renderTodayClasses(classes) {
        if (this.settings.schedule.mode === 'vacation') {
            return '<div class="sstssd-empty">🌴 방학 중</div>';
        }

        if (!classes || classes.length === 0) {
            return '<div class="sstssd-empty">오늘 수업 없음</div>';
        }

        return classes.map(cls => `
            <div class="sstssd-schedule-class">
                ${cls.startTime}~${cls.endTime} ${this.escapeHtml(cls.subject)}
                ${cls.location ? `<span class="sstssd-location">📍 ${this.escapeHtml(cls.location)}</span>` : ''}
            </div>
        `).join('');
    }

    // 약속 렌더링
    renderAppointment(apt) {
        const aptDate = new Date(apt.date);
        const dateStr = `${aptDate.getMonth() + 1}/${aptDate.getDate()}`;
        const dayStr = ScheduleModule.DAYS[aptDate.getDay()];

        return `
            <div class="sstssd-appointment" data-id="${apt.id}">
                <div class="sstssd-appointment-header">
                    <span class="sstssd-appointment-date">${dateStr}(${dayStr}) ${apt.time || ''}</span>
                </div>
                <div class="sstssd-appointment-title">${this.escapeHtml(apt.title)}</div>
                ${apt.location ? `<div class="sstssd-appointment-detail">📍 ${this.escapeHtml(apt.location)}</div>` : ''}
                ${apt.with ? `<div class="sstssd-appointment-detail">👥 ${this.escapeHtml(apt.with)}</div>` : ''}
                ${apt.memo ? `<div class="sstssd-appointment-memo">${this.escapeHtml(apt.memo)}</div>` : ''}
                <div class="sstssd-appointment-actions">
                    <button class="sstssd-btn sstssd-btn-sm sstssd-btn-postpone" data-id="${apt.id}">미루기</button>
                    <button class="sstssd-btn sstssd-btn-sm sstssd-btn-cancel" data-id="${apt.id}">취소</button>
                </div>
            </div>
        `;
    }

    // 이벤트 리스너 추가
    attachEventListeners(container) {
        // 시간표 설정 버튼
        const timetableBtn = container.querySelector('[data-action="open-timetable"]');
        if (timetableBtn) {
            timetableBtn.addEventListener('click', () => this.showTimetableModal());
        }

        // 약속 추가 버튼
        const addAptBtn = container.querySelector('[data-action="add-appointment"]');
        if (addAptBtn) {
            addAptBtn.addEventListener('click', () => this.showAddAppointmentModal());
        }

        // 약속 미루기 버튼
        container.querySelectorAll('.sstssd-btn-postpone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showPostponeModal(id);
            });
        });

        // 약속 취소 버튼
        container.querySelectorAll('.sstssd-btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 약속을 취소하시겠습니까?')) {
                    this.cancelAppointment(id);
                    this.render(container);
                }
            });
        });

        // 약속 항목 클릭 (편집)
        container.querySelectorAll('.sstssd-appointment').forEach(apt => {
            apt.addEventListener('click', () => {
                const id = parseInt(apt.dataset.id);
                this.showEditAppointmentModal(id);
            });
        });
    }

    // 시간표 설정 모달
    showTimetableModal() {
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        const timetable = this.settings.schedule.timetable;

        const modal = this.createModal(`
            <h3>📅 시간표 설정</h3>
            <div class="sstssd-timetable-mode">
                <label>모드:</label>
                <select id="sstssd-mode-select" class="sstssd-input">
                    <option value="semester" ${this.settings.schedule.mode === 'semester' ? 'selected' : ''}>🎓 학기 중</option>
                    <option value="vacation" ${this.settings.schedule.mode === 'vacation' ? 'selected' : ''}>🌴 방학</option>
                </select>
            </div>
            <div class="sstssd-timetable-content">
                ${days.map(day => `
                    <div class="sstssd-timetable-day" data-day="${day}">
                        <div class="sstssd-timetable-day-header">
                            <strong>${day}요일</strong>
                            <button class="sstssd-btn sstssd-btn-sm" data-action="add-class" data-day="${day}">+ 추가</button>
                        </div>
                        <div class="sstssd-timetable-classes">
                            ${(timetable[day] || []).map(cls => `
                                <div class="sstssd-timetable-class" data-id="${cls.id}" data-day="${day}">
                                    <span>${cls.startTime}~${cls.endTime} ${this.escapeHtml(cls.subject)}</span>
                                    ${cls.location ? `<span class="sstssd-location-sm">📍${this.escapeHtml(cls.location)}</span>` : ''}
                                    <button class="sstssd-btn-icon" data-action="delete-class" data-day="${day}" data-id="${cls.id}">✕</button>
                                </div>
                            `).join('')}
                            ${(timetable[day] || []).length === 0 ? '<div class="sstssd-empty-sm">수업 없음</div>' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="sstssd-form-actions">
                <button type="button" class="sstssd-btn sstssd-btn-primary" id="sstssd-close-timetable">닫기</button>
            </div>
        `, 'large');

        // 모드 변경
        modal.querySelector('#sstssd-mode-select').addEventListener('change', (e) => {
            this.settings.schedule.mode = e.target.value;
            this.saveCallback();
        });

        // 수업 추가 버튼
        modal.querySelectorAll('[data-action="add-class"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const day = btn.dataset.day;
                this.showAddClassModal(day, modal);
            });
        });

        // 수업 삭제 버튼
        modal.querySelectorAll('[data-action="delete-class"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const day = btn.dataset.day;
                const id = parseInt(btn.dataset.id);
                if (confirm('이 수업을 삭제하시겠습니까?')) {
                    this.deleteClass(day, id);
                    modal.remove();
                    this.showTimetableModal();
                }
            });
        });

        // 수업 항목 클릭 (편집)
        modal.querySelectorAll('.sstssd-timetable-class').forEach(cls => {
            cls.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'delete-class') return;
                const day = cls.dataset.day;
                const id = parseInt(cls.dataset.id);
                this.showEditClassModal(day, id, modal);
            });
        });

        // 닫기 버튼
        modal.querySelector('#sstssd-close-timetable').addEventListener('click', () => {
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="schedule"]'));
        });
    }

    // 수업 추가 모달
    showAddClassModal(day, parentModal) {
        const modal = this.createModal(`
            <h3>수업 추가 (${day}요일)</h3>
            <form id="sstssd-class-form">
                <div class="sstssd-form-group">
                    <label>시작 시간 <span class="sstssd-required">*</span></label>
                    <input type="time" name="startTime" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>종료 시간 <span class="sstssd-required">*</span></label>
                    <input type="time" name="endTime" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>과목명 <span class="sstssd-required">*</span></label>
                    <input type="text" name="subject" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>장소</label>
                    <input type="text" name="location" class="sstssd-input">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-class-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.addClass(day, {
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                subject: formData.get('subject'),
                location: formData.get('location')
            });
            modal.remove();
            parentModal.remove();
            this.showTimetableModal();
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    // 수업 편집 모달
    showEditClassModal(day, id, parentModal) {
        const cls = this.settings.schedule.timetable[day].find(c => c.id === id);
        if (!cls) return;

        const modal = this.createModal(`
            <h3>수업 수정</h3>
            <form id="sstssd-class-form">
                <div class="sstssd-form-group">
                    <label>시작 시간 <span class="sstssd-required">*</span></label>
                    <input type="time" name="startTime" value="${cls.startTime}" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>종료 시간 <span class="sstssd-required">*</span></label>
                    <input type="time" name="endTime" value="${cls.endTime}" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>과목명 <span class="sstssd-required">*</span></label>
                    <input type="text" name="subject" value="${this.escapeHtml(cls.subject)}" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>장소</label>
                    <input type="text" name="location" value="${this.escapeHtml(cls.location || '')}" class="sstssd-input">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-class-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.updateClass(day, id, {
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                subject: formData.get('subject'),
                location: formData.get('location')
            });
            modal.remove();
            parentModal.remove();
            this.showTimetableModal();
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    // 약속 추가 모달
    showAddAppointmentModal() {
        const modal = this.createModal(`
            <h3>약속 추가</h3>
            <form id="sstssd-appointment-form">
                <div class="sstssd-form-group">
                    <label>제목 <span class="sstssd-required">*</span></label>
                    <input type="text" name="title" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>날짜 <span class="sstssd-required">*</span></label>
                    <input type="date" name="date" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>시간</label>
                    <input type="time" name="time" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>장소</label>
                    <input type="text" name="location" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>누구와</label>
                    <input type="text" name="with" class="sstssd-input">
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

        const form = modal.querySelector('#sstssd-appointment-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.addAppointment({
                title: formData.get('title'),
                date: formData.get('date'),
                time: formData.get('time'),
                location: formData.get('location'),
                with: formData.get('with'),
                memo: formData.get('memo')
            });
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="schedule"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    // 약속 편집 모달
    showEditAppointmentModal(id) {
        const apt = this.settings.schedule.appointments.find(a => a.id === id);
        if (!apt) return;

        const modal = this.createModal(`
            <h3>약속 수정</h3>
            <form id="sstssd-appointment-form">
                <div class="sstssd-form-group">
                    <label>제목 <span class="sstssd-required">*</span></label>
                    <input type="text" name="title" value="${this.escapeHtml(apt.title)}" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>날짜 <span class="sstssd-required">*</span></label>
                    <input type="date" name="date" value="${apt.date}" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>시간</label>
                    <input type="time" name="time" value="${apt.time || ''}" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>장소</label>
                    <input type="text" name="location" value="${this.escapeHtml(apt.location || '')}" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>누구와</label>
                    <input type="text" name="with" value="${this.escapeHtml(apt.with || '')}" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>메모</label>
                    <textarea name="memo" rows="3" class="sstssd-input">${this.escapeHtml(apt.memo || '')}</textarea>
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-appointment-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.updateAppointment(id, {
                title: formData.get('title'),
                date: formData.get('date'),
                time: formData.get('time'),
                location: formData.get('location'),
                with: formData.get('with'),
                memo: formData.get('memo')
            });
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="schedule"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    // 약속 미루기 모달
    showPostponeModal(id) {
        const apt = this.settings.schedule.appointments.find(a => a.id === id);
        if (!apt) return;

        const modal = this.createModal(`
            <h3>약속 미루기</h3>
            <p>새로운 날짜를 선택하세요</p>
            <form id="sstssd-postpone-form">
                <div class="sstssd-form-group">
                    <label>새 날짜 <span class="sstssd-required">*</span></label>
                    <input type="date" name="newDate" required class="sstssd-input">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">미루기</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-postpone-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.postponeAppointment(id, formData.get('newDate'));
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="schedule"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    // 모달 생성 헬퍼
    createModal(content, size = 'normal') {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content ${size === 'large' ? 'sstssd-modal-large' : ''}">
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
