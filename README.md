# Side Dashboard Extension for SillyTavern

A third-party extension for SillyTavern that adds a comprehensive side dashboard panel with todo, schedule, balance, baking, and shop management features.

## Features

### 📝 Todo Module
- **Task Management**: Add, edit, and complete tasks with deadlines
- **Smart Categorization**:
  - ⚠️ Urgent tasks (deadline ≤ 1 day) with highlighted background
  - 📋 In-progress tasks with D-day countdown
  - ✅ Recently completed tasks (last 5)
- **D-day Calculation**: Automatic countdown to deadlines
- **Rich Details**: Title, deadline, estimated time, and memo fields

### 📅 Schedule Module
- **Dual Mode System**:
  - 🎓 Semester mode: Weekly timetable for classes
  - 🌴 Vacation mode: Appointment-only view
- **Weekly Timetable**: Manage classes by day with start/end times and locations
- **Appointments**: Schedule meetings with date, time, location, and participants
- **Appointment Actions**:
  - Postpone to a new date
  - Cancel appointments
  - Edit details

### 💳 Balance Module
- **Personal Finance Tracking**: Track living expenses and income
- **Savings Goals**: Set and monitor multiple savings targets
- **Recurring Transactions**: Automatic monthly income/expenses
- **Shop Mode**: Separate shop operating fund from personal finances
- **Transaction History**: Detailed record of all financial activities

### 🧁 Baking Module
- **Recipe Management**: Create and store baking recipes
- **Product Registration**: Add finished products when baking is complete
- **Batch Tracking**: Record quantity and yield for each bake

### 🏪 Shop Module (NEW)
- **Shop Status**: Toggle between open/closed with visual indicators
- **Menu Management**: Create and manage shop menu with pricing and profit margins
- **Sales Tracking**: 
  - Automatic sale recording via `<SALE>` tags
  - Daily sales summary with breakdown
  - Monthly revenue reports
- **Staff Management**:
  - Register part-time staff with hourly wages
  - Skill tracking for roleplay (화술, 포장, etc.)
  - Shift scheduling
  - Payroll management (daily or monthly payment modes)
- **Daily Settlement**: End-of-day summary when closing shop
- **Monthly Reports**: Revenue, costs, and top-selling items
- **Integration**: Automatic balance updates on sales

## Design

### Dark Theme
- Background: Gradient from `#0f0f1a` to `#1a1a2e`
- Card background: `#1e1e3a`
- Text: `#e0e0e0` (primary), `#9ca3af` (secondary)
- Accent colors:
  - Todo: `#60a5fa` (sky blue)
  - Schedule: `#c084fc` (light purple)
  - Balance: `#a78bfa` (purple)
  - Baking: `#ec4899` (pink)
  - Shop: `#fb923c` (orange)

### Responsive Layout
- **Desktop (>768px)**: 400px side panel
- **Tablet (≤768px)**: 320px side panel
- **Mobile (≤480px)**: Full-screen overlay with slide-in/out

### UI Layout
- **Dashboard Summary Bar**: Shows urgent tasks and upcoming schedule at a glance
- **Accordion Modules**: Expandable sections for todo and schedule
- **Floating Toggle Button**: Quick access on mobile devices

## Installation

1. Copy this directory to your SillyTavern's `public/scripts/extensions/third-party/` folder
2. Restart SillyTavern or reload extensions
3. The side dashboard panel will appear automatically

**Note**: The extension has `auto_update` enabled in the manifest. This allows SillyTavern to automatically update the extension when new versions are available. If you prefer to control updates manually, you can set `"auto_update": false` in the `manifest.json` file.

## File Structure

```
sstssd/
├── manifest.json          # Extension metadata
├── index.js              # Main entry point
├── style.css             # Styles (dark theme + responsive)
├── modules/
│   ├── todo.js          # Todo module
│   ├── schedule.js      # Schedule module
│   ├── balance.js       # Balance/finance module
│   ├── baking.js        # Baking/recipe module
│   └── shop.js          # Shop management module
└── README.md            # This file
```

## Data Storage

All data is stored in SillyTavern's `extension_settings` using the key `sstssd`:

```javascript
{
  chats: {
    [chatId]: {
      rpDate: null,          // Roleplay date (null = use real time)
      rpDateSource: null,    // "auto" | "manual"
      todo: { items: [...] },
      schedule: {
        mode: 'semester' | 'vacation',
        timetable: { ... },
        appointments: [...]
      },
      balance: {
        living: 50000000,    // Personal funds
        goals: [...],        // Savings goals
        transactions: [...], // Transaction history
        shopMode: {
          enabled: false,
          shopName: "가게",
          operatingFund: 0,  // Shop funds (separate from personal)
          payrollMode: "monthly" | "daily",
          // ... more shop settings
        }
      },
      baking: {
        recipes: [...]       // Baking recipes
      },
      shop: {
        isOpen: false,       // Shop status
        menu: [...],         // Menu items
        sales: [...],        // Sales records
        staff: [...],        // Staff members
        shifts: [...],       // Work shifts
        monthlyReports: [...] // Financial reports
      }
    }
  },
  globalSettings: {
    panelOpen: true,
    openModules: ['todo', 'schedule', 'balance', 'baking', 'shop']
  }
}
```

Changes are automatically saved using SillyTavern's `saveSettingsDebounced()` function.

## Tag-Based Integration

The extension supports automatic data extraction from AI chat messages using XML-style tags:

### Implemented Tags:
- **`<DATE>YYYY-MM-DD</DATE>`**: Auto-detect and update roleplay date
- **`<FIN_IN>description|amount</FIN_IN>`**: Auto-record income transactions
- **`<FIN_OUT>description|amount</FIN_OUT>`**: Auto-record expense transactions
- **`<SALE>menuName|quantity|unitPrice</SALE>`**: Auto-record shop sales (NEW)

### Example Usage:
```
AI: "You sold 3 strawberry macarons today! <SALE>딸기 마카롱|3|3500</SALE>"
Result: 
- +10,500원 added to shop operating fund
- Sale recorded in daily summary
- Toast notification shown
```

## CSS Classes

All CSS classes use the `.sstssd-` prefix to avoid conflicts with SillyTavern's existing styles.

## Future Features

- Additional tag parsing (e.g., `<TASKS>`, `<TIMELINE>`)
- Auto-import tasks and schedules from chat messages
- Reminders and notifications
- Export/import functionality
- Calendar view for appointments
- Advanced analytics and charts for shop data
- Multi-currency support
- Staff performance tracking

## Technical Details

- **MutationObserver**: Monitors chat for tag-based data extraction
- **Module Pattern**: Separate modules with clean interfaces and dependency injection
- **Event Delegation**: Efficient event handling for dynamic content
- **Error Handling**: Try-catch blocks to prevent UI breakage
- **Chat Isolation**: Data is separated by chat ID for multi-character support
- **Debounced Saves**: Prevents excessive writes to extension settings

## Browser Compatibility

Works on all modern browsers that support:
- ES6 modules
- CSS Grid and Flexbox
- MutationObserver API

## License

MIT License - Feel free to use and modify

## Author

jinpado - https://github.com/jinpado/sstssd

## Version

0.1.0 - Initial release
