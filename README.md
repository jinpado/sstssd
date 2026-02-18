# Side Dashboard Extension for SillyTavern

A third-party extension for SillyTavern that adds a side dashboard panel with todo and schedule management features.

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

## Design

### Dark Theme
- Background: Gradient from `#0f0f1a` to `#1a1a2e`
- Card background: `#1e1e3a`
- Text: `#e0e0e0` (primary), `#9ca3af` (secondary)
- Accent colors:
  - Todo: `#60a5fa` (sky blue)
  - Schedule: `#c084fc` (light purple)

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
│   └── schedule.js      # Schedule module
└── README.md            # This file
```

## Data Storage

All data is stored in SillyTavern's `extension_settings` using the key `sstssd`:

```javascript
{
  todo: {
    items: [...]  // Array of todo items
  },
  schedule: {
    mode: 'semester' | 'vacation',
    timetable: { ... },      // Weekly class schedule
    appointments: [...]       // Array of appointments
  },
  panelOpen: true,           // Panel visibility state
  openModules: [...]         // Currently expanded modules
}
```

Changes are automatically saved using SillyTavern's `saveSettingsDebounced()` function.

## CSS Classes

All CSS classes use the `.sstssd-` prefix to avoid conflicts with SillyTavern's existing styles.

## Future Features

- Tag parsing from chat (e.g., `<TASKS>`, `<TIMELINE>`, `<FIN_IN>`, `<FIN_OUT>`)
- Auto-import tasks and schedules from chat messages
- Reminders and notifications
- Export/import functionality
- Calendar view for appointments

## Technical Details

- **MutationObserver**: Monitors chat for future tag-based data extraction
- **Module Pattern**: Separate modules for todo and schedule with clean interfaces
- **Event Delegation**: Efficient event handling for dynamic content
- **Error Handling**: Try-catch blocks to prevent UI breakage

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
