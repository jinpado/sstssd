// Side Dashboard Extension for SillyTavern
// Main entry point

import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';
import { TodoModule } from './modules/todo.js';
import { ScheduleModule } from './modules/schedule.js';
import { BalanceModule } from './modules/balance.js';
import { BakingModule } from './modules/baking.js';
import { ShopModule } from './modules/shop.js';
import { InstagramModule } from './modules/instagram.js';

const MODULE_NAME = 'sstssd';

// Time constants
const MS_PER_DAY = 24 * 60 * 60 * 1000;  // Milliseconds in a day

// Tag detection regex patterns
const FIN_IN_REGEX = /<FIN_IN>(.+?)\|(\d+)\s*<\/FIN_IN>/g;
const FIN_OUT_REGEX = /<FIN_OUT>(.+?)\|(\d+)\s*<\/FIN_OUT>/g;
const SALE_REGEX = /<SALE>(.+?)\|(\d+)\|(\d+)\s*<\/SALE>/g;
// GIFT_REGEX: Gift product from personal stock
// Example: <GIFT>소금쿠키|5|친구이름</GIFT>
const GIFT_REGEX = /<GIFT>(.+?)\|(\d+)\|?([^<]*)<\/GIFT>/g;
// SHOP_DETAILED_REGEX: Enhanced shopping list with detailed items
// Supports both WI format (품명|가격§구분) and QR format (🔸 item — qty — price원)
// Example: <SHOP>[STORE]학교 앞 마트[/STORE][WHEN]작업 전[/WHEN][ITEMS]🔸 아몬드 가루 — 200g — 4,500원[/ITEMS][TOTAL]22,000원[/TOTAL]</SHOP>
const SHOP_DETAILED_REGEX = /<SHOP>\s*\[STORE\]([\s\S]*?)\[\/STORE\]\s*\[WHEN\]([\s\S]*?)\[\/WHEN\]\s*\[ITEMS\]([\s\S]*?)\[\/ITEMS\]\s*\[TOTAL\]([\s\S]*?)\[\/TOTAL\]\s*<\/SHOP>/g;
// BAKE_STATUS_REGEX: Enhanced baking progress tracking
// Supports both WI format (상태|단계명|시간|비고§구분) and QR format (⬜ step (time) newline-separated)
// Example: <BAKE>[MENU]딸기 타르트 ×6개[/MENU][START]2024-01-15 14:00[/START][END]2024-01-15 16:00[/END][STEPS]✅ ✅ 🔄 ⬜ ⬜[/STEPS][PCT]60[/PCT]</BAKE>
const BAKE_STATUS_REGEX = /<BAKE>\s*\[MENU\]([\s\S]+?)\[\/MENU\]\s*\[START\]([\s\S]+?)\[\/START\]\s*\[END\]([\s\S]+?)\[\/END\]\s*\[STEPS\]([\s\S]+?)\[\/STEPS\]\s*\[PCT\]\s*(\d+)\s*%?\s*\[\/PCT\]\s*<\/BAKE>/g;
// BANK_REGEX: Financial status with balance, savings, income/expense totals
// Example: <BANK>[BAL]현재잔고[/BAL][SAVE]저축액[/SAVE][GOAL]목표금액[/GOAL]...[/BANK>
const BANK_REGEX = /<BANK>\s*\[BAL\]([\s\S]*?)\[\/BAL\]\s*\[SAVE\]([\s\S]*?)\[\/SAVE\]\s*\[GOAL\]([\s\S]*?)\[\/GOAL\]\s*\[GOALPCT\]([\s\S]*?)\[\/GOALPCT\]\s*\[INTOTAL\]([\s\S]*?)\[\/INTOTAL\]\s*\[INLIST\]([\s\S]*?)\[\/INLIST\]\s*\[OUTTOTAL\]([\s\S]*?)\[\/OUTTOTAL\]\s*\[OUTLIST\]([\s\S]*?)\[\/OUTLIST\]\s*\[NET\]([\s\S]*?)\[\/NET\]\s*<\/BANK>/g;
// TASKS_REGEX: To-do list with categorized items (semicolon-separated within categories)
// Example: <TASKS>[URGENT]긴급항목[/URGENT][WEEK]이번주항목[/WEEK][ROUTINE]루틴항목[/ROUTINE][LONGTERM]장기목표[/LONGTERM][DONE]최근완료[/DONE]</TASKS>
const TASKS_REGEX = /<TASKS>\s*\[URGENT\]([\s\S]*?)\[\/URGENT\]\s*\[WEEK\]([\s\S]*?)\[\/WEEK\]\s*\[ROUTINE\]([\s\S]*?)\[\/ROUTINE\]\s*\[LONGTERM\]([\s\S]*?)\[\/LONGTERM\]\s*\[DONE\]([\s\S]*?)\[\/DONE\]\s*<\/TASKS>/g;
// TIMELINE_REGEX: Schedule with day, weather, and events
// Example: <TIMELINE>[DAY]2024/01/15 (월)[/DAY][WEATHER]맑음, 5°C[/WEATHER][EVENTS]유형|시간|제목|장소§구분[/EVENTS]</TIMELINE>
const TIMELINE_REGEX = /<TIMELINE>\s*\[DAY\]([\s\S]*?)\[\/DAY\]\s*\[WEATHER\]([\s\S]*?)\[\/WEATHER\]\s*\[EVENTS\]([\s\S]*?)\[\/EVENTS\]\s*<\/TIMELINE>/g;
// VN1_REGEX: Status display tag with date, time, weather, location, outfit, condition, schedule
// Example: <VN1>2026/02/20 (금)¦¦14:30¦¦맑음, 6℃¦¦학교¦¦교복¦¦보통¦¦15:00 실습</VN1>
const VN1_REGEX = /<VN1>([\s\S]*?)¦¦([\s\S]*?)¦¦([\s\S]*?)¦¦([\s\S]*?)¦¦([\s\S]*?)¦¦([\s\S]*?)¦¦([\s\S]*?)<\/VN1>/gs;

// Extension state
let panelElement = null;
let todoModule = null;
let scheduleModule = null;
let balanceModule = null;
let bakingModule = null;
let shopModule = null;
let instagramModule = null;
let observer = null;
let currentChatId = null;
const processedNodes = new WeakSet();  // Track processed DOM nodes to prevent duplicates
const processedMessageIds = new Set();  // Track processed message IDs (as "id_hash") to prevent duplicates
let lastReceivedMessageId = undefined;  // Track the last received message ID for GENERATION_ENDED

// Simple hash for deduplication
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
}

