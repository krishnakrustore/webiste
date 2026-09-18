import { useEffect } from "react";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

const SESSION_KEY = "kgbk-timed-auth-shown";
const DELAY_MS = 15000;

export default function TimedAuthPrompt() {
  const { customer, loading, authOpen, openAuth } = useCustomerAuth();

  useEffect(() => {
    if (loading || customer || authOpen) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      openAuth();
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [loading, customer, authOpen, openAuth]);

  return null;
}
