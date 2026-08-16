import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TranslationResult {
  en: string;
  de: string;
  es: string;
  fr?: string;
}

interface UseAutoTranslateOptions {
  debounceMs?: number;
  onSuccess?: (translations: TranslationResult) => void;
  onError?: (error: string) => void;
}

export const useAutoTranslate = (options: UseAutoTranslateOptions = {}) => {
  const { debounceMs = 800, onSuccess, onError } = options;
  const [translating, setTranslating] = useState(false);
  const timerRef = useRef<number | null>(null);

  const translate = useCallback(async (text: string, sourceLang: 'fr' | 'en' | 'de' | 'es' = 'fr'): Promise<TranslationResult | null> => {
    if (!text?.trim()) return null;

    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-product", {
        body: { text: text.trim(), sourceLang },
      });

      if (error) {
        const errorMsg = "Traduction indisponible";
        onError?.(errorMsg);
        toast.error(errorMsg);
        return null;
      }

      const result: TranslationResult = {
        en: data?.en || "",
        de: data?.de || "",
        es: data?.es || "",
        fr: sourceLang !== 'fr' ? data?.fr : undefined,
      };

      onSuccess?.(result);
      return result;
    } catch (e) {
      console.error("Translation error:", e);
      const errorMsg = "Erreur de traduction";
      onError?.(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setTranslating(false);
    }
  }, [onSuccess, onError]);

  const translateDebounced = useCallback((
    text: string,
    callback: (translations: TranslationResult) => void,
    sourceLang: 'fr' | 'en' | 'de' | 'es' = 'fr'
  ) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(async () => {
      const result = await translate(text, sourceLang);
      if (result) {
        callback(result);
      }
    }, debounceMs);
  }, [translate, debounceMs]);

  const cancelPending = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    translate,
    translateDebounced,
    cancelPending,
    translating,
  };
};