// Initialize extension settings
function initSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = {
            chats: {},  // Chat-specific data
            globalSettings: {
                panelOpen: true,
                openModules: ['todo', 'schedule', 'balance', 'baking', 'shop', 'instagram']
            }
        };
    }
    
    // Migrate old data structure if it exists
    if (extension_settings[MODULE_NAME].todo || extension_settings[MODULE_NAME].schedule) {
        console.log('SSTSSD: Migrating old data structure to new format');
        const oldData = {
            todo: extension_settings[MODULE_NAME].todo || { items: [] },
            schedule: extension_settings[MODULE_NAME].schedule || {
                mode: 'semester',
                timetable: {
                    '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': []
                },
                appointments: []
            }
        };
        
        // Preserve global settings if they exist
        const panelOpen = extension_settings[MODULE_NAME].panelOpen !== undefined ? 
            extension_settings[MODULE_NAME].panelOpen : true;
        const openModules = extension_settings[MODULE_NAME].openModules || ['todo', 'schedule', 'balance', 'baking', 'shop', 'instagram'];
        
        // Restructure to new format
        extension_settings[MODULE_NAME] = {
            chats: {
                'legacyPreChatIsolation': oldData
            },
            globalSettings: {
                panelOpen: panelOpen,
                openModules: openModules
            }
        };
        
        // Remove old fields
        delete extension_settings[MODULE_NAME].todo;
        delete extension_settings[MODULE_NAME].schedule;
        
        saveSettings();
    }
    
    // Ensure globalSettings exists
    if (!extension_settings[MODULE_NAME].globalSettings) {
        extension_settings[MODULE_NAME].globalSettings = {
            panelOpen: true,
            openModules: ['todo', 'schedule', 'balance', 'baking', 'shop', 'instagram']
        };
    }
    
    // Ensure chats object exists
    if (!extension_settings[MODULE_NAME].chats) {
        extension_settings[MODULE_NAME].chats = {};
    }
}

// Get current chat data (or create default)
function getCurrentChatData() {
    const context = getContext();
    const chatId = context.chatId;
    
    if (!chatId) {
        return null; // Not in a chat
    }
    
    // Initialize chat data if it doesn't exist
    if (!extension_settings[MODULE_NAME].chats[chatId]) {
        extension_settings[MODULE_NAME].chats[chatId] = {
            rpDate: null,  // Roleplay current date (null = use real time)
            rpDateSource: null,  // "auto" (tag detection) | "manual" (manual setting)
            rpTime: null,  // Roleplay current time "HH:MM" (null = use real time)
            todo: { items: [] },
            schedule: {
                mode: 'semester',
                currentSemester: '',
                semesters: null,  // Will be initialized by ScheduleModule constructor
                timetable: null,  // Synced to semesters[currentSemester] by ScheduleModule
                appointments: []
            },
            balance: null,  // Will be initialized by BalanceModule
            baking: null,  // Will be initialized by BakingModule
            shop: null,  // Will be initialized by ShopModule
            instagram: null  // Will be initialized by InstagramModule
        };
    }
    
    return extension_settings[MODULE_NAME].chats[chatId];
}

// Get global settings with proper fallback
function getGlobalSettings() {
    return extension_settings[MODULE_NAME].globalSettings;
}

// Validate date string
function isValidDateString(dateStr) {
    return !isNaN(new Date(dateStr).getTime());
}

// Get roleplay date or fallback to real date
function getRpDate() {
    const chatData = getCurrentChatData();
    
    if (chatData?.rpDate) {
        const rpDate = new Date(chatData.rpDate);
        
        // rpTime이 있으면 해당 시간 사용, 없으면 현실 시간 폴백
        if (chatData.rpTime) {
            const timeMatch = chatData.rpTime.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                rpDate.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0);
                return rpDate;
            }
        }
        
        // rpTime이 없으면 현실 시간의 시/분을 사용
        const now = new Date();
        rpDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        return rpDate;
    }
    // rpDate가 없으면 현실 시간 폴백
    return new Date();
}

// Update roleplay date
function updateRpDate(date, source) {
    const chatData = getCurrentChatData();
    if (!chatData) return;
    
    chatData.rpDate = date;
    chatData.rpDateSource = source;
    saveSettings();
}

// Save settings callback
function saveSettings() {
    try {
        saveSettingsDebounced();
    } catch (error) {
        console.error('SSTSSD: Failed to save settings', error);
    }
}

// Create panel HTML structure
function createPanel() {
    const panel = document.createElement('div');
    panel.className = 'sstssd-panel';
    panel.id = 'sstssd-panel';
    
    const globalSettings = getGlobalSettings();
    if (!globalSettings.panelOpen) {
        panel.classList.add('sstssd-panel-closed');
    }

    panel.innerHTML = `
        <div class="sstssd-header">
            <div class="sstssd-header-content">
                <h2 class="sstssd-title">Side Dashboard</h2>
                <button class="sstssd-close-btn" id="sstssd-close-btn" title="패널 닫기">✕</button>
            </div>
            <div class="sstssd-summary" id="sstssd-summary">
                <!-- Summary will be populated by updateSummary() -->
            </div>
        </div>
        <div class="sstssd-body">
            <div class="sstssd-module" data-module="balance">
                <!-- Balance module content -->
            </div>
            <div class="sstssd-module" data-module="todo">
                <!-- Todo module content -->
            </div>
            <div class="sstssd-module" data-module="schedule">
                <!-- Schedule module content -->
            </div>
            <div class="sstssd-module" data-module="baking">
                <!-- Baking module content -->
            </div>
            <div class="sstssd-module" data-module="shop">
                <!-- Shop module content -->
            </div>
            <div class="sstssd-module" data-module="instagram">
                <!-- Instagram module content -->
            </div>
        </div>
    `;

    return panel;
}

// Create floating toggle button for mobile
function createToggleButton() {
    const button = document.createElement('button');
    button.className = 'sstssd-toggle-btn';
    button.id = 'sstssd-toggle-btn';
    button.innerHTML = '📊';
    button.title = '대시보드 열기';
    
    const globalSettings = getGlobalSettings();
    if (globalSettings.panelOpen) {
        button.style.display = 'none';
    }

    return button;
}

