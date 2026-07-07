import { useEffect, useRef, useState } from "react";

export const useTypingText = (text: string) => {
  const queueRef = useRef<string>("");
  const [cachedText, setCachedText] = useState<string>("");
  const [displayText, setDisplayText] = useState<string>("");

  useEffect(() => {
    const index = text.indexOf(cachedText);

    // Nếu text chỉ là bổ sung của text trước
    if (index === 0) {
      const extra = text.slice(cachedText.length);
      setCachedText(text);
      queueRef.current += extra;
    } else {
      setDisplayText("");
      setCachedText(text);
      queueRef.current = text;
    }
  }, [text]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (queueRef.current.length > 0) {
        const chars = Math.floor(queueRef.current.length / 16);
        const numberOfChars = chars > 7 ? 7 : chars < 2 ? 2 : chars;
        const nextChar = queueRef.current.slice(0, numberOfChars);
        setDisplayText((prev) => prev + nextChar);
        queueRef.current = queueRef.current.substring(numberOfChars);
      } else {
        clearInterval(timer);
      }
    }, 30); // Tốc độ gõ 30ms mỗi chữ -> Rất mượt!

    return () => clearInterval(timer);
  }, [text]);

  return displayText;
};
