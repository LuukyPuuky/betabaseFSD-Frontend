/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'bb-bg': '#1a1a1a',
        'bb-card': '#232523',
        'bb-green': '#5A8B5F',
        'bb-text': '#F3F4F6',
        'bb-text-muted': '#9CA3AF',
        'bb-input-border': '#333333',
        'bb-checkbox': '#2A2A2A',
        'bb-checkbox-border': '#444444'
      }
    },
  },
  plugins: [],
};