// Update dashboard summary bar
function updateSummary() {
    const summaryEl = document.getElementById('sstssd-summary');
    if (!summaryEl) return;

    const chatData = getCurrentChatData();
    let summaryParts = [];

    // 1. 📅 롤플 날짜 (항상 표시)
    const rpDate = getRpDate();
    const dateStr = `${rpDate.getFullYear()}-${String(rpDate.getMonth()+1).padStart(2,'0')}-${String(rpDate.getDate()).padStart(2,'0')}`;
    const timeStr = chatData?.rpTime || '';
    summaryParts.push(`📅 ${dateStr} ${timeStr ? '🕐 ' + timeStr : ''} <button id="sstssd-edit-date-btn" class="sstssd-edit-date-btn" title="날짜 수정">✏️</button>`);

    // 2. 💳 개인 자산 (항상 표시)
    if (balanceModule && chatData && chatData.balance) {
        const personalTotal = chatData.balance.living + balanceModule.getTotalSavings();
        summaryParts.push(`💳 개인: ${formatCurrency(personalTotal)}`);
    }

    // 3. 🏪 가게 자금 (가게 모드 ON일 때만)
    if (balanceModule && chatData?.balance?.shopMode?.enabled) {
        const shopFund = chatData.balance.shopMode.operatingFund;
        summaryParts.push(`🏪 가게: ${formatCurrency(shopFund)}`);
    }

    // 4. 🎓 다음 수업 (학기 중 + 수업 있을 때)
    if (scheduleModule) {
        const nextClass = scheduleModule.getNextClass();
        if (nextClass) {
            summaryParts.push(`🎓 다음 수업: ${nextClass.startTime} ${nextClass.subject}`);
        }
    }

    // 5. 📌 다음 약속 (약속 있을 때)
    if (scheduleModule) {
        const upcomingAppointments = scheduleModule.getUpcomingAppointments();
        if (upcomingAppointments && upcomingAppointments.length > 0) {
            const next = upcomingAppointments[0];
            summaryParts.push(`📌 다음 약속: ${next.date} ${next.title}`);
        }
    }

    // 6. 🏪 영업 상태 (가게 모드 ON일 때만)
    if (shopModule && chatData?.balance?.shopMode?.enabled && chatData.shop) {
        const isOpen = chatData.shop.isOpen;
        summaryParts.push(`🏪 영업: ${isOpen ? '🟢 OPEN' : '🔴 CLOSED'}`);
    }

    // 7. 📱 팔로워 (항상 표시)
    if (instagramModule && chatData?.instagram) {
        const followers = chatData.instagram.followers;
        const change = chatData.instagram.followerChange || 0;
        if (change > 0) {
            summaryParts.push(`📱 팔로워: ${followers.toLocaleString('ko-KR')} (+${change})`);
        } else {
            summaryParts.push(`📱 팔로워: ${followers.toLocaleString('ko-KR')}`);
        }
    }

    if (summaryParts.length === 0) {
        summaryParts.push('오늘 일정이 없습니다');
    }

    // 세로 줄바꿈으로 표시
    summaryEl.innerHTML = `<div class="sstssd-summary-text">${summaryParts.map(part => `<div class="sstssd-summary-item">${part}</div>`).join('')}</div>`;
    
    // Date edit button listener
    const editDateBtn = document.getElementById('sstssd-edit-date-btn');
    if (editDateBtn) {
        editDateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDateSettingModal();
        });
    }
}

// Format currency helper
function formatCurrency(amount) {
    return amount.toLocaleString('ko-KR') + '원';
}

// Toggle panel visibility
function togglePanel() {
    const panel = document.getElementById('sstssd-panel');
    const toggleBtn = document.getElementById('sstssd-toggle-btn');
    
    if (!panel || !toggleBtn) return;

    const isOpen = !panel.classList.contains('sstssd-panel-closed');
    
    if (isOpen) {
        panel.classList.add('sstssd-panel-closed');
        toggleBtn.style.display = 'block';
    } else {
        panel.classList.remove('sstssd-panel-closed');
        toggleBtn.style.display = 'none';
    }

    const globalSettings = getGlobalSettings();
    globalSettings.panelOpen = !isOpen;
    saveSettings();
}

// Toggle module accordion
function toggleModule(moduleName) {
    const moduleEl = document.querySelector(`.sstssd-module[data-module="${moduleName}"]`);
    if (!moduleEl) return;

    const content = moduleEl.querySelector('.sstssd-module-content');
    const toggle = moduleEl.querySelector('.sstssd-module-toggle');
    
    if (!content || !toggle) return;

    const isOpen = content.classList.contains('sstssd-module-open');
    
    const globalSettings = getGlobalSettings();
    
    if (isOpen) {
        content.classList.remove('sstssd-module-open');
        toggle.textContent = '▼';
        const index = globalSettings.openModules.indexOf(moduleName);
        if (index > -1) {
            globalSettings.openModules.splice(index, 1);
        }
    } else {
        content.classList.add('sstssd-module-open');
        toggle.textContent = '▲';
        if (!globalSettings.openModules.includes(moduleName)) {
            globalSettings.openModules.push(moduleName);
        }
    }

    saveSettings();
}

// Show panel
function showPanel() {
    const panel = document.getElementById('sstssd-panel');
    if (panel) {
        panel.style.display = '';
    }
}

