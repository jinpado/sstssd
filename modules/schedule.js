// 📅 스케줄 모듈 (Schedule Module)
export class ScheduleModule {
    static DAYS = ['일', '월', '화', '수', '목', '금', '토'];

    // 호텔디저트학과 4년 8학기 기본 시간표 데이터
    static DEFAULT_SEMESTERS = {
        '1-1': {
            '월': [
                { id: 1, startTime: '09:00', endTime: '11:50', subject: '기초제빵실습', location: '제과제빵실습실' },
                { id: 2, startTime: '13:00', endTime: '14:50', subject: '식품학개론', location: '강의실201' }
            ],
            '화': [
                { id: 3, startTime: '10:00', endTime: '12:50', subject: '기초제과실습', location: '제과제빵실습실' }
            ],
            '수': [],
            '목': [
                { id: 4, startTime: '09:00', endTime: '10:50', subject: '식품영양학', location: '강의실201' },
                { id: 5, startTime: '13:00', endTime: '15:50', subject: '디저트플레이팅기초', location: '디저트실습실' }
            ],
            '금': [
                { id: 6, startTime: '14:00', endTime: '15:50', subject: '식품위생학', location: '강의실202' },
                { id: 7, startTime: '16:00', endTime: '17:50', subject: '커피바리스타기초', location: '카페실습실' }
            ],
            '토': [], '일': []
        },
        '1-2': {
            '월': [
                { id: 8, startTime: '09:00', endTime: '11:50', subject: '제빵실습Ⅰ', location: '제과제빵실습실' }
            ],
            '화': [
                { id: 9, startTime: '10:00', endTime: '11:50', subject: '식품가공학', location: '강의실201' },
                { id: 10, startTime: '13:00', endTime: '15:50', subject: '제과실습Ⅰ', location: '제과제빵실습실' }
            ],
            '수': [
                { id: 11, startTime: '09:00', endTime: '10:50', subject: '식품미생물학', location: '강의실203' },
                { id: 12, startTime: '14:00', endTime: '16:50', subject: '카페디저트실습', location: '카페실습실' }
            ],
            '목': [
                { id: 13, startTime: '11:00', endTime: '12:50', subject: '메뉴관리론', location: '강의실202' }
            ],
            '금': [],
            '토': [], '일': []
        },
        '2-1': {
            '월': [
                { id: 14, startTime: '09:00', endTime: '11:50', subject: '고급제빵실습', location: '제과제빵실습실' },
                { id: 15, startTime: '14:00', endTime: '15:50', subject: '식품화학', location: '강의실301' }
            ],
            '화': [
                { id: 16, startTime: '13:00', endTime: '15:50', subject: '케이크데코레이션', location: '디저트실습실' }
            ],
            '수': [
                { id: 17, startTime: '09:00', endTime: '10:50', subject: '원가관리', location: '강의실302' },
                { id: 18, startTime: '11:00', endTime: '13:50', subject: '고급제과실습', location: '제과제빵실습실' }
            ],
            '목': [],
            '금': [
                { id: 19, startTime: '10:00', endTime: '12:50', subject: '바리스타실습', location: '카페실습실' },
                { id: 20, startTime: '14:00', endTime: '15:50', subject: '제과제빵재료학', location: '강의실301' }
            ],
            '토': [], '일': []
        },
        '2-2': {
            '월': [
                { id: 21, startTime: '09:00', endTime: '11:50', subject: '초콜릿공예', location: '디저트실습실' }
            ],
            '화': [],
            '수': [
                { id: 22, startTime: '09:00', endTime: '10:50', subject: '위생법규', location: '강의실301' },
                { id: 23, startTime: '11:00', endTime: '12:50', subject: 'HACCP실무', location: '강의실303' }
            ],
            '목': [
                { id: 24, startTime: '10:00', endTime: '12:50', subject: '푸드스타일링', location: '디저트실습실' },
                { id: 25, startTime: '14:00', endTime: '15:50', subject: '제과제빵경영학', location: '강의실301' }
            ],
            '금': [
                { id: 26, startTime: '09:00', endTime: '11:50', subject: '아트브레드실습', location: '제과제빵실습실' },
                { id: 27, startTime: '13:00', endTime: '14:50', subject: '식품관능검사', location: '강의실301' }
            ],
            '토': [], '일': []
        },
        '3-1': {
            '월': [],
            '화': [
                { id: 28, startTime: '09:00', endTime: '11:50', subject: '고급디저트실습', location: '디저트실습실' },
                { id: 29, startTime: '13:00', endTime: '14:50', subject: '글로벌외식문화', location: '강의실402' }
            ],
            '수': [
                { id: 30, startTime: '10:00', endTime: '12:50', subject: '웨딩케이크실습', location: '제과제빵실습실' }
            ],
            '목': [
                { id: 31, startTime: '09:00', endTime: '11:50', subject: '프랑스디저트', location: '디저트실습실' },
                { id: 32, startTime: '13:00', endTime: '14:50', subject: '식품품질관리', location: '강의실401' },
                { id: 33, startTime: '15:00', endTime: '16:50', subject: '현장실습세미나', location: '강의실401' }
            ],
            '금': [],
            '토': [], '일': []
        },
        '3-2': {
            '월': [
                { id: 34, startTime: '10:00', endTime: '12:50', subject: '슈가크래프트', location: '디저트실습실' },
                { id: 35, startTime: '14:00', endTime: '15:50', subject: '프랜차이즈경영', location: '강의실401' }
            ],
            '화': [
                { id: 36, startTime: '09:00', endTime: '11:50', subject: '이탈리안디저트', location: '디저트실습실' }
            ],
            '수': [],
            '목': [
                { id: 37, startTime: '09:00', endTime: '10:50', subject: '식품안전관리', location: '강의실401' },
                { id: 38, startTime: '13:00', endTime: '15:50', subject: '캡스톤디자인Ⅰ', location: '강의실402' }
            ],
            '금': [
                { id: 39, startTime: '11:00', endTime: '12:50', subject: '창업실무', location: '강의실402' },
                { id: 40, startTime: '14:00', endTime: '15:50', subject: '외식트렌드분석', location: '강의실402' }
            ],
            '토': [], '일': []
        },
        '4-1': {
            '월': [
                { id: 41, startTime: '09:00', endTime: '11:50', subject: '마스터디저트실습', location: '디저트실습실' },
                { id: 42, startTime: '13:00', endTime: '14:50', subject: '외식사업계획론', location: '강의실501' }
            ],
            '화': [
                { id: 43, startTime: '10:00', endTime: '12:50', subject: '쇼콜라티에실습', location: '디저트실습실' }
            ],
            '수': [
                { id: 44, startTime: '13:00', endTime: '15:50', subject: '퓨전디저트개발', location: '디저트실습실' },
                { id: 45, startTime: '16:00', endTime: '17:50', subject: '식품위생법규', location: '강의실502' }
            ],
            '목': [],
            '금': [
                { id: 46, startTime: '09:00', endTime: '11:50', subject: '캡스톤디자인Ⅱ', location: '강의실502' },
                { id: 47, startTime: '13:00', endTime: '14:50', subject: '취업세미나', location: '강의실501' }
            ],
            '토': [], '일': []
        },
        '4-2': {
            '월': [
                { id: 48, startTime: '09:00', endTime: '11:50', subject: '졸업작품실습', location: '디저트실습실' },
                { id: 49, startTime: '13:00', endTime: '15:50', subject: '졸업프로젝트Ⅱ', location: '강의실501' }
            ],
            '화': [],
            '수': [
                { id: 50, startTime: '10:00', endTime: '12:50', subject: '졸업작품실습', location: '디저트실습실' }
            ],
            '목': [
                { id: 51, startTime: '09:00', endTime: '16:50', subject: '현장실습', location: '외부' }
            ],
            '금': [
                { id: 52, startTime: '09:00', endTime: '10:50', subject: '졸업세미나', location: '강의실501' }
            ],
            '토': [], '일': []
        }
    };
    
