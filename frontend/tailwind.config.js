/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["'Tajawal'", "'Cairo'", "sans-serif"],
      },
      colors: {
        // هوية بصرية مستوحاة من الأزرق الماجوريلي وذهبي الزليج
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#b7dcff",
          300: "#84c3ff",
          400: "#4aa1ff",
          500: "#1f7ef2",
          600: "#1260cc", // اللون الأساسي
          700: "#124da3",
          800: "#153f80",
          900: "#0f2e5c",
        },
        gold: {
          400: "#e8c46b",
          500: "#d4a94a",
          600: "#b8863a",
        },
      },
    },
  },
  plugins: [],
};
