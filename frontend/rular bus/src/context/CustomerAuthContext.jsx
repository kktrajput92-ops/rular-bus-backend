import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import customerApi from "../api/customerApi";

const CustomerAuthContext =
  createContext(null);

export function CustomerAuthProvider({
  children,
}) {
  const [customer, setCustomer] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const saveCustomer = (
    customerValue
  ) => {
    if (customerValue) {
      localStorage.setItem(
        "customer_user",
        JSON.stringify(customerValue)
      );
    } else {
      localStorage.removeItem(
        "customer_user"
      );
    }

    setCustomer(customerValue);
  };

  const clearCustomerSession = () => {
    localStorage.removeItem(
      "customer_token"
    );

    localStorage.removeItem(
      "customer_user"
    );

    setCustomer(null);
  };

  const refreshCustomer = async () => {
    const token =
      localStorage.getItem(
        "customer_token"
      );

    if (!token) {
      clearCustomerSession();
      return null;
    }

    const { data } =
      await customerApi.get(
        "/customer-auth/me"
      );

    saveCustomer(data.customer);

    return data.customer;
  };

  useEffect(() => {
    const initializeCustomer =
      async () => {
        try {
          await refreshCustomer();
        } catch {
          clearCustomerSession();
        } finally {
          setLoading(false);
        }
      };

    initializeCustomer();
  }, []);

  const login = async (
    identifier,
    password
  ) => {
    const { data } =
      await customerApi.post(
        "/customer-auth/login",
        {
          identifier,
          password,
        }
      );

    localStorage.setItem(
      "customer_token",
      data.token
    );

    saveCustomer(data.customer);

    return data;
  };

  const updateCustomer = async (
    profile
  ) => {
    const { data } =
      await customerApi.put(
        "/customer-auth/profile",
        profile
      );

    saveCustomer(data.customer);

    return data;
  };

  const logout = async () => {
    try {
      await customerApi.post(
        "/customer-auth/logout"
      );
    } catch {}

    clearCustomerSession();
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        login,
        logout,
        refreshCustomer,
        updateCustomer,
        isAuthenticated:
          Boolean(customer),
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(
    CustomerAuthContext
  );

  if (!context) {
    throw new Error(
      "useCustomerAuth must be used inside CustomerAuthProvider"
    );
  }

  return context;
}
