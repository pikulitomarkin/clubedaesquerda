import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        linen: {
          50: "#faf8f6",
          100: "#f5f2ed",
          200: "#ebe5db",
          300: "#e1d9ca",
          400: "#d7ccb8",
          500: "#cdbfa7",
          sand: "#cdbfa7",
          600: "#b8a78a",
          700: "#a38f6d",
          800: "#8e7750",
          900: "#7a6343",
        },
        terracotta: {
          50: "#fdf6f2",
          100: "#fceae1",
          200: "#f8d0ba",
          300: "#f5b692",
          400: "#f19c6a",
          500: "#ed8242",
          main: "#ed8242",
          600: "#d86d2e",
          700: "#c25826",
          800: "#9c461f",
          900: "#7a341a",
        },
        embroidery: {
          black: "#1a1a1a",
          dark: "#3a3a3a",
          gray: "#5a5a5a",
        },
      },
      fontFamily: {
        manuscript: ["Caveat", "cursive"],
        handwritten: ["Dancing Script", "cursive"],
        // Referência do cliente: IMAGENS PROJETO/Fonte.png (alfabeto
        // desenhado à mão, caixa alta, traço arredondado). "Gochi Hand" é a
        // aproximação mais próxima no Google Fonts — o arquivo da fonte
        // original não veio junto. Usada em títulos e rótulos de campo.
        marker: ["Gochi Hand", "Caveat", "cursive"],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        heading: ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        subheading: ["1.5rem", { lineHeight: "1.3", fontWeight: "400" }],
        body: ["0.75rem", { lineHeight: "1.5" }],
      },
      backgroundImage: {
        linen: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3CfilterCrypto id=\'linen-noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' result=\'noise\' /%3E%3C/filter%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'%23cdbfa7\' /%3E%3Crect width=\'100\' height=\'100\' fill=\'none\' opacity=\'0.03\' filter=\'url(%23linen-noise)\' /%3E%3Cline x1=\'0\' y1=\'0\' x2=\'100\' y2=\'100\' stroke=\'%23b8a78a\' stroke-width=\'0.5\' opacity=\'0.1\' /%3E%3Cline x1=\'0\' y1=\'100\' x2=\'100\' y2=\'0\' stroke=\'%23b8a78a\' stroke-width=\'0.5\' opacity=\'0.1\' /%3E%3C/svg%3E")',
      },
      boxShadow: {
        embroidery: "0 2px 4px rgba(26, 26, 26, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        "embroidery-3d": "0 4px 8px rgba(26, 26, 26, 0.2), inset 0 -2px 4px rgba(26, 26, 26, 0.1)",
        "embroidery-pressed": "inset 0 2px 4px rgba(26, 26, 26, 0.3), 0 1px 2px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "button-press": "buttonPress 0.15s ease-out",
        // Bastidor "pulando" no chão: a subida é mais rápida que a queda
        // (cubic-bezier), e a sombra abaixo encolhe/clareia em sincronia,
        // dando a leitura de que existe um piso.
        hop: "hop 1.9s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "hop-shadow": "hopShadow 1.9s cubic-bezier(0.5, 0, 0.5, 1) infinite",
      },
      keyframes: {
        buttonPress: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(2px)" },
          "100%": { transform: "translateY(0)" },
        },
        hop: {
          // pousa e "assenta" um instante antes do próximo pulo
          "0%, 12%, 100%": { transform: "translateY(0) scaleY(1)" },
          "6%": { transform: "translateY(0) scaleY(0.96)" },
          "50%": { transform: "translateY(-22px) scaleY(1.02)" },
        },
        hopShadow: {
          "0%, 12%, 100%": { transform: "scaleX(1)", opacity: "0.30" },
          "50%": { transform: "scaleX(0.68)", opacity: "0.12" },
        },
      },
      textDecorationLine: {
        embroidered: "underline",
      },
    },
  },
  plugins: [],
};

export default config;