// Hide panel
function hidePanel() {
    const panel = document.getElementById('sstssd-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Show "no chat selected" message
function showNoChatMessage() {
    const summaryEl = document.getElementById('sstssd-summary');
    if (summaryEl) {
        summaryEl.innerHTML = '<div class="sstssd-summary-text">채팅방을 선택해주세요</div>';
    }
    
    // Clear module contents
    const balanceContainer = document.querySelector('.sstssd-module[data-module="balance"]');
    const todoContainer = document.querySelector('.sstssd-module[data-module="todo"]');
    const scheduleContainer = document.querySelector('.sstssd-module[data-module="schedule"]');
    const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
    const shopContainer = document.querySelector('.sstssd-module[data-module="shop"]');
    const instagramContainer = document.querySelector('.sstssd-module[data-module="instagram"]');
    
    if (balanceContainer) {
        balanceContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="balance">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">💳</span>
                    <span>잔고</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="balance">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (todoContainer) {
        todoContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="todo">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📝</span>
                    <span>할일</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="todo">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (scheduleContainer) {
        scheduleContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="schedule">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📅</span>
                    <span>스케줄</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="schedule">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (bakingContainer) {
        bakingContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="baking">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">🧁</span>
                    <span>베이킹</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="baking">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (shopContainer) {
        shopContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="shop">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">🏪</span>
                    <span>가게</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="shop">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (instagramContainer) {
        instagramContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="instagram">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📱</span>
                    <span class="sstssd-insta-header">Instagram</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="instagram">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
}

// Show date setting modal
function showDateSettingModal() {
    const chatData = getCurrentChatData();
    if (!chatData) return;
    
    const currentDate = chatData.rpDate || '';
    
    const modal = document.createElement('div');
    modal.className = 'sstssd-modal';
    modal.innerHTML = `
        <div class="sstssd-modal-overlay"></div>
        <div class="sstssd-modal-content">
            <h3>📅 롤플 날짜 설정</h3>
            <form id="sstssd-date-form">
                <div class="sstssd-form-group">
                    <label>날짜</label>
                    <input type="date" name="rpDate" value="${currentDate}" class="sstssd-input" required>
                </div>
                <div class="sstssd-form-actions">
                    <button type="button" class="sstssd-btn sstssd-btn-reset" id="sstssd-reset-date">초기화</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    const form = modal.querySelector('#sstssd-date-form');
    const resetBtn = modal.querySelector('#sstssd-reset-date');
    const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
    const overlay = modal.querySelector('.sstssd-modal-overlay');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const newDate = formData.get('rpDate');
        
        // Validate date
        if (isValidDateString(newDate)) {
            updateRpDate(newDate, 'manual');
            // 수동 변경 시 rpTime 초기화 (다음 AI 응답에서 자동 갱신됨)
            const chatData = getCurrentChatData();
            if (chatData) {
                chatData.rpTime = null;
            }
            renderAllModules();
            modal.remove();
        }
    });
    
    resetBtn.addEventListener('click', () => {
        updateRpDate(null, null);
        const chatData = getCurrentChatData();
        if (chatData) {
            chatData.rpTime = null;
        }
        renderAllModules();
        modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => modal.remove());
    overlay.addEventListener('click', () => modal.remove());
}

// Re-render all modules
function renderAllModules() {
    initModules();
    updateSummary();
}

// Initialize modules
function initModules() {
    try {
        const chatData = getCurrentChatData();
        
        // If no chat is selected, show message and return
        if (!chatData) {
            showNoChatMessage();
            return;
        }
        
        const globalSettings = getGlobalSettings();
        
        // Initialize Balance module with chat-specific data and global settings getter
        balanceModule = new BalanceModule(chatData, saveSettings, getGlobalSettings, getRpDate);
        const balanceContainer = document.querySelector('.sstssd-module[data-module="balance"]');
        if (balanceContainer) {
            balanceModule.render(balanceContainer);
        }
        
        // Initialize Todo module with chat-specific data and global settings getter
        todoModule = new TodoModule(chatData, saveSettings, getGlobalSettings, getRpDate);
        const todoContainer = document.querySelector('.sstssd-module[data-module="todo"]');
        if (todoContainer) {
            todoModule.render(todoContainer);
        }

        // Initialize Schedule module with chat-specific data and global settings getter
        scheduleModule = new ScheduleModule(chatData, saveSettings, getGlobalSettings, getRpDate);
        const scheduleContainer = document.querySelector('.sstssd-module[data-module="schedule"]');
        if (scheduleContainer) {
            scheduleModule.render(scheduleContainer);
        }
        
        // Initialize Instagram module with chat-specific data, global settings getter, balance and todo modules
        instagramModule = new InstagramModule(chatData, saveSettings, getGlobalSettings, getRpDate, balanceModule, todoModule);
        const instagramContainer = document.querySelector('.sstssd-module[data-module="instagram"]');
        if (instagramContainer) {
            instagramModule.render(instagramContainer);
        }
        
        // Initialize Baking module with chat-specific data, global settings getter, and instagram module
        bakingModule = new BakingModule(chatData, saveSettings, getGlobalSettings, getRpDate, instagramModule, balanceModule, getContext);
        const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
        if (bakingContainer) {
            bakingModule.render(bakingContainer);
        }
        
        // Initialize Shop module with chat-specific data, global settings getter, and balance module
        shopModule = new ShopModule(chatData, saveSettings, getGlobalSettings, getRpDate, balanceModule);
        const shopContainer = document.querySelector('.sstssd-module[data-module="shop"]');
        if (shopContainer) {
            shopModule.render(shopContainer);
        }
        
        // Connect bakingModule to instagramModule (after both are initialized)
        instagramModule.bakingModule = bakingModule;

        // Set initial module states from global settings
        globalSettings.openModules.forEach(moduleName => {
            const content = document.querySelector(`.sstssd-module-content[data-module="${moduleName}"]`);
            const toggle = document.querySelector(`.sstssd-module[data-module="${moduleName}"] .sstssd-module-toggle`);
            if (content) {
                content.classList.add('sstssd-module-open');
            }
            if (toggle) {
                toggle.textContent = '▲';
            }
        });

        // Update summary
        updateSummary();
    } catch (error) {
        console.error('SSTSSD: Failed to initialize modules', error);
    }
}

// Reload modules for current chat
function reloadModules() {
    const context = getContext();
    currentChatId = context.chatId;
    
    if (!currentChatId) {
        showNoChatMessage();
        showPanel(); // Show panel with "select chat" message
        return;
    }
    
    showPanel();
    initModules();
}

// Attach event listeners
function attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('sstssd-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', togglePanel);
    }

    // Toggle button
    const toggleBtn = document.getElementById('sstssd-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', togglePanel);
    }

    // Module toggles - using event delegation on the body
    const panelBody = document.querySelector('.sstssd-body');
    if (panelBody) {
        panelBody.addEventListener('click', (e) => {
            // Find if clicked element is within a module header
            const header = e.target.closest('.sstssd-module-header');
            if (!header) return;
            
            // Don't toggle if clicking on buttons inside the header (except toggle button)
            if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('sstssd-module-toggle')) {
                return;
            }
            
            const moduleName = header.dataset.module;
            if (moduleName) {
                toggleModule(moduleName);
            }
        });
    }
}

// Parse all tag types from raw message text
function parseTagsFromRawText(rawText) {
    if (!rawText) return;
    
    let anyTagFound = false;
    
    // Parse BAKE_STATUS tags (detailed format with [MENU], [STEPS], [PCT])
    const bakeStatusMatches = [...rawText.matchAll(BAKE_STATUS_REGEX)];
    for (const match of bakeStatusMatches) {
        const menu = match[1].trim();
        const start = match[2].trim();
        const end = match[3].trim();
        const stepsStr = match[4].trim();
        const pct = parseInt(match[5]);
        
        if (bakingModule) {
            console.log(`SSTSSD: Auto-detected baking status (MESSAGE_RECEIVED): ${menu} ${pct}%`);
            
            const parsedSteps = [];
            
            // Try WI format first: status|name|time|note§step2§step3...
            if (stepsStr.includes('§')) {
                const wiSteps = stepsStr.split('§');
                for (const wiStep of wiSteps) {
                    const parts = wiStep.trim().split('|');
                    if (parts.length >= 2) {
                        const statusPart = parts[0].trim();
                        let status = 'pending';
                        let icon = '⬜';
                        
                        if (statusPart === '✅' || statusPart.includes('완료') || statusPart.includes('done')) {
                            status = 'completed';
                            icon = '✅';
                        } else if (statusPart === '🔄' || statusPart.includes('진행') || statusPart.includes('progress')) {
                            status = 'in_progress';
                            icon = '🔄';
                        } else if (statusPart === '⏸️' || statusPart.includes('일시정지') || statusPart.includes('pause')) {
                            status = 'paused';
                            icon = '⏸️';
                        }
                        
                        parsedSteps.push({
                            name: parts[1].trim(),
                            estimatedTime: parts.length > 2 ? parts[2].trim() : '',
                            status: status,
                            icon: icon,
                            note: parts.length > 3 ? parts[3].trim() : ''
                        });
                    }
                }
            } else {
                // QR format: newline-separated or space-separated icons
                let stepLines = stepsStr.split('\n').filter(l => l.trim());
                
                if (stepLines.length <= 1) {
                    const singleLine = stepsStr.trim();
                    const iconPattern = /[✅🔄⏸️⬜]/g;
                    const icons = singleLine.match(iconPattern);
                    if (icons && icons.length > 1) {
                        stepLines = singleLine.split(/\s+/).filter(l => l.trim());
                    }
                }
                
                for (const line of stepLines) {
                    const trimmed = line.trim();
                    let status = 'pending';
                    let icon = '⬜';
                    
                    if (trimmed.startsWith('✅')) {
                        status = 'completed';
                        icon = '✅';
                    } else if (trimmed.startsWith('🔄')) {
                        status = 'in_progress';
                        icon = '🔄';
                    } else if (trimmed.startsWith('⏸️')) {
                        status = 'paused';
                        icon = '⏸️';
                    } else if (trimmed.startsWith('⬜')) {
                        status = 'pending';
                        icon = '⬜';
                    }
                    
                    const withoutIcon = trimmed.replace(/^[✅🔄⏸️⬜]\s*/, '');
                    if (withoutIcon) {
                        const nameMatch = withoutIcon.match(/^(.+?)(?:\s*\((.+?)\))?$/);
                        if (nameMatch) {
                            parsedSteps.push({
                                name: nameMatch[1].trim(),
                                estimatedTime: nameMatch[2] ? nameMatch[2].trim() : '',
                                status: status,
                                icon: icon
                            });
                        }
                    } else {
                        parsedSteps.push({
                            name: '',
                            estimatedTime: '',
                            status: status,
                            icon: icon
                        });
                    }
                }
            }
            
            bakingModule.updateFromBakeTag({
                menu: menu,
                start: start,
                end: end,
                stepsText: stepsStr,
                parsedSteps: parsedSteps,
                pct: pct
            });
            
            anyTagFound = true;
        }
    }
    
    // Parse SHOP_DETAILED tags
    const shopDetailedMatches = [...rawText.matchAll(SHOP_DETAILED_REGEX)];
    for (const match of shopDetailedMatches) {
        const store = match[1].trim();
        const when = match[2].trim();
        const itemsText = match[3].trim();
        const totalText = match[4].trim();
        
        if (bakingModule) {
            console.log(`SSTSSD: Auto-detected detailed shopping list (MESSAGE_RECEIVED) from ${store}`);
            
            const parsedItems = [];
            
            if (itemsText.includes('§') && !itemsText.includes('🔸')) {
                const wiItems = itemsText.split('§');
                for (const wiItem of wiItems) {
                    const parts = wiItem.trim().split('|');
                    if (parts.length >= 2) {
                        parsedItems.push({
                            name: parts[0].trim(),
                            qty: 1,
                            unit: "개",
                            price: parseInt(parts[1].replace(/[^\d]/g, '')) || 0
                        });
                    }
                }
            } else {
                const itemLines = itemsText.split('\n').filter(l => l.trim());
                
                for (const line of itemLines) {
                    const trimmed = line.trim();
                    const itemMatch = trimmed.match(/🔸\s*(.+?)\s*—\s*(\d+(?:\.\d+)?)\s*(\S*)\s*—\s*([\d,]+)\s*원?/);
                    if (itemMatch) {
                        parsedItems.push({
                            name: itemMatch[1].trim(),
                            qty: parseFloat(itemMatch[2]),
                            unit: itemMatch[3].trim() || "개",
                            price: parseInt(itemMatch[4].replace(/,/g, ''))
                        });
                    } else {
                        const parts = trimmed.replace(/^🔸\s*/, '').split('—').map(p => p.trim());
                        if (parts.length >= 3) {
                            const qtyUnitMatch = parts[1].match(/(\d+(?:\.\d+)?)\s*(\S*)/);
                            const priceMatch = parts[2].match(/([\d,]+)\s*원?/);
                            
                            if (qtyUnitMatch && priceMatch) {
                                parsedItems.push({
                                    name: parts[0],
                                    qty: parseFloat(qtyUnitMatch[1]),
                                    unit: (qtyUnitMatch[2] || '').trim() || "개",
                                    price: parseInt(priceMatch[1].replace(/,/g, ''))
                                });
                            }
                        }
                    }
                }
            }
            
            const totalMatch = totalText.match(/([\d,]+)\s*원?/);
            const totalPrice = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : 0;
            
            let linkedRecipe = null;
            if (bakingModule.settings.baking && bakingModule.settings.baking.recipes) {
                let lastPending = null;
                for (const recipe of bakingModule.settings.baking.recipes) {
                    if (recipe.status === 'in_progress') {
                        linkedRecipe = recipe;
                        break;
                    } else if (recipe.status === 'pending') {
                        lastPending = recipe;
                    }
                }
                if (!linkedRecipe && lastPending) {
                    linkedRecipe = lastPending;
                }
            }
            
            if (parsedItems.length > 0) {
                bakingModule.addDetailedShoppingList({
                    items: parsedItems,
                    totalPrice: totalPrice,
                    store: store,
                    when: when,
                    linkedRecipe: linkedRecipe ? linkedRecipe.id : null,
                    status: "pending"
                });
                
                if (linkedRecipe) {
                    if (!linkedRecipe.ingredients || linkedRecipe.ingredients.length === 0) {
                        linkedRecipe.ingredients = parsedItems.map(item => ({
                            name: item.name,
                            qty: item.qty,
                            unit: item.unit,
                            price: item.price
                        }));
                        bakingModule.saveCallback();
                    }
                }
                
                anyTagFound = true;
            }
        }
    }
    
    // Parse BANK tags
    const bankMatches = [...rawText.matchAll(BANK_REGEX)];
    for (const match of bankMatches) {
        const balance = match[1].trim();
        const savings = match[2].trim();
        
        if (balanceModule) {
            console.log(`SSTSSD: Auto-detected BANK tag (MESSAGE_RECEIVED) - Balance: ${balance}, Savings: ${savings}`);
            anyTagFound = true;
        }
    }
    
    // Parse TASKS tags
    const tasksMatches = [...rawText.matchAll(TASKS_REGEX)];
    for (const match of tasksMatches) {
        const urgent = match[1].trim();
        const week = match[2].trim();
        const routine = match[3].trim();
        const longterm = match[4].trim();
        const done = match[5].trim();
        
        if (todoModule) {
            console.log(`SSTSSD: Auto-detected TASKS tag (MESSAGE_RECEIVED)`);
            
            if (urgent) {
                const urgentItems = urgent.split(';').map(t => t.trim()).filter(t => t);
                for (const item of urgentItems) {
                    const exists = todoModule.settings.todo.items.some(i => i.title === item);
                    if (!exists) {
                        const today = todoModule.getRpDate();
                        todoModule.addItem({
                            title: item,
                            deadline: new Date(today.getTime() + MS_PER_DAY).toISOString().split('T')[0],
                            estimatedTime: '',
                            memo: 'AI 자동 감지 (긴급)'
                        });
                    }
                }
            }
            
            if (week) {
                const weekItems = week.split(';').map(t => t.trim()).filter(t => t);
                for (const item of weekItems) {
                    const exists = todoModule.settings.todo.items.some(i => i.title === item);
                    if (!exists) {
                        const today = todoModule.getRpDate();
                        todoModule.addItem({
                            title: item,
                            deadline: new Date(today.getTime() + 7 * MS_PER_DAY).toISOString().split('T')[0],
                            estimatedTime: '',
                            memo: 'AI 자동 감지 (이번 주)'
                        });
                    }
                }
            }
            
            anyTagFound = true;
        }
    }
    
    // Parse TIMELINE tags
    const timelineMatches = [...rawText.matchAll(TIMELINE_REGEX)];
    for (const match of timelineMatches) {
        const day = match[1].trim();
        const weather = match[2].trim();
        const events = match[3].trim();
        
        if (scheduleModule) {
            console.log(`SSTSSD: Auto-detected TIMELINE tag (MESSAGE_RECEIVED) for ${day}`);
            
            if (events) {
                const eventList = events.split('§').map(e => e.trim()).filter(e => e);
                for (const event of eventList) {
                    const parts = event.split('|');
                    if (parts.length >= 3) {
                        const type = parts[0].trim();
                        const timeRange = parts[1].trim();
                        const title = parts[2].trim();
                        const location = parts.length > 3 ? parts[3].trim() : '';
                        
                        const dateMatch = day.match(/(\d{4})\/(\d{2})\/(\d{2})/);
                        if (dateMatch) {
                            const eventDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                            
                            const exists = scheduleModule.settings.schedule.appointments.some(a => 
                                a.date === eventDate && a.title === title
                            );
                            if (!exists) {
                                scheduleModule.addAppointment({
                                    date: eventDate,
                                    time: timeRange,
                                    title: title,
                                    location: location,
                                    participants: '',
                                    memo: `AI 자동 감지 (${type})`
                                });
                            }
                        }
                    }
                }
                anyTagFound = true;
            }
        }
    }
    
    // Parse FIN_IN tags (income)
    const finInMatches = [...rawText.matchAll(FIN_IN_REGEX)];
    for (const match of finInMatches) {
        const description = match[1];
        const amount = parseInt(match[2]);
        if (balanceModule && amount > 0) {
            console.log(`SSTSSD: Auto-detected income (MESSAGE_RECEIVED): ${description} ${amount}원`);
            const chatData = getCurrentChatData();
            const shopEnabled = chatData?.balance?.shopMode?.enabled;
            balanceModule.addTransaction({
                type: "income",
                source: shopEnabled ? "shop" : "personal",
                category: "자동감지",
                description: description,
                amount: amount,
                memo: "AI 응답에서 자동 감지"
            });
            anyTagFound = true;
        }
    }
    
    // Parse FIN_OUT tags (expense)
    const finOutMatches = [...rawText.matchAll(FIN_OUT_REGEX)];
    for (const match of finOutMatches) {
        const description = match[1];
        const amount = parseInt(match[2]);
        if (balanceModule && amount > 0) {
            console.log(`SSTSSD: Auto-detected expense (MESSAGE_RECEIVED): ${description} ${amount}원`);
            const chatData = getCurrentChatData();
            const shopEnabled = chatData?.balance?.shopMode?.enabled;
            balanceModule.addTransaction({
                type: "expense",
                source: shopEnabled ? "shop" : "personal",
                category: "자동감지",
                description: description,
                amount: amount,
                memo: "AI 응답에서 자동 감지"
            });
            anyTagFound = true;
        }
    }
    
    // Parse SALE tags (shop sales)
    const saleMatches = [...rawText.matchAll(SALE_REGEX)];
    for (const match of saleMatches) {
        const menuName = match[1];
        const quantity = parseInt(match[2]);
        const unitPrice = parseInt(match[3]);
        if (shopModule && quantity > 0 && unitPrice > 0) {
            console.log(`SSTSSD: Auto-detected sale (MESSAGE_RECEIVED): ${menuName} ${quantity}개 @${unitPrice}원`);
            const chatData = getCurrentChatData();
            if (chatData?.balance?.shopMode?.enabled) {
                shopModule.addSale({
                    menuName: menuName,
                    quantity: quantity,
                    unitPrice: unitPrice
                });
                // 가게 진열 완성품 차감
                if (bakingModule) {
                    bakingModule.deductShopProduct(menuName, quantity);
                }
                anyTagFound = true;
            }
        }
    }
    
    // Parse GIFT tags (gift from personal stock)
    const giftMatches = [...rawText.matchAll(GIFT_REGEX)];
    for (const match of giftMatches) {
        const productName = match[1].trim();
        const quantity = parseInt(match[2]);
        const recipient = match[3] ? match[3].trim() : '?';
        if (bakingModule && productName && quantity > 0) {
            console.log(`SSTSSD: Auto-detected gift (MESSAGE_RECEIVED): ${productName} ${quantity}개 → ${recipient}`);
            bakingModule.deductProduct(productName, quantity);
            anyTagFound = true;
        }
    }
    
    // Parse VN1 tags (status display with date, time, weather, location, outfit, condition, schedule)
    const vn1Matches = [...rawText.matchAll(VN1_REGEX)];
    for (const match of vn1Matches) {
        const dateField = match[1].trim();   // "2026/02/20 (금)" or "2026/02/20"
        const timeField = match[2].trim();   // "14:30"

        console.log(`SSTSSD: Auto-detected VN1 tag - Date: ${dateField}, Time: ${timeField}`);

        // 날짜 추출: "2026/02/20 (금)" → "2026-02-20"
        const vn1DateMatch = dateField.match(/(\d{4})\/(\d{2})\/(\d{2})/);
        if (vn1DateMatch) {
            const newDate = `${vn1DateMatch[1]}-${vn1DateMatch[2]}-${vn1DateMatch[3]}`;
            if (isValidDateString(newDate)) {
                updateRpDate(newDate, 'auto');
            }
        }

        // 시간 추출: "14:30" → rpTime에 저장
        const vn1TimeMatch = timeField.match(/(\d{1,2}):(\d{2})/);
        if (vn1TimeMatch) {
            const chatData = getCurrentChatData();
            if (chatData) {
                chatData.rpTime = timeField;  // "14:30"
                saveSettings();
            }
        }

        anyTagFound = true;
    }

    // Parse DATE tags
    const dateMatch = rawText.match(/<DATE>(\d{4}-\d{2}-\d{2})<\/DATE>/);
    if (dateMatch) {
        const newDate = dateMatch[1];
        if (isValidDateString(newDate)) {
            console.log(`SSTSSD: Auto-detected roleplay date (MESSAGE_RECEIVED): ${newDate}`);
            updateRpDate(newDate, 'auto');
            anyTagFound = true;
        }
    }
    
    // Re-render all modules if any tag was found
    if (anyTagFound) {
        renderAllModules();
    }
}

// Initialize MutationObserver for chat monitoring (fallback for DOM-visible tags only)
function initObserver() {
    try {
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && !processedNodes.has(node)) {
                        processedNodes.add(node);
                        const text = node.textContent || '';
                        
                        // DATE fallback only - lightweight, idempotent (overwrites)
                        const dateMatch = text.match(/<DATE>(\d{4}-\d{2}-\d{2})<\/DATE>/);
                        if (dateMatch) {
                            const newDate = dateMatch[1];
                            if (isValidDateString(newDate)) {
                                console.log(`SSTSSD: Auto-detected roleplay date (DOM fallback): ${newDate}`);
                                updateRpDate(newDate, 'auto');
                                renderAllModules();
                            }
                        }
                        
                        // FIN_IN, FIN_OUT, SALE, GIFT fallbacks REMOVED
                        // These are now reliably handled by GENERATION_ENDED
                        // Having them here caused double-processing (duplicate transactions)
                    }
                }
            }
        });

        // Observe the chat element
        const chatElement = document.getElementById('chat');
        if (chatElement) {
            observer.observe(chatElement, { childList: true, subtree: true });
        }
    } catch (error) {
        console.error('SSTSSD: Failed to initialize observer', error);
    }
}

// Build system prompt injection from all modules
function buildDashboardPrompt() {
    const chatData = getCurrentChatData();
    if (!chatData) return '';
    
    let prompt = '\n[📊 Side Dashboard - Current State]\n';
    
    // Date
    if (chatData.rpDate) {
        const timeStr = chatData.rpTime ? ` ${chatData.rpTime}` : '';
        prompt += `\n[📅 Date] ${chatData.rpDate}${timeStr}\n`;
    }
    
    // Balance
    if (balanceModule && chatData.balance) {
        const living = chatData.balance.living;
        const savings = balanceModule.getTotalSavings();
        prompt += `\n[💳 Balance]\n`;
        prompt += `생활비: ${living.toLocaleString()}원\n`;
        prompt += `저축: ${savings.toLocaleString()}원\n`;
        
        if (chatData.balance.shopMode?.enabled) {
            prompt += `가게 운영비: ${chatData.balance.shopMode.operatingFund.toLocaleString()}원\n`;
        }
    }
    
    // Schedule
    if (scheduleModule && chatData.schedule) {
        const mode = chatData.schedule.mode;
        if (mode === 'semester' && chatData.schedule.currentSemester) {
            const semesterKey = chatData.schedule.currentSemester;
            prompt += `\n[🎓 학기] 현재 ${scheduleModule.getSemesterLabel(semesterKey)}\n`;
        }
        const todaySchedule = scheduleModule.getTodaySchedule();
        if (todaySchedule.length > 0) {
            prompt += `\n[📅 Today's Schedule]\n`;
            todaySchedule.forEach(item => {
                prompt += `- ${item.startTime || '시간 미정'} ${item.title}\n`;
            });
        }
    }
    
    // Todo
    if (todoModule && chatData.todo) {
        const { urgent, inProgress } = todoModule.categorizeItems();
        if (urgent.length > 0 || inProgress.length > 0) {
            prompt += `\n[📝 Tasks]\n`;
            urgent.forEach(item => prompt += `- ⚠️ ${item.title} (${todoModule.calculateDday(item.deadline)})\n`);
            inProgress.forEach(item => prompt += `- ${item.title} (${todoModule.calculateDday(item.deadline)})\n`);
        }
    }

    
    // Baking
    if (bakingModule && chatData.baking) {
        const activeRecipes = chatData.baking.recipes.filter(r => r.status === 'in_progress');
        if (activeRecipes.length > 0) {
            prompt += `\n[🧁 Baking In Progress]\n`;
            activeRecipes.forEach(r => {
                const multiplier = r.multiplier || 1;
                prompt += `레시피: ${r.name} ×${r.yieldQty * multiplier}${r.yieldUnit}\n`;
                
                if (r.deadline) {
                    prompt += `납품 기한: ${r.deadline}\n`;
                }
                
                // Add step progress
                if (r.steps && r.steps.length > 0) {
                    const currentStepIndex = r.currentStep || 0;
                    const currentStep = r.steps[currentStepIndex];
                    const completedSteps = r.steps.filter(s => s.status === 'completed').length;
                    
                    prompt += `현재 단계: "${currentStep.name}" (${completedSteps + 1}/${r.steps.length}단계)\n`;
                    prompt += `예상 시간: ${currentStep.estimatedTime}\n`;
                    
                    if (currentStep.status === 'in_progress') {
                        prompt += `상태: 진행 중 🔄\n`;
                        prompt += `→ 캐릭터가 이 단계의 작업을 하고 있는 것으로 묘사해주세요. 구체적인 동작과 감각을 포함해주세요.\n`;
                    } else if (currentStep.status === 'paused') {
                        prompt += `상태: 일시정지 ⏸️ (다른 작업 가능)\n`;
                    }
                }
                prompt += `\n`;
            });
        }
        
        // Add event notifications
        if (chatData.baking.currentEvent) {
            const event = chatData.baking.currentEvent;
            const eventAge = Date.now() - event.timestamp;
            
            // Only show recent events (within 5 seconds)
            if (eventAge < 5000) {
                prompt += `\n[🔔 Recent Baking Event]\n`;
                
                switch (event.type) {
                    case 'step_start':
                        prompt += `시아가 "${event.stepName}" 단계를 시작합니다.\n`;
                        prompt += `→ 이 단계에서 시아가 무엇을 하는지 구체적으로 묘사해주세요.\n`;
                        break;
                    case 'step_pause':
                        prompt += `시아가 "${event.stepName}" 작업을 잠시 멈추고 다른 일을 합니다.\n`;
                        break;
                    case 'step_complete':
                        prompt += `시아가 "${event.stepName}" 단계를 마쳤습니다.\n`;
                        prompt += `→ 완료된 작업의 결과물을 간단히 언급해주세요.\n`;
                        break;
                    case 'baking_complete':
                        prompt += `${event.recipeName} 베이킹이 완전히 완료되었습니다! 🎉\n`;
                        prompt += `→ 완성된 제품의 외관과 향을 묘사해주세요.\n`;
                        break;
                }
                prompt += `\n`;
            }
        }
    }
    
    // Instagram
    if (instagramModule && chatData.instagram) {
        const ig = chatData.instagram;
        prompt += `\n[📱 Instagram @${ig.username}]\n`;
        prompt += `팔로워: ${ig.followers.toLocaleString()}\n`;
        
        const pendingDMs = ig.dms.filter(d => d.status === 'pending');
        if (pendingDMs.length > 0) {
            prompt += `DM 주문 대기: ${pendingDMs.length}건 (응답은 선택사항입니다)\n`;
        }
    }
    
    // Shop
    if (shopModule && chatData.balance?.shopMode?.enabled && chatData.shop) {
        const shop = chatData.shop;
        const shopName = chatData.balance.shopMode.shopName || "가게";
        prompt += `\n[🏪 Shop - "${shopName}"]\n`;
        prompt += `영업 상태: ${shop.isOpen ? 'OPEN' : 'CLOSED'}\n`;
        
        if (shop.isOpen) {
            // Check if staff is operating today
            const today = scheduleModule ? scheduleModule.formatDate(getRpDate()) : '';
            const todayShift = shop.shifts.find(s => s.date === today && s.status !== 'cancelled');
            if (todayShift) {
                const staffMember = shop.staff.find(st => st.id === todayShift.staffId);
                if (staffMember) {
                    prompt += `\n오늘 운영: ${staffMember.name} (알바)\n`;
                    prompt += `사장 부재 시: 판매와 포장만 가능, 베이킹 불가\n`;
                    if (staffMember.skills) {
                        staffMember.skills.forEach(s => {
                            prompt += `- ${s.icon} ${s.name} ${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)}\n`;
                        });
                    }
                }
            }

            // 진열품 정보 (가격 포함) 및 자연스러운 손님 방문 힌트
            const shopProducts = chatData.baking?.products?.filter(p => p.shopQuantity > 0) || [];
            if (shopProducts.length > 0) {
                prompt += `\n가게 진열품:\n`;
                shopProducts.forEach(p => {
                    const priceStr = p.unitPrice > 0 ? `, ${p.unitPrice.toLocaleString()}원` : '';
                    prompt += `- ${p.name}: ${p.shopQuantity}개${priceStr}\n`;
                });

                // 시간대 기반 방문 빈도 힌트
                const rpTime = chatData.rpTime || '';
                if (rpTime) {
                    const hour = parseInt(rpTime.split(':')[0], 10) || 0;
                    let timeLabel = '';
                    if (hour >= 7 && hour < 10) timeLabel = '아침 시간대';
                    else if (hour >= 10 && hour < 14) timeLabel = '점심 시간대 (방문 빈도 높음)';
                    else if (hour >= 14 && hour < 18) timeLabel = '오후 시간대';
                    else if (hour >= 18 && hour < 21) timeLabel = '저녁 시간대';
                    else timeLabel = '한산한 시간대';
                    prompt += `현재: ${timeLabel}\n`;
                }

                prompt += `가게가 열려 있으니 자연스럽게 가끔 손님이 방문하는 장면을 묘사해도 좋습니다 (매 턴 강제 아님).\n`;
                prompt += `손님 구매 시: <SALE>품명|수량|단가</SALE>\n`;
            }
        }
    }
    
    // 완성품 개인 보유 (가게 모드 OFF 포함)
    if (bakingModule && chatData.baking?.products) {
        const personalProducts = chatData.baking.products.filter(p => p.quantity > 0);
        if (personalProducts.length > 0) {
            prompt += `\n[🧁 완성품 개인 보유]\n`;
            personalProducts.forEach(p => {
                prompt += `- ${p.name}: ${p.quantity}개\n`;
            });
            prompt += `선물 시: <GIFT>제품명|수량|받는사람</GIFT>\n`;
        }
    }
    
    // Tag instructions
    prompt += `\n[Available Tags]\n`;
    prompt += `<FIN_IN>항목|금액</FIN_IN> — 수입 발생 시\n`;
    prompt += `<FIN_OUT>항목|금액</FIN_OUT> — 지출 발생 시\n`;
    if (chatData.balance?.shopMode?.enabled) {
        prompt += `<SALE>품명|수량|단가</SALE> — 판매 발생 시\n`;
    }
    prompt += `<GIFT>제품명|수량|받는사람</GIFT> — 완성품 선물 시\n`;
    prompt += `<BAKE>[MENU]메뉴명|수량[/MENU][START]시작일시[/START][END]종료일시[/END][STEPS]상태|단계명|시간§구분[/STEPS][PCT]진행률[/PCT]</BAKE> — 베이킹 진행 시\n`;
    prompt += `<SHOP>[STORE]구매장소[/STORE][WHEN]시점[/WHEN][ITEMS]품명|가격§구분[/ITEMS][TOTAL]합계금액[/TOTAL]</SHOP> — 재료 구매 필요 시\n`;
    
    return prompt;
}

// Main initialization function
async function init() {
    try {
        console.log('SSTSSD: Initializing Side Dashboard extension');

        // Initialize settings
        initSettings();

        // Create and insert panel
        panelElement = createPanel();
        document.body.appendChild(panelElement);

        // Create and insert toggle button
        const toggleBtn = createToggleButton();
        document.body.appendChild(toggleBtn);

        // Get initial chat context
        const context = getContext();
        currentChatId = context.chatId;

        // Initialize modules
        initModules();

        // Attach event listeners
        attachEventListeners();

        // Initialize observer
        initObserver();

        // Expose updateSummary globally for modules to call
        window.sstsdUpdateSummary = updateSummary;
        
        // Register prompt injection for AI context
        eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, (promptData) => {
            try {
                const dashboardPrompt = buildDashboardPrompt();
                if (dashboardPrompt && promptData) {
                    console.log('SSTSSD: Injecting dashboard state into AI prompt');
                    // Add as system message to the prompt
                    if (Array.isArray(promptData)) {
                        promptData.push({
                            role: 'system',
                            content: dashboardPrompt
                        });
                    } else if (promptData.messages && Array.isArray(promptData.messages)) {
                        promptData.messages.push({
                            role: 'system',
                            content: dashboardPrompt
                        });
                    } else if (promptData.prompt !== undefined) {
                        // If it has a prompt property, append to it
                        promptData.prompt += dashboardPrompt;
                    }
                }
            } catch (error) {
                console.error('SSTSSD: Failed to inject dashboard prompt', error);
            }
        });

        // Listen for chat changes
        eventSource.on(event_types.CHAT_CHANGED, () => {
            console.log('SSTSSD: Chat changed, reloading modules');
            reloadModules();
        });

        // Listen for MESSAGE_RECEIVED to record ID only (parsing happens on GENERATION_ENDED)
        eventSource.on(event_types.MESSAGE_RECEIVED, (messageId) => {
            lastReceivedMessageId = messageId;
        });

        // Listen for GENERATION_ENDED to parse the completed message text
        const generationEndEvent = event_types.GENERATION_ENDED ?? event_types.GENERATION_STOPPED ?? 'generation_ended';
        eventSource.on(generationEndEvent, () => {
            try {
                if (lastReceivedMessageId === undefined) return;
                const messageId = lastReceivedMessageId;
                lastReceivedMessageId = undefined;

                const context = getContext();
                if (!context.chat || messageId === undefined) return;
                const message = context.chat[messageId];
                if (!message || !message.mes) return;

                const textHash = simpleHash(message.mes);
                if (processedMessageIds.has(`${messageId}_${textHash}`)) return;
                processedMessageIds.add(`${messageId}_${textHash}`);

                if (processedMessageIds.size > 200) {
                    const it = processedMessageIds.values();
                    for (let i = 0; i < 100; i++) processedMessageIds.delete(it.next().value);
                }

                console.log('SSTSSD: GENERATION_ENDED - parsing complete message');
                parseTagsFromRawText(message.mes);
            } catch (e) { console.error('SSTSSD: GENERATION_ENDED error', e); }
        });

        // Listen for MESSAGE_UPDATED to re-parse updated messages (hash-based deduplication)
        eventSource.on(event_types.MESSAGE_UPDATED, (messageId) => {
            try {
                const context = getContext();
                if (!context.chat || messageId === undefined) return;
                const message = context.chat[messageId];
                if (!message || !message.mes) return;

                const textHash = simpleHash(message.mes);
                if (processedMessageIds.has(`${messageId}_${textHash}`)) return;
                processedMessageIds.add(`${messageId}_${textHash}`);

                console.log('SSTSSD: MESSAGE_UPDATED - re-parsing message');
                parseTagsFromRawText(message.mes);
            } catch (e) { console.error('SSTSSD: MESSAGE_UPDATED error', e); }
        });

        console.log('SSTSSD: Side Dashboard extension initialized successfully');
    } catch (error) {
        console.error('SSTSSD: Failed to initialize extension', error);
    }
}

// Extension entry point
jQuery(async () => {
    try {
        await init();
    } catch (error) {
        console.error('SSTSSD: Fatal error during initialization', error);
    }
});

// Export for potential use by other extensions
export { MODULE_NAME, todoModule, scheduleModule, balanceModule, bakingModule, shopModule, getRpDate };
