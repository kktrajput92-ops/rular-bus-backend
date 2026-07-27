import axios from "axios";

const customerApi = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5001/api",

  headers: {
    "Content-Type": "application/json",
  },
});

customerApi.interceptors.request.use(
  (config) => {
    const customerToken =
      localStorage.getItem("customer_token");

    config.headers =
      config.headers || {};

    if (customerToken) {
      /*
       * Standard Authorization header.
       */
      if (
        typeof config.headers.set ===
        "function"
      ) {
        config.headers.set(
          "Authorization",
          `Bearer ${customerToken}`
        );

        /*
         * Dedicated customer header.
         * Existing ERP Authorization config इसे
         * override नहीं कर पाएगा।
         */
        config.headers.set(
          "X-Customer-Token",
          customerToken
        );
      } else {
        config.headers.Authorization =
          `Bearer ${customerToken}`;

        config.headers[
          "X-Customer-Token"
        ] = customerToken;
      }
    } else {
      if (
        typeof config.headers.delete ===
        "function"
      ) {
        config.headers.delete(
          "Authorization"
        );

        config.headers.delete(
          "X-Customer-Token"
        );
      } else {
        delete config.headers.Authorization;

        delete config.headers[
          "X-Customer-Token"
        ];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

customerApi.interceptors.response.use(
  (response) => response,

  (error) => {
    const message =
      error.response?.data?.message;

    if (
      error.response?.status === 401 &&
      (
        message ===
          "Invalid customer access token" ||
        message ===
          "Customer session expired" ||
        message ===
          "Customer access token required"
      )
    ) {
      localStorage.removeItem(
        "customer_token"
      );

      localStorage.removeItem(
        "customer_user"
      );
    }

    return Promise.reject(error);
  }
);

export default customerApi;
