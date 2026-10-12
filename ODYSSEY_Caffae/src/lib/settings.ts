import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const PAYMENT_ENABLED_KEY = "payment_enabled";

function settingQuery(key: string) {
  return {
    queryKey: ["settings", key],
    queryFn: async () => {
      return await api.settings.get(key);
    },
    refetchInterval: 30000,
  };
}

export const paymentEnabledQuery = settingQuery(PAYMENT_ENABLED_KEY);

export function usePaymentEnabled() {
  const { data } = useQuery(paymentEnabledQuery);
  return data ?? true;
}
