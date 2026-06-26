import { useState } from "react";

export function useHome() {
  const [loading, setLoading] = useState(false);

  return { loading, setLoading };
}
