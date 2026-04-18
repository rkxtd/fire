import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider attribute="class" disableTransitionOnChange {...props}>
      {children}
    </NextThemeProvider>
  );
}