    constructor(settings, saveCallback, getGlobalSettings, getRpDate) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.getGlobalSettings = getGlobalSettings;
        this.getRpDate = getRpDate;
        this.idCounter = Date.now();
        this.moduleName = 'schedule';
        if (!this.settings.schedule) {
            this.settings.schedule = {
                mode: 'semester',
                currentSemester: '',
                semesters: JSON.parse(JSON.stringify(ScheduleModule.DEFAULT_SEMESTERS)),
                timetable: null,
                appointments: []
            };
        }
        // Migration: if semesters doesn't exist or is empty, set from defaults
        if (!this.settings.schedule.semesters || Object.keys(this.settings.schedule.semesters || {}).length === 0) {
            this.settings.schedule.semesters = JSON.parse(JSON.stringify(ScheduleModule.DEFAULT_SEMESTERS));
        }
        // Preserve saved currentSemester. Default to '' (no semester selected) for new chats.
        // Users must manually select their semester from the dropdown.
        if (this.settings.schedule.currentSemester === undefined || this.settings.schedule.currentSemester === null) {
            this.settings.schedule.currentSemester = '';
        }
        // Sync timetable to current semester (null when no semester selected)
        this.settings.schedule.timetable = this.settings.schedule.currentSemester
            ? this.settings.schedule.semesters[this.settings.schedule.currentSemester]
            : null;
    }

    // 오늘 날짜의 요일 가져오기
    getTodayDay() {
        return ScheduleModule.DAYS[this.getRpDate().getDay()];
    }

    // 오늘 일정 통합 (수업 + 약속) - 시간순 정렬
    getTodaySchedule() {
        const rpDate = this.getRpDate();
        const todayDay = this.getTodayDay();
        const todayStr = this.formatDate(rpDate);
        
        let todayItems = [];
        
        // 1. 오늘 수업 추가 (학기 중일 때만)
        if (this.settings.schedule.mode === 'semester') {
            const classes = this.getCurrentTimetable()[todayDay] || [];
            classes.forEach(c => {
                todayItems.push({
                    type: 'class',
                    startTime: c.startTime,
                    endTime: c.endTime,
                    title: c.subject,
                    location: c.location,
                    icon: '🎓'
                });
            });
        }
        
        // 2. 오늘 약속 추가
        const todayAppointments = this.settings.schedule.appointments.filter(a => {
            return a.date === todayStr && a.status === 'active';
        });
        todayAppointments.forEach(a => {
            todayItems.push({
                type: 'appointment',
                startTime: a.time || null,  // null for unspecified time
                endTime: null,
                title: a.title,
                location: a.location,
                with: a.with,
                icon: '📌',
                appointmentData: a  // 미루기/취소 버튼용
            });
        });
        
        // 3. 시간순 정렬 (null은 맨 뒤로)
        todayItems.sort((a, b) => {
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return a.startTime.localeCompare(b.startTime);
        });
        
        return todayItems;
    }

    // 날짜 포맷 (YYYY-MM-DD)
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 오늘 수업 가져오기
    getTodayClasses() {
        if (this.settings.schedule.mode === 'vacation') {
            return null;
        }
        const today = this.getTodayDay();
        return this.getCurrentTimetable()[today] || [];
    }

    // 다음 수업 정보 가져오기 (대시보드 요약용)
    getNextClass() {
        const classes = this.getTodayClasses();
        if (!classes || classes.length === 0) return null;

        const now = this.getRpDate();
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

    // 다가오는 약속 가져오기 (내일 이후)
    getUpcomingAppointments() {
        const today = this.getRpDate();
        today.setHours(0, 0, 0, 0);
        
        // Get tomorrow's date for comparison
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.settings.schedule.appointments
            .filter(apt => {
                if (apt.status !== 'active') return false;
                const aptDate = new Date(apt.date);
                return aptDate >= tomorrow;  // Only appointments from tomorrow onwards
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
        // Sync timetable when switching back to semester mode
        if (this.settings.schedule.mode === 'semester') {
            this.settings.schedule.timetable = this.settings.schedule.currentSemester
                ? this.settings.schedule.semesters[this.settings.schedule.currentSemester]
                : null;
        }
        this.saveCallback();
    }

    // 현재 학기 시간표 반환
    getCurrentTimetable() {
        const semester = this.settings.schedule.currentSemester;
        if (!semester) {
            return { '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': [] };
        }
        return this.settings.schedule.semesters?.[semester] ||
               { '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': [] };
    }

    // 학기 변경
    setSemester(semesterKey) {
        if (!semesterKey) {
            // 학기 선택 해제
            this.settings.schedule.currentSemester = '';
            this.settings.schedule.timetable = null;
            this.saveCallback();
            return;
        }
        // 해당 학기 데이터가 없으면 기본값에서 복구
        if (!this.settings.schedule.semesters[semesterKey]) {
            if (ScheduleModule.DEFAULT_SEMESTERS[semesterKey]) {
                this.settings.schedule.semesters[semesterKey] =
                    JSON.parse(JSON.stringify(ScheduleModule.DEFAULT_SEMESTERS[semesterKey]));
            } else {
                return; // 존재하지 않는 학기
            }
        }
        this.settings.schedule.currentSemester = semesterKey;
        this.settings.schedule.timetable = this.settings.schedule.semesters[semesterKey];
        this.saveCallback();
    }

    // 학기 키를 표시 문자열로 변환 ('2-1' → '2학년 1학기')
    getSemesterLabel(key) {
        if (!key) return '미선택';
        if (!key.includes('-')) return key;
        const [year, term] = key.split('-');
        return `${year}학년 ${term}학기`;
    }

    // UI 렌더링
    render(container) {
        const todaySchedule = this.getTodaySchedule();
        const upcomingAppointments = this.getUpcomingAppointments();
        const today = this.getRpDate();
        const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
        const dayStr = this.getTodayDay();

        // Preserve accordion state
        const contentEl = container.querySelector('.sstssd-module-content');
        let isOpen = contentEl ? contentEl.classList.contains('sstssd-module-open') : false;
        
        // Check global settings if available and content element doesn't exist yet
        if (!contentEl && this.getGlobalSettings) {
            const globalSettings = this.getGlobalSettings();
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
                        ${this.settings.schedule.mode === 'semester' 
                            ? (this.settings.schedule.currentSemester
                                ? `🎓 ${this.getSemesterLabel(this.settings.schedule.currentSemester)}`
                                : '📋 학기를 선택해주세요')
                            : '🌴 방학 중'}
                        <button class="sstssd-btn sstssd-btn-sm" data-action="open-timetable">시간표⚙️</button>
                    </div>
                </div>

                <div class="sstssd-section">
                    <div class="sstssd-section-title">📋 오늘의 일정</div>
                    ${this.renderTodaySchedule(todaySchedule)}
                </div>

                <div class="sstssd-section">
                    <div class="sstssd-section-title">📌 다가오는 일정</div>
                    ${upcomingAppointments.length > 0 
                        ? upcomingAppointments.slice(0, 3).map(apt => this.renderAppointment(apt)).join('')
                        : '<div class="sstssd-empty">다가오는 일정이 없습니다</div>'
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

    // 오늘 일정 렌더링 (수업 + 약속 통합)
    renderTodaySchedule(scheduleItems) {
        if (this.settings.schedule.mode === 'vacation' && scheduleItems.length === 0) {
            return '<div class="sstssd-empty">🌴 방학 중 - 오늘 일정이 없습니다</div>';
        }

        if (this.settings.schedule.mode === 'semester' && !this.settings.schedule.currentSemester && scheduleItems.length === 0) {
            return '<div class="sstssd-empty">학기를 선택하면 수업이 표시됩니다</div>';
        }

        if (scheduleItems.length === 0) {
            return '<div class="sstssd-empty">오늘 일정이 없습니다</div>';
        }

        return scheduleItems.map(item => {
            if (item.type === 'class') {
                return `
                    <div class="sstssd-today-item class">
                        <div class="sstssd-today-time">${item.startTime}~${item.endTime}</div>
                        <div class="sstssd-today-title">${item.icon} ${this.escapeHtml(item.title)}</div>
                        ${item.location ? `<div class="sstssd-today-location">📍 ${this.escapeHtml(item.location)}</div>` : ''}
                    </div>
                `;
            } else {
                // appointment
                const apt = item.appointmentData;
                const displayTime = item.startTime ? item.startTime : '시간 미정';
                return `
                    <div class="sstssd-today-item appointment" data-id="${apt.id}">
                        <div class="sstssd-today-time">${displayTime}</div>
                        <div class="sstssd-today-title">${item.icon} ${this.escapeHtml(item.title)}</div>
                        ${item.location ? `<div class="sstssd-today-location">📍 ${this.escapeHtml(item.location)}</div>` : ''}
                        ${item.with ? `<div class="sstssd-today-with">👥 ${this.escapeHtml(item.with)}</div>` : ''}
                        <div class="sstssd-appointment-actions">
                            <button class="sstssd-btn sstssd-btn-sm sstssd-btn-postpone" data-id="${apt.id}">미루기</button>
                            <button class="sstssd-btn sstssd-btn-sm sstssd-btn-cancel" data-id="${apt.id}">취소</button>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    /**
     * @deprecated Use renderTodaySchedule() instead for unified class and appointment view
     */
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

        // 약속 미루기 버튼 (both today and upcoming sections)
        container.querySelectorAll('.sstssd-btn-postpone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showPostponeModal(id);
            });
        });

        // 약속 취소 버튼 (both today and upcoming sections)
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

        // 약속 항목 클릭 (편집) - both in today's schedule and upcoming appointments
        container.querySelectorAll('.sstssd-today-item.appointment, .sstssd-appointment').forEach(apt => {
            apt.addEventListener('click', (e) => {
                // Ignore clicks on buttons
                if (e.target.tagName === 'BUTTON') {
                    return;
                }
                const id = parseInt(apt.dataset.id);
                this.showEditAppointmentModal(id);
            });
        });
    }

    // 시간표 설정 모달
    showTimetableModal() {
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        const currentSemester = this.settings.schedule.currentSemester || '';
        const timetable = this.getCurrentTimetable();
        const semesterKeys = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
        const isSemester = this.settings.schedule.mode === 'semester';

        const modal = this.createModal(`
            <h3>📅 시간표 설정</h3>
            <div class="sstssd-timetable-mode">
                <label>모드:</label>
                <select id="sstssd-mode-select" class="sstssd-input">
                    <option value="semester" ${isSemester ? 'selected' : ''}>🎓 학기 중</option>
                    <option value="vacation" ${!isSemester ? 'selected' : ''}>🌴 방학</option>
                </select>
            </div>
            <div class="sstssd-timetable-semester-row" style="${isSemester ? '' : 'display:none'}">
                <label>학기:</label>
                <select id="sstssd-semester-select" class="sstssd-input">
                    <option value="" ${!currentSemester ? 'selected' : ''}>— 학기 선택 —</option>
                    ${semesterKeys.map(k => `<option value="${k}" ${k === currentSemester ? 'selected' : ''}>${this.getSemesterLabel(k)}</option>`).join('')}
                </select>
                <button type="button" class="sstssd-btn sstssd-btn-sm" id="sstssd-reset-timetable" ${!currentSemester ? 'disabled' : ''}>기본값으로 초기화</button>
            </div>
            <div class="sstssd-timetable-content">
                ${!currentSemester ? '<div class="sstssd-empty">학기를 선택하면 시간표가 표시됩니다</div>' : days.map(day => `
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
            if (e.target.value === 'semester') {
                this.settings.schedule.timetable = this.settings.schedule.currentSemester
                    ? this.settings.schedule.semesters[this.settings.schedule.currentSemester]
                    : null;
            }
            this.saveCallback();
            modal.remove();
            this.showTimetableModal();
        });

        // 학기 변경
        modal.querySelector('#sstssd-semester-select').addEventListener('change', (e) => {
            this.setSemester(e.target.value);
            modal.remove();
            this.showTimetableModal();
        });

        // 기본값으로 초기화
        modal.querySelector('#sstssd-reset-timetable').addEventListener('click', () => {
            if (!ScheduleModule.DEFAULT_SEMESTERS[currentSemester]) return;
            const label = this.getSemesterLabel(currentSemester);
            if (confirm(`${label} 시간표를 기본값으로 초기화하시겠습니까?\n현재 수정 내용이 모두 삭제됩니다.`)) {
                this.settings.schedule.semesters[currentSemester] = JSON.parse(JSON.stringify(ScheduleModule.DEFAULT_SEMESTERS[currentSemester]));
                this.settings.schedule.timetable = this.settings.schedule.semesters[currentSemester];
                this.saveCallback();
                modal.remove();
                this.showTimetableModal();
            }
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
        const cls = this.getCurrentTimetable()[day]?.find(c => c.id === id);
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
